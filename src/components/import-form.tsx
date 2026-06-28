"use client";

import { AlertCircle, CheckCircle2, Download, FileUp, Upload } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CSV_TEMPLATE,
  JSON_TEMPLATE,
  parseImport,
  type ParsedRow,
} from "@/lib/import-parser";
import { importTools, type ImportSummary } from "@/lib/actions/import";

export function ImportForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseImport(text), [text]);
  const validRows = parsed.rows.filter((r) => r.ok);
  const invalidRows = parsed.rows.filter((r) => !r.ok);
  const hasText = text.trim().length > 0;

  async function onFile(file: File) {
    const content = await file.text();
    setText(content);
  }

  function downloadTemplate(format: "csv" | "json") {
    const blob = new Blob([format === "csv" ? CSV_TEMPLATE : JSON_TEMPLATE], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tools-template.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function submit() {
    if (validRows.length === 0) {
      toast.error("Nothing to import — fix the errors first");
      return;
    }
    startTransition(async () => {
      const rows = validRows.map((r) => r.data);
      const summary: ImportSummary = await importTools(rows);
      if (summary.created > 0) {
        toast.success(
          `Imported ${summary.created} tool${summary.created === 1 ? "" : "s"}` +
            (summary.skipped ? ` (${summary.skipped} skipped)` : ""),
        );
        setText("");
        router.push("/dashboard/tools");
        router.refresh();
        return;
      }
      if (summary.skipped > 0 && summary.errors.length === 0) {
        toast.message(`Nothing new — all ${summary.skipped} already exist`);
        return;
      }
      toast.error(
        `Failed: ${summary.errors.length} error${summary.errors.length === 1 ? "" : "s"}`,
      );
    });
  }

  return (
    <div className="space-y-5">
      {/* Step 1: source */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">1. Upload or paste content</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate("csv")}
            >
              <Download className="mr-1 h-3.5 w-3.5" /> CSV template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate("json")}
            >
              <Download className="mr-1 h-3.5 w-3.5" /> JSON template
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,application/json,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="mr-1.5 h-4 w-4" /> Choose file…
          </Button>
          {hasText ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setText("")}
            >
              Clear
            </Button>
          ) : null}
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste CSV or JSON here, or use 'Choose file…' above."
          rows={8}
          spellCheck={false}
          className="font-mono text-xs"
        />
      </div>

      {/* Step 2: preview */}
      {hasText ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium">2. Preview</p>
            <span className="text-xs text-muted-foreground">
              format: <span className="font-mono">{parsed.format}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              {validRows.length} valid
            </span>
            {invalidRows.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600">
                <AlertCircle className="h-3 w-3" />
                {invalidRows.length} with errors
              </span>
            ) : null}
          </div>

          {parsed.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rows parsed.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">URL</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Tags</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {parsed.rows.map((row) => (
                    <PreviewRow key={row.index} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Step 3: submit */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Tools with names that already exist will be skipped. New categories
          and tags are created automatically.
        </p>
        <Button
          type="button"
          onClick={submit}
          disabled={pending || validRows.length === 0}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {pending
            ? "Importing…"
            : `Import ${validRows.length} tool${validRows.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}

function PreviewRow({ row }: { row: ParsedRow }) {
  if (!row.ok) {
    return (
      <tr className="bg-rose-500/5">
        <td className="px-3 py-2 align-top text-xs text-muted-foreground">
          {row.index + 1}
        </td>
        <td colSpan={4} className="px-3 py-2 align-top text-xs">
          <span className="font-mono break-all text-muted-foreground">
            {JSON.stringify(row.raw)}
          </span>
        </td>
        <td className="px-3 py-2 align-top">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-600">
            <AlertCircle className="h-3 w-3" />
            {row.error ?? "invalid"}
          </span>
        </td>
      </tr>
    );
  }
  const data = row.data!;
  return (
    <tr>
      <td className="px-3 py-2 align-top text-xs text-muted-foreground">
        {row.index + 1}
      </td>
      <td className="px-3 py-2 align-top font-medium">{data.name}</td>
      <td className="px-3 py-2 align-top text-xs text-muted-foreground">
        <span className="break-all">{data.url}</span>
      </td>
      <td className="px-3 py-2 align-top">{data.category}</td>
      <td className="px-3 py-2 align-top text-xs">
        {data.tags.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          data.tags.join(", ")
        )}
      </td>
      <td className="px-3 py-2 align-top">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
          <CheckCircle2 className="h-3 w-3" />
          Ready
        </span>
      </td>
    </tr>
  );
}
