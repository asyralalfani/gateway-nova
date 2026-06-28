import { ToolCard } from "@/components/tool-card";

type Props = {
  category: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  };
  tools: React.ComponentProps<typeof ToolCard>["tool"][];
  slug: string;
};

export function CategorySection({ category, tools, slug }: Props) {
  if (tools.length === 0) return null;

  const accent = category.color ?? "hsl(var(--brand))";

  return (
    <section id={slug} className="scroll-mt-32 space-y-4">
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden
          className="inline-block h-5 w-1 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <h2 className="text-base font-semibold tracking-tight">
          {category.name}
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {tools.length}
        </span>
        {category.description ? (
          <p className="hidden text-sm text-muted-foreground sm:block">
            · {category.description}
          </p>
        ) : null}
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
