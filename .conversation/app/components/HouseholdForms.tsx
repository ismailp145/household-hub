"use client";

import { useFormStatus } from "react-dom";
import { createHousehold, joinHousehold } from "@/app/actions/household-actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="button-primary w-full" disabled={pending}>{pending ? "Working..." : children}</button>;
}

export function HouseholdForms() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form action={createHousehold} className="panel p-5">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-coral">Start fresh</p>
        <h2 className="mt-2 text-xl font-bold">Create a household</h2>
        <p className="mt-2 text-sm leading-6 text-ink/55">Set up a shared space and invite people with a join code.</p>
        <input className="field mt-5" name="name" placeholder="e.g. The Patel household" required />
        <div className="mt-3"><SubmitButton>Create household</SubmitButton></div>
      </form>
      <form action={joinHousehold} className="panel p-5">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-coral">Already invited?</p>
        <h2 className="mt-2 text-xl font-bold">Join a household</h2>
        <p className="mt-2 text-sm leading-6 text-ink/55">Enter the invite code shared by someone in your household.</p>
        <input className="field mt-5 uppercase tracking-[0.16em]" name="code" placeholder="AB12CD34" required />
        <div className="mt-3"><SubmitButton>Join household</SubmitButton></div>
      </form>
    </div>
  );
}