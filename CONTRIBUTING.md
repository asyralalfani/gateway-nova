# CONTRIBUTING.md

Guide for contributing to this project.

## Development Setup

### Prerequisites
- Node.js 20 LTS or newer
- pnpm 9+ (install: `npm install -g pnpm`)
- Docker & Docker Compose (for testing production builds)

### Setup Steps

```bash
# Clone the repo
git clone <repo-url>
cd gateway-nova

# Install dependencies
pnpm install

# Copy env example
cp .env.example .env

# Set up the database
pnpm prisma migrate dev
pnpm prisma db seed

# Run the dev server
pnpm dev
```

Open http://localhost:3000

## Git Workflow

### Branches
- `main` — production-ready, protected
- `develop` — integration, deployed to staging
- `feature/<feature-name>` — new features
- `fix/<bug-name>` — bug fixes
- `chore/<description>` — maintenance

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<optional body>
```

**Types**:
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation changes only
- `style`: formatting, no logic change
- `refactor`: refactor without behavior change
- `perf`: performance improvement
- `test`: add/edit tests
- `chore`: maintenance, dependency updates

**Examples**:
```
feat(tools): add drag-and-drop reorder
fix(auth): handle expired session correctly
docs(readme): update deployment steps
```

### Pull Requests

1. Branch off `develop`
2. Push & open a PR against `develop`
3. Make sure CI is passing (lint + typecheck + tests)
4. At least 1 reviewer approval
5. Squash & merge

**PR Template**:
```markdown
## What changed
<short description>

## Why
<context/motivation>

## Testing
- [ ] Manual test locally
- [ ] Automated tests added/updated
- [ ] Screenshot (if UI)

## Checklist
- [ ] Lint passing
- [ ] Typecheck passing
- [ ] Documentation updated (if needed)
```

## Coding Standards

### TypeScript
- Strict mode is mandatory
- Don't use `any`; use `unknown` when the type is unknown
- Export types from the implementation file, or from `src/types/`

### React
- Server Components by default
- Client Components only for interactivity (state, effects, event handlers)
- One component per file (except for small, tightly-coupled components)

### Naming
- Components: `PascalCase` (file & name: `ToolCard.tsx`)
- Helpers/utils: `camelCase` (file: `formatDate.ts`, function: `formatDate`)
- Constants: `SCREAMING_SNAKE_CASE`
- CSS classes: Tailwind utilities; avoid custom classes unless necessary

### Formatting
- Prettier runs automatically in the pre-commit hook
- 2-space indentation
- Single quotes for strings
- Trailing commas on multiline
- Max line length 100

## Adding a New Feature

### 1. Discuss first
Open an issue labeled `proposal` before coding any large feature.

### 2. Update documentation
- Architecture change → update `ARCHITECTURE.md`
- Scope change → update `PROJECT.md`
- New env var → update `.env.example` & `README.md`

### 3. Add tests
At minimum:
- Unit tests for logic in `src/lib/`
- Integration tests for Server Actions

## Adding UI Components

Lean on shadcn/ui as much as possible:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
```

New custom components go in `src/components/`. Make sure they:
- Use TypeScript with typed props
- Support dark mode (use theme-aware Tailwind classes)
- Are accessible (ARIA labels, keyboard navigation)

## Database Migrations

```bash
# Create a new migration after editing the schema
pnpm prisma migrate dev --name describe_what_changed

# Apply migrations in production (automatic on container start)
pnpm prisma migrate deploy
```

**Important**:
- Commit migrations to git
- Never edit a migration that has already been committed
- For a rollback, create a new migration that reverses the change

## Testing

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:e2e      # End-to-end (Playwright)
```

## Reporting Bugs

Open an issue with this template:

```markdown
**Version**: v1.x.x
**Browser/OS**: Chrome 120 / Ubuntu 22.04

**Steps to reproduce**:
1. ...
2. ...

**Expected**: ...
**Actual**: ...

**Screenshot**: (if available)
**Logs**: (if available)
```

## Questions?

Ask in the `#gateway-nova` Slack channel or open a discussion in the repo.
