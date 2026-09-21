"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { householdMembers, households, invites } from "@/lib/db/schema";
import { createJoinCode, hashCode } from "@/lib/security";

const householdSchema = z.object({ name: z.string().trim().min(2).max(80) });
const joinSchema = z.object({ code: z.string().trim().min(4).max(32) });

export async function createHousehold(formData: FormData) {
  const user = await requireUser();
  const { name } = householdSchema.parse({ name: formData.get("name") });
  const joinCode = createJoinCode();

  const [household] = await db
    .insert(households)
    .values({ name, createdByUserId: user.id, joinCodeHash: hashCode(joinCode) })
    .returning();

  await db.insert(householdMembers).values({
    householdId: household.id,
    userId: user.id,
    role: "owner",
  });

  revalidatePath("/dashboard");
  redirect(`/households/${household.id}?createdCode=${joinCode}`);
}

export async function joinHousehold(formData: FormData) {
  const user = await requireUser();
  const { code } = joinSchema.parse({ code: formData.get("code") });
  const household = await db.query.households.findFirst({
    where: eq(households.joinCodeHash, hashCode(code)),
  });

  if (!household) redirect("/dashboard?error=invalid_code");

  const existing = await db.query.householdMembers.findFirst({
    where: and(
      eq(householdMembers.householdId, household.id),
      eq(householdMembers.userId, user.id),
    ),
  });

  if (!existing) {
    await db.insert(householdMembers).values({
      householdId: household.id,
      userId: user.id,
      role: "member",
    });
  }

  revalidatePath("/dashboard");
  redirect(`/households/${household.id}`);
}

export async function createInvite(householdId: string) {
  const { user, membership } = await requireHouseholdMemberForAction(householdId);
  if (membership.role !== "owner") throw new Error("Only household owners can create invites.");
  const code = createJoinCode();

  await db.insert(invites).values({
    householdId,
    inviteCodeHash: hashCode(code),
    createdByUserId: user.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  return code;
}

async function requireHouseholdMemberForAction(householdId: string) {
  const user = await requireUser();
  const membership = await db.query.householdMembers.findFirst({
    where: and(
      eq(householdMembers.householdId, householdId),
      eq(householdMembers.userId, user.id),
    ),
  });
  if (!membership) throw new Error("You are not a member of this household.");
  return { user, membership };
}