# CONTRIBUTING.md

Panduan untuk berkontribusi di project ini.

## Setup Development

### Prasyarat
- Node.js 20 LTS atau lebih baru
- pnpm 9+ (install: `npm install -g pnpm`)
- Docker & Docker Compose (untuk testing production build)

### Langkah Setup

```bash
# Clone repo
git clone <repo-url>
cd gateway-nova

# Install dependencies
pnpm install

# Copy env example
cp .env.example .env

# Setup database
pnpm prisma migrate dev
pnpm prisma db seed

# Jalankan dev server
pnpm dev
```

Buka http://localhost:3000

## Workflow Git

### Branch
- `main` — production-ready, protected
- `develop` — integrasi, deploy ke staging
- `feature/<nama-fitur>` — fitur baru
- `fix/<nama-bug>` — bug fix
- `chore/<deskripsi>` — maintenance

### Commit Message
Pakai [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body opsional>
```

**Types**:
- `feat`: fitur baru
- `fix`: bug fix
- `docs`: perubahan dokumentasi saja
- `style`: formatting, no logic change
- `refactor`: refactor tanpa ubah behavior
- `perf`: improvement performance
- `test`: tambah/edit test
- `chore`: maintenance, dependency update

**Contoh**:
```
feat(tools): add drag-and-drop reorder
fix(auth): handle expired session correctly
docs(readme): update deployment steps
```

### Pull Request

1. Buat branch dari `develop`
2. Push & buat PR ke `develop`
3. Pastikan CI passing (lint + typecheck + test)
4. Minimal 1 reviewer approve
5. Squash & merge

**Template PR**:
```markdown
## Apa yang diubah
<deskripsi singkat>

## Kenapa
<konteks/alasan>

## Testing
- [ ] Manual test di local
- [ ] Test otomatis ditambah/diupdate
- [ ] Screenshot (jika UI)

## Checklist
- [ ] Lint passing
- [ ] Typecheck passing
- [ ] Dokumentasi diupdate (jika perlu)
```

## Coding Standards

### TypeScript
- Strict mode wajib aktif
- Jangan pakai `any`; pakai `unknown` jika tidak tahu tipe
- Export type dari file implementasinya, atau dari `src/types/`

### React
- Server Components by default
- Client Components hanya untuk interaktivitas (state, effect, event handler)
- Component file 1 component per file (kecuali komponen kecil yang erat kaitannya)

### Naming
- Component: `PascalCase` (file & nama: `ToolCard.tsx`)
- Helper/util: `camelCase` (file: `formatDate.ts`, function: `formatDate`)
- Constant: `SCREAMING_SNAKE_CASE`
- CSS class: utility Tailwind, hindari custom class kecuali perlu

### Formatting
- Prettier dijalankan otomatis di pre-commit hook
- 2 spasi indentation
- Single quote untuk string
- Trailing comma di multiline
- Max line length 100

## Menambah Fitur Baru

### 1. Diskusi dulu
Buka issue dengan label `proposal` sebelum coding fitur besar.

### 2. Update dokumentasi
- Jika ubah arsitektur → update `ARCHITECTURE.md`
- Jika ubah scope → update `PROJECT.md`
- Jika tambah env var → update `.env.example` & `README.md`

### 3. Tambah test
Minimal:
- Unit test untuk logika di `src/lib/`
- Integration test untuk Server Actions

## Menambah Komponen UI

Pakai shadcn/ui sebanyak mungkin:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
```

Custom component baru di `src/components/`. Pastikan:
- Pakai TypeScript dengan props yang ter-type
- Support dark mode (pakai Tailwind class yang theme-aware)
- Accessible (ARIA labels, keyboard navigation)

## Database Migration

```bash
# Buat migration baru setelah edit schema
pnpm prisma migrate dev --name describe_what_changed

# Apply migration di production (otomatis saat container start)
pnpm prisma migrate deploy
```

**Penting**:
- Migration commit ke git
- Jangan pernah edit migration yang sudah di-commit
- Jika butuh rollback → buat migration baru yang reverse

## Testing

```bash
pnpm test          # Jalankan semua test
pnpm test:watch    # Watch mode
pnpm test:e2e      # End-to-end (Playwright)
```

## Reporting Bug

Buka issue dengan template:

```markdown
**Versi**: v1.x.x
**Browser/OS**: Chrome 120 / Ubuntu 22.04

**Langkah Reproduce**:
1. ...
2. ...

**Expected**: ...
**Actual**: ...

**Screenshot**: (jika ada)
**Log**: (jika ada)
```

## Pertanyaan?

Tanya di channel `#gateway-nova` di Slack atau buka discussion di repo.
