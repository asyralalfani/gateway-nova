"use client";

import { useEffect, useRef } from "react";

export function PageBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotlightRef.current;
    if (!el) return;

    const HALF = 600;
    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    function flush() {
      frame = 0;
      el!.style.transform = `translate3d(${nextX - HALF}px, ${nextY - HALF}px, 0)`;
    }

    function onMove(e: PointerEvent) {
      nextX = e.clientX;
      nextY = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(flush);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-50 overflow-hidden"
    >
      {/* Grid pattern dengan fade radial */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.3] mask-radial-fade" />

      {/* Floating gradient orbs — transform only, will-change biar di-promote GPU layer */}
      <div className="absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-brand/25 blur-2xl animate-blob-1 [will-change:transform]" />
      <div
        className="absolute -right-24 top-1/3 h-[24rem] w-[24rem] rounded-full blur-2xl animate-blob-2 [will-change:transform]"
        style={{ backgroundColor: "hsl(280 90% 60% / 0.22)" }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full blur-2xl animate-blob-3 [will-change:transform]"
        style={{ backgroundColor: "hsl(200 95% 60% / 0.18)" }}
      />

      {/* Cursor spotlight — pre-rendered div, hanya transform */}
      <div
        ref={spotlightRef}
        className="absolute left-0 top-0 h-[1200px] w-[1200px] rounded-full [will-change:transform]"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--brand) / 0.12), transparent 70%)",
          transform: "translate3d(-9999px, -9999px, 0)",
        }}
      />
    </div>
  );
}
