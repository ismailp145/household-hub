import { createHash, randomBytes } from "node:crypto";
import { clerkClient, getAuth } from "@clerk/express";
import {
  CreateHouseholdBody,
  CreateHouseholdResponse,
  CreateProjectBody,
  CreateProjectParams,
  CreateProjectResponse,
  CreateTaskBody,
  CreateTaskParams,
  CreateTaskResponse,
  GetHouseholdDashboardParams,
  GetHouseholdDashboardResponse,
  GetProjectParams,
  GetProjectResponse,
  JoinHouseholdBody,
  JoinHouseholdResponse,
  ListHouseholdsResponse,
  RegenerateHouseholdJoinCodeParams,
  RegenerateHouseholdJoinCodeResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";
import {
  db,
  householdMembersTable,
  householdsTable,
  projectsTable,
  taskAssigneesTable,
  tasksTable,
  usersTable,
  type User,
  activityEventsTable,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

function hashCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

function createJoinCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

function claimString(claims: unknown, key: string) {
  if (!claims || typeof claims !== "object") return undefined;
  const value = (claims as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

async function clerkProfile(
  clerkUserId: string,
  fallback: Pick<User, "displayName" | "email" | "avatarUrl">,
) {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId,
    ) ?? clerkUser.emailAddresses[0];
  const fullName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    displayName:
      fullName ||
      clerkUser.username ||
      primaryEmail?.emailAddress.split("@")[0] ||
      fallback.displayName,
    email: primaryEmail?.emailAddress ?? fallback.email,
    avatarUrl: clerkUser.imageUrl || fallback.avatarUrl,
  };
}

async function requireUser(req: Request, res: Response): Promise<User | null> {
  const auth = getAuth(req);
  const clerkUserId = (auth.sessionClaims?.userId ?? auth.userId) as
    | string
    | null
    | undefined;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  let displayName =
    claimString(auth.sessionClaims, "name") ??
    claimString(auth.sessionClaims, "first_name") ??
    "Household member";
  let email =
    claimString(auth.sessionClaims, "email") ??
    claimString(auth.sessionClaims, "email_address") ??
    `${clerkUserId}@users.household-hub.local`;
  let avatarUrl =
    claimString(auth.sessionClaims, "image_url") ??
    claimString(auth.sessionClaims, "picture") ??
    null;

  try {
    const profile = await clerkProfile(clerkUserId, {
      displayName,
      email,
      avatarUrl,
    });
    displayName = profile.displayName;
    email = profile.email;
    avatarUrl = profile.avatarUrl;
  } catch {
    // Keep existing database data if Clerk is temporarily unavailable.
    if (existing) return existing;
  }

  if (existing) {
    if (
      existing.displayName === displayName &&
      existing.email === email &&
      existing.avatarUrl === avatarUrl
    ) {
      return existing;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ displayName, email, avatarUrl })
      .where(eq(usersTable.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(usersTable)
    .values({ clerkUserId, displayName, email, avatarUrl })
    .onConflictDoNothing({ target: usersTable.clerkUserId })
    .returning();
  if (created) return created;

  const [concurrent] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return concurrent;
}

function toDateString(value: Date | string | null | undefined) {
  if (value == null || typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}

function formatNameList(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

async function recordActivity(values: {
  householdId: string;
  actorUserId: string | null;
  type:
    | "household_created"
    | "member_joined"
    | "task_created"
    | "task_assigned"
    | "task_completed"
    | "task_reopened";
  message: string;
  taskId?: string | null;
}) {
  await db.insert(activityEventsTable).values(values);
}

async function activityResponses(householdId: string) {
  const rows = await db
    .select({
      id: activityEventsTable.id,
      type: activityEventsTable.type,
      message: activityEventsTable.message,
      createdAt: activityEventsTable.createdAt,
    })
    .from(activityEventsTable)
    .where(eq(activityEventsTable.householdId, householdId))
    .orderBy(desc(activityEventsTable.createdAt))
    .limit(40);
  return rows;
}

async function memberNamesByIds(householdId: string, memberIds: string[]) {
  if (!memberIds.length) return [];
  const rows = await db
    .select({
      id: householdMembersTable.id,
      displayName: usersTable.displayName,
    })
    .from(householdMembersTable)
    .innerJoin(usersTable, eq(householdMembersTable.userId, usersTable.id))
    .where(
      and(
        eq(householdMembersTable.householdId, householdId),
        inArray(householdMembersTable.id, memberIds),
      ),
    );
  return rows.map((row) => row.displayName);
}

async function validateAssignees(
  res: Response,
  householdId: string,
  assigneeIds: string[],
) {
  if (!assigneeIds.length) return true;
  const valid = await db
    .select({ id: householdMembersTable.id })
    .from(householdMembersTable)
    .where(
      and(
        eq(householdMembersTable.householdId, householdId),
        inArray(householdMembersTable.id, assigneeIds),
      ),
    );
  if (valid.length !== new Set(assigneeIds).size) {
    res.status(400).json({ error: "Invalid household assignee" });
    return false;
  }
  return true;
}

async function replaceAssignees(taskId: string, assigneeIds: string[]) {
  await db
    .delete(taskAssigneesTable)
    .where(eq(taskAssigneesTable.taskId, taskId));
  if (!assigneeIds.length) return;
  await db.insert(taskAssigneesTable).values(
    [...new Set(assigneeIds)].map((householdMemberId) => ({
      taskId,
      householdMemberId,
    })),
  );
}

async function requireMember(
  req: Request,
  res: Response,
  householdId: string,
) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const [membership] = await db
    .select()
    .from(householdMembersTable)
    .where(
      and(
        eq(householdMembersTable.householdId, householdId),
        eq(householdMembersTable.userId, user.id),
      ),
    )
    .limit(1);
  if (!membership) {
    res.status(403).json({ error: "You are not a member of this household" });
    return null;
  }
  return { user, membership };
}

async function membersForHousehold(householdId: string) {
  const rows = await db
    .select({
      id: householdMembersTable.id,
      userId: usersTable.id,
      clerkUserId: usersTable.clerkUserId,
      displayName: usersTable.displayName,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      role: householdMembersTable.role,
    })
    .from(householdMembersTable)
    .innerJoin(usersTable, eq(householdMembersTable.userId, usersTable.id))
    .where(eq(householdMembersTable.householdId, householdId))
    .orderBy(asc(usersTable.displayName));

  const members = await Promise.all(
    rows.map(async (row) => {
      let profile = {
        displayName: row.displayName,
        email: row.email,
        avatarUrl: row.avatarUrl,
      };

      if (
        row.displayName === "Household member" ||
        row.email.endsWith("@users.household-hub.local")
      ) {
        try {
          profile = await clerkProfile(row.clerkUserId, profile);
          await db
            .update(usersTable)
            .set(profile)
            .where(eq(usersTable.id, row.userId));
        } catch {
          // Return the existing profile if Clerk is temporarily unavailable.
        }
      }

      return {
        id: row.id,
        ...profile,
        role: row.role,
      };
    }),
  );

  return members.sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );
}

async function taskResponses(
  householdId: string,
  projectId?: string,
) {
  const taskRows = await db
    .select()
    .from(tasksTable)
    .where(
      projectId
        ? and(
            eq(tasksTable.householdId, householdId),
            eq(tasksTable.projectId, projectId),
          )
        : eq(tasksTable.householdId, householdId),
    )
    .orderBy(desc(tasksTable.createdAt));

  if (!taskRows.length) return [];
  const assignments = await db
    .select({
      taskId: taskAssigneesTable.taskId,
      id: householdMembersTable.id,
      displayName: usersTable.displayName,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      role: householdMembersTable.role,
    })
    .from(taskAssigneesTable)
    .innerJoin(
      householdMembersTable,
      eq(taskAssigneesTable.householdMemberId, householdMembersTable.id),
    )
    .innerJoin(usersTable, eq(householdMembersTable.userId, usersTable.id))
    .where(
      and(
        eq(householdMembersTable.householdId, householdId),
        inArray(
          taskAssigneesTable.taskId,
          taskRows.map((task) => task.id),
        ),
      ),
    );

  return taskRows.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    projectId: task.projectId,
    assignees: assignments
      .filter((assignment) => assignment.taskId === task.id)
      .map(({ taskId: _taskId, ...member }) => member),
  }));
}

async function projectResponses(householdId: string) {
  const rows = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      taskCount: sql<number>`count(${tasksTable.id})::int`,
      completedTaskCount:
        sql<number>`count(${tasksTable.id}) filter (where ${tasksTable.status} = 'done')::int`,
    })
    .from(projectsTable)
    .leftJoin(tasksTable, eq(projectsTable.id, tasksTable.projectId))
    .where(eq(projectsTable.householdId, householdId))
    .groupBy(projectsTable.id)
    .orderBy(desc(projectsTable.updatedAt));
  return rows;
}

