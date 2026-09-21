"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireHouseholdMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
});

export async function createProject(householdId: string, formData: FormData) {
  const { user } = await requireHouseholdMember(householdId);
  const input = projectSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  await db.insert(projects).values({
    householdId,
    name: input.name,
    description: input.description || null,
    createdByUserId: user.id,
  });

  revalidatePath(`/households/${householdId}`);
}