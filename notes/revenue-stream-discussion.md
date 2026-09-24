# Revenue Stream Discussion

Ringkasan diskusi strategi monetisasi Uangku. Codeword: **"revenue stream discussion"**.

## Revenue Stream 1 — Biaya akses aplikasi

**Opsi yang dipertimbangkan:**
- One-time Rp 88.000 (lifetime/selamanya)
- Recurring Rp 15.000/bulan, minimum pembayaran 3 bulan
- Pembayaran: QRIS saja (tidak mau CC/debit)

**Rekomendasi: recurring, bukan lifetime.**

Alasan (LTV, asumsi eksplisit — perlu divalidasi dengan data real):
- Lifetime Rp 88.000, asumsi retensi rata-rata 18 bulan → ARPU efektif ~Rp 4.900/bulan
- Recurring Rp 15.000/bulan, asumsi churn ~8%/bulan setelah komitmen 3 bulan awal → retensi rata-rata ~12,5 bulan → LTV ~Rp 187.500 (2x lebih tinggi dari lifetime)
- Masalah struktural lifetime: makin loyal user, makin rugi marginal (cost dukungan jalan terus, revenue nol)
- Saran tambahan: opsi tahunan (mis. Rp 150.000/tahun) buat cash flow lebih baik + retensi

**Constraint teknis QRIS**: QRIS didesain untuk transaksi push/manual (scan tiap kali bayar), bukan auto-debit recurring native. "Minimum 3 bulan" paling gampang dieksekusi sebagai satu transaksi Rp 45.000 di muka untuk 3 bulan. Auto-debit bulanan asli butuh PSP (Midtrans/Xendit/DOKU) dengan token recurring via e-wallet linking (GoPay/OVO/DANA), bukan QRIS murni.

**Soal "sistem di-close kalau tidak bayar"**: jangan hard-lock total data. Rekomendasi soft-lock — read-only ke histori, input baru & fitur premium (AI insight, dst) di-lock sampai bayar. Hard delete baru setelah dormant lama (6-12 bulan) dengan peringatan berkali-kali.

## Revenue Stream 2 — Referral/affiliate produk investasi

**Ide 1: Affiliate ke platform reksadana/obligasi** (Bibit, Bareksa, Ajaib, Pluang)

Koreksi setelah riset lebih detail (search + fetch ke halaman resmi masing-masing platform) —
awalnya diasumsikan "program affiliate publik self-service", ternyata realitanya lebih
dekat ke program referral konsumen biasa, bukan program affiliate B2B/CPA formal:

| Platform | Status program | Komisi/reward |
|---|---|---|
| **Ajaib Ambassador** | Paling konkret — ada halaman daftar resmi, tapi tetap "PIC Ajaib akan menghubungi" buat bahas detail (bukan API self-service) | Maks **Rp 30.000/user** (registrasi + verifikasi KYC + transaksi pertama) |
| **Bibit** | Ada "Program Afiliasi" dengan 3 jenis komisi — rincian nominal per tier tidak berhasil diakses penuh (situs mereka block dari fetch otomatis) | Referral biasa: cashback Rp 25.000 ke kedua pihak. Detail tier affiliate perlu dicek manual |
| **Bareksa** | Invite-only via email ke customer terpilih — **bukan** open enrollment untuk bisnis | Voucher Rp 25.000–50.000 |
| **Pluang** | Belum ketemu struktur komisi publik yang jelas, cuma promo referral musiman | Tidak diketahui |

**Temuan penting**: semua yang berhasil dikonfirmasi itu **komisi flat one-time per konversi**
(~Rp 25.000–30.000), BUKAN trailing/recurring commission berdasarkan AUM yang mengendap di
platform partner. Ini beda dari asumsi awal — model bisnisnya lebih ke "bounty per referral
berhasil", bukan revenue share berkelanjutan. Reset ekspektasi: stream ini realistis jadi
bonus kecil, bukan revenue utama.

**Cara "connect" teknisnya**: bukan integrasi API — cukup daftar sebagai affiliate/ambassador
(pakai identitas bisnis), dapat kode/link referral unik, taruh link itu di CTA insight card
di app. User klik → diarahkan ke halaman signup partner dengan kode ter-embed → konversi
ke-track otomatis di sistem partner, komisi masuk ke akun yang daftar. Tidak butuh backend
tracking sendiri untuk versi paling sederhana ini.

**Catatan regulasi**: OJK mewajibkan lisensi (APERD/WAPERD) untuk siapa pun yang
*merekomendasikan produk investasi spesifik*. Selama Uangku cuma jadi affiliate link (bukan
eksekusi transaksi, bahasa edukatif bukan "beli produk X sekarang"), ini lebih aman secara
hukum — tapi tetap perlu dicek ke legal/konsultan sebelum ship.

**Mockup UI insight card** (nge-hit user dengan AUM ≥50% di Cash) sudah dibuat:
https://claude.ai/artifact/A9wzErA5DxMNMcJ3DuscSt