router.get("/households", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const rows = await db
    .select({
      id: householdsTable.id,
      name: householdsTable.name,
      role: householdMembersTable.role,
      memberCount: sql<number>`(
        select count(*)::int from household_members hm
        where hm.household_id = ${householdsTable.id}
      )`,
      openTaskCount: sql<number>`(
        select count(*)::int from tasks t
        where t.household_id = ${householdsTable.id} and t.status <> 'done'
      )`,
    })
    .from(householdMembersTable)
    .innerJoin(
      householdsTable,
      eq(householdMembersTable.householdId, householdsTable.id),
    )
    .where(eq(householdMembersTable.userId, user.id))
    .orderBy(asc(householdsTable.name));
  res.json(ListHouseholdsResponse.parse(rows));
});

router.post("/households", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = CreateHouseholdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const joinCode = createJoinCode();
  const household = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(householdsTable)
      .values({
        name: parsed.data.name,
        createdByUserId: user.id,
        joinCodeHash: hashCode(joinCode),
      })
      .returning();
    await tx.insert(householdMembersTable).values({
      householdId: created.id,
      userId: user.id,
      role: "owner",
    });
    return created;
  });
  await recordActivity({
    householdId: household.id,
    actorUserId: user.id,
    type: "household_created",
    message: `${user.displayName} created ${household.name}`,
  });
  res.status(201).json(
    CreateHouseholdResponse.parse({
      household: {
        id: household.id,
        name: household.name,
        role: "owner",
        memberCount: 1,
        openTaskCount: 0,
      },
      joinCode,
    }),
  );
});

router.post("/households/join", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = JoinHouseholdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [household] = await db
    .select()
    .from(householdsTable)
    .where(eq(householdsTable.joinCodeHash, hashCode(parsed.data.code)))
    .limit(1);
  if (!household) {
    res.status(404).json({ error: "Invalid join code" });
    return;
  }
  const [joined] = await db
    .insert(householdMembersTable)
    .values({ householdId: household.id, userId: user.id, role: "member" })
    .onConflictDoNothing()
    .returning();
  if (joined) {
    await recordActivity({
      householdId: household.id,
      actorUserId: user.id,
      type: "member_joined",
      message: `${user.displayName} joined ${household.name}`,
    });
  }
  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(householdMembersTable)
    .where(eq(householdMembersTable.householdId, household.id));
  const [openTaskCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.householdId, household.id),
        ne(tasksTable.status, "done"),
      ),
    );
  res.json(
    JoinHouseholdResponse.parse({
      id: household.id,
      name: household.name,
      role: "member",
      memberCount: memberCount.count,
      openTaskCount: openTaskCount.count,
    }),
  );
});

router.get(
  "/households/:householdId/dashboard",
  async (req, res): Promise<void> => {
    const params = GetHouseholdDashboardParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const auth = await requireMember(req, res, params.data.householdId);
    if (!auth) return;
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, params.data.householdId))
      .limit(1);
    if (!household) {
      res.status(404).json({ error: "Household not found" });
      return;
    }
    const [members, projects, tasks, activity] = await Promise.all([
      membersForHousehold(params.data.householdId),
      projectResponses(params.data.householdId),
      taskResponses(params.data.householdId),
      activityResponses(params.data.householdId),
    ]);
    res.json(
      GetHouseholdDashboardResponse.parse({
        id: household.id,
        name: household.name,
        role: auth.membership.role,
        members,
        projects,
        tasks,
        activity,
      }),
    );
  },
);

router.post(
  "/households/:householdId/join-code",
  async (req, res): Promise<void> => {
    const params = RegenerateHouseholdJoinCodeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const auth = await requireMember(req, res, params.data.householdId);
    if (!auth) return;
    if (auth.membership.role !== "owner") {
      res.status(403).json({ error: "Only household owners can create invite codes" });
      return;
    }
    const code = createJoinCode();
    await db
      .update(householdsTable)
      .set({ joinCodeHash: hashCode(code) })
      .where(eq(householdsTable.id, params.data.householdId));
    res.json(RegenerateHouseholdJoinCodeResponse.parse({ code }));
  },
);

router.post(
  "/households/:householdId/projects",
  async (req, res): Promise<void> => {
    const params = CreateProjectParams.safeParse(req.params);
    const body = CreateProjectBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid project" });
      return;
    }
    const auth = await requireMember(req, res, params.data.householdId);
    if (!auth) return;
    const [project] = await db
      .insert(projectsTable)
      .values({
        householdId: params.data.householdId,
        name: body.data.name,
        description: body.data.description ?? null,
        createdByUserId: auth.user.id,
      })
      .returning();
    res.status(201).json(
      CreateProjectResponse.parse({
        id: project.id,
        name: project.name,
        description: project.description,
        taskCount: 0,
        completedTaskCount: 0,
      }),
    );
  },
);

router.get(
  "/households/:householdId/projects/:projectId",
  async (req, res): Promise<void> => {
    const params = GetProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const auth = await requireMember(req, res, params.data.householdId);
    if (!auth) return;
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, params.data.projectId),
          eq(projectsTable.householdId, params.data.householdId),
        ),
      )
      .limit(1);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const [members, tasks] = await Promise.all([
      membersForHousehold(params.data.householdId),
      taskResponses(params.data.householdId, params.data.projectId),
    ]);
    res.json(
      GetProjectResponse.parse({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          taskCount: tasks.length,
          completedTaskCount: tasks.filter((task) => task.status === "done").length,
        },
        members,
        tasks,
      }),
    );
  },
);

