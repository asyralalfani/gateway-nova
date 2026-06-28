import { db } from "@/lib/db";
import { createTag, deleteTag } from "@/lib/actions/tags";
import { TagForm } from "@/components/tag-form";
import { DeleteButton } from "@/components/delete-button";

export default async function TagsPage() {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tools: true } } },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Tags</h1>
          <p className="text-sm text-muted-foreground">
            A tag can be attached to multiple tools at once.
          </p>
        </div>

        {tags.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            No tags yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card pl-3 pr-1.5 py-1 shadow-soft transition-shadow hover:shadow-lifted"
              >
                <span className="text-sm font-medium">{tag.name}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {tag._count.tools}
                </span>
                <DeleteButton
                  label=""
                  confirmText={`Delete tag "${tag.name}"?`}
                  action={async () => {
                    "use server";
                    await deleteTag(tag.id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="h-fit rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Add a new tag
        </h2>
        <TagForm action={createTag} />
      </aside>
    </div>
  );
}
