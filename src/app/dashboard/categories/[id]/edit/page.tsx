import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { CategoryForm } from "@/components/category-form";
import { updateCategory } from "@/lib/actions/categories";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) notFound();

  const action = updateCategory.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit category</h1>
        <p className="text-sm text-muted-foreground">{category.name}</p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <CategoryForm action={action} category={category} />
      </div>
    </div>
  );
}
