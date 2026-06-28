"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { toolSchema } from "@/lib/validators";

type ActionState = { ok: boolean; error?: string };

function parseFormData(formData: FormData) {
  const tagIds = formData.getAll("tagIds").map((v) => String(v)).filter(Boolean);
  return {
    name: String(formData.get("name") ?? "").trim(),
    url: String(formData.get("url") ?? "").trim(),
    description: (formData.get("description") as string | null) || null,
    iconUrl: (formData.get("iconUrl") as string | null) || null,
    categoryId: String(formData.get("categoryId") ?? ""),
    order: String(formData.get("order") ?? "0"),
    tagIds,
  };
}

export async function createTool(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireEditor();
    const raw = parseFormData(formData);
    const data = toolSchema.parse(raw);

    await db.tool.create({
      data: {
        name: data.name,
        url: data.url,
        description: data.description ?? null,
        iconUrl: data.iconUrl ?? null,
        categoryId: data.categoryId,
        order: data.order,
        createdBy: user?.id ?? null,
        tags: {
          create: data.tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal membuat tool",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/tools");
  redirect("/dashboard/tools");
}

export async function updateTool(
  id: string,
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireEditor();
    const raw = parseFormData(formData);
    const data = toolSchema.parse(raw);

    await db.$transaction([
      db.toolTag.deleteMany({ where: { toolId: id } }),
      db.tool.update({
        where: { id },
        data: {
          name: data.name,
          url: data.url,
          description: data.description ?? null,
          iconUrl: data.iconUrl ?? null,
          categoryId: data.categoryId,
          order: data.order,
          tags: {
            create: data.tagIds.map((tagId) => ({ tagId })),
          },
        },
      }),
    ]);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal mengupdate tool",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/tools");
  redirect("/dashboard/tools");
}

export async function deleteTool(id: string) {
  await requireEditor();
  await db.tool.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/dashboard/tools");
}
