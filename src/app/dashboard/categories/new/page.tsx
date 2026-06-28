import { CategoryForm } from "@/components/category-form";
import { createCategory } from "@/lib/actions/categories";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New category</h1>
        <p className="text-sm text-muted-foreground">
          Create a group to organize tools.
        </p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  );
}
