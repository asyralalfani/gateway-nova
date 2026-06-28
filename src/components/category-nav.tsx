"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Item = { id: string; slug: string; name: string; count: number };

type Props = {
  items: Item[];
};

export function CategoryNav({ items }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    items[0]?.slug ?? null,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const sections = items
      .map((it) => document.getElementById(it.slug))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSlug(visible.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!activeSlug || !scrollerRef.current) return;
    const el = scrollerRef.current.querySelector<HTMLElement>(
      `[data-slug="${activeSlug}"]`,
    );
    if (!el) return;
    const parent = scrollerRef.current;
    const elLeft = el.offsetLeft;
    const elRight = elLeft + el.offsetWidth;
    const viewLeft = parent.scrollLeft;
    const viewRight = viewLeft + parent.clientWidth;
    if (elLeft < viewLeft || elRight > viewRight) {
      const target = elLeft - parent.clientWidth / 2 + el.offsetWidth / 2;
      parent.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }, [activeSlug]);

  if (items.length < 2) return null;

  function onClick(e: React.MouseEvent<HTMLAnchorElement>, slug: string) {
    e.preventDefault();
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSlug(slug);
    history.replaceState(null, "", `#${slug}`);
  }

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:-mx-0 sm:rounded-xl sm:border sm:px-2">
      <div
        ref={scrollerRef}
        className="flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it) => {
          const active = it.slug === activeSlug;
          return (
            <Link
              key={it.id}
              href={`#${it.slug}`}
              data-slug={it.slug}
              data-active={active}
              onClick={(e) => onClick(e, it.slug)}
              className="group/nav inline-flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active=true]:bg-foreground data-[active=true]:text-background"
            >
              <span className="truncate">{it.name}</span>
              <span className="rounded-full bg-muted/60 px-1.5 text-[10px] font-semibold text-muted-foreground group-hover/nav:bg-muted group-data-[active=true]/nav:bg-background/20 group-data-[active=true]/nav:text-background/80">
                {it.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
