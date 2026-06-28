import { ImportForm } from "@/components/import-form";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bulk import</h1>
        <p className="text-sm text-muted-foreground">
          Add many tools at once from a CSV or JSON file. New categories and
          tags are created automatically.
        </p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <ImportForm />
      </div>
    </div>
  );
}
