export const SESS = [
  { id: "morning", label: "Səhər", icon: "🌅", sub: "Verilən + qalıq geri alındı" },
  { id: "afternoon", label: "Günorta", icon: "☀️", sub: "Yalnız verilən" },
  { id: "evening", label: "Axşam", icon: "🌙", sub: "Yalnız verilən" },
];

export const SESS_WITH_DEBT = [
  ...SESS,
  { id: "debt", label: "Borc", icon: "💰", sub: "Ödəniş yığ" },
];

export const EXP_CATS = [
  { id: "benzin", label: "Benzin", icon: "⛽" },
  { id: "moyka", label: "Moyka", icon: "🚿" },
  { id: "baxim", label: "Baxım xərcləri", icon: "🔧" },
  { id: "diger", label: "Digər", icon: "📝" },
];

export const DEF_SHOPS = [
  "Rza","Murad","Alasgar","50_Gapik","Fuad","Elbrus",
  "Ramal","Suraddin","Khila","Kolya","Nur-S","Xila",
  "Shaig","Kafe","Selimxan"
];

export const DEFAULT_DB = {
  pin: "1234",
  prices: { kura: 0.55, damiryolu: 0.65 },
  deliveries: {},
  debts: {},
  debtPayments: {},
  expenses: {},
  shops: DEF_SHOPS.map(n => ({ name: n, kura: null, damiryolu: null }))
};
