import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, CheckCircle2, Users, LayoutDashboard } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 font-bold text-xl text-foreground">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          Household Hub
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">
            Log in
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-full shadow-sm">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-16 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          A calmer way to live together
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
          The shared place for <span className="text-primary italic font-serif">home projects</span> and chores.
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Create a warm, intentional space for your family or housemates. Organize tasks, track projects, and keep everyone on the same page without the noise.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-md hover-elevate">
              Start your household
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Peaceful tracking</h3>
            <p className="text-muted-foreground leading-relaxed">No aggressive notifications. Just a calm list of what needs doing around the house.</p>
          </div>
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Everyone included</h3>
            <p className="text-muted-foreground leading-relaxed">Invite partners, kids, or roommates. Share the load and see who is doing what.</p>
          </div>
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#D4A373]/10 flex items-center justify-center mb-4">
              <LayoutDashboard className="w-6 h-6 text-[#D4A373]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Bigger projects</h3>
            <p className="text-muted-foreground leading-relaxed">Group tasks into projects like 'Spring Cleaning' or 'Kitchen Reno' to stay organized.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
