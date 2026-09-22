export type Lang = "id" | "en";

export const LANG_COOKIE = "uangku-lang";

const id = {
  nav: {
    home: "Home",
    transactions: "Transaksi",
    cashflow: "Arus Kas",
    settings: "Pengaturan",
  },
  shell: {
    addIncomeAria: "Catat pemasukan",
    addIncome: "Pemasukan",
    addExpenseAria: "Catat pengeluaran",
    addExpense: "Catat",
  },
  theme: {
    title: "Tampilan",
    system: "Sistem",
    light: "Terang",
    dark: "Gelap",
  },
  language: {
    title: "Bahasa",
    id: "Indonesia",
    en: "English",
  },
  settings: {
    title: "Pengaturan",
    account: "Akun",
    signedInAs: "Masuk sebagai",
    signOut: "Keluar",
    footer: "Uangku · Draft testing — data disimpan aman di akunmu dan bisa diakses dari perangkat mana pun.",
    profile: "Profil",
    nameLabel: "Nama",
    saveName: "Simpan nama",
    saved: "Tersimpan ✓",
    otherCashflow: "Arus kas lainnya",
    lifestyleLabel: "Lifestyle expense (Rp/bulan)",
    investLabel: "Investasi rutin (Rp/bulan)",
    save: "Simpan",
  },
  budget: {
    title: "Budget bulanan per kategori",
    perMonth: "/bln",
    helper: "Kosongkan / isi 0 untuk kategori yang tidak mau dibudget-kan.",
  },
  dashboard: {
    fcfMonthly: "💰 Free Cash Flow /bln",
    savingRate: "📊 Saving Rate",
  },
};

const en: typeof id = {
  nav: {
    home: "Home",
    transactions: "Transactions",
    cashflow: "Cash Flow",
    settings: "Settings",
  },
  shell: {
    addIncomeAria: "Add income",
    addIncome: "Income",
    addExpenseAria: "Add expense",
    addExpense: "Add",
  },
  theme: {
    title: "Appearance",
    system: "System",
    light: "Light",
    dark: "Dark",
  },
  language: {
    title: "Language",
    id: "Indonesia",
    en: "English",
  },
  settings: {
    title: "Settings",
    account: "Account",
    signedInAs: "Signed in as",
    signOut: "Sign out",
    footer: "Uangku · Testing draft — your data is stored securely on your account and accessible from any device.",
    profile: "Profile",
    nameLabel: "Name",
    saveName: "Save name",
    saved: "Saved ✓",
    otherCashflow: "Other cash flow",
    lifestyleLabel: "Lifestyle expense (Rp/month)",
    investLabel: "Recurring investment (Rp/month)",
    save: "Save",
  },
  budget: {
    title: "Monthly budget per category",
    perMonth: "/mo",
    helper: "Leave empty / set to 0 for categories you don't want to budget.",
  },
  dashboard: {
    fcfMonthly: "💰 Free Cash Flow /mo",
    savingRate: "📊 Saving Rate",
  },
};

export const dictionaries = { id, en };

export type Dictionary = typeof id;

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}
