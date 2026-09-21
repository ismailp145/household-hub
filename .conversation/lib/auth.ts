import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { householdMembers, users } from "@/lib/db/schema";

export async function requireUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    email ||
    "Household member";

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUser.id),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      clerkUserId: clerkUser.id,
      displayName,
      email,
      avatarUrl: clerkUser.imageUrl,
    })
    .returning();

  return created;
}

export async function requireHouseholdMember(householdId: string) {
  const user = await requireUser();
  const membership = await db.query.householdMembers.findFirst({
    where: and(
      eq(householdMembers.householdId, householdId),
      eq(householdMembers.userId, user.id),
    ),
  });

  if (!membership) {
    redirect("/dashboard?error=not_a_member");
  }

  return { user, membership };
}