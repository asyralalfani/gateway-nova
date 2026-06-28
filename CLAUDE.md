# CLAUDE.md

Panduan untuk Claude (dan AI assistant lain) saat bekerja di project ini. File ini dibaca otomatis oleh Claude Code.

## Tentang Project

**Gateway Nova** adalah aplikasi self-hosted untuk mendokumentasikan dan mengorganisir URL/tools internal tim. Mirip [gethomepage.dev](https://gethomepage.dev/), tetapi dengan UI editor sehingga anggota tim bisa menambah/mengedit entri langsung dari browser tanpa edit file config.

**Tujuan utama:**
- Satu tempat untuk semua tools internal (Jenkins, Grafana, dashboard internal, dll)
- Mudah ditambah/diedit oleh anggota tim via UI
- Self-hosted via Docker, tanpa dependency eksternal
- Cepat di-load, ringan, dan tidak butuh maintenance besar

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js 15 (App Router) + React 19
- **Bahasa**: TypeScript strict mode
- **Database**: PostgreSQL 16 via Prisma ORM
- **Styling**: Tailwind CSS v4
- **Komponen UI**: shadcn/ui (Radix primitives)
- **Auth**: NextAuth.js v5 (Credentials provider, opsional)
- **Validation**: Zod
- **Deployment**: Docker (multi-stage build), single container

## Prinsip & Konvensi

### Bahasa
- **Kode, komentar, dan commit message**: Bahasa Inggris
- **Dokumentasi (.md), error message untuk user, UI label**: Bahasa Indonesia
- Variabel & function name: camelCase, deskriptif tanpa singkatan ambigu

### Struktur File
- Server Components by default; tambahkan `"use client"` hanya jika perlu interaktivitas
- Database queries hanya di Server Components atau Server Actions, tidak pernah di Client Components
- Komponen reusable di `src/components/ui/` (shadcn) dan `src/components/` (custom)
- Logika bisnis di `src/lib/`, jangan campur dengan komponen
- Tipe data di `src/types/` atau di file yang sama dengan implementasinya jika hanya digunakan satu tempat

### Database
- Skema di `prisma/schema.prisma` adalah source of truth
- Setiap perubahan skema → buat migration: `pnpm prisma migrate dev --name describe_change`
- Jangan pernah edit file di `prisma/migrations/` yang sudah di-commit
- Folder data PostgreSQL (`data/postgres/`) tidak boleh masuk git — pastikan ada di `.gitignore`

### Komponen UI
- Gunakan shadcn/ui sebagai default; tambahkan komponen via `pnpm dlx shadcn@latest add <component>`
- Gunakan utility class Tailwind, hindari CSS file terpisah kecuali untuk hal khusus
- Untuk icon, gunakan `lucide-react`
- Untuk form, gunakan `react-hook-form` + Zod resolver

### Server Actions vs API Routes
- **Server Actions**: untuk mutation (create, update, delete) yang dipanggil dari komponen React
- **API Routes** (`src/app/api/`): untuk endpoint yang dipanggil dari luar (webhook, integrasi) atau butuh streaming

### Error Handling
- Throw error di server, tangkap di client dengan error boundary atau toast
- Pesan error untuk user dalam Bahasa Indonesia dan tidak expose detail teknis
- Log error teknis ke stdout (akan ditangkap Docker logs)

## Hal yang BOLEH dilakukan tanpa konfirmasi

- Menambah komponen UI baru di `src/components/`
- Menambah halaman baru di `src/app/`
- Refactor untuk kejelasan tanpa mengubah behavior
- Menambah test
- Menambah komentar atau JSDoc
- Update dependency patch version

## Hal yang HARUS dikonfirmasi dulu

- Perubahan skema database (`prisma/schema.prisma`)
- Penambahan dependency baru (kecuali shadcn components)
- Perubahan struktur autentikasi
- Perubahan Dockerfile atau docker-compose.yml
- Perubahan environment variable yang dibutuhkan
- Refactor besar yang menyentuh > 5 file

## Command Penting

```bash
# Development
pnpm dev                          # Jalankan dev server di :3000
pnpm prisma studio                # Buka Prisma Studio (DB GUI)
pnpm prisma migrate dev           # Apply migration baru
pnpm prisma generate              # Regenerate Prisma Client

# Quality
pnpm lint                         # ESLint
pnpm typecheck                    # TypeScript check
pnpm test                         # Run tests (jika sudah disetup)

# Build & Deploy
pnpm build                        # Production build
docker compose up -d --build      # Build & jalankan via Docker
docker compose logs -f app        # Lihat logs
```

## Yang Tidak Boleh

- Jangan commit file `.env` (gunakan `.env.example` sebagai template)
- Jangan hardcode URL/credentials di kode
- Jangan disable TypeScript strict mode atau ESLint rules tanpa diskusi
- Jangan tambah dependency besar (>500KB) tanpa konfirmasi
- Jangan ubah file di `prisma/migrations/` yang sudah ada
- Jangan hapus data user via migration; selalu buat path migration yang aman

## Konteks Tim

- Tim development: ~5-10 orang
- User aplikasi: seluruh anggota tim (~30-50 orang)
- Bahasa tim: Indonesia (komunikasi), Inggris (kode)
- Timezone: Asia/Jakarta (WIB)
