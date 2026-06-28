"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FavoriteToggle } from "@/components/favorite-toggle";

type Props = {
  tool: {
    id: string;
    name: string;
    url: string;
    description: string | null;
    iconUrl: string | null;
    tags: { tag: { id: string; name: string } }[];
  };
};

export function ToolCard({ tool }: Props) {
  const host = safeHost(tool.url);
  const iconSrc = tool.iconUrl ?? (host ? faviconFor(host) : null);

  return (
    <Link
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lifted"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-brand/0 via-transparent to-brand/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ToolIcon iconSrc={iconSrc} name={tool.name} />
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight tracking-tight">
              {tool.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {host ?? tool.url}
            </p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-1">
          <FavoriteToggle toolId={tool.id} />
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
        </div>
      </div>

      {tool.description ? (
        <p className="relative line-clamp-2 text-sm text-muted-foreground">
          {tool.description}
        </p>
      ) : null}

      {tool.tags.length > 0 ? (
        <div className="relative mt-auto flex flex-wrap gap-1.5">
          {tool.tags.map(({ tag }) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="rounded-full bg-muted/60 px-2 py-0 text-[10px] font-medium text-muted-foreground"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function ToolIcon({
  iconSrc,
  name,
}: {
  iconSrc: string | null;
  name: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted/50 to-muted shadow-soft">
      {iconSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt=""
          className="h-7 w-7 object-contain"
          loading="lazy"
        />
      ) : (
        <span className="text-xs font-semibold text-foreground/70">
          {initials}
        </span>
      )}
    </div>
  );
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
