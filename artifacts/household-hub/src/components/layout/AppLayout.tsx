import { useUser, useClerk } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { useHouseholds } from "@/hooks/use-households";
import { 
  Home, 
  LogOut, 
  Menu,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();
  const { households, isLoading } = useHouseholds();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItems = () => (
    <div className="flex flex-col h-full gap-2 py-4">
      <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${location === '/dashboard' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-black/5 hover:text-foreground'}`}>
        <Home className="w-4 h-4" />
        <span>Dashboard</span>
      </Link>

      <div className="mt-6 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        My Households
      </div>
      
      {isLoading ? (
        <div className="px-3 flex flex-col gap-2">
          <Skeleton className="h-8 w-full rounded-md bg-black/5" />
          <Skeleton className="h-8 w-full rounded-md bg-black/5" />
        </div>
      ) : households?.length === 0 ? (
        <div className="px-3 text-sm text-muted-foreground">
          No households yet.
        </div>
      ) : (
        households?.map(h => (
          <Link key={h.id} href={`/households/${h.id}`} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${location.startsWith(`/households/${h.id}`) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-black/5 hover:text-foreground'}`}>
            <div className="flex items-center gap-3 truncate">
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">{h.name}</span>
            </div>
            {h.openTaskCount > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                {h.openTaskCount}
              </span>
            )}
          </Link>
        ))
      )}

      <div className="mt-auto pt-6 border-t border-border">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut({ redirectUrl: '/' })} className="text-muted-foreground shrink-0 hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card fixed inset-y-0 left-0">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border font-bold text-lg">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          Household Hub
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavItems />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 font-bold">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          Household Hub
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex items-center gap-3 px-6 h-16 border-b border-border font-bold text-lg bg-card">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              Household Hub
            </div>
            <div className="px-3 py-2 bg-card h-[calc(100dvh-64px)]">
              <NavItems />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-[100dvh]">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
