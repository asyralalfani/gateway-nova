"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
};

type Props = {
  action: (
    prev: { ok: boolean; error?: string } | null,
    formData: FormData,
  ) => Promise<{ ok: boolean; error?: string }>;
  category?: Category;
};

export function CategoryForm({ action, category }: Props) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={category?.name}
          placeholder="Misal: DevOps"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={category?.description ?? ""}
          placeholder="Penjelasan singkat (opsional)"
          rows={2}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="icon">Icon</Label>
          <Input
            id="icon"
            name="icon"
            defaultValue={category?.icon ?? ""}
            placeholder="emoji / nama"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Warna</Label>
          <Input
            id="color"
            name="color"
            type="text"
            defaultValue={category?.color ?? ""}
            placeholder="#3b82f6"
            pattern="^#[0-9a-fA-F]{6}$"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Urutan</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min={0}
            defaultValue={category?.order ?? 0}
          />
        </div>
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <SubmitButton label={category ? "Simpan perubahan" : "Tambah kategori"} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan…" : label}
    </Button>
  );
}
