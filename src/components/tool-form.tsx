"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };
type Tool = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  categoryId: string;
  order: number;
  tags: { tagId: string }[];
};

type Props = {
  action: (
    prev: { ok: boolean; error?: string } | null,
    formData: FormData,
  ) => Promise<{ ok: boolean; error?: string }>;
  categories: Category[];
  tags: Tag[];
  tool?: Tool;
};

export function ToolForm({ action, categories, tags, tool }: Props) {
  const [state, formAction] = useActionState(action, null);
  const selectedTagIds = new Set(tool?.tags.map((t) => t.tagId) ?? []);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={tool?.name}
          placeholder="e.g. Jenkins Production"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={tool?.url}
          placeholder="https://"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={tool?.description ?? ""}
          placeholder="Short description (optional)"
          rows={3}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="iconUrl">Icon URL</Label>
          <Input
            id="iconUrl"
            name="iconUrl"
            defaultValue={tool?.iconUrl ?? ""}
            placeholder="https://… (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min={0}
            defaultValue={tool?.order ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={tool?.categoryId ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="" disabled>
            Pick a category…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {tags.length > 0 ? (
        <fieldset className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="inline-flex cursor-pointer items-center gap-1.5"
              >
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  defaultChecked={selectedTagIds.has(tag.id)}
                  className="peer sr-only"
                />
                <Badge
                  variant="outline"
                  className="peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"
                >
                  {tag.name}
                </Badge>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <SubmitButton label={tool ? "Save changes" : "Add tool"} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}
