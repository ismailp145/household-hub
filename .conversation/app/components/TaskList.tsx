"use client";

import { Check, Circle, Clock3 } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/task-actions";
import { formatDate } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  dueDate: string | null;
  assignees: string[];
};

const nextStatus = { todo: "in_progress", in_progress: "done", done: "todo" } as const;

export function TaskList({ tasks, householdId }: { tasks: TaskItem[]; householdId: string }) {
  if (!tasks.length) {
    return <div className="rounded-2xl border border-dashed border-black/10 px-5 py-10 text-center text-sm text-ink/50">No tasks yet. Add the first one to get the household moving.</div>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <form action={async () => updateTaskStatus(task.id, householdId, nextStatus[task.status])} key={task.id} className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <button className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${task.status === "done" ? "border-moss bg-moss text-white" : "border-black/15 hover:border-moss"}`} title="Advance task status">
            {task.status === "done" ? <Check className="h-4 w-4" /> : task.status === "in_progress" ? <Clock3 className="h-3.5 w-3.5 text-coral" /> : <Circle className="h-3.5 w-3.5 text-transparent" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${task.status === "done" ? "text-ink/40 line-through" : ""}`}>{task.title}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/45">
              <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
              {task.assignees.length > 0 && <span>{task.assignees.join(", ")}</span>}
            </div>
          </div>
          <span className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold capitalize text-moss">{task.status.replace("_", " ")}</span>
        </form>
      ))}
    </div>
  );
}