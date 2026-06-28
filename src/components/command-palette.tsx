"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  Clock,
  CornerDownLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Tool = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  category: { id: string; name: string; color: string | null } | null;
  tags: string[];
};

type IndexedTool = Tool & {
  _name: string;
  _description: string;
  _category: string;
  _tags: string[];
  _host: string;
};

type Scored = { tool: IndexedTool; score: number };

const RECENT_KEY = "gateway-nova.cmdk.recent";
const RECENT_LIMIT = 5;
const MAX_RESULTS = 20;

function getMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string): string[] {
  const current = loadRecent().filter((x) => x !== id);
  const next = [id, ...current].slice(0, RECENT_LIMIT);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function faviconFor(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
}

function indexTools(raw: Tool[]): IndexedTool[] {
  return raw.map((t) => ({
    ...t,
    _name: t.name.toLowerCase(),
    _description: (t.description ?? "").toLowerCase(),
    _category: (t.category?.name ?? "").toLowerCase(),
    _tags: t.tags.map((x) => x.toLowerCase()),
    _host: (safeHost(t.url) ?? "").toLowerCase(),
  }));
}

function score(tool: IndexedTool, q: string): number {
  let s = 0;
  if (tool._name === q) s += 200;
  if (tool._name.startsWith(q)) s += 100;
  if (tool._name.includes(q)) s += 50;
  if (tool._description.includes(q)) s += 20;
  for (const t of tool._tags) {
    if (t === q) s += 30;
    else if (t.includes(q)) s += 15;
  }
  if (tool._category.includes(q)) s += 10;
  if (tool._host.includes(q)) s += 25;
  if (s === 0 && subsequenceMatch(tool._name, q)) s += 5;
  return s;
}

function subsequenceMatch(target: string, query: string): boolean {
  let i = 0;
  for (let k = 0; k < target.length && i < query.length; k++) {
    if (target[k] === query[i]) i++;
  }
  return i === query.length;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tools, setTools] = useState<IndexedTool[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [isMac, setIsMac] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMac(getMacPlatform());
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle =
        (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (isToggle) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "/" && !open) {
        const t = e.target as HTMLElement;
        const tag = t.tagName.toLowerCase();
        const editable = t.isContentEditable;
        if (tag !== "input" && tag !== "textarea" && !editable) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpenEvent);
    };
  }, [open]);

  useEffect(() => {
    if (!open || tools !== null) return;
    setLoading(true);
    fetch("/api/search/tools")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Tool[]) => setTools(indexTools(data)))
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, [open, tools]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setRecent(loadRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results: Scored[] = useMemo(() => {
    if (!tools) return [];
    const q = query.trim().toLowerCase();
    if (!q) {
      const recentOrder = new Map(recent.map((id, i) => [id, i]));
      const arr = tools.map<Scored>((tool) => ({
        tool,
        score: recentOrder.has(tool.id)
          ? 1000 - (recentOrder.get(tool.id) ?? 0)
          : 0,
      }));
      arr.sort(
        (a, b) => b.score - a.score || a.tool._name.localeCompare(b.tool._name),
      );
      return arr.slice(0, MAX_RESULTS);
    }
    const matched: Scored[] = [];
    for (const tool of tools) {
      const s = score(tool, q);
      if (s > 0) matched.push({ tool, score: s });
    }
    matched.sort(
      (a, b) => b.score - a.score || a.tool._name.localeCompare(b.tool._name),
    );
    return matched.slice(0, MAX_RESULTS);
  }, [tools, query, recent]);

  const showingRecent = !query.trim() && recent.length > 0;

  const openTool = useCallback((tool: IndexedTool) => {
    setRecent(pushRecent(tool.id));
    window.open(tool.url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }, []);

  const hoverRow = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) openTool(target.tool);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(results.length - 1);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[15%] z-50 w-[92vw] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-2xl shadow-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Cari tool
          </DialogPrimitive.Title>

          {/* Subtle top border accent (static, cheap) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent"
          />

          <div className="relative">
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
              <Search className="h-4 w-4 flex-none text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Cari tool berdasarkan nama, tag, atau kategori..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden flex-none items-center gap-1 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                esc
              </kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto overscroll-contain p-2"
            >
              {loading && tools === null ? (
                <LoadingSkeleton />
              ) : results.length === 0 ? (
                <EmptyResults query={query} />
              ) : (
                <>
                  {showingRecent && (
                    <div className="mb-1 flex items-center gap-1.5 px-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Baru-baru ini
                    </div>
                  )}
                  {results.map((item, idx) => (
                    <ResultRow
                      key={item.tool.id}
                      tool={item.tool}
                      active={idx === activeIndex}
                      index={idx}
                      onSelect={openTool}
                      onHover={hoverRow}
                    />
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-background/40 px-4 py-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-brand" />
                  {tools?.length ?? 0} tools
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden items-center gap-1 sm:flex">
                  <kbd className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-medium">
                    ↑↓
                  </kbd>
                  navigasi
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center gap-0.5 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-medium">
                    <CornerDownLeft className="h-2.5 w-2.5" />
                  </kbd>
                  buka
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <kbd className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-medium">
                    {isMac ? "⌘" : "Ctrl"}K
                  </kbd>
                  toggle
                </span>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type RowProps = {
  tool: IndexedTool;
  active: boolean;
  index: number;
  onSelect: (tool: IndexedTool) => void;
  onHover: (index: number) => void;
};

const ResultRow = memo(
  function ResultRow({ tool, active, index, onSelect, onHover }: RowProps) {
    const host = safeHost(tool.url);
    const iconSrc = tool.iconUrl ?? (host ? faviconFor(host) : null);
    const color = tool.category?.color ?? null;

    return (
      <button
        type="button"
        data-index={index}
        data-active={active}
        onMouseEnter={() => onHover(index)}
        onClick={() => onSelect(tool)}
        className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <div
          className="relative grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted shadow-soft"
          style={color ? { boxShadow: `0 0 0 1px ${color}33` } : undefined}
        >
          {iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              alt=""
              className="h-6 w-6 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-[10px] font-semibold text-foreground/60">
              {tool.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium leading-tight">
              {tool.name}
            </span>
            {tool.category && (
              <span
                className="hidden flex-none rounded-full border border-border/60 px-1.5 py-0 text-[10px] font-medium text-muted-foreground sm:inline"
                style={
                  color
                    ? {
                        borderColor: `${color}55`,
                        color: color,
                        backgroundColor: `${color}11`,
                      }
                    : undefined
                }
              >
                {tool.category.name}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {tool.description ?? host ?? tool.url}
          </p>
        </div>

        <ArrowUpRight className="h-4 w-4 flex-none text-muted-foreground opacity-0 transition-opacity group-data-[active=true]:opacity-100" />
      </button>
    );
  },
  (prev, next) =>
    prev.tool === next.tool &&
    prev.active === next.active &&
    prev.index === next.index &&
    prev.onSelect === next.onSelect &&
    prev.onHover === next.onHover,
);

function LoadingSkeleton() {
  return (
    <div className="space-y-1 p-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="h-9 w-9 flex-none animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <Search className="h-5 w-5 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">
        {query
          ? `Tidak ada tool yang cocok dengan "${query}".`
          : "Belum ada tool. Tambahkan dari dashboard."}
      </p>
    </div>
  );
}
