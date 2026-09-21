import { UserButton } from "@clerk/nextjs";
import { eq, inArray } from "drizzle-orm";
import { ArrowLeft, FolderKanban } from "lucide-react";
import Link from "next/link";
import { CreateTaskForm } from "@/app/components/CreateTaskForm";
import { TaskList } from "@/app/components/TaskList";
import { requireHouseholdMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { householdMembers, taskAssignees, users } from "@/lib/db/schema";

export default async function ProjectPage({ params }: { params: Promise<{ householdId: string; projectId: string }> }) {
  const { householdId, projectId } = await params;
  await requireHouseholdMember(householdId);
  const project = await db.query.projects.findFirst({ where: (projects, { and, eq }) => and(eq(projects.id, projectId), eq(projects.householdId, householdId)) });
  if (!project) return <main className="p-8">Project not found.</main>;
  const projectTasks = await db.query.tasks.findMany({ where: (tasks, { and, eq }) => and(eq(tasks.projectId, projectId), eq(tasks.householdId, householdId)), orderBy: (tasks, { desc }) => [desc(tasks.createdAt)] });
  const [members, assignments] = await Promise.all([
    db
      .select({ id: householdMembers.id, name: users.displayName })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
      .where(eq(householdMembers.householdId, householdId)),
    projectTasks.length
      ? db
          .select({ taskId: taskAssignees.taskId, displayName: users.displayName })
          .from(taskAssignees)
          .innerJoin(householdMembers, eq(taskAssignees.householdMemberId, householdMembers.id))
          .innerJoin(users, eq(householdMembers.userId, users.id))
          .where(inArray(taskAssignees.taskId, projectTasks.map((task) => task.id)))
      : Promise.resolve([]),
  ]);
  const assigneesByTask = new Map<string, string[]>();
  for (const assignment of assignments) {
    const names = assigneesByTask.get(assignment.taskId) ?? [];
    names.push(assignment.displayName);
    assigneesByTask.set(assignment.taskId, names);
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-black/5 bg-white/75"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><UserButton afterSignOutUrl="/" /></div></header>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <Link href={`/households/${householdId}`} className="flex items-center gap-2 text-sm font-semibold text-ink/55"><ArrowLeft className="h-4 w-4" /> Back to household</Link>
        <div className="mt-8 flex items-start gap-4"><div className="rounded-2xl bg-sage p-3 text-moss"><FolderKanban className="h-6 w-6" /></div><div><p className="text-sm font-semibold text-coral">Project</p><h1 className="mt-1 text-4xl font-bold tracking-tight">{project.name}</h1>{project.description && <p className="mt-2 text-ink/55">{project.description}</p>}</div></div>
        <section className="panel mt-8 p-5 sm:p-6"><div className="mb-5"><h2 className="text-xl font-bold">Project tasks</h2><p className="mt-1 text-sm text-ink/50">{projectTasks.length} tasks in this project</p></div><CreateTaskForm householdId={householdId} projectId={projectId} members={members} /><TaskList householdId={householdId} tasks={projectTasks.map((task) => ({ id: task.id, title: task.title, status: task.status, dueDate: task.dueDate, assignees: assigneesByTask.get(task.id) ?? [] }))} /></section>
      </div>
    </main>
  );
}