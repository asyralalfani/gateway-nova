import Link from "next/link";
import { Plus, FolderTree, Tag as TagIcon, LayoutGrid } from "lucide-react";

import { db } from "@/lib/db";
import { CategorySection } from "@/components/category-section";
import { DailyBriefing } from "@/components/daily-briefing";
import { SearchBar } from "@/components/search-bar";
import { TagFilter } from "@/components/tag-filter";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; tag?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, tag } = await searchParams;
  const search = q?.trim();

  const [categories, allTags, totalsRaw] = await Promise.all([
    db.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        tools: {
          where: {
            AND: [
              search
                ? {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { description: { contains: search, mode: "insensitive" } },
                      {
                        tags: {
                          some: {
                            tag: { name: { contains: search, mode: "insensitive" } },
                          },
                        },
                      },
                    ],
                  }
                : {},
              tag ? { tags: { some: { tag: { name: tag } } } } : {},
            ],
          },
          orderBy: [{ order: "asc" }, { name: "asc" }],
          include: { tags: { include: { tag: true } } },
        },
      },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { tools: true } } },
    }),
    db.$transaction([db.tool.count(), db.category.count(), db.tag.count()]),
  ]);

  const [totalTools, totalCategories, totalTags] = totalsRaw;
  const visible = categories.filter((c) => c.tools.length > 0);
  const visibleTools = visible.reduce((acc, c) => acc + c.tools.length, 0);
  const filtered = Boolean(search) || Boolean(tag);

  return (
    <div className="space-y-6 sm:space-y-8">
      <DailyBriefing />

      <Hero
        visibleTools={visibleTools}
        totalTools={totalTools}
        totalCategories={totalCategories}
        totalTags={totalTags}
        filtered={filtered}
      />

      <TagFilter tags={allTags} activeTag={tag} query={search} />

      {visible.length === 0 ? (
        <EmptyState search={search} tag={tag} />
      ) : (
        <div className="space-y-10">
          {visible.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              tools={category.tools}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Hero({
  visibleTools,
  totalTools,
  totalCategories,
  totalTags,
  filtered,
}: {
  visibleTools: number;
  totalTools: number;
  totalCategories: number;
  totalTags: number;
  filtered: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 shadow-soft sm:p-10">
      {/* Subtle gradient sheen — static, no animation */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-brand/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 -z-10 h-56 w-56 rounded-full blur-2xl"
        style={{ backgroundColor: "hsl(280 90% 60% / 0.12)" }}
      />

      <div className="relative flex flex-col gap-6">
        <div className="space-y-3">
          <div className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-brand/40 hover:text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand shadow-glow" />
            </span>
            <span>Live</span>
            <span className="text-border">·</span>
            <span className="font-semibold text-foreground/80">{totalTools}</span>
            <span>tools terdaftar</span>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Semua tools tim,{" "}
            <span className="text-gradient-brand inline-block">
              dalam satu tempat
            </span>
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
            Pencarian cepat, dikelompokkan per kategori, dan bisa diedit oleh
            siapa pun di tim.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar />
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              className="group relative h-11 overflow-hidden rounded-xl shadow-soft transition-all hover:shadow-glow hover:-translate-y-0.5"
            >
              <Link href="/dashboard/tools/new">
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-shimmer bg-[length:200%_100%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-shimmer"
                />
                <Plus className="mr-1.5 h-4 w-4 transition-transform group-hover:rotate-90" />
                Tool baru
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat
            icon={LayoutGrid}
            label="Tools"
            value={filtered ? `${visibleTools}/${totalTools}` : String(totalTools)}
            accent="brand"
          />
          <Stat
            icon={FolderTree}
            label="Kategori"
            value={String(totalCategories)}
            accent="violet"
          />
          <Stat
            icon={TagIcon}
            label="Tag"
            value={String(totalTags)}
            accent="sky"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "brand" | "violet" | "sky";
}) {
  const accentStyles = {
    brand: {
      iconColor: "hsl(var(--brand))",
      iconBg: "hsl(var(--brand) / 0.15)",
      glow: "hsl(var(--brand) / 0.35)",
      border: "group-hover:border-brand/50",
    },
    violet: {
      iconColor: "hsl(280 90% 65%)",
      iconBg: "hsl(280 90% 65% / 0.15)",
      glow: "hsl(280 90% 65% / 0.35)",
      border: "group-hover:border-[hsl(280_90%_65%/0.5)]",
    },
    sky: {
      iconColor: "hsl(200 95% 60%)",
      iconBg: "hsl(200 95% 60% / 0.15)",
      glow: "hsl(200 95% 60% / 0.35)",
      border: "group-hover:border-[hsl(200_95%_60%/0.5)]",
    },
  }[accent];

  return (
    <div
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-background/60 p-3 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-background/80 ${accentStyles.border}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: accentStyles.glow }}
      />
      <div
        className="relative grid h-9 w-9 flex-none place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ backgroundColor: accentStyles.iconBg, color: accentStyles.iconColor }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="relative min-w-0">
        <p className="truncate text-lg font-semibold leading-tight tracking-tight tabular-nums">
          {value}
        </p>
        <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ search, tag }: { search?: string; tag?: string }) {
  if (search || tag) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada tool yang cocok
          {search ? ` dengan "${search}"` : ""}
          {tag ? ` pada tag "${tag}"` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
      <h2 className="text-base font-medium">Belum ada tool</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Mulai dengan menambahkan kategori, lalu tambahkan tool.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard/categories/new">Tambah kategori</Link>
        </Button>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/tools/new">Tambah tool</Link>
        </Button>
      </div>
    </div>
  );
}