**Ide 2: Referral ke bank private banking** (untuk AUM > 1M, model "member get member")
- Valid (bank memang bayar referral fee untuk lead HNW), tapi ini kerjaan BD manusia — butuh ngobrol langsung ke unit wealth/priority banking tiap bank, tidak bisa auto-jalan tanpa kontak partner.
- Volume kecil (realistis <1-2% user), tapi ticket size per deal bisa besar. Bagus buat "someday" tier, murah disiapkan sekarang (tinggal nambah segmentation logic berbasis AUM yang sudah di-track).

**Premis penting**: kedua model TETAP butuh hubungan/pendaftaran resmi dengan partner — tidak ada dunia di mana taruh link lalu otomatis dapat komisi tanpa relasi apa pun ke partner tsb.

## Segmentasi customer untuk insight (siapa yang lihat kapan)

4 segmen berbasis sinyal yang sudah ada di data (mockup interaktif: https://claude.ai/artifact/1aGtHwp64VjjFQavURXsCU):

| Segmen | Trigger | Sumber data | Prioritas |
|---|---|---|---|
| 1. Dana Darurat Berlebih | Saldo Cash > 6× rata-rata pengeluaran bulanan (9-12× untuk pengusaha) | `monthExpenseTotal`, cashflow — sudah ada | **Utama** — paling data-driven |
| 2. Goal Butuh Percepatan | Trigger #1 + ada goal aktif `onTrack = false` | `goalMonthlySavingsPlan` — sudah ada | Prioritas 2 — paling persuasif |
| 3. Windfall Belum Dialokasikan | Cash naik >20% dlm 30 hari, tanpa goal baru | `asset_holding_snapshots` — butuh logic baru | Nanti |
| 4. Belum Pernah Investasi | 100% aset di Cash | `asset_holdings` — sudah ada | Tone beda (edukasi, bukan upsell) |

**Segmen 5 — Market-Triggered** (ide tambahan user): IHSG turun → arahkan ke saham/reksadana saham; yield obligasi naik (wacana suku bunga naik) → arahkan ke obligasi/SBN. Mockup + penempatan: https://claude.ai/artifact/9VEXdPNCXJ1Ti62vvVgsj1

- **Beda kelas risiko** dari segmen 1-4: ini market timing advice, bukan observasi data personal — perlu disclaimer lebih tegas ("bukan ajakan beli sekarang"), dan lebih dekat ke garis regulasi WAPERD/APERD.
- **Data**: IHSG harian sudah siap (`change_pct` di cron `stock-prices`). IHSG mingguan butuh 1 tabel snapshot baru (pattern sudah ada 3x di app — net worth/FCF/asset holding). **Yield obligasi/SBN belum ada sumber data sama sekali** — perlu riset sumber (BI/Kemenkeu/IBPA), belum ada API gratis semudah Yahoo Finance buat ini.
- **Penempatan berbeda dari segmen 1-4**: insight personal tetap di dashboard atas (computed per-user tiap load); insight market ditaro nempel section "Berita Pasar" yang sudah ada (bukan generic ke semua user, harus tetap combine dengan sinyal personal spy nggak berasa spam blast).

## Sourcing "Berita Pasar" (fitur existing, bukan baru)

User tanya: dari mana sumbernya, sustain nggak, siapa yang decide berita mana.

- **Sudah otomatis penuh** — cron harian (03:00 UTC/~10:00 WIB) pakai Claude Sonnet 5 + web search tool, dibatasi ke 15 domain whitelist (Reuters, Bloomberg, AP, FT, WSJ, CNBC Indonesia, Kontan, Bisnis.com, Katadata, Kompas, IDX, BI, OJK, IMF, World Bank).
- **Claude yang decide sendiri** 3-5 berita paling relevan tiap hari, tulis analisis Bahasa Indonesia — user/founder nggak perlu kurasi manual sama sekali.
- **Sitasi wajib** — tiap item harus ada minimal 1 URL asli dari hasil search, dilarang mengarang URL. Sudah jadi hard requirement di prompt existing (`api/cron/market-news/route.ts`).
- **Insight market baru (Segmen 5) ikut aturan sitasi yang sama**: klaim kualitatif wajib ada sitasi media, angka murni dari sistem sendiri (mis. IHSG turun X%) ditandai beda (nggak butuh sitasi eksternal karena itu data terverifikasi sendiri).

## Ide tambahan

- **Freemium tiering** — basic tracking gratis selamanya, fitur premium (AI insight, export, multi-akun, budget advanced) dikunci. Kemungkinan revenue engine paling sehat jangka pendek.
- **B2B2C / white-label** ke perusahaan sebagai employee financial wellness benefit — deal size besar, sales cycle lambat, worth dipikirkan setelah traction consumer cukup.
- **Sponsored placement** dari bank/fintech (pay-to-list, bukan pay-per-lead) — model lebih simpel dinegosiasi dibanding referral fee.

## Biaya operasional (cek harga resmi Anthropic + estimasi infra)

| Item | Biaya | Catatan |
|---|---|---|
| AI Insight (Claude Sonnet 5) | ~Rp 100/klik | Input ~700 tok + output ~500 tok |
| Split Bill (Claude Opus 5.5, vision) | ~Rp 250-300/foto struk | Estimasi kasar token gambar — cek `response.usage` real sebelum finalisasi harga |
| Berita Pasar (cron harian + web search) | ~Rp 43.000/bulan (shared, bukan per-user) | Makin banyak user, makin murah per kepala |
| Hosting (Vercel Pro) | $20/bulan (~Rp 316.000) | Wajib — Vercel Hobby dilarang untuk produk komersial |
| Database (Supabase Pro) | $25/bulan (~Rp 395.000) | Wajib — Supabase Free auto-pause kalau tidak dipakai seminggu |
| Email konfirmasi (Supabase bawaan) | Rp 0 | ⚠️ Limit ~2-4 email/jam tanpa custom SMTP — lihat notes/domain-topic.md |
| Email reminder billing (Resend) | Rp 0 | Gratis sampai 3.000 email/bulan, lalu $20/bulan (50.000 email) |

**Total biaya tetap ≈ $47,70/bulan ≈ Rp 754.000/bulan** (di luar biaya AI variable per pemakaian yang kecil).

**Breakeven**: ~51 subscriber di harga Rp 15.000/bulan sudah cukup nutup semua biaya tetap. Angka kecil dan achievable — menguatkan rekomendasi recurring di atas Revenue Stream 1.

## Kapasitas user maksimum (infra saat ini, Vercel Pro + Supabase Pro)

Bottleneck bukan compute/storage duluan, tapi **email konfirmasi Supabase bawaan** (~2-4 email/jam tanpa custom SMTP) — ini jebol duluan di kisaran puluhan signup/hari. Fix: custom SMTP ke Resend (lihat notes/domain-topic.md dan checklist artifact yang sudah dibuat).

Setelah itu dibenarkan, estimasi kasar (perlu divalidasi dengan load test real):
- Supabase Pro: 100.000 MAU included, storage 8GB included → kira-kira cukup untuk low-thousands sampai ~10.000 active user selama setahun+ (pertumbuhan storage utamanya dari tabel snapshot harian, bukan transaksi)
- Vercel Pro: 1 juta invocation included → kira-kira ~5.000 active user sebelum keluar kuota (lepas itu cuma nambah $0,60/juta, bukan tembok keras)

**Kesimpulan**: nyaman di kisaran beberapa ribu sampai ~5.000-10.000 monthly active user dengan setup sekarang, asalkan email confirmation dibenerin duluan.

## Status: diversification insight cards — SUDAH DI-SHIP ke kode (commit d79e8f1)

- [x] `idleCashSurplus()` + `hasNoNonCashAssets()` di `calculations.ts`
- [x] `DiversificationInsightCard` — Segmen 1 (dana darurat berlebih), Segmen 2 (goal-linked), Segmen 3 (windfall), Segmen 4 (first-timer), otomatis pilih prioritas tertinggi yang berlaku (goal-linked > windfall > idle-cash > first-timer)
- [x] `MarketInsightCard` — IHSG turun >2,5%/hari, ditaro dekat Berita Pasar
- [x] Fetch `ihsgChangePct` (dari `stock_prices` yang sudah ada) di `dashboard.ts`
- [x] **Keputusan diubah**: CTA tidak lagi nunggu affiliate. `AFFILIATE_CTA_ENABLED` flag dihapus — CTA sekarang aktif dan buka `InvestmentEducationModal` (edukasi umum, nggak nge-push produk/partner tertentu, sebut nama platform OJK secara netral tanpa favoritism). Ini justru lebih aman secara regulasi dibanding versi affiliate.
- [x] **Segmen 3 (windfall) sudah di-build juga** — ternyata nggak butuh tabel baru, `asset_holding_snapshots` sudah nyimpen history harian sejak lama (PK per hari per holding), tinggal query lebih jauh ke belakang (~30 hari). Koreksi dari catatan sebelumnya yang bilang ini butuh infra baru.
- [ ] **Masih belum di-build**: insight yield obligasi (beneran belum ada sumber data sama sekali, beda dari windfall)
- [ ] **Legal review OJK (APERD/WAPERD)** — belum dilakukan, tapi risikonya sudah lebih rendah karena CTA sekarang murni edukasi umum, bukan affiliate ke platform tertentu. Tetap worth direview profesional sebelum ada rencana kerja sama affiliate beneran ke depannya.

## Status bagian lain

- [x] SMTP fix diagnosis (root cause + langkah + checklist interaktif sudah dibuat: https://claude.ai/artifact/WA8kcaQi2B9yHB5q6fthcL)
- [ ] Eksekusi setup SMTP di dashboard Resend + Supabase (task user, belum dikonfirmasi selesai)
- [ ] Keputusan final harga Revenue Stream 1 (one-time vs recurring vs tahunan) — belum diputuskan user
- [ ] Belum dibahas: struktur freemium tier konkret
