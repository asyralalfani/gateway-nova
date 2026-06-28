"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function CommandPaletteTrigger() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  function open() {
    window.dispatchEvent(new CustomEvent("cmdk:open"));
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Buka command palette"
      className="group inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:bg-background hover:text-foreground"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Cari tool...</span>
      <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-medium text-muted-foreground sm:inline-flex">
        <span className="text-[10px]">{isMac ? "⌘" : "Ctrl"}</span>
        <span className="text-[10px]">K</span>
      </kbd>
    </button>
  );
}
