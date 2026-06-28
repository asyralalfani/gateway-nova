import { z } from "zod";

export const importRowSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("URL is invalid").max(2000),
  description: z.string().max(500).optional().nullable(),
  iconUrl: z.string().max(2000).optional().nullable(),
  category: z.string().min(1, "Category is required").max(80),
  tags: z.array(z.string().min(1).max(50)).default([]),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export type ParsedRow = {
  index: number;
  raw: Record<string, unknown>;
  ok: boolean;
  data?: ImportRow;
  error?: string;
};

export type ParseResult = {
  format: "csv" | "json";
  rows: ParsedRow[];
};

export function parseImport(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { format: "csv", rows: [] };

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return { format: "json", rows: parseJSON(trimmed) };
  }
  return { format: "csv", rows: parseCSV(trimmed) };
}

function parseJSON(text: string): ParsedRow[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return [
      {
        index: 0,
        raw: {},
        ok: false,
        error: err instanceof Error ? err.message : "Invalid JSON",
      },
    ];
  }

  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item, i) => validateRow(i, normalizeJsonRow(item)));
}

function normalizeJsonRow(item: unknown): Record<string, unknown> {
  if (item === null || typeof item !== "object") return {};
  const obj = item as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };
  // Accept either `tags: [...]` or `tags: "a,b,c"`
  if (typeof out.tags === "string") {
    out.tags = splitCommaList(out.tags);
  }
  return out;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = splitCSVLines(text);
  if (lines.length === 0) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line, i) => {
    const cells = parseCSVLine(line);
    const raw: Record<string, unknown> = {};
    header.forEach((key, idx) => {
      raw[key] = cells[idx] ?? "";
    });
    if (typeof raw.tags === "string") raw.tags = splitCommaList(raw.tags);
    if (raw.description === "") raw.description = null;
    if (raw.iconUrl === "") raw.iconUrl = null;
    return validateRow(i, raw);
  });
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuote = !inQuote;
      current += c;
    } else if ((c === "\n" || c === "\r") && !inQuote) {
      if (current.trim()) lines.push(current);
      current = "";
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else {
      current += c;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        current += c;
      }
    } else if (c === ",") {
      result.push(current);
      current = "";
    } else if (c === '"' && current === "") {
      inQuote = true;
    } else {
      current += c;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateRow(index: number, raw: Record<string, unknown>): ParsedRow {
  const result = importRowSchema.safeParse(raw);
  if (result.success) {
    return { index, raw, ok: true, data: result.data };
  }
  const first = result.error.issues[0];
  return {
    index,
    raw,
    ok: false,
    error: `${first.path.join(".") || "row"}: ${first.message}`,
  };
}

export const CSV_TEMPLATE = `name,url,description,category,tags,iconUrl
Jenkins,https://jenkins.example.com,Main CI pipeline,DevOps,"internal,production",
Grafana,https://grafana.example.com,Metrics dashboards,Monitoring,production,
`;

export const JSON_TEMPLATE = `[
  {
    "name": "Jenkins",
    "url": "https://jenkins.example.com",
    "description": "Main CI pipeline",
    "category": "DevOps",
    "tags": ["internal", "production"]
  },
  {
    "name": "Grafana",
    "url": "https://grafana.example.com",
    "category": "Monitoring",
    "tags": ["production"]
  }
]
`;
