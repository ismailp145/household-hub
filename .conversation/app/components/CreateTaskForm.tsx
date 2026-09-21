import { createTaskFromForm } from "@/app/actions/task-actions";

type MemberOption = {
  id: string;
  name: string;
};

export function CreateTaskForm({
  householdId,
  projectId,
  members,
}: {
  householdId: string;
  projectId?: string;
  members: MemberOption[];
}) {
  const action = createTaskFromForm.bind(null, householdId, projectId);

  return (
    <form action={action} className="mb-5 grid gap-3 rounded-2xl bg-sage/35 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-ink/60" htmlFor={`task-title-${projectId ?? "household"}`}>
          Task
        </label>
        <input
          className="field"
          id={`task-title-${projectId ?? "household"}`}
          name="title"
          placeholder="What needs to get done?"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink/60" htmlFor={`task-due-${projectId ?? "household"}`}>
          Due date
        </label>
        <input className="field" id={`task-due-${projectId ?? "household"}`} name="dueDate" type="date" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink/60" htmlFor={`task-assignee-${projectId ?? "household"}`}>
          Assignees
        </label>
        <select className="field min-h-11" id={`task-assignee-${projectId ?? "household"}`} multiple name="assigneeIds">
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-ink/40">Use Ctrl/Cmd to select more than one.</p>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-ink/60" htmlFor={`task-description-${projectId ?? "household"}`}>
          Notes <span className="font-normal">(optional)</span>
        </label>
        <textarea className="field min-h-20 resize-y" id={`task-description-${projectId ?? "household"}`} name="description" placeholder="Add helpful context" />
      </div>
      <div className="sm:col-span-2">
        <button className="button-primary" type="submit">Add task</button>
      </div>
    </form>
  );
}