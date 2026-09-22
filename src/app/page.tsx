import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { LinkButton } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  Target,
  Sparkles,
  Smartphone,
  ShieldCheck,
  CircleCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Net worth, selalu update",
    desc: "Aset, utang, dan cash — semua kategori finansial Indonesia (reksadana, saham, emas, KPR, properti) dalam satu angka yang jelas.",
  },
  {
    icon: TrendingUp,
    title: "Cash flow & Debt Burden Ratio",
    desc: "Tahu persis berapa free cash flow bulananmu dan seberapa sehat rasio cicilan terhadap income — bukan sekadar tebakan.",
  },
  {
    icon: Target,
    title: "Goals yang dihitung otomatis",
    desc: "Dana darurat, DP rumah, dana pendidikan anak — tahu persis berapa yang perlu disisihkan tiap bulan agar tercapai tepat waktu.",
  },
  {
    icon: Sparkles,
    title: "Ringkasan & saran AI",
    desc: "Minta AI membaca kondisi keuanganmu dan memberi saran yang actionable, bukan nasihat generik.",
  },
  {
    icon: Smartphone,
    title: "Akses dari mana saja",
    desc: "Buka dari HP saat di jalan, atau laptop saat weekend review — datanya selalu sinkron dan bisa diupdate kapan pun.",
  },
  {
    icon: ShieldCheck,
    title: "Privat, hanya untukmu",
    desc: "Setiap akun punya datanya masing-masing, terkunci lewat autentikasi standar industri. Tidak ada yang bisa melihat kecuali kamu.",
  },
];

const STEPS = [
  { n: "01", title: "Daftar akun", desc: "Cukup email dan password. Gratis untuk testing." },
  { n: "02", title: "Isi kondisi finansialmu", desc: "Aset, utang, cash flow, dan goals — 5-10 menit lewat wizard yang santai." },
  { n: "03", title: "Pantau & update", desc: "Cek dashboard kapan saja, catat pengeluaran harian, lihat progress goals." },
];

const FAQS = [
  {
    q: "Apakah data keuanganku aman?",
    a: "Setiap akun memiliki datanya sendiri dan terisolasi penuh dari akun lain lewat kebijakan keamanan database (row-level security) — bukan hanya dipisah di tampilan.",
  },
  {
    q: "Apakah ini masih tahap testing?",
    a: "Ya — Uangku saat ini dalam tahap draft/testing untuk kumpulan pengguna terbatas. Fitur bisa berubah, dan masukanmu sangat membantu.",
  },
  {
    q: "Apakah bisa diakses dari HP?",
    a: "Bisa. Tampilan dioptimalkan untuk layar HP dan bisa ditambahkan ke home screen seperti aplikasi biasa.",
  },
  {
    q: "Berapa biayanya?",
    a: "Gratis selama tahap testing ini.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-full">
      <SiteHeader />

      {/* Hero */}
      <section className="max-w-[1100px] mx-auto px-5 pt-14 pb-16 sm:pt-20 sm:pb-24 grid sm:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 mb-5">
            <Sparkles size={13} /> Draft testing — dicari early user
          </div>
          <h1 className="serif text-[34px] sm:text-[44px] leading-[1.1] font-medium mb-5">
            Satu tempat untuk seluruh kehidupan finansialmu.
          </h1>
          <p className="text-text-dim text-[16px] leading-relaxed mb-8 max-w-[440px]">
            Net worth, arus kas, dan tujuan finansial — terlihat jelas, terhitung otomatis, dan bisa diupdate kapan
            saja dari HP maupun laptop. Dibangun untuk kamu yang serius mengatur uang, bukan sekadar mencatat.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/signup" size="md">
              Mulai gratis
            </LinkButton>
            <LinkButton href="/login" variant="ghost" size="md">
              Sudah punya akun
            </LinkButton>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-text-dim">
            {["Gratis untuk testing", "Data private per akun", "Bisa dari HP"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CircleCheck size={14} className="text-good" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="order-first sm:order-last">
          <PhoneMockup />
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="bg-bg-sunken border-y border-hairline py-16 sm:py-20">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="max-w-[560px] mb-12">
            <h2 className="serif text-[28px] sm:text-[32px] font-medium mb-3">
              Dibuat dari kebiasaan orang Indonesia mengatur uang.
            </h2>
            <p className="text-text-dim leading-relaxed">
              Bukan sekadar pencatat pengeluaran — Uangku menggabungkan net worth tracking, analisis cash flow, dan
              perencanaan goals yang biasanya tersebar di banyak spreadsheet.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-bg-raised border border-hairline rounded-2xl p-5 shadow-[var(--shadow-card)]">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 text-brand-strong">
                  <Icon size={18} />
                </div>
                <h3 className="font-medium text-[15px] mb-1.5">{title}</h3>
                <p className="text-sm text-text-dim leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="max-w-[1100px] mx-auto px-5 py-16 sm:py-20">
        <h2 className="serif text-[28px] sm:text-[32px] font-medium mb-12 text-center">Mulai dalam tiga langkah</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="serif text-brand text-[15px] mb-2">{s.n}</div>
              <h3 className="font-medium text-[16px] mb-2">{s.title}</h3>
              <p className="text-sm text-text-dim leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-bg-sunken border-y border-hairline py-16 sm:py-20">
        <div className="max-w-[720px] mx-auto px-5">
          <h2 className="serif text-[28px] sm:text-[32px] font-medium mb-10 text-center">Pertanyaan umum</h2>
          <div className="space-y-5">
            {FAQS.map((f) => (
              <div key={f.q} className="bg-bg-raised border border-hairline rounded-2xl p-5 shadow-[var(--shadow-card)]">
                <h3 className="font-medium text-[15px] mb-1.5">{f.q}</h3>
                <p className="text-sm text-text-dim leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[1100px] mx-auto px-5 py-16 sm:py-24 text-center">
        <h2 className="serif text-[28px] sm:text-[34px] font-medium mb-4 max-w-[560px] mx-auto">
          Berhenti menebak-nebak kondisi keuanganmu.
        </h2>
        <p className="text-text-dim mb-8 max-w-[440px] mx-auto leading-relaxed">
          Daftar sekarang dan lihat gambaran lengkap net worth-mu dalam 10 menit.
        </p>
        <LinkButton href="/signup" size="md">
          Mulai gratis
        </LinkButton>
      </section>

      <footer className="border-t border-hairline py-8">
        <div className="max-w-[1100px] mx-auto px-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-text-muted">
          <span className="serif text-text-dim">Uangku</span>
          <span>Draft testing · Bukan produk final</span>
          <Link href="/login" className="hover:text-text-dim">
            Masuk
          </Link>
        </div>
      </footer>
    </div>
  );
}
