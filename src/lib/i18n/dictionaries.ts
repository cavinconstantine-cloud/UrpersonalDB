export type Lang = "id" | "en";

export const LANG_COOKIE = "uangku-lang";

const id = {
  nav: {
    home: "Home",
    transactions: "Transaksi",
    summary: "Summary",
    cashflow: "Arus Kas",
    settings: "Pengaturan",
  },
  shell: {
    addIncomeAria: "Catat pemasukan",
    addIncome: "Catat Pemasukan",
    addExpenseAria: "Catat pengeluaran",
    addExpense: "Catat Pengeluaran",
    splitBillAria: "Split bill",
    splitBill: "Split Bill",
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
  },
  budget: {
    title: "Budget bulanan per kategori",
    perMonth: "/bln",
    helper: "Kosongkan / isi 0 untuk kategori yang tidak mau dibudget-kan.",
  },
  dashboard: {
    fcfMonthly: "💰 Free Cash Flow /bln",
    savingRate: "💰 % Nabung dari Income",
  },
};

const en: typeof id = {
  nav: {
    home: "Home",
    transactions: "Transactions",
    summary: "Summary",
    cashflow: "Cash Flow",
    settings: "Settings",
  },
  shell: {
    addIncomeAria: "Add income",
    addIncome: "Log Income",
    addExpenseAria: "Add expense",
    addExpense: "Log Expense",
    splitBillAria: "Split bill",
    splitBill: "Split Bill",
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
  },
  budget: {
    title: "Monthly budget per category",
    perMonth: "/mo",
    helper: "Leave empty / set to 0 for categories you don't want to budget.",
  },
  dashboard: {
    fcfMonthly: "💰 Free Cash Flow /mo",
    savingRate: "💰 % of Income Saved",
  },
};

export const dictionaries = { id, en };

export type Dictionary = typeof id;

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}
