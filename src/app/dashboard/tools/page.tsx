import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { deleteTool } from "@/lib/actions/tools";

export default async function ToolsListPage() {
  const tools = await db.tool.findMany({
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }, { name: "asc" }],
    include: { category: true, tags: { include: { tag: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Tools</h1>
          <p className="text-sm text-muted-foreground">
            {tools.length} tools registered
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/tools/new">
            <Plus className="mr-1.5 h-4 w-4" /> New tool
          </Link>
        </Button>
      </div>

      {tools.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          No tools yet. Add your first tool.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <ul className="divide-y divide-border/60">
            {tools.map((tool) => (
              <li
                key={tool.id}
                className="group flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{tool.name}</p>
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/60 text-[10px] font-medium"
                    >
                      {tool.category.name}
                    </Badge>
                  </div>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className="truncate">{tool.url}</span>
                    <ExternalLink className="h-3 w-3 flex-none" />
                  </a>
                  {tool.tags.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tool.tags.map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="rounded-full text-[10px]"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/tools/${tool.id}/edit`}>
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <DeleteButton
                    action={async () => {
                      "use server";
                      await deleteTool(tool.id);
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
