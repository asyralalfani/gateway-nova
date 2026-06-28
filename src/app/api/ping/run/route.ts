import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PingResult = {
  toolId: string;
  status: "up" | "down";
  statusCode: number | null;
  responseMs: number | null;
  error: string | null;
};

async function pingOne(
  toolId: string,
  url: string,
  timeoutMs: number,
): Promise<PingResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    // HEAD first — most servers respond; fall back to GET if HEAD is rejected.
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
    }
    const responseMs = Date.now() - startedAt;
    const up = res.status >= 200 && res.status < 400;
    return {
      toolId,
      status: up ? "up" : "down",
      statusCode: res.status,
      responseMs,
      error: up ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    const responseMs = Date.now() - startedAt;
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `Timeout after ${timeoutMs}ms`
          : err.message
        : "Unknown error";
    return {
      toolId,
      status: "down",
      statusCode: null,
      responseMs,
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  if (!env.pingEnabled) {
    return NextResponse.json(
      { ok: false, error: "Pinger disabled" },
      { status: 503 },
    );
  }

  if (!env.pingSecret) {
    return NextResponse.json(
      { ok: false, error: "PING_SECRET not configured" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== env.pingSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const tools = await db.tool.findMany({
    select: { id: true, url: true },
  });

  const results = await Promise.all(
    tools.map((t) => pingOne(t.id, t.url, env.pingTimeoutMs)),
  );

  const now = new Date();
  await db.$transaction(
    results.map((r) =>
      db.tool.update({
        where: { id: r.toolId },
        data: {
          status: r.status,
          statusCode: r.statusCode,
          responseMs: r.status === "up" ? r.responseMs : null,
          checkedAt: now,
        },
      }),
    ),
  );

  const up = results.filter((r) => r.status === "up").length;
  const down = results.length - up;

  return NextResponse.json({
    ok: true,
    total: results.length,
    up,
    down,
    durationMs: Date.now() - startedAt,
  });
}
