"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { tagSchema } from "@/lib/validators";

type ActionState = { ok: boolean; error?: string };

export async function createTag(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireEditor();
    const data = tagSchema.parse({
      name: String(formData.get("name") ?? "").trim(),
    });

    await db.tag.create({ data: { name: data.name } });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create tag",
    };
  }

  revalidatePath("/dashboard/tags");
  return { ok: true };
}

export async function deleteTag(id: string) {
  await requireEditor();
  await db.tag.delete({ where: { id } });
  revalidatePath("/dashboard/tags");
}
