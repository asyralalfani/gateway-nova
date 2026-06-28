# CLAUDE.md

Guidance for Claude (and other AI assistants) working in this project. This file is auto-loaded by Claude Code.

## About the Project

**Gateway Nova** is a self-hosted app for documenting and organizing internal team tools/URLs. Similar to [gethomepage.dev](https://gethomepage.dev/), but with an editor UI so team members can add and edit entries directly from the browser without touching config files.

**Primary goals:**
- A single place for every internal tool (Jenkins, Grafana, internal dashboards, etc.)
- Easy for team members to add and edit via the UI
- Self-hosted via Docker, no external dependencies
- Fast to load, lightweight, and low-maintenance

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript strict mode
- **Database**: PostgreSQL 16 via Prisma ORM
- **Styling**: Tailwind CSS v4
- **UI components**: shadcn/ui (Radix primitives)
- **Auth**: NextAuth.js v5 (Credentials provider, optional)
- **Validation**: Zod
- **Deployment**: Docker (multi-stage build), single container

## Principles & Conventions

### Language
- **Everything in English**: code, comments, commit messages, documentation (.md), UI labels, error messages shown to users.
- Variable & function names: camelCase, descriptive, no ambiguous abbreviations.

### File Structure
- Server Components by default; add `"use client"` only when you need interactivity
- Database queries only in Server Components or Server Actions — never in Client Components
- Reusable components in `src/components/ui/` (shadcn) and `src/components/` (custom)
- Business logic in `src/lib/` — don't mix with components
- Types in `src/types/`, or co-located with their implementation when used in only one place

### Database
- The schema in `prisma/schema.prisma` is the source of truth
- Any schema change → create a migration: `pnpm prisma migrate dev --name describe_change`
- Never edit files in `prisma/migrations/` that are already committed
- The PostgreSQL data directory (`data/postgres/`) must not be committed — make sure it stays in `.gitignore`

### UI Components
- Use shadcn/ui by default; add components with `pnpm dlx shadcn@latest add <component>`
- Use Tailwind utility classes; avoid separate CSS files unless there's a specific need
- For icons, use `lucide-react`
- For forms, use `react-hook-form` + the Zod resolver

### Server Actions vs API Routes
- **Server Actions**: for mutations (create, update, delete) called from React components
- **API Routes** (`src/app/api/`): for endpoints called from outside (webhooks, integrations) or that need streaming

### Error Handling
- Throw errors on the server, catch on the client with an error boundary or toast
- User-facing error messages must be in English and must not expose technical detail
- Log technical errors to stdout (captured by Docker logs)

## Allowed Without Confirmation

- Adding new UI components in `src/components/`
- Adding new pages in `src/app/`
- Refactoring for clarity without changing behavior
- Adding tests
- Adding comments or JSDoc
- Updating dependency patch versions

## Requires Confirmation First

- Database schema changes (`prisma/schema.prisma`)
- Adding new dependencies (except shadcn components)
- Changes to the authentication structure
- Changes to `Dockerfile` or `docker-compose.yml`
- Changes to required environment variables
- Large refactors touching > 5 files

## Key Commands

```bash
# Development
pnpm dev                          # Run dev server on :3000
pnpm prisma studio                # Open Prisma Studio (DB GUI)
pnpm prisma migrate dev           # Apply a new migration
pnpm prisma generate              # Regenerate the Prisma Client

# Quality
pnpm lint                         # ESLint
pnpm typecheck                    # TypeScript check
pnpm test                         # Run tests (once set up)

# Build & Deploy
pnpm build                        # Production build
docker compose up -d --build      # Build & run via Docker
docker compose logs -f app        # Tail logs
```

## Don'ts

- Don't commit `.env` files (use `.env.example` as the template)
- Don't hardcode URLs or credentials in code
- Don't disable TypeScript strict mode or ESLint rules without discussion
- Don't add large dependencies (>500KB) without confirmation
- Don't edit existing files in `prisma/migrations/`
- Don't delete user data via migration; always design migrations to be safe

## Team Context

- Development team: ~5-10 people
- App users: the entire team (~30-50 people)
- Team language: Indonesian (verbal/chat communication), English (everything written into the repo)
- Timezone: Asia/Jakarta (WIB)
