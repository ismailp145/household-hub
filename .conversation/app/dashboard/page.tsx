import { UserButton } from "@clerk/nextjs";
import { and, asc, eq } from "drizzle-orm";
import { Home, Plus, Users } from "lucide-react";
import Link from "next/link";
import { HouseholdForms } from "@/app/components/HouseholdForms";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { householdMembers, households } from "@/lib/db/schema";

export default async function DashboardPage() {
  const user = await requireUser();
  const memberships = await db
    .select({ household: households, membership: householdMembers })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, user.id))
    .orderBy(asc(households.name));

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-black/5 bg-white/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-moss"><Home className="h-5 w-5" /> Household Hub</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-semibold text-coral">Welcome back, {user.displayName.split(" ")[0]}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-4xl font-bold tracking-tight">Your households</h1><p className="mt-2 text-ink/55">Choose a shared space or start a new one.</p></div>
          <div className="flex items-center gap-2 text-sm text-ink/50"><Users className="h-4 w-4" /> {memberships.length} {memberships.length === 1 ? "household" : "households"}</div>
        </div>
        {memberships.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ household, membership }) => (
              <Link href={`/households/${household.id}`} className="panel group p-5 transition hover:-translate-y-0.5 hover:border-moss/20" key={household.id}>
                <div className="flex items-start justify-between"><div className="rounded-2xl bg-sage p-3 text-moss"><Home className="h-5 w-5" /></div><span className="text-xs font-semibold capitalize text-ink/40">{membership.role}</span></div>
                <h2 className="mt-5 text-xl font-bold">{household.name}</h2>
                <p className="mt-2 text-sm text-ink/50">Open household <span className="text-moss transition group-hover:ml-1">→</span></p>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-10"><HouseholdForms /></div>
      </div>
    </main>
  );
}