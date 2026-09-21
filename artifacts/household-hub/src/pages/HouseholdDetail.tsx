import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetHouseholdDashboard } from "@workspace/api-client-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Plus, LayoutDashboard, CheckCircle2, CalendarDays, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function HouseholdDetail() {
  const { householdId } = useParams<{ householdId: string }>();
  const { data: dashboard, isLoading, error } = useGetHouseholdDashboard(householdId);
  const { createTask, updateTask, isCreating: isCreatingTask, isUpdating: isUpdatingTask } = useTasks(householdId);
  const { createProject, isCreating: isCreatingProject } = useProjects(householdId);
  
  const { toast } = useToast();

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;
    createTask({ householdId, data: { title: taskTitle, description: taskDesc || undefined } }, {
      onSuccess: () => {
        setNewTaskOpen(false);
        setTaskTitle("");
        setTaskDesc("");
        toast({ title: "Task added" });
      }
    });
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    createProject({ householdId, data: { name: projectName, description: projectDesc || undefined } }, {
      onSuccess: () => {
        setNewProjectOpen(false);
        setProjectName("");
        setProjectDesc("");
        toast({ title: "Project created" });
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
          <Skeleton className="h-12 w-1/3 rounded-xl bg-card" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-3xl bg-card" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-3xl bg-card" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-muted-foreground">
          Failed to load household. You might not have access.
        </div>
      </AppLayout>
    );
  }

  const sortedTasks = dashboard.tasks.sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return 0;
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{dashboard.name}</h1>
        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
          <span className="capitalize px-2 py-1 bg-secondary/10 text-secondary rounded-md font-medium">{dashboard.role}</span>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {dashboard.members.length} members
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Tasks
            </h2>
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full shadow-sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      placeholder="e.g. Buy groceries" 
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
                  <Button onClick={handleCreateTask} disabled={isCreatingTask || !taskTitle} className="w-full">
                    {isCreatingTask ? "Adding..." : "Add Task"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {sortedTasks.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium">All caught up!</h3>
                <p className="text-sm text-muted-foreground mt-1">There are no tasks for this household yet.</p>
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
                        className="mt-1 w-5 h-5 rounded-full border-2 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                        disabled={isUpdatingTask}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          {task.projectId && (
                            <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px] font-bold">
                              <LayoutDashboard className="w-3 h-3" />
                              Project Task
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="w-3 h-3" />
                              {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.assignees.length > 0 && (
                        <div className="flex -space-x-2 shrink-0">
                          {task.assignees.map(a => (
                            <Avatar key={a.id} className="w-7 h-7 border-2 border-card">
                              <AvatarImage src={a.avatarUrl || ''} />
                              <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">{a.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Content: Projects & Members */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-[#D4A373]" />
                Projects
              </h2>
              <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input 
                        placeholder="e.g. Spring Cleaning" 
                        value={projectName} 
                        onChange={e => setProjectName(e.target.value)} 
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea 
                        placeholder="What's the goal?" 
                        value={projectDesc} 
                        onChange={e => setProjectDesc(e.target.value)} 
                      />
                    </div>
                    <Button onClick={handleCreateProject} disabled={isCreatingProject || !projectName} className="w-full">
                      {isCreatingProject ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3">
              {dashboard.projects.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 bg-card rounded-2xl border border-border border-dashed text-center">
                  No projects yet.
                </div>
              ) : (
                dashboard.projects.map(project => {
                  const progress = project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0;
                  return (
                    <Link key={project.id} href={`/households/${householdId}/projects/${project.id}`} className="block">
                      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover-elevate cursor-pointer transition-colors group">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                          <span className="font-medium">{project.completedTaskCount} / {project.taskCount} tasks</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-[#D4A373] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              Members
            </h2>
            <div className="bg-card rounded-2xl border border-border p-2">
              {dashboard.members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">{member.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{member.displayName}</span>
                    <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
