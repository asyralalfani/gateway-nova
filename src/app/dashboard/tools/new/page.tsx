import { db } from "@/lib/db";
import { ToolForm } from "@/components/tool-form";
import { createTool } from "@/lib/actions/tools";

export default async function NewToolPage() {
  const [categories, tags] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New tool</h1>
        <p className="text-sm text-muted-foreground">
          Add a link for a tool your team uses.
        </p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <ToolForm action={createTool} categories={categories} tags={tags} />
      </div>
    </div>
  );
}
