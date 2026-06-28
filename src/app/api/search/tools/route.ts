import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const tools = await db.tool.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      url: true,
      description: true,
      iconUrl: true,
      category: { select: { id: true, name: true, color: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  const payload = tools.map((t) => ({
    id: t.id,
    name: t.name,
    url: t.url,
    description: t.description,
    iconUrl: t.iconUrl,
    category: t.category,
    tags: t.tags.map((tt) => tt.tag.name),
  }));

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
