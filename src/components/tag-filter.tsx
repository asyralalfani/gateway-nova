import Link from "next/link";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  tags: { id: string; name: string; _count: { tools: number } }[];
  activeTag?: string;
  query?: string;
};

export function TagFilter({ tags, activeTag, query }: Props) {
  if (tags.length === 0) return null;

  const buildHref = (tag: string | null) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Tag
      </span>
      <Link
        href={buildHref(null)}
        className={cn(
          "rounded-full border border-border/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
          !activeTag && "border-transparent bg-foreground text-background hover:bg-foreground",
        )}
      >
        All
      </Link>
      {tags.map((tag) => {
        const active = tag.name === activeTag;
        return (
          <Link
            key={tag.id}
            href={buildHref(active ? null : tag.name)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
              active && "border-transparent bg-brand text-brand-foreground hover:bg-brand",
            )}
          >
            <span>{tag.name}</span>
            <span
              className={cn(
                "text-[10px]",
                active ? "text-brand-foreground/80" : "text-muted-foreground",
              )}
            >
              {tag._count.tools}
            </span>
            {active ? <X className="h-3 w-3" /> : null}
          </Link>
        );
      })}
    </div>
  );
}
