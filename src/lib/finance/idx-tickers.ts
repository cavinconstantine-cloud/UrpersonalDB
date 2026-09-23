/**
 * Curated list of actively-traded IDX tickers for the "Cari Saham" picker —
 * there's no free ticker/company search API for the Indonesia Stock Exchange,
 * so this ships as a static directory instead (mostly LQ45 constituents).
 * The daily price cron (`/api/cron/stock-prices`) refreshes prices for every
 * ticker in this list, so search results always show a current price even
 * before anyone holds that stock. A user can still add a ticker not listed
 * here via the manual-entry fallback in SahamHoldingModal.
 */
export interface IdxTicker {
  ticker: string;
  name: string;
}

export const IDX_TICKERS: IdxTicker[] = [
  { ticker: "BBCA", name: "Bank Central Asia Tbk" },
  { ticker: "BBRI", name: "Bank Rakyat Indonesia Tbk" },
  { ticker: "BMRI", name: "Bank Mandiri Tbk" },
  { ticker: "BBNI", name: "Bank Negara Indonesia Tbk" },
  { ticker: "BRIS", name: "Bank Syariah Indonesia Tbk" },
  { ticker: "TLKM", name: "Telkom Indonesia Tbk" },
  { ticker: "ASII", name: "Astra International Tbk" },
  { ticker: "UNVR", name: "Unilever Indonesia Tbk" },
  { ticker: "ICBP", name: "Indofood CBP Sukses Makmur Tbk" },
  { ticker: "INDF", name: "Indofood Sukses Makmur Tbk" },
  { ticker: "KLBF", name: "Kalbe Farma Tbk" },
  { ticker: "ADRO", name: "Adaro Energy Indonesia Tbk" },
  { ticker: "PGAS", name: "Perusahaan Gas Negara Tbk" },
  { ticker: "PTBA", name: "Bukit Asam Tbk" },
  { ticker: "ANTM", name: "Aneka Tambang Tbk" },
  { ticker: "MDKA", name: "Merdeka Copper Gold Tbk" },
  { ticker: "INCO", name: "Vale Indonesia Tbk" },
  { ticker: "SMGR", name: "Semen Indonesia Tbk" },
  { ticker: "INTP", name: "Indocement Tunggal Prakarsa Tbk" },
  { ticker: "GGRM", name: "Gudang Garam Tbk" },
  { ticker: "HMSP", name: "H.M. Sampoerna Tbk" },
  { ticker: "UNTR", name: "United Tractors Tbk" },
  { ticker: "CPIN", name: "Charoen Pokphand Indonesia Tbk" },
  { ticker: "JPFA", name: "Japfa Comfeed Indonesia Tbk" },
  { ticker: "EXCL", name: "XL Axiata Tbk" },
  { ticker: "ISAT", name: "Indosat Ooredoo Hutchison Tbk" },
  { ticker: "TOWR", name: "Sarana Menara Nusantara Tbk" },
  { ticker: "MNCN", name: "Media Nusantara Citra Tbk" },
  { ticker: "SCMA", name: "Surya Citra Media Tbk" },
  { ticker: "SIDO", name: "Industri Jamu dan Farmasi Sido Muncul Tbk" },
  { ticker: "ERAA", name: "Erajaya Swasembada Tbk" },
  { ticker: "ACES", name: "Ace Hardware Indonesia Tbk" },
  { ticker: "MAPI", name: "Mitra Adiperkasa Tbk" },
  { ticker: "AMRT", name: "Sumber Alfaria Trijaya Tbk" },
  { ticker: "MYOR", name: "Mayora Indah Tbk" },
  { ticker: "ULTJ", name: "Ultrajaya Milk Industry Tbk" },
  { ticker: "TPIA", name: "Chandra Asri Pacific Tbk" },
  { ticker: "BRPT", name: "Barito Pacific Tbk" },
  { ticker: "MEDC", name: "Medco Energi Internasional Tbk" },
  { ticker: "ITMG", name: "Indo Tambangraya Megah Tbk" },
  { ticker: "TINS", name: "Timah Tbk" },
  { ticker: "WIKA", name: "Wijaya Karya Tbk" },
  { ticker: "PTPP", name: "PP (Persero) Tbk" },
  { ticker: "ADHI", name: "Adhi Karya (Persero) Tbk" },
  { ticker: "BSDE", name: "Bumi Serpong Damai Tbk" },
  { ticker: "CTRA", name: "Ciputra Development Tbk" },
  { ticker: "PWON", name: "Pakuwon Jati Tbk" },
  { ticker: "SMRA", name: "Summarecon Agung Tbk" },
  { ticker: "JSMR", name: "Jasa Marga (Persero) Tbk" },
  { ticker: "KAEF", name: "Kimia Farma Tbk" },
];

export function searchIdxTickers(query: string, limit = 8): IdxTicker[] {
  const q = query.trim().toUpperCase();
  if (!q) return IDX_TICKERS.slice(0, limit);
  return IDX_TICKERS.filter((t) => t.ticker.includes(q) || t.name.toUpperCase().includes(q)).slice(0, limit);
}
