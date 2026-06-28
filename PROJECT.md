# PROJECT.md

Dokumen perencanaan dan scope project. Update file ini saat ada perubahan tujuan atau scope.

## Ringkasan

**Gateway Nova** adalah aplikasi web self-hosted untuk mengorganisir dan mendokumentasikan tools/URL internal tim dalam satu tempat. Dideploy via Docker.

## Masalah yang Dipecahkan

Saat ini tim kesulitan:
- Mengingat URL semua tools internal (Jenkins, Grafana, Confluence, dashboard internal, dll)
- Onboarding anggota baru harus dikasih daftar manual via chat/email
- Tidak ada satu tempat untuk lihat "semua tools yang dipakai tim"
- Bookmark browser bersifat personal, tidak shareable

## Solusi

Aplikasi homepage internal dengan:
1. **Daftar tools terorganisir** dalam kategori/grup
2. **UI editor** sehingga anggota tim bisa menambah/mengedit langsung
3. **Search & filter** untuk menemukan tools cepat
4. **Self-hosted** via Docker, data tetap di infrastruktur tim
5. **Sederhana** — tidak butuh database server, cukup SQLite

## Scope MVP (v1.0)

### Yang Termasuk

- [x] CRUD entries (judul, URL, deskripsi, ikon, kategori, tags)
- [x] Pengelompokan tools dalam kategori (misal: "DevOps", "Monitoring", "Dokumentasi")
- [x] Search by nama/deskripsi/tag
- [x] Filter by kategori atau tag
- [x] Layout grid yang rapi dan responsive (desktop & mobile)
- [x] Dark mode (default mengikuti sistem)
- [x] Autentikasi sederhana (username + password) — opsional di-enable via env
- [x] Role: admin (CRUD) vs viewer (read-only)
- [x] Docker deployment dengan single command

### Yang TIDAK Termasuk (di luar MVP)

- ❌ Widget yang menampilkan status service real-time (mungkin v2)
- ❌ SSO/OAuth integration (v2)
- ❌ Multi-tenant / multi-workspace
- ❌ Notifikasi atau alerting
- ❌ Mobile app native
- ❌ Audit log (mungkin v1.1 jika dibutuhkan)

## Roadmap

### v1.0 — MVP (target: 4 minggu)
- Semua fitur scope MVP
- Dokumentasi setup
- Docker image siap deploy

### v1.1 — Polish
- Drag & drop reorder
- Import/export config sebagai JSON/YAML
- Audit log sederhana
- Backup otomatis SQLite

### v2.0 — Integrations
- Widget status service (ping URL, status code, response time)
- OAuth/SSO (Google, GitHub, generic OIDC)
- Tag favorit per user

## User Persona

### 1. Tech Lead "Andi"
- Setup awal aplikasi
- Tambah kategori dan tools dasar
- Manage user lain
- **Butuh**: deployment mudah, backup terjamin

### 2. Engineer "Budi" (paling sering)
- Buka aplikasi tiap pagi untuk akses tools
- Sesekali tambah tool baru yang dipakai timnya
- **Butuh**: search cepat, akses 1-2 klik ke tool

### 3. Manager "Citra"
- Onboarding anggota baru
- Lihat overview tools yang dipakai
- **Butuh**: tampilan rapi, mudah di-share

## Metrik Sukses

- ⏱️ Time-to-first-tool < 3 detik dari buka aplikasi
- 👥 100% anggota tim pakai dalam 1 bulan pertama
- 📝 Minimal 30 tools terdaftar dalam 2 minggu pertama
- 🔧 Setup di server baru < 10 menit

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| SQLite tidak cukup untuk scale | Medium | Prisma abstraksi DB; bisa migrasi ke PostgreSQL nanti |
| Tim tidak update entri | High | UI sangat sederhana; reminder di Slack |
| Server downtime | Medium | Backup SQLite otomatis ke S3/storage tim |
| Lupa password admin | Low | CLI command untuk reset password |

## Stakeholders

- **Owner**: [Nama Anda]
- **Tim Dev**: [Tim Anda]
- **User**: Seluruh tim engineering (~30-50 orang)

## Link Terkait

- Inspirasi: https://gethomepage.dev/
- Inspirasi: https://heimdall.site/
- Inspirasi: https://github.com/Lissy93/dashy
