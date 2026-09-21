import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectDetail } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Plus, LayoutDashboard, CheckCircle2, CalendarDays, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AssigneeSelect } from "@/components/AssigneeSelect";

export default function ProjectDetail() {
  const { householdId, projectId } = useParams<{ householdId: string, projectId: string }>();
  const { data: detail, isLoading, error } = useProjectDetail(householdId, projectId);
  const { createTask, updateTask, isCreating: isCreatingTask, isUpdating: isUpdatingTask } = useTasks(householdId, projectId);
  const { toast } = useToast();

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("unassigned");

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;
    createTask({ 
      householdId,
      data: { 
        title: taskTitle, 
        description: taskDesc || undefined, 
        projectId,
        assigneeIds: taskAssigneeId === "unassigned" ? undefined : [taskAssigneeId],
      } 
    }, {
      onSuccess: () => {
        setNewTaskOpen(false);
        setTaskTitle("");
        setTaskDesc("");
        setTaskAssigneeId("unassigned");
        toast({ title: "Project task added" });
      }
    });
  };

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTask({ householdId, taskId, data: { status: newStatus } }, {
      onError: () => {
        toast({ title: "Failed to update task", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-24 rounded-lg bg-card mb-6" />
          <Skeleton className="h-12 w-1/3 rounded-xl bg-card" />
          <Skeleton className="h-64 w-full rounded-3xl bg-card" />
        </div>
      </AppLayout>
    );
  }

  if (error || !detail) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-muted-foreground">
          Failed to load project.
        </div>
      </AppLayout>
    );
  }

  const { project, tasks } = detail;
  const progress = project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0;

  const sortedTasks = tasks.sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return 0;
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <Link href={`/households/${householdId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Household
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#D4A373]/10 flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-7 h-7 text-[#D4A373]" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2 text-lg">{project.description}</p>
            )}
            
            <div className="mt-6 max-w-md bg-card p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between text-sm font-semibold mb-2">
                <span>Project Progress</span>
                <span className="text-[#D4A373]">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4A373] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {project.completedTaskCount} of {project.taskCount} tasks completed
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#D4A373]" />
            Project Tasks
          </h2>
          <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full shadow-sm bg-[#D4A373] hover:bg-[#D4A373]/90 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a project task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g. Paint the cabinets" 
                    value={taskTitle} 
                    onChange={e => setTaskTitle(e.target.value)} 
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                    <Textarea 
                      placeholder="Any details..." 
                      value={taskDesc} 
                      onChange={e => setTaskDesc(e.target.value)} 
                    />
                  </div>
                  <AssigneeSelect
                    label="Assign to"
                    members={detail.members}
                    value={taskAssigneeId}
                    onChange={setTaskAssigneeId}
                  />
                  <Button onClick={handleCreateTask} disabled={isCreatingTask || !taskTitle} className="w-full bg-[#D4A373] hover:bg-[#D4A373]/90 text-white">
                  {isCreatingTask ? "Adding..." : "Add Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          {sortedTasks.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No tasks yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Break this project down into smaller tasks.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedTasks.map(task => {
                const isDone = task.status === "done";
                return (
                  <div key={task.id} className={`p-4 flex items-start gap-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${isDone ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <Checkbox 
                      checked={isDone}
                      onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                      className="mt-1 w-5 h-5 rounded-full border-2 data-[state=checked]:bg-[#D4A373] data-[state=checked]:border-[#D4A373]"
                      disabled={isUpdatingTask}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-2">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 w-40">
                      <AssigneeSelect
                        members={detail.members}
                        value={task.assignees[0]?.id ?? "unassigned"}
                        onChange={(memberId) => {
                          updateTask({
                            householdId,
                            taskId: task.id,
                            data: {
                              assigneeIds: memberId === "unassigned" ? [] : [memberId],
                            },
                          }, {
                            onError: () => {
                              toast({ title: "Failed to assign task", variant: "destructive" });
                            },
                          });
                        }}
                        disabled={isUpdatingTask}
                        className="h-8"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
