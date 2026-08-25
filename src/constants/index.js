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
  { id: "moyka", label: "Avtoyuma", icon: "🚿" },
  { id: "baxim", label: "Baxım xərcləri", icon: "🔧" },
  { id: "maas",    label: "Günlük maaş",      icon: "💵" },
  { id: "diger", label: "Digər", icon: "📝" },
];

export const DEF_SHOPS = [
  { name: "İbrahim",     kura: 0.55, damiryolu: 0.60 },
  { name: "Rza",         kura: 0.55, damiryolu: 0.60 },
  { name: "Ələsgər",     kura: 0.55, damiryolu: 0.55 },
  { name: "Murad",       kura: 0.55, damiryolu: 0.55 },
  { name: "Nur-S",       kura: 0.55, damiryolu: 0.55 },
  { name: "Fuad",        kura: 0.55, damiryolu: 0.60 },
  { name: "Şaiq",        kura: 0.55, damiryolu: 0.60 },
  { name: "Sürəddin",    kura: 0.55, damiryolu: 0.55 },
  { name: "Ramal",       kura: 0.55, damiryolu: 0.60 },
  { name: "Araz-Elbrus", kura: 0.50, damiryolu: 0.55 },
  { name: "Xilə",        kura: 0.55, damiryolu: 0.60 },
  { name: "50-Qəpik",    kura: 0.55, damiryolu: 0.55 },
  { name: "Kolya",       kura: 0.55, damiryolu: 0.60 },
  { name: "Kafe",        kura: 0.60, damiryolu: 0.60 },
  { name: "Seli",        kura: 0.00, damiryolu: 0.00 },
];

export const DEFAULT_DB = {
  pin: "1234",
  prices: { kura: 0.55, damiryolu: 0.60 },
  deliveries: {},
  debts: {},
  debtPayments: {},
  expenses: {},
  handovers: {},
  kassaBalance: 0,
  kassaAdjustment: 0,
  dayStart: null, // { date, balance } — son təsdiqlənmiş təhvildə dondurulan "günə başlanan qalıq"
  shops: DEF_SHOPS.map(n => ({ name: n.name, kura: n.kura, damiryolu: n.damiryolu }))
};
