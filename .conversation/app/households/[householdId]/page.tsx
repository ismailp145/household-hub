import { UserButton } from "@clerk/nextjs";
import { eq, inArray } from "drizzle-orm";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { CreateProjectForm } from "@/app/components/CreateProjectForm";
import { CreateTaskForm } from "@/app/components/CreateTaskForm";
import { TaskList } from "@/app/components/TaskList";
import { requireHouseholdMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { householdMembers, taskAssignees, users } from "@/lib/db/schema";

export default async function HouseholdPage({ params }: { params: Promise<{ householdId: string }> }) {
  const { householdId } = await params;
  const { user } = await requireHouseholdMember(householdId);

  const [household, members, projectRows, taskRows] = await Promise.all([
    db.query.households.findFirst({ where: (households, { eq }) => eq(households.id, householdId) }),
    db.select({ member: householdMembers, user: users }).from(householdMembers).innerJoin(users, eq(householdMembers.userId, users.id)).where(eq(householdMembers.householdId, householdId)),
    db.query.projects.findMany({ where: (projects, { eq }) => eq(projects.householdId, householdId), orderBy: (projects, { desc }) => [desc(projects.updatedAt)] }),
    db.query.tasks.findMany({ where: (tasks, { eq }) => eq(tasks.householdId, householdId), orderBy: (tasks, { desc }) => [desc(tasks.createdAt)], limit: 12 }),
  ]);

  if (!household) return null;

  const assignments = taskRows.length
    ? await db
        .select({
          taskId: taskAssignees.taskId,
          displayName: users.displayName,
        })
        .from(taskAssignees)
        .innerJoin(householdMembers, eq(taskAssignees.householdMemberId, householdMembers.id))
        .innerJoin(users, eq(householdMembers.userId, users.id))
        .where(inArray(taskAssignees.taskId, taskRows.map((task) => task.id)))
    : [];

  const assigneesByTask = new Map<string, string[]>();
  for (const assignment of assignments) {
    const names = assigneesByTask.get(assignment.taskId) ?? [];
    names.push(assignment.displayName);
    assigneesByTask.set(assignment.taskId, names);
  }

  const taskItems = taskRows.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    assignees: assigneesByTask.get(task.id) ?? [],
  }));
  const memberOptions = members.map(({ member, user: memberUser }) => ({
    id: member.id,
    name: memberUser.displayName,
  }));

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-black/5 bg-white/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-ink/55"><ArrowLeft className="h-4 w-4" /> All households</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-sm font-semibold text-coral">Your shared space</p><h1 className="mt-2 text-4xl font-bold tracking-tight">{household.name}</h1><p className="mt-2 text-ink/55">Keep the next few things visible.</p></div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"><span className="font-semibold">{members.length}</span> members</div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5"><h2 className="text-xl font-bold">Household tasks</h2><p className="mt-1 text-sm text-ink/50">The things that need doing next.</p></div>
            <CreateTaskForm householdId={householdId} members={memberOptions} />
            <TaskList tasks={taskItems} householdId={householdId} />
          </section>
          <div className="space-y-6">
            <section className="panel p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Members</h2><Users className="h-4 w-4 text-moss" /></div><div className="space-y-3">{members.map(({ member, user: memberUser }) => <div className="flex items-center gap-3" key={member.id}><div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage text-sm font-bold text-moss">{memberUser.displayName.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{memberUser.displayName}</p><p className="truncate text-xs text-ink/45">{memberUser.email}</p></div>{member.role === "owner" && <span className="text-[11px] font-semibold text-coral">Owner</span>}</div>)}</div></section>
            <section className="panel p-5"><div className="mb-4"><h2 className="font-bold">Projects</h2><p className="mt-1 text-xs text-ink/50">Bigger things, broken down.</p></div><CreateProjectForm householdId={householdId} />{projectRows.length ? <div className="space-y-2">{projectRows.map((project) => <Link href={`/households/${householdId}/projects/${project.id}`} className="block rounded-xl bg-sage/50 p-3 text-sm font-semibold transition hover:bg-sage" key={project.id}>{project.name}</Link>)}</div> : <p className="rounded-xl border border-dashed border-black/10 p-4 text-sm text-ink/45">No projects yet.</p>}</section>
          </div>
        </div>
      </div>
    </main>
  );
}