import {
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const memberRoleEnum = pgEnum("member_role", ["owner", "member"]);
export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
]);
export const activityEventTypeEnum = pgEnum("activity_event_type", [
  "household_created",
  "member_joined",
  "task_created",
  "task_assigned",
  "task_completed",
  "task_reopened",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const householdsTable = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  joinCodeHash: text("join_code_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const householdMembersTable = pgTable(
  "household_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => householdsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("household_members_household_user_idx").on(
      table.householdId,
      table.userId,
    ),
    index("household_members_user_idx").on(table.userId),
  ],
);

export const projectsTable = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => householdsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("projects_household_idx").on(table.householdId)],
);

export const tasksTable = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => householdsTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projectsTable.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    notes: text("notes"),
    dueDate: date("due_date", { mode: "string" }),
    status: taskStatusEnum("status").default("todo").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_household_idx").on(table.householdId),
    index("tasks_project_idx").on(table.projectId),
  ],
);

export const taskAssigneesTable = pgTable(
  "task_assignees",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    householdMemberId: uuid("household_member_id")
      .notNull()
      .references(() => householdMembersTable.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.householdMemberId] }),
  ],
);

export const activityEventsTable = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => householdsTable.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    type: activityEventTypeEnum("type").notNull(),
    message: text("message").notNull(),
    taskId: uuid("task_id").references(() => tasksTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("activity_events_household_idx").on(table.householdId)],
);

export const invitesTable = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => householdsTable.id, { onDelete: "cascade" }),
    email: text("email"),
    inviteCodeHash: text("invite_code_hash").notNull().unique(),
    status: inviteStatusEnum("status").default("pending").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => usersTable.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("invites_household_idx").on(table.householdId)],
);

export const insertHouseholdSchema = createInsertSchema(householdsTable);
export const insertProjectSchema = createInsertSchema(projectsTable);
export const insertTaskSchema = createInsertSchema(tasksTable);

export type User = typeof usersTable.$inferSelect;
export type Household = typeof householdsTable.$inferSelect;
export type HouseholdMember = typeof householdMembersTable.$inferSelect;
export type Project = typeof projectsTable.$inferSelect;
export type Task = typeof tasksTable.$inferSelect;
export type ActivityEvent = typeof activityEventsTable.$inferSelect;