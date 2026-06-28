"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { importRowSchema, type ImportRow } from "@/lib/import-parser";

export type ImportSummary = {
  ok: boolean;
  created: number;
  skipped: number;
  errors: { index: number; name?: string; error: string }[];
};

export async function importTools(rawRows: unknown[]): Promise<ImportSummary> {
  await requireEditor();

  const summary: ImportSummary = { ok: true, created: 0, skipped: 0, errors: [] };

  // Validate every row up-front so we don't half-import on a bad payload.
  const validated: { index: number; row: ImportRow }[] = [];
  rawRows.forEach((raw, index) => {
    const parsed = importRowSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      summary.errors.push({
        index,
        name: typeof (raw as Record<string, unknown>)?.name === "string"
          ? ((raw as Record<string, unknown>).name as string)
          : undefined,
        error: `${first.path.join(".") || "row"}: ${first.message}`,
      });
      return;
    }
    validated.push({ index, row: parsed.data });
  });

  if (validated.length === 0) {
    return summary;
  }

  // Upsert categories.
  const uniqueCategories = Array.from(new Set(validated.map((v) => v.row.category)));
  const categoryByName = new Map<string, string>();
  for (const name of uniqueCategories) {
    const category = await db.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryByName.set(name, category.id);
  }

  // Upsert tags.
  const uniqueTags = Array.from(
    new Set(validated.flatMap((v) => v.row.tags)),
  );
  const tagByName = new Map<string, string>();
  for (const name of uniqueTags) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagByName.set(name, tag.id);
  }

  // Existing tools by name (used for skip-on-duplicate).
  const existingNames = new Set(
    (
      await db.tool.findMany({
        where: { name: { in: validated.map((v) => v.row.name) } },
        select: { name: true },
      })
    ).map((t) => t.name),
  );

  // Create tools one-by-one so a single bad row doesn't break the rest.
  for (const { index, row } of validated) {
    if (existingNames.has(row.name)) {
      summary.skipped++;
      continue;
    }
    const categoryId = categoryByName.get(row.category);
    if (!categoryId) {
      summary.errors.push({
        index,
        name: row.name,
        error: `category "${row.category}" not found`,
      });
      continue;
    }
    try {
      await db.tool.create({
        data: {
          name: row.name,
          url: row.url,
          description: row.description ?? null,
          iconUrl: row.iconUrl ?? null,
          categoryId,
          tags: {
            create: row.tags
              .map((t) => tagByName.get(t))
              .filter((id): id is string => Boolean(id))
              .map((tagId) => ({ tagId })),
          },
        },
      });
      summary.created++;
      existingNames.add(row.name);
    } catch (err) {
      summary.errors.push({
        index,
        name: row.name,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  if (summary.created > 0) {
    revalidatePath("/");
    revalidatePath("/dashboard/tools");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/tags");
  }

  return summary;
}
