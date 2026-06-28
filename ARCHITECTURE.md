# ARCHITECTURE.md

Keputusan teknis dan arsitektur sistem.

## Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────┐
│              User Browser                    │
│         (Desktop / Mobile)                   │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────┐
│          Reverse Proxy (opsional)            │
│         Traefik / Nginx / Caddy              │
└─────────────────┬───────────────────────────┘
                  │ HTTP
                  ▼
┌─────────────────────────────────────────────┐
│        Docker Container: app                 │
│  ┌───────────────────────────────────────┐  │
│  │     Next.js 15 (Node.js 20)           │  │
│  │  ┌──────────────┬─────────────────┐   │  │
│  │  │   App Router │  Server Actions │   │  │
│  │  └──────┬───────┴────────┬────────┘   │  │
│  │         │                │             │  │
│  │         ▼                ▼             │  │
│  │  ┌─────────────────────────────┐      │  │
│  │  │   Prisma Client (ORM)        │      │  │
│  │  └─────────────┬───────────────┘      │  │
│  │                ▼                       │  │
│  │  ┌─────────────────────────────┐      │  │
│  │  │   SQLite (file: /data/app.db)│     │  │
│  │  └─────────────────────────────┘      │  │
│  └───────────────────────────────────────┘  │
│         Volume: ./data → /data              │
└─────────────────────────────────────────────┘
```

## Keputusan Arsitektur

### ADR-001: Pakai Next.js Fullstack (bukan FE/BE terpisah)

**Konteks**: Tim kecil, fitur tidak banyak, butuh deployment sederhana.

**Keputusan**: Pakai Next.js sebagai fullstack framework (Server Components + Server Actions + API Routes).

**Alasan**:
- Satu codebase, satu deployment artifact
- Type-safety end-to-end tanpa codegen (bagi type langsung antara server & client)
- Server Components mengurangi JavaScript bundle untuk client
- Server Actions menghilangkan kebutuhan API routes untuk mutasi sederhana

**Konsekuensi**:
- Vendor-lock ringan ke Next.js
- Tidak bisa pakai backend non-Node (tapi tidak butuh)

### ADR-002: SQLite, bukan PostgreSQL/MySQL

**Konteks**: Data kecil (puluhan-ratusan entri), tim kecil, butuh deployment sederhana.

**Keputusan**: SQLite dengan file persistence via Docker volume.

**Alasan**:
- Zero-config: tidak butuh DB server terpisah
- Backup = copy file
- Cukup untuk ribuan entri & puluhan concurrent user
- Prisma abstraksi DB, mudah migrasi ke Postgres nanti

**Konsekuensi**:
- Tidak cocok kalau aplikasi tumbuh jadi multi-region / horizontal scale
- Write concurrency terbatas (tapi tidak masalah untuk use case ini)

### ADR-003: Prisma sebagai ORM

**Konteks**: Butuh type-safe DB access dan migration management.

**Keputusan**: Prisma ORM.

**Alasan**:
- Schema-first, type-safe
- Migration system bagus
- DX excellent (autocomplete, Prisma Studio)
- Bisa switch DB engine via connector

### ADR-004: shadcn/ui sebagai komponen library

**Konteks**: Butuh komponen UI bagus tanpa over-engineering.

**Keputusan**: shadcn/ui (copy-paste components, bukan npm package).

**Alasan**:
- Komponen di-copy ke codebase → bisa di-customize bebas
- Built on Radix (accessible)
- Pair sempurna dengan Tailwind
- Tidak ada lock-in versi

### ADR-005: NextAuth.js opsional via env flag

**Konteks**: Beberapa tim mau public di internal network, beberapa mau auth.

**Keputusan**: Auth bisa di-enable/disable via `AUTH_ENABLED=true|false`.

**Alasan**:
- Fleksibel untuk berbagai use case
- Default off → quick start
- Bisa di-enable nanti tanpa breaking change

## Struktur Folder

```
gateway-nova/
├── .claude/                    # Claude Code settings
├── prisma/
│   ├── schema.prisma           # Schema database
│   ├── migrations/             # Migration files (commit ke git)
│   └── seed.ts                 # Seed data untuk dev
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Route group auth (login, register)
│   │   ├── (dashboard)/        # Route group dashboard utama
│   │   ├── api/                # API routes (jika perlu)
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage (list tools)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── tool-card.tsx       # Card untuk satu tool
│   │   ├── tool-form.tsx       # Form add/edit tool
│   │   ├── category-section.tsx
│   │   └── search-bar.tsx
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── auth.ts             # NextAuth config
│   │   ├── actions/            # Server Actions
│   │   │   ├── tools.ts
│   │   │   └── categories.ts
│   │   └── utils.ts            # Utility functions
│   └── types/
│       └── index.ts            # Shared types
├── public/                     # Static assets, icons
├── data/                       # SQLite database (gitignored, mounted as volume)
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── CLAUDE.md
├── PROJECT.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
└── README.md
```

## Data Model

```prisma
// prisma/schema.prisma (excerpt)

model Tool {
  id          String   @id @default(cuid())
  name        String
  url         String
  description String?
  iconUrl     String?  // URL ke icon, atau identifier dari icon library
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  tags        Tag[]    @relation("ToolTags")
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?  // User ID, nullable kalau auth disabled

  @@index([categoryId])
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  icon        String?
  color       String?  // Hex color untuk accent
  order       Int      @default(0)
  tools       Tool[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  tools Tool[] @relation("ToolTags")
}

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  role         Role     @default(VIEWER)
  createdAt    DateTime @default(now())
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
}
```

## Environment Variables

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `DATABASE_URL` | yes | `file:/data/app.db` | Path SQLite |
| `AUTH_ENABLED` | no | `false` | Enable autentikasi |
| `AUTH_SECRET` | jika auth on | - | Random string untuk JWT |
| `NEXTAUTH_URL` | jika auth on | - | URL public aplikasi |
| `NODE_ENV` | no | `production` | Mode runtime |
| `PORT` | no | `3000` | Port internal container |

## Strategi Backup

- SQLite file di `/data/app.db` di-mount sebagai Docker volume
- Backup harian via cron: `sqlite3 /data/app.db ".backup /backups/app-$(date +%F).db"`
- Retain 30 hari terakhir + 12 bulan (monthly)
- Optional: upload ke S3/object storage

## Performance Targets

- First Contentful Paint < 1.5s
- Time to Interactive < 2.5s
- Database query average < 50ms
- Docker image size < 300MB (multi-stage build)

## Keamanan

- Password di-hash dengan bcrypt (cost 12)
- CSRF protection built-in dari Next.js Server Actions
- Rate limit di login endpoint (5 attempts / 15 menit per IP)
- Content Security Policy via Next.js config
- Container jalan sebagai non-root user
- Tidak ada credentials di image, semua via environment variable
