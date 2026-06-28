"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";

type ActionState = { ok: boolean; error?: string };

function parseFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: (formData.get("description") as string | null) || null,
    icon: (formData.get("icon") as string | null) || null,
    color: (formData.get("color") as string | null) || null,
    order: String(formData.get("order") ?? "0"),
  };
}

export async function createCategory(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireEditor();
    const data = categorySchema.parse(parseFormData(formData));

    await db.category.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        icon: data.icon ?? null,
        color: data.color ?? null,
        order: data.order,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create category",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function updateCategory(
  id: string,
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireEditor();
    const data = categorySchema.parse(parseFormData(formData));

    await db.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
        icon: data.icon ?? null,
        color: data.color ?? null,
        order: data.order,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update category",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function deleteCategory(id: string) {
  await requireEditor();
  await db.category.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/dashboard/categories");
}
