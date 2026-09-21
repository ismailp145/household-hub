import { createProject } from "@/app/actions/project-actions";

export function CreateProjectForm({ householdId }: { householdId: string }) {
  const action = createProject.bind(null, householdId);

  return (
    <form action={action} className="mb-4 space-y-2 rounded-2xl bg-sage/35 p-3">
      <input className="field" name="name" placeholder="Project name" required />
      <textarea className="field min-h-16 resize-y" name="description" placeholder="Short description (optional)" />
      <button className="button-primary w-full" type="submit">Create project</button>
    </form>
  );
}