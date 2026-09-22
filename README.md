# Uangku — Dashboard Keuangan Pribadi

Versi produksi (draft/testing) dari prototype "Personal Life Dashboard": net worth,
arus kas, Debt Burden Ratio, goals, dan pencatatan pengeluaran — multi-user, dengan
akun & data privat per orang, bisa diakses dari HP maupun laptop, dan bisa diupdate
kapan saja.

**Stack:** Next.js 16 (App Router) · Supabase (Auth + Postgres, dengan Row Level
Security) · Tailwind CSS v4 · opsional Anthropic API untuk fitur ringkasan AI.

## 1. Setup Supabase

1. Buat project baru di [supabase.com/dashboard](https://supabase.com/dashboard) (gratis).
2. Buka **SQL Editor** di project tsb, lalu jalankan seluruh isi file
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). Ini akan
   membuat semua tabel yang dibutuhkan (`profiles`, `cashflow`, `asset_holdings`,
   `liabilities`, `goals`, `expenses`, dll) lengkap dengan Row Level Security — setiap
   akun hanya bisa membaca/menulis datanya sendiri.
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
