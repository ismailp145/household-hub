import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useHouseholds } from "@/hooks/use-households";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Users, Plus, Key } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { households, isLoading, createHousehold, isCreating, joinHousehold, isJoining } = useHouseholds();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const { toast } = useToast();

  const handleCreate = () => {
    if (!newHouseholdName.trim()) return;
    createHousehold({ data: { name: newHouseholdName } }, {
      onSuccess: (data) => {
        setCreateOpen(false);
        setNewHouseholdName("");
        toast({
          title: "Household created",
          description: `You've successfully created ${data.household.name}. The invite code is ${data.joinCode}.`
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to create",
          description: err.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinHousehold({ data: { code: joinCode } }, {
      onSuccess: (data) => {
        setJoinOpen(false);
        setJoinCode("");
        toast({
          title: "Joined household",
          description: `You are now a member of ${data.name}.`
        });
      },
      onError: (err) => {
        toast({
          title: "Failed to join",
          description: "Invalid code or you are already a member.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your households and join new ones.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-card shadow-sm hover-elevate">
                <Key className="w-4 h-4 mr-2" />
                Join Household
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Join a Household</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Invite Code</Label>
                  <Input 
                    placeholder="e.g. A1B2C3D4" 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value)} 
                  />
                </div>
                <Button onClick={handleJoin} disabled={isJoining || !joinCode} className="w-full">
                  {isJoining ? "Joining..." : "Join"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm hover-elevate">
                <Plus className="w-4 h-4 mr-2" />
                New Household
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a Household</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Household Name</Label>
                  <Input 
                    placeholder="e.g. The Smith Family" 
                    value={newHouseholdName} 
                    onChange={e => setNewHouseholdName(e.target.value)} 
                  />
                </div>
                <Button onClick={handleCreate} disabled={isCreating || !newHouseholdName} className="w-full">
                  {isCreating ? "Creating..." : "Create Household"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-40 w-full rounded-2xl bg-card border border-border" />
            <Skeleton className="h-40 w-full rounded-2xl bg-card border border-border" />
          </>
        ) : households.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-card rounded-3xl border border-border border-dashed">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <Home className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No households yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Create a new household or join an existing one using an invite code to get started.
            </p>
          </div>
        ) : (
          households.map(household => (
            <Link key={household.id} href={`/households/${household.id}`} className="block">
              <Card className="rounded-3xl cursor-pointer transition-all hover-elevate hover:border-primary/30 group h-full">
                <CardHeader className="pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle>{household.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1">
                    <span className="capitalize">{household.role}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{household.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-secondary/10 text-secondary px-2.5 py-1 rounded-full text-xs font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    {household.openTaskCount} open tasks
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </AppLayout>
  );
}
