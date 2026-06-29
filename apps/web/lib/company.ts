// ─────────────────────────────────────────────────────────────
// TEK KAYNAK — Şirket / yasal / iletişim bilgileri.
// [DOLDUR] alanlarını GERÇEK bilgilerle değiştir; tüm yasal sayfalar
// (KVKK, koşullar, mesafeli satış) ve iletişim sayfası buradan beslenir.
// Hukuk onayı ayrıca gereklidir.
// ─────────────────────────────────────────────────────────────
export const COMPANY = {
  brand: "Luca",
  legalName: "[DOLDUR — Tam Şirket Ünvanı]", // ör. "Luca Eğlence ve Organizasyon A.Ş."
  address: "[DOLDUR — Açık adres]",
  city: "İstanbul",
  mersis: "[DOLDUR — MERSIS No]",
  taxOffice: "[DOLDUR — Vergi Dairesi]",
  taxNo: "[DOLDUR — Vergi No]",

  email: "destek@lucaclub.com.tr",
  kvkkEmail: "kvkk@lucaclub.com.tr",
  phone: "[DOLDUR — Telefon]",

  instagram: "@luca.club.tr",
  instagramUrl: "https://instagram.com/luca.club.tr",
  youtubeUrl: "https://music.youtube.com/channel/UC212vA0OA6FuaEGJaAVpvJw",
  website: "https://luca.club",
} as const;

/** Mesafeli satışta tek satır satıcı künyesi. */
export const COMPANY_SELLER_LINE = `${COMPANY.legalName}, ${COMPANY.address}, MERSIS: ${COMPANY.mersis}, Vergi Dairesi/No: ${COMPANY.taxOffice} / ${COMPANY.taxNo}, E-posta: ${COMPANY.email}`;
