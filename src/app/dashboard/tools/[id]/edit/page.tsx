import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { ToolForm } from "@/components/tool-form";
import { updateTool } from "@/lib/actions/tools";

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tool, categories, tags] = await Promise.all([
    db.tool.findUnique({
      where: { id },
      include: { tags: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!tool) notFound();

  const action = updateTool.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit tool</h1>
        <p className="text-sm text-muted-foreground">{tool.name}</p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <ToolForm
          action={action}
          categories={categories}
          tags={tags}
          tool={tool}
        />
      </div>
    </div>
  );
}
