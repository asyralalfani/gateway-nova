import Link from "next/link";
import { Sparkles, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPaletteTrigger } from "@/components/command-palette-trigger";
import { currentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const user = await currentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-brand-foreground shadow-glow transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base">
            Gateway<span className="text-muted-foreground">Nova</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <CommandPaletteTrigger />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/tools">
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kelola</span>
            </Link>
          </Button>
          <ThemeToggle />
          {env.authEnabled ? <UserMenu user={user} /> : null}
        </nav>
      </div>
    </header>
  );
}
