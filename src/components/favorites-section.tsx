"use client";

import { Star } from "lucide-react";

import { ToolCard } from "@/components/tool-card";
import { useFavorites } from "@/components/favorite-toggle";

type Tool = React.ComponentProps<typeof ToolCard>["tool"];

type Props = {
  allTools: Tool[];
};

export function FavoritesSection({ allTools }: Props) {
  const favoriteIds = useFavorites();

  if (favoriteIds.length === 0) return null;

  const byId = new Map(allTools.map((t) => [t.id, t]));
  const tools = favoriteIds
    .map((id) => byId.get(id))
    .filter((t): t is Tool => Boolean(t));

  if (tools.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden
          className="inline-flex h-5 w-5 items-center justify-center"
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgb(251_191_36_/_0.5)]" />
        </span>
        <h2 className="text-base font-semibold tracking-tight">Favorites</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {tools.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool, i) => (
          <div
            key={tool.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <ToolCard tool={tool} />
          </div>
        ))}
      </div>
    </section>
  );
}
