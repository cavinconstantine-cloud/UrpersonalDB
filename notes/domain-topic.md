# Domain Topic

Ringkasan diskusi soal domain website. Topik ini "soon akan dibicarakan lebih lanjut" — user minta dicatat dulu.

## Apa itu domain

Alamat website (mis. `google.com`) — bukan link lengkap dengan `https://` dan path halaman, cuma nama intinya.

## Status saat ini

Aplikasi Uangku **belum punya domain sendiri** — masih pakai subdomain gratis bawaan Vercel: `urpersonal-db.vercel.app` (terlihat dari screenshot yang dikirim user sebelumnya).

## Kenapa ini penting

1. **Email (Resend)** — Resend cuma bisa kirim email ke siapa saja kalau pakai domain terverifikasi milik sendiri. Pakai domain testing `resend.dev` (default sekarang) → email cuma nyampe ke email pemilik akun Resend sendiri, bukan ke nasabah asli. Ini prasyarat untuk setup custom SMTP (lihat notes/revenue-stream-discussion.md bagian biaya operasional, dan checklist SMTP: https://claude.ai/artifact/WA8kcaQi2B9yHB5q6fthcL).
2. **Kredibilitas** — nasabah lebih percaya `uangku.id` dibanding `urpersonal-db.vercel.app`, terutama karena ini aplikasi finansial yang mau charge uang beneran.
3. **Kebutuhan masa depan** — WhatsApp Business API verification dan payment gateway biasanya juga minta domain sendiri.

## Estimasi biaya

| Jenis domain | Kisaran harga/tahun | Catatan |
|---|---|---|
| `.id` / `.co.id` | Rp 150.000–300.000 | Perlu verifikasi KTP |
| `.com` | Rp 150.000–200.000 (~$10-12) | Tidak perlu verifikasi identitas |

Sudah dimasukkan ke perhitungan biaya operasional di notes/revenue-stream-discussion.md.

## Langkah yang perlu dilakukan (belum dieksekusi)

1. Cek ketersediaan nama (mis. `uangku.id`, `uangku.com`) di registrar — Claude sempat tawarkan bantu cek, belum dijawab user.
2. Beli domain di registrar (Niagahoster/Domainesia/Rumahweb untuk `.id`, atau Namecheap/Cloudflare untuk `.com`).
3. Hubungkan domain ke Vercel (Project Settings → Domains → Add Domain → ubah DNS di registrar).
4. Verifikasi domain yang sama di Resend (Domains → Add Domain → ubah DNS lagi, record berbeda dari langkah 3).
5. Lanjut ke checklist setup SMTP yang sudah dibuat.

## Status

- [ ] Belum diputuskan: nama domain final, `.id` vs `.com`, kapan beli
- [ ] Belum dicek: ketersediaan nama `uangku.id` / `uangku.com`
- [ ] Diskusi lanjutan dijadwalkan "soon" oleh user — belum ada tanggal pasti
