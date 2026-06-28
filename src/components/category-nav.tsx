import Link from "next/link";

type Item = {
  id: string;
  slug: string;
  name: string;
  count: number;
  href: string;
};

type Props = {
  items: Item[];
  activeSlug: string | null;
  allHref: string;
  totalCount: number;
};

export function CategoryNav({ items, activeSlug, allHref, totalCount }: Props) {
  if (items.length < 2) return null;

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:-mx-0 sm:rounded-xl sm:border sm:px-2">
      <div className="flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <PillLink
          href={allHref}
          active={activeSlug === null}
          name="All"
          count={totalCount}
        />
        {items.map((it) => (
          <PillLink
            key={it.id}
            href={it.href}
            active={it.slug === activeSlug}
            name={it.name}
            count={it.count}
          />
        ))}
      </div>
    </div>
  );
}

function PillLink({
  href,
  active,
  name,
  count,
}: {
  href: string;
  active: boolean;
  name: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      data-active={active}
      className="group/nav inline-flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active=true]:bg-foreground data-[active=true]:text-background"
    >
      <span className="truncate">{name}</span>
      <span className="rounded-full bg-muted/60 px-1.5 text-[10px] font-semibold text-muted-foreground group-hover/nav:bg-muted group-data-[active=true]/nav:bg-background/20 group-data-[active=true]/nav:text-background/80">
        {count}
      </span>
    </Link>
  );
}
