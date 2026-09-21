"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { householdMembers, projects, taskAssignees, tasks } from "@/lib/db/schema";

const taskSchema = z.object({
  householdId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string().uuid()).default([]),
});

async function assertMember(userId: string, householdId: string) {
  const member = await db.query.householdMembers.findFirst({
    where: and(eq(householdMembers.userId, userId), eq(householdMembers.householdId, householdId)),
  });
  if (!member) throw new Error("You are not a member of this household.");
  return member;
}

export async function createTask(input: z.infer<typeof taskSchema>) {
  const user = await requireUser();
  const parsed = taskSchema.parse(input);
  await assertMember(user.id, parsed.householdId);

  if (parsed.projectId) {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, parsed.projectId), eq(projects.householdId, parsed.householdId)),
    });
    if (!project) throw new Error("Project does not belong to this household.");
  }

  if (parsed.assigneeIds.length) {
    const members = await db.query.householdMembers.findMany({
      where: and(
        eq(householdMembers.householdId, parsed.householdId),
        inArray(householdMembers.id, parsed.assigneeIds),
      ),
    });
    if (members.length !== parsed.assigneeIds.length) {
      throw new Error("Every assignee must belong to this household.");
    }
  }

  const [task] = await db.insert(tasks).values({
    householdId: parsed.householdId,
    projectId: parsed.projectId,
    title: parsed.title,
    description: parsed.description || null,
    dueDate: parsed.dueDate || null,
    createdByUserId: user.id,
  }).returning();

  if (parsed.assigneeIds.length) {
    await db.insert(taskAssignees).values(
      parsed.assigneeIds.map((householdMemberId) => ({ taskId: task.id, householdMemberId })),
    );
  }

  revalidatePath(`/households/${parsed.householdId}`);
  if (parsed.projectId) revalidatePath(`/households/${parsed.householdId}/projects/${parsed.projectId}`);
}

export async function createTaskFromForm(
  householdId: string,
  projectId: string | undefined,
  formData: FormData,
) {
  const assigneeIds = formData
    .getAll("assigneeIds")
    .map(String)
    .filter(Boolean);

  await createTask({
    householdId,
    projectId,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    dueDate: String(formData.get("dueDate") ?? "") || undefined,
    assigneeIds,
  });
}

export async function updateTaskStatus(taskId: string, householdId: string, status: "todo" | "in_progress" | "done") {
  const user = await requireUser();
  await assertMember(user.id, householdId);

  await db.update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.householdId, householdId)));

  revalidatePath(`/households/${householdId}`);
}