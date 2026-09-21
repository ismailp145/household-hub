import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CheckCircle2, Home, Users } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    return (
      <main className="min-h-screen bg-cream px-5 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-moss">
            <Home className="h-5 w-5" />
            Household Hub
          </div>
          <Link className="button-primary" href="/dashboard">
            Open your hub <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-cream">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
        <div>
          <div className="mb-8 flex items-center gap-2 font-bold text-moss">
            <Home className="h-5 w-5" />
            Household Hub
          </div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-coral">
            Home, in sync
          </p>
          <h1 className="max-w-xl text-5xl font-bold leading-[1.02] tracking-tight text-ink sm:text-7xl">
            Less remembering. More living.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-ink/60">
            One calm place for the people, tasks, and projects that keep your household moving.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-primary px-5 py-3" href="/sign-up">
              Create your hub <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link className="button-secondary px-5 py-3" href="/sign-in">
              Sign in
            </Link>
          </div>
          <div className="mt-10 grid max-w-lg gap-3 text-sm text-ink/65 sm:grid-cols-3">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-moss" /> Shared tasks</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-moss" /> Everyone included</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-moss" /> Clear ownership</span>
          </div>
        </div>
        <div className="panel relative overflow-hidden bg-sage/50 p-5 sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-coral/20 blur-2xl" />
          <div className="relative">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/55">Sunday, September 20</p>
                <h2 className="mt-1 text-2xl font-bold">The Patel household</h2>
              </div>
              <div className="rounded-2xl bg-white p-3 text-moss shadow-sm"><Home className="h-5 w-5" /></div>
            </div>
            <div className="space-y-3">
              {[
                { title: "Put recycling out", meta: "Today · Maya", done: true },
                { title: "Order school supplies", meta: "Tomorrow · Ish", done: false },
                { title: "Paint the guest room", meta: "Project · 4 tasks", done: false },
              ].map(({ title, meta, done }) => (
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm" key={title}>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${done ? "border-moss bg-moss text-white" : "border-black/15"}`}>
                    {done && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold ${done ? "text-ink/40 line-through" : ""}`}>{title}</p>
                    <p className="mt-1 text-xs text-ink/45">{meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}