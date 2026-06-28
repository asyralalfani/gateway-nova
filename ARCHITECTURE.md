# ARCHITECTURE.md

Technical and architectural decisions for the system.

## High-Level Architecture

```
┌─────────────────────────────────────────────┐
│              User Browser                    │
│         (Desktop / Mobile)                   │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────┐
│          Reverse Proxy (optional)            │
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
│  └────────────────┼──────────────────────┘  │
└───────────────────┼─────────────────────────┘
                    │ docker network (db:5432)
                    ▼
┌─────────────────────────────────────────────┐
│       Docker Container: db                   │
│         PostgreSQL 16-alpine                 │
│   Volume: ./data/postgres → /var/lib/...    │
└─────────────────────────────────────────────┘
```

## Architecture Decisions

### ADR-001: Next.js fullstack (not separate FE/BE)

**Context**: Small team, limited surface area, needs simple deployment.

**Decision**: Use Next.js as a fullstack framework (Server Components + Server Actions + API Routes).

**Rationale**:
- One codebase, one deployment artifact
- End-to-end type safety without codegen (share types directly between server & client)
- Server Components reduce JavaScript shipped to the client
- Server Actions remove the need for API routes for simple mutations

**Consequences**:
- Mild vendor lock-in to Next.js
- Can't use a non-Node backend (not needed)

### ADR-002: PostgreSQL via docker-compose

**Context**: Need a reliable, well-understood relational store with type-safe access and headroom for moderate growth.

**Decision**: PostgreSQL 16 bundled via docker-compose, with data persisted to a host-bound volume (`./data/postgres`).

**Rationale**:
- Battle-tested, predictable behavior under concurrent writes
- Plays well with Prisma migrations and Prisma Studio
- Simple `pg_dump`/`pg_restore` workflow for backups
- Easy to upgrade or move to managed PostgreSQL (RDS, Cloud SQL) later without app changes
- Bundling via docker-compose keeps deployment to a single command

**Consequences**:
- One extra container vs an embedded DB
- Admin needs to mind volume permissions on the host

### ADR-003: Prisma as the ORM

**Context**: We want type-safe DB access and a clean migration story.

**Decision**: Use Prisma ORM.

**Rationale**:
- Schema-first and type-safe
- Solid migration system
- Excellent DX (autocomplete, Prisma Studio)
- Can swap the underlying DB engine via the connector

### ADR-004: shadcn/ui as the component library

**Context**: Need solid UI components without over-engineering.

**Decision**: shadcn/ui (copy-paste components, not an npm package).

**Rationale**:
- Components are copied into the codebase → free to customize
- Built on Radix (accessible)
- Pairs perfectly with Tailwind
- No version lock-in

### ADR-005: NextAuth.js, optional via env flag

**Context**: Some teams want the app public on an internal network; others want auth.

**Decision**: Auth can be enabled/disabled via `AUTH_ENABLED=true|false`.

**Rationale**:
- Flexible across use cases
- Default off → fast start
- Can be enabled later without a breaking change

## Folder Structure

```
gateway-nova/
├── .claude/                    # Claude Code settings
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files (committed to git)
│   └── seed.ts                 # Seed data for dev
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group (login, register)
│   │   ├── (dashboard)/        # Main dashboard route group
│   │   ├── api/                # API routes (when needed)
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage (tools list)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── tool-card.tsx       # Card for a single tool
│   │   ├── tool-form.tsx       # Add/edit tool form
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
├── data/postgres/              # PostgreSQL data (gitignored, mounted volume)
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
  iconUrl     String?  // URL to an icon, or an identifier from an icon library
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  tags        Tag[]    @relation("ToolTags")
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?  // User ID, nullable when auth is disabled

  @@index([categoryId])
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  icon        String?
  color       String?  // Hex color for accent
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

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_PORT` | no | `3100` | Host port for the app container |
| `POSTGRES_PORT` | no | `5433` | Host port for the postgres container (127.0.0.1 only) |
| `POSTGRES_USER` | no | `homepage` | PostgreSQL user |
| `POSTGRES_PASSWORD` | no | `homepage` | PostgreSQL password (change in production) |
| `POSTGRES_DB` | no | `homepage` | PostgreSQL database name |
| `DATABASE_URL` | yes | `postgresql://homepage:homepage@localhost:5433/homepage?schema=public` | Prisma connection string |
| `AUTH_ENABLED` | no | `false` | Enable authentication |
| `AUTH_SECRET` | if auth on | - | Random string for JWT |
| `NEXTAUTH_URL` | if auth on | - | Public URL of the app |
| `NODE_ENV` | no | `production` | Runtime mode |

## Backup Strategy

- PostgreSQL data at `./data/postgres/` is mounted as a Docker volume on the host
- Daily backup via cron: `docker compose exec -T db pg_dump -U homepage -F c homepage > backups/homepage-$(date +%F).dump`
- Retain the last 30 days + 12 months (monthly)
- Optional: upload to S3 / object storage

## Performance Targets

- First Contentful Paint < 1.5s
- Time to Interactive < 2.5s
- Average database query < 50ms
- Docker image size < 300MB (multi-stage build)

## Security

- Passwords hashed with bcrypt (cost 12)
- CSRF protection built into Next.js Server Actions
- Rate limit on the login endpoint (5 attempts / 15 minutes per IP)
- Content Security Policy via Next.js config
- Containers run as a non-root user
- No credentials baked into the image — all via environment variables
- PostgreSQL bound to `127.0.0.1` on the host (never exposed publicly)
