import Link from "next/link";
import { Wrench, FolderTree, Tag } from "lucide-react";

import { requireEditor } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/dashboard/tools", label: "Tools", icon: Wrench },
  { href: "/dashboard/categories", label: "Categories", icon: FolderTree },
  { href: "/dashboard/tags", label: "Tags", icon: Tag },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (env.authEnabled) {
    await requireEditor();
  }

  return (
    <div className="space-y-6">
      <nav className="inline-flex gap-1 rounded-xl border border-border/60 bg-card p-1 shadow-soft">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
