import Link from "next/link";
import { Plus, Pencil } from "lucide-react";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { deleteCategory } from "@/lib/actions/categories";

export default async function CategoriesListPage() {
  const categories = await db.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { tools: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kelola Kategori
          </h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} kategori
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/categories/new">
            <Plus className="mr-1.5 h-4 w-4" /> Kategori baru
          </Link>
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          Belum ada kategori.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
            >
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: cat.color ?? "hsl(var(--brand))" }}
              />
              <div className="flex items-start justify-between gap-2 pl-2">
                <div className="min-w-0">
                  <p className="truncate font-medium tracking-tight">
                    {cat.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cat._count.tools} tools
                  </p>
                </div>
                <div className="flex flex-none gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/categories/${cat.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeleteButton
                    label=""
                    confirmText={`Hapus kategori "${cat.name}"? Semua tools di dalamnya akan ikut terhapus.`}
                    action={async () => {
                      "use server";
                      await deleteCategory(cat.id);
                    }}
                  />
                </div>
              </div>
              {cat.description ? (
                <p className="line-clamp-2 pl-2 text-sm text-muted-foreground">
                  {cat.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
