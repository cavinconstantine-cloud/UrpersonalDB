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
- Realistis & bisa jalan duluan — program affiliate publik, self-service, tidak perlu BD meeting besar
- **Catatan regulasi**: OJK mewajibkan lisensi (APERD/WAPERD) untuk siapa pun yang *merekomendasikan produk investasi spesifik*. Selama Uangku cuma jadi affiliate link (bukan eksekusi transaksi, bahasa edukatif bukan "beli produk X sekarang"), ini lebih aman secara hukum — tapi tetap perlu dicek ke legal/konsultan sebelum ship.

**Ide 2: Referral ke bank private banking** (untuk AUM > 1M, model "member get member")
- Valid (bank memang bayar referral fee untuk lead HNW), tapi ini kerjaan BD manusia — butuh ngobrol langsung ke unit wealth/priority banking tiap bank, tidak bisa auto-jalan tanpa kontak partner.
- Volume kecil (realistis <1-2% user), tapi ticket size per deal bisa besar. Bagus buat "someday" tier, murah disiapkan sekarang (tinggal nambah segmentation logic berbasis AUM yang sudah di-track).

**Premis penting**: kedua model TETAP butuh hubungan/pendaftaran resmi dengan partner — tidak ada dunia di mana taruh link lalu otomatis dapat komisi tanpa relasi apa pun ke partner tsb.

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

## Status per bagian ini

- [x] SMTP fix diagnosis (root cause + langkah + checklist interaktif sudah dibuat: https://claude.ai/artifact/WA8kcaQi2B9yHB5q6fthcL)
- [ ] Eksekusi setup SMTP di dashboard Resend + Supabase (task user, belum dikonfirmasi selesai)
- [ ] Keputusan final harga Revenue Stream 1 (one-time vs recurring vs tahunan) — belum diputuskan user
- [ ] Belum dibahas: struktur freemium tier konkret, implementasi teknis affiliate link, legal review APERD/WAPERD