router.post(
  "/households/:householdId/tasks",
  async (req, res): Promise<void> => {
    const params = CreateTaskParams.safeParse(req.params);
    const body = CreateTaskBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid task" });
      return;
    }
    const auth = await requireMember(req, res, params.data.householdId);
    if (!auth) return;
    if (body.data.projectId) {
      const [project] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.id, body.data.projectId),
            eq(projectsTable.householdId, params.data.householdId),
          ),
        )
        .limit(1);
      if (!project) {
        res.status(400).json({ error: "Project is not in this household" });
        return;
      }
    }
    const assigneeIds = body.data.assigneeIds ?? [];
    if (!(await validateAssignees(res, params.data.householdId, assigneeIds))) {
      return;
    }
    const task = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(tasksTable)
        .values({
          householdId: params.data.householdId,
          projectId: body.data.projectId ?? null,
          title: body.data.title,
          description: body.data.description ?? null,
          dueDate: toDateString(body.data.dueDate) ?? null,
          createdByUserId: auth.user.id,
        })
        .returning();
      if (assigneeIds.length) {
        await tx.insert(taskAssigneesTable).values(
          [...new Set(assigneeIds)].map((householdMemberId) => ({
            taskId: created.id,
            householdMemberId,
          })),
        );
      }
      return created;
    });
    await recordActivity({
      householdId: params.data.householdId,
      actorUserId: auth.user.id,
      type: "task_created",
      taskId: task.id,
      message: `${auth.user.displayName} added “${task.title}”`,
    });
    if (assigneeIds.length) {
      const names = await memberNamesByIds(params.data.householdId, assigneeIds);
      await recordActivity({
        householdId: params.data.householdId,
        actorUserId: auth.user.id,
        type: "task_assigned",
        taskId: task.id,
        message: `${auth.user.displayName} assigned “${task.title}” to ${formatNameList(names)}`,
      });
    }
    const responses = await taskResponses(params.data.householdId);
    const createdResponse = responses.find((item) => item.id === task.id);
    res.status(201).json(CreateTaskResponse.parse(createdResponse));
  },
);

router.patch(
  "/households/:householdId/tasks/:taskId",
  async (req, res): Promise<void> => {
    const params = UpdateTaskParams.safeParse(req.params);
    const body = UpdateTaskBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid task update" });
      return;
    }
    const auth = await requireMember(req, res, params.data.householdId);
    if (!auth) return;
    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.id, params.data.taskId),
          eq(tasksTable.householdId, params.data.householdId),
        ),
      )
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (body.data.assigneeIds !== undefined) {
      if (
        !(await validateAssignees(
          res,
          params.data.householdId,
          body.data.assigneeIds,
        ))
      ) {
        return;
      }
      await replaceAssignees(params.data.taskId, body.data.assigneeIds);
      if (body.data.assigneeIds.length) {
        const names = await memberNamesByIds(
          params.data.householdId,
          body.data.assigneeIds,
        );
        await recordActivity({
          householdId: params.data.householdId,
          actorUserId: auth.user.id,
          type: "task_assigned",
          taskId: existing.id,
          message: `${auth.user.displayName} assigned “${existing.title}” to ${formatNameList(names)}`,
        });
      }
    }
    const [updated] = await db
      .update(tasksTable)
      .set({
        ...(body.data.status ? { status: body.data.status } : {}),
        ...(body.data.title ? { title: body.data.title } : {}),
        ...(body.data.dueDate !== undefined
          ? { dueDate: toDateString(body.data.dueDate) }
          : {}),
      })
      .where(
        and(
          eq(tasksTable.id, params.data.taskId),
          eq(tasksTable.householdId, params.data.householdId),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (body.data.status && body.data.status !== existing.status) {
      if (body.data.status === "done") {
        await recordActivity({
          householdId: params.data.householdId,
          actorUserId: auth.user.id,
          type: "task_completed",
          taskId: updated.id,
          message: `${auth.user.displayName} completed “${updated.title}”`,
        });
      } else if (existing.status === "done") {
        await recordActivity({
          householdId: params.data.householdId,
          actorUserId: auth.user.id,
          type: "task_reopened",
          taskId: updated.id,
          message: `${auth.user.displayName} reopened “${updated.title}”`,
        });
      }
    }
    const response = (
      await taskResponses(params.data.householdId)
    ).find((task) => task.id === updated.id);
    res.json(UpdateTaskResponse.parse(response));
  },
);

export default router;