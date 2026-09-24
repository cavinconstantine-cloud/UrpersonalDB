# Uangku — Dashboard Keuangan Pribadi

Versi produksi (draft/testing) dari prototype "Personal Life Dashboard": net worth,
arus kas, Debt Burden Ratio, goals, dan pencatatan pengeluaran — multi-user, dengan
akun & data privat per orang, bisa diakses dari HP maupun laptop, dan bisa diupdate
kapan saja.

**Stack:** Next.js 16 (App Router) · Supabase (Auth + Postgres, dengan Row Level
Security) · Tailwind CSS v4 · opsional Anthropic API untuk fitur ringkasan AI.

## 1. Setup Supabase

1. Buat project baru di [supabase.com/dashboard](https://supabase.com/dashboard) (gratis).
2. Buka **SQL Editor** di project tsb, lalu jalankan **berurutan** seluruh isi ketiga
   file migration di [`supabase/migrations/`](./supabase/migrations/): `0001_init.sql`,
   lalu `0002_income_tracking.sql`, lalu `0003_liability_holdings_and_reminders.sql`.
   Ini membuat semua tabel yang dibutuhkan (`profiles`, `cashflow`, `asset_holdings`,
   `liabilities`, `incomes`, `goals`, `expenses`, dll) lengkap dengan Row Level
   Security — setiap akun hanya bisa membaca/menulis datanya sendiri.
3. Di **Authentication → Sign In / Providers**, pastikan "Email" provider aktif.
   Secara default Supabase mewajibkan konfirmasi email — bisa dimatikan sementara
   di **Authentication → Sign In / Email** kalau mau testing lebih cepat tanpa
   perlu cek inbox setiap daftar akun baru.
4. Di **Authentication → URL Configuration**, isi **Site URL** dan tambahkan
   **Redirect URLs** sesuai domain kamu, misalnya:
   - `http://localhost:3000/auth/callback` (untuk development)
   - `https://<domain-produksi-kamu>/auth/callback` (setelah deploy)
5. Ambil kredensial di **Project Settings → API**: `Project URL` dan `anon public` key.

## 2. Environment variables

Salin `.env.example` menjadi `.env.local`, lalu isi:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Opsional — aktifkan kartu "Ringkasan & Saran AI" di dashboard.
ANTHROPIC_API_KEY=
```

`ANTHROPIC_API_KEY` sepenuhnya opsional — kalau dikosongkan, kartu AI insight
otomatis tidak ditampilkan dan seluruh fitur lain tetap berjalan normal.

## 3. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Daftar akun baru lewat halaman
`/signup`, lalu ikuti wizard onboarding (nama → aset → utang → arus kas → goals) untuk
sampai ke dashboard di `/app`.

## 4. Deploy (Vercel)

1. Push repo ini ke GitHub/GitLab.
2. Buat project baru di [vercel.com/new](https://vercel.com/new) dan hubungkan ke repo ini.
3. Di **Environment Variables**, isi `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan (opsional) `ANTHROPIC_API_KEY` — sama seperti
   `.env.local`.
4. Deploy. Setelah dapat domain dari Vercel, tambahkan
   `https://<domain>/auth/callback` ke **Redirect URLs** di Supabase (langkah 1.4).
5. Bagikan link domainnya ke orang-orang yang mau testing — tiap orang tinggal daftar
   akun sendiri di `/signup`, datanya otomatis privat dan terpisah dari akun lain.

Karena tampilan sudah mobile-first dan mendukung "Add to Home Screen" (PWA manifest +
ikon di `public/icons`), aplikasi ini bisa dipasang di HP seperti aplikasi biasa.

## 5. (Opsional) Reminder email tanggal billing

Kartu Kredit, KPR, dan Pinjaman Lainnya punya field opsional "Tanggal billing". Kalau
diisi, cron job harian (`vercel.json` → `/api/cron/billing-reminders`, jalan tiap jam
02:00 UTC / 09:00 WIB) mengirim email reminder ke pemilik akun pada tanggal tsb. Untuk
mengaktifkan, isi 2 env var tambahan (di Vercel **Project Settings → Environment
Variables**, sama seperti `NEXT_PUBLIC_SUPABASE_URL` dkk):

- `SUPABASE_SERVICE_ROLE_KEY` — dari Supabase **Project Settings → API**, bagian
  **Secret keys** (`sb_secret_...`). Ini kredensial admin yang bisa baca data semua
  user — **jangan pernah** dipakai di kode client-side; di aplikasi ini hanya dibaca
  oleh route cron di server (`src/lib/supabase/admin.ts`).
- `RESEND_API_KEY` — daftar gratis di [resend.com](https://resend.com) (100
  email/hari gratis), buat API key di Dashboard → API Keys.

Tanpa domain terverifikasi di Resend, email hanya bisa terkirim ke alamat email
pemilik akun Resend itu sendiri (mode testing) — cukup untuk kamu coba sendiri dulu.
Supaya reminder benar-benar sampai ke semua tester, verifikasi domain kamu di Resend
lalu isi `REMINDER_FROM_EMAIL` dengan alamat dari domain tsb.

Kosongkan salah satu env var ini kapan saja untuk mematikan fitur reminder — sisanya
tetap jalan normal.

## 6. (Penting sebelum ada user asli) Custom SMTP untuk email konfirmasi & reset password

Secara default, email konfirmasi signup dan reset password dikirim lewat email bawaan
Supabase Auth (bukan Resend) — dan itu dibatasi sangat ketat (kira-kira 2-4 email/jam)
selama belum diarahkan ke SMTP sendiri. Ini akan jadi bottleneck signup jauh sebelum
server kewalahan, jadi wajib dibenahi sebelum promosi ke user asli.

**Prasyarat**: domain sendiri sudah diverifikasi di Resend (lihat bagian 5 di atas —
tanpa ini, email cuma bisa terkirim ke alamat pemilik akun Resend sendiri).

Langkahnya (dashboard-only, tidak ada perubahan kode/env var):

1. Kredensial SMTP dari Resend — pakai API key yang sama dengan `RESEND_API_KEY`:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) atau `587` (STARTTLS)
   - Username: `resend` (literal, bukan username akun)
   - Password: Resend API key kalian
2. Supabase Dashboard → project → **Authentication → Emails** (atau **Project
   Settings → Auth**) → cari **SMTP Settings** → aktifkan **Enable Custom SMTP** →
   isi sender email (dari domain terverifikasi, mis. `noreply@domainkamu.com`),
   sender name (`Uangku`), dan kredensial dari langkah 1.
3. Test dengan signup akun baru — pastikan email konfirmasi masuk & link-nya jalan.

Setelah aktif, limit bawaan Supabase hilang — kalian ikut limit Resend (100
email/hari / 3.000/bulan di tier gratis, mencakup konfirmasi + reset password +
reminder billing sekaligus karena satu akun Resend yang sama).

## Struktur proyek

```
src/
  app/
    (auth)/          → login, signup, forgot/update password
    auth/callback/    → penukaran kode konfirmasi email / reset password
    onboarding/       → wizard onboarding (client-side draft + commit ke Supabase)
    app/              → dashboard & halaman terproteksi (assets, liabilities, goals, expenses, settings)
    page.tsx          → landing page pemasaran
  components/
    ui/               → primitives (Button, Field, Modal, Chip, ...)
    dashboard/        → kartu-kartu dashboard (hero, trend, DBR, AI insight, ...)
    app/              → shell aplikasi (bottom nav, FAB, modal pengeluaran)
    finance/          → form generik berbasis schema aset/utang
    marketing/        → komponen landing page
  lib/
    finance/          → skema kategori aset/utang, kalkulasi (net worth, DBR, dll), format angka
    supabase/         → client/server/middleware Supabase + tipe Database
    data/dashboard.ts  → agregasi query dashboard (server-only)
    onboarding/draft.ts → penyimpanan draft onboarding di localStorage (sebelum commit)
supabase/migrations/   → skema database + Row Level Security
scripts/generate-icons.mjs → generator ikon PWA (jalankan ulang kalau mau ganti logo)
```

## Catatan tahap testing / roadmap

- **AI scan statement** (baca transaksi dari foto/PDF e-statement) ada di prototype
  awal tapi belum diimplementasikan di versi ini — kandidat fitur lanjutan lewat
  Claude vision API.
- **Kurs mata uang asing** (di form aset Cash) masih berupa referensi statis
  (`src/lib/finance/constants.ts`), bukan live rate — cocok untuk estimasi, sambungkan
  ke API kurs sungguhan untuk akurasi penuh.
- Belum ada service worker untuk mode offline — instalasi ke home screen tetap
  berfungsi, tapi butuh koneksi internet setiap dibuka.
