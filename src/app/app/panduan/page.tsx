import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PanduanAccordion, type PanduanItem } from "@/components/app/panduan-accordion";

export const metadata: Metadata = { title: "Panduan Fitur" };

const ITEMS: PanduanItem[] = [
  {
    id: "whatsapp",
    icon: "💬",
    title: "Catat via WhatsApp",
    badge: "BETA",
    summary: "Chat ke Uangku, transaksi otomatis tercatat.",
    body: [
      "Nggak perlu buka app — chat ke nomor WhatsApp Uangku kayak chat ke teman, mis. \"makan siang 35rb\" atau \"gaji 5jt\". Uangku otomatis baca nominal, kategori, dan jenisnya (pengeluaran/pemasukan).",
      "Cara hubungkan: buka Settings → \"Catat via WhatsApp\" → tap \"Hubungkan WhatsApp\", nanti muncul kode pairing dan tombol yang langsung buka WhatsApp dengan kode itu terisi otomatis.",
      "Kalau kamu punya lebih dari satu rekening (Sumber Dana), bot bakal nanya balik rekening mana yang dipakai — atau langsung sebut nama banknya di pesan (mis. \"beli buku 125rb dari BCA\") biar nggak ditanya.",
      "Fitur ini masih tahap testing terbatas. Kalau ada yang aneh, kabarin tim Uangku ya.",
    ],
  },
  {
    id: "transaksi",
    icon: "🧾",
    title: "Catat Transaksi",
    summary: "Tombol tambah cepat, riwayat lengkap, cari & filter.",
    body: [
      "Tombol + di bawah layar buat catat pengeluaran atau pemasukan dalam beberapa detik. Bisa pilih kategori bawaan atau bikin kategori sendiri.",
      "Semua transaksi kelihatan di halaman Transaksi — bisa dicari lewat nama, difilter per kategori atau Sumber Dana, dan diurutkan dari yang terbaru.",
      "Khusus pemasukan usaha (Pengusaha/freelancer), ada opsi hitung otomatis potongan pajak (PPh Final UMKM atau Non-Karyawan/Jasa) sebelum dicatat sebagai bersih.",
    ],
  },
  {
    id: "sumber-dana",
    icon: "🏦",
    title: "Sumber Dana",
    summary: "Tandai transaksi ke rekening/kas spesifik, saldo auto-update.",
    body: [
      "Waktu catat transaksi, kamu bisa pilih dari rekening/kas mana uangnya keluar atau masuk — opsional, tapi kalau dipakai konsisten, saldo tiap rekening jadi selalu akurat tanpa hitung manual.",
      "Saldo otomatis nyesuaikan tiap kali transaksi ditambah, diedit, atau dihapus — termasuk transaksi yang datang dari WhatsApp dan Split Bill.",
    ],
  },
  {
    id: "split-bill",
    icon: "🧮",
    title: "Split Bill",
    badge: "BETA",
    summary: "Foto struk, bagi tagihan, share link ke teman.",
    body: [
      "Foto atau upload struk belanja/makan, Uangku baca item & harganya otomatis pakai AI — hasilnya tetap bisa dikoreksi sebelum disimpan.",
      "Assign tiap item ke orang yang pesan, atau kalau itu menu yang dipesan buat dimakan bareng-bareng, pakai toggle \"Bagi Rata\" — pilih siapa aja yang ikut patungan, harganya kebagi rata otomatis.",
      "Setelah selesai, dapet link yang bisa dibagikan ke teman-teman lewat WhatsApp — mereka bisa lihat rincian bagian masing-masing tanpa perlu install app.",
      "Cuma bagianmu sendiri yang tercatat sebagai pengeluaranmu dan ngurangin saldo Sumber Dana — bagian orang lain nggak ngaruh ke datamu.",
    ],
  },
  {
    id: "ringkasan",
    icon: "📊",
    title: "Ringkasan & Arus Kas",
    summary: "Free Cash Flow, saving rate, grafik bulanan.",
    body: [
      "Tab Summary nunjukkin Free Cash Flow (FCF) dan saving rate kamu, plus grafik tren beberapa bulan terakhir, sebaran pengeluaran per kategori, dan transaksi terbesar.",
      "Buat Karyawan, periode \"bulan ini\" otomatis mengikuti tanggal gajian kamu (bukan tanggal 1) — jadi tagihan yang kepotong pas gajian nggak numpuk salah bulan. Ada highlight kecil di tab ini yang nunjukkin periode yang lagi ditampilin.",
    ],
  },
  {
    id: "budget-goals",
    icon: "🎯",
    title: "Budget & Goals",
    summary: "Batas pengeluaran per kategori, progress target nabung.",
    body: [
      "Set limit bulanan per kategori pengeluaran di Settings — progress-nya kelihatan di dashboard, jadi ketauan sebelum kebablasan.",
      "Goals buat nabung ke target tertentu (dana darurat, liburan, DP rumah, dll) — update progress manual kapan aja, atau link ke aset spesifik biar keupdate otomatis.",
    ],
  },
  {
    id: "aset-utang",
    icon: "📈",
    title: "Aset & Utang",
    summary: "Kelola portofolio, saham auto-update, cicilan & jatuh tempo.",
    body: [
      "Catat semua aset (cash, deposito, saham, reksadana, properti, dll) dan utang (KPR, kartu kredit, cicilan lain) dalam kategori yang bisa disesuaikan.",
      "Buat saham: cukup isi kode saham, jumlah lot, dan harga beli — harga terkini plus IHSG otomatis update tiap hari kerja, nggak perlu update manual.",
      "Ada badge pergerakan harian per aset dan reminder otomatis (email) beberapa hari sebelum tanggal jatuh tempo cicilan.",
    ],
  },
  {
    id: "notifikasi",
    icon: "🔔",
    title: "Notifikasi & Streak",
    summary: "Reminder harian, streak pencatatan konsisten.",
    body: [
      "Aktifkan notifikasi push di Settings buat dapet reminder harian, peringatan budget yang mepet, dan update streak.",
      "Streak nambah tiap hari kamu nyatet minimal satu transaksi (dari app atau WhatsApp) — cara ringan buat jaga kebiasaan konsisten.",
    ],
  },
  {
    id: "berita-pasar",
    icon: "🌐",
    title: "Berita Pasar",
    summary: "Insight pasar modal, dikurasi manual — tanpa noise.",
    body: [
      "Kartu \"Berita Pasar\" di dashboard nampilin ringkasan & analisa dampak berita ekonomi/pasar modal ke investor Indonesia — dikurasi manual, bukan auto-scrape, jadi kualitasnya terjaga.",
      "Tiap berita juga ada 1 kalimat rekomendasi actionable — bukan cuma info, tapi apa yang sebaiknya kamu lakuin.",
    ],
  },
  {
    id: "payday",
    icon: "🗓️",
    title: "Otomasi Gajian",
    summary: "Khusus Karyawan — income & expense tetap tercatat otomatis.",
    body: [
      "Kalau kamu profil Karyawan dan udah set tanggal gajian, pemasukan dan pengeluaran tetap (recurring) yang udah kamu daftarin otomatis tercatat tiap tanggal gajian — nggak perlu input manual tiap bulan.",
    ],
  },
];

export default async function PanduanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-5 pt-6 pb-10">
      <Link href="/app" className="text-sm text-text-dim mb-4 inline-block">
        ‹ Kembali ke Dashboard
      </Link>
      <h1 className="serif text-[24px] font-medium mb-1.5">📖 Panduan Fitur</h1>
      <p className="text-[13px] text-text-dim mb-6 leading-relaxed">
        Semua fitur Uangku, ringkas dan lengkap. Tap bagian yang mau kamu pelajari.
      </p>
      <PanduanAccordion items={ITEMS} defaultOpenId="whatsapp" />
    </div>
  );
}
