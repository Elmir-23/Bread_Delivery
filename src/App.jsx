import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const SESS = [
  { id: "morning", label: "Morning", icon: "🌅", sub: "Given + collect leftovers" },
  { id: "afternoon", label: "Afternoon", icon: "☀️", sub: "Given only" },
  { id: "evening", label: "Evening", icon: "🌙", sub: "Given only" },
];
const SESS_WITH_DEBT = [
  ...SESS,
  { id: "debt", label: "Debt", icon: "💰", sub: "Collect payment" },
];
const DEF_SHOPS = ["Shahin","Murad","Alasgar","50_Gapik","Fuad","Elbrus","Ramal","Suraddin","Khila","Kolya","Nur-S"];
const DEFAULT_DB = {
  pin: "1234",
  prices: { kura: 0.55, damiryolu: 0.65 },
  deliveries: {},
  debts: {},
  debtPayments: {},
  shops: DEF_SHOPS.map(n => ({ name: n, kura: null, damiryolu: null }))
};

function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function addDays(s, n) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDate(s) { const d = new Date(s + "T00:00:00"); return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
function fmtDateShort(s) { const d = new Date(s + "T00:00:00"); return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }

const c = {
  wrap: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: "var(--text)" },
  nav: { display: "flex", borderBottom: "1px solid var(--border)", paddingTop: "env(safe-area-inset-top)" },
  navBtn: a => ({ flex: 1, padding: "10px 4px 13px", background: "none", border: "none", borderBottom: a ? "2.5px solid var(--text)" : "2.5px solid transparent", fontSize: 12, fontWeight: a ? 600 : 400, color: a ? "var(--text)" : "var(--text2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
  topbar: { display: "flex", alignItems: "center", gap: 10, padding: "14px 1rem 12px", borderBottom: "1px solid var(--border)" },
  backBtn: { background: "none", border: "1px solid var(--border2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  dateRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 1rem", background: "var(--bg2)" },
  dateBtn: (disabled) => ({ background: "none", border: "1px solid var(--border2)", borderRadius: 8, width: 30, height: 30, cursor: disabled ? "default" : "pointer", color: "var(--text)", fontSize: 16, opacity: disabled ? 0.3 : 1 }),
  pad: { padding: "1rem" },
  shopGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  shopBtn: { padding: "18px 12px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg)", color: "var(--text)", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", position: "relative" },
  sessList: { display: "flex", flexDirection: "column", gap: 8 },
  sessBtn: done => ({ padding: "14px 16px", border: done ? "1px solid var(--success-border)" : "1px solid var(--border)", borderRadius: 12, background: done ? "var(--success-bg)" : "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }),
  block: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem", marginBottom: 10 },
  blockTitle: { fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 },
  breadRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  counter: { display: "flex", alignItems: "center", gap: 8 },
  cntBtn: { width: 36, height: 36, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg2)", color: "var(--text)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  primaryBtn: { width: "100%", padding: 13, fontSize: 15, fontWeight: 600, background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 12, cursor: "pointer" },
  outlineBtn: { width: "100%", padding: 11, fontSize: 14, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 12, background: "none", color: "var(--text)", cursor: "pointer" },
  metric: { background: "var(--bg2)", borderRadius: 10, padding: "12px 14px" },
  metricGreen: { background: "var(--collected-bg)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--collected-border)" },
  listCard: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: "1rem" },
  listRow: last => ({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }),
  periodBtn: a => ({ flex: 1, padding: "7px 4px", fontSize: 12, border: "1px solid var(--border2)", borderRadius: 8, background: a ? "var(--text)" : "none", color: a ? "var(--bg)" : "var(--text2)", cursor: "pointer", borderColor: a ? "transparent" : "var(--border2)" }),
  settRow: last => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }),
  pinDot: filled => ({ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--border2)", background: filled ? "var(--text)" : "var(--bg2)" }),
  pinKey: { padding: 14, fontSize: 20, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 12, background: "var(--bg)", color: "var(--text)", cursor: "pointer", textAlign: "center" },
  ownerNavBtn: a => ({ flex: "none", padding: "7px 10px", fontSize: 11, border: "1px solid var(--border2)", borderRadius: 8, background: a ? "var(--text)" : "none", color: a ? "var(--bg)" : "var(--text2)", cursor: "pointer" }),
  tag: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "var(--success-bg)", color: "var(--success-text)", fontWeight: 600 },
};

const CSS = `
  :root {
    --bg:#fff; --bg2:#f5f5f4; --text:#1a1a1a; --text2:#6b7280;
    --border:#e5e7eb; --border2:#d1d5db;
    --success-bg:#dcfce7; --success-text:#15803d; --success-border:#86efac;
    --collected-bg:#f0fdf4; --collected-border:#bbf7d0; --collected-text:#166534;
  }
  @media(prefers-color-scheme:dark){
    :root {
      --bg:#1c1c1e; --bg2:#2c2c2e; --text:#f2f2f7; --text2:#8e8e93;
      --border:#3a3a3c; --border2:#48484a;
      --success-bg:#052e16; --success-text:#86efac; --success-border:#166534;
      --collected-bg:#052e16; --collected-border:#166534; --collected-text:#4ade80;
    }
  }
  *{box-sizing:border-box;margin:0;padding:0} body{background:var(--bg)} button,input{font-family:inherit}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  input[type=number]{-moz-appearance:textfield}
  .shop-edit-grid{display:grid;grid-template-columns:1fr 58px 58px 30px;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
  .shop-edit-grid:last-child{border-bottom:none}
  .shop-edit-grid input[type=text]{padding:7px 9px;font-size:13px;border:1px solid var(--border2);border-radius:8px;background:var(--bg);color:var(--text);width:100%}
  .shop-edit-grid input[type=number]{padding:7px 5px;font-size:13px;border:1px solid var(--border2);border-radius:8px;background:var(--bg);color:var(--text);width:100%;text-align:right}
  .shop-edit-grid button{width:30px;height:30px;border:1px solid var(--border2);border-radius:7px;background:none;cursor:pointer;color:var(--text2);display:flex;align-items:center;justify-content:center}
  .shop-edit-hdr{display:grid;grid-template-columns:1fr 58px 58px 30px;gap:6px;padding-bottom:6px;border-bottom:1px solid var(--border);margin-bottom:4px}
  .shop-edit-hdr span{font-size:10px;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .bar-label{font-size:12px;color:var(--text2);width:72px;text-align:right;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bar-track{flex:1;height:20px;background:var(--bg2);border-radius:4px;overflow:hidden}
  .bar-fill{height:100%;background:var(--text);border-radius:4px}
  .sub-metric{display:flex;justify-content:space-between;align-items:center;padding:5px 0 5px 12px;border-top:1px solid var(--border)}
  .sub-metric:first-child{border-top:1px solid var(--border);margin-top:8px}
`;

export default function App() {
  const [db_data, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("delivery");
  const [view, setView] = useState("shops");
  const [selShop, setSelShop] = useState(null);
  const [selSess, setSelSess] = useState(null);
  const [entryVals, setEntryVals] = useState({});
  const [collectedInput, setCollectedInput] = useState("");
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const [ownerTab, setOwnerTab] = useState("dashboard");
  const [pinBuf, setPinBuf] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [dashPeriod, setDashPeriod] = useState("day");
  const [repPeriod, setRepPeriod] = useState("day");
  const [editDate, setEditDate] = useState(todayStr());
  const [editView, setEditView] = useState("date-shops");
  const [editSelShop, setEditSelShop] = useState(null);
  const [editSelSess, setEditSelSess] = useState(null);
  const [editEntryVals, setEditEntryVals] = useState({});
  const [toast, setToast] = useState("");
  const [shopEdits, setShopEdits] = useState([]);
  const [newShopName, setNewShopName] = useState("");
  const [settPrices, setSettPrices] = useState({ kura: "", damiryolu: "" });
  const [pinOld, setPinOld] = useState("");
  const [pinNew, setPinNew] = useState("");

  useEffect(() => {
    const ref = doc(db, "app", "data");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setDbData(snap.data());
      } else {
        setDoc(ref, DEFAULT_DB);
        setDbData(DEFAULT_DB);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const upd = async (newData) => {
    setDbData(newData);
    await setDoc(doc(db, "app", "data"), newData);
  };

  const toast$ = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const shopKura = (i) => db_data?.shops[i]?.kura ?? db_data?.prices?.kura ?? 1.5;
  const shopRail = (i) => db_data?.shops[i]?.damiryolu ?? db_data?.prices?.damiryolu ?? 0.65;
  const TODAY = todayStr();

  const triggerArchiveIfMonday = async (data) => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    if (!isMonday) return;
    const lastArchive = localStorage.getItem("lastArchiveDate");
    const todayKey = todayStr();
    if (lastArchive === todayKey) return;
    try {
      const res = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveries: data.deliveries || {},
          debtPayments: data.debtPayments || {},
          debts: data.debts || {},
          shops: data.shops || [],
          prices: data.prices || {},
        }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem("lastArchiveDate", todayKey);
        toast$("📦 Weekly archive saved to Drive ✓");
      }
    } catch (e) {
      console.error("Archive failed:", e);
    }
  };

  useEffect(() => {
    if (pinBuf.length < 4) return;
    if (pinBuf === db_data?.pin) {
      setOwnerUnlocked(true); setPinBuf(""); setPinErr("");
      setShopEdits(db_data.shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
      setSettPrices({ kura: String(db_data.prices.kura), damiryolu: String(db_data.prices.damiryolu) });
      triggerArchiveIfMonday(db_data);
    } else {
      setPinErr("Wrong PIN. Try again.");
      setTimeout(() => { setPinBuf(""); setPinErr(""); }, 900);
    }
  }, [pinBuf]);

  const pinKey = (k) => {
    if (k === "clr") { setPinBuf(""); setPinErr(""); return; }
    if (k === "del") { setPinBuf(p => p.slice(0, -1)); return; }
    if (pinBuf.length >= 4) return;
    setPinBuf(p => p + k);
  };

  const openDeliveryEntry = (shopIdx, sessId) => {
    setSelShop(shopIdx); setSelSess(sessId);
    const ex = db_data?.deliveries?.[TODAY]?.[shopIdx]?.[sessId] || {};
    setEntryVals({ given: { kura: ex.given?.kura || 0, damiryolu: ex.given?.damiryolu || 0 }, leftover: { kura: ex.leftover?.kura || 0, damiryolu: ex.leftover?.damiryolu || 0 } });
    setView("entry");
  };

  const adjDelivery = (g, t, d) => setEntryVals(prev => ({ ...prev, [g]: { ...prev[g], [t]: Math.max(0, (prev[g]?.[t] || 0) + d) } }));

  const saveDeliveryEntry = async () => {
    const nd = { ...db_data, deliveries: { ...db_data.deliveries, [TODAY]: { ...(db_data.deliveries?.[TODAY] || {}), [selShop]: { ...(db_data.deliveries?.[TODAY]?.[selShop] || {}) } } } };
    const obj = { given: { ...entryVals.given } };
    if (selSess === "morning") obj.leftover = { ...entryVals.leftover };

    const prev = nd.deliveries[TODAY][selShop][selSess];
    const prevVal = prev ? (prev.given?.kura || 0) * shopKura(selShop) + (prev.given?.damiryolu || 0) * shopRail(selShop) : 0;
    const newVal = (entryVals.given?.kura || 0) * shopKura(selShop) + (entryVals.given?.damiryolu || 0) * shopRail(selShop);
    nd.deliveries[TODAY][selShop][selSess] = obj;
    const debts = { ...(nd.debts || {}) };
    debts[selShop] = (debts[selShop] || 0) - prevVal + newVal;
    nd.debts = debts;

    await upd(nd); toast$("Saved ✓"); setTimeout(() => setView("session"), 300);
  };

  const saveDebtCollection = async () => {
    const collected = parseFloat(collectedInput) || 0;
    if (collected <= 0) { toast$("Enter an amount"); return; }

    // Update running debt balance
    const debts = { ...(db_data.debts || {}) };
    debts[selShop] = (debts[selShop] || 0) - collected;

    // Record the payment with date for period-based reporting
    const debtPayments = { ...(db_data.debtPayments || {}) };
    if (!debtPayments[TODAY]) debtPayments[TODAY] = {};
    debtPayments[TODAY][selShop] = (debtPayments[TODAY][selShop] || 0) + collected;

    await upd({ ...db_data, debts, debtPayments });
    setCollectedInput("");
    toast$("Debt updated ✓");
    setTimeout(() => setView("session"), 300);
  };

  const openEditEntry = (shopIdx, sessId) => {
    setEditSelShop(shopIdx); setEditSelSess(sessId);
    const ex = db_data?.deliveries?.[editDate]?.[shopIdx]?.[sessId] || {};
    setEditEntryVals({ given: { kura: ex.given?.kura || 0, damiryolu: ex.given?.damiryolu || 0 }, leftover: { kura: ex.leftover?.kura || 0, damiryolu: ex.leftover?.damiryolu || 0 } });
    setEditView("date-entry");
  };

  const adjEdit = (g, t, d) => setEditEntryVals(prev => ({ ...prev, [g]: { ...prev[g], [t]: Math.max(0, (prev[g]?.[t] || 0) + d) } }));

  const saveEditEntry = async () => {
    const nd = { ...db_data, deliveries: { ...db_data.deliveries, [editDate]: { ...(db_data.deliveries?.[editDate] || {}), [editSelShop]: { ...(db_data.deliveries?.[editDate]?.[editSelShop] || {}) } } } };
    const obj = { given: { ...editEntryVals.given } };
    if (editSelSess === "morning") obj.leftover = { ...editEntryVals.leftover };
    nd.deliveries[editDate][editSelShop][editSelSess] = obj;
    await upd(nd); toast$("Saved ✓"); setTimeout(() => setEditView("date-session"), 300);
  };

  // ── calcStats: returns delivery stats + collected money for the period ──
  const calcStats = (period) => {
    if (!db_data) return { totGK: 0, totGR: 0, totLK: 0, totLR: 0, totRev: 0, totCollected: 0, ss: {} };
    const t = todayStr(); let s = t;
    if (period === "week") s = addDays(t, -6);
    if (period === "month") s = addDays(t, -29);
    let totGK = 0, totGR = 0, totLK = 0, totLR = 0, totRev = 0, totCollected = 0;
    const ss = {};
    db_data.shops.forEach((_, i) => ss[i] = { kura: 0, damiryolu: 0, leftK: 0, leftR: 0, rev: 0 });

    // Delivery stats
    Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.damiryolu || 0;
          const rev = k * shopKura(i) + r * shopRail(i);
          if (!ss[i]) ss[i] = { kura: 0, damiryolu: 0, leftK: 0, leftR: 0, rev: 0 };
          ss[i].kura += k; ss[i].damiryolu += r; ss[i].rev += rev;
          totGK += k; totGR += r; totRev += rev;
          if (sv.id === "morning") {
            const lk = d.leftover?.kura || 0, lr = d.leftover?.damiryolu || 0;
            ss[i].leftK += lk; ss[i].leftR += lr; totLK += lk; totLR += lr;
          }
        });
      });
    });

    // Collected money for the period
    Object.entries(db_data.debtPayments || {}).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.values(shops).forEach(amount => { totCollected += amount; });
    });

    return { totGK, totGR, totLK, totLR, totRev, totCollected, ss };
  };

  // ── CSV Export with Debt + Collected Money columns ──
  const exportCSV = () => {
    const t = todayStr(); let s = t;
    if (repPeriod === "week") s = addDays(t, -6);
    if (repPeriod === "month") s = addDays(t, -29);

    // Build initial debt balance per shop at the START of the period
    // = current debt minus all deliveries in period + all collections in period
    const runningDebt = {};
    db_data.shops.forEach((_, i) => { runningDebt[i] = db_data.debts?.[i] || 0; });

    // Subtract deliveries that happened IN the period (to get balance before period)
    Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.damiryolu || 0;
          runningDebt[i] -= k * shopKura(i) + r * shopRail(i);
        });
      });
    });

    // Add back collections that happened IN the period
    Object.entries(db_data.debtPayments || {}).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.entries(shops).forEach(([idx, amount]) => {
        runningDebt[parseInt(idx)] += amount;
      });
    });

    // Now runningDebt[i] = balance at start of period. Build CSV row by row.
    let csv = "Date,Shop,Session,Kura Given,Damiryolu Given,Kura Price,Damiryolu Price,Revenue,Leftover Kura,Leftover Damiryolu,Debt,Collected Money\n";

    // Group deliveries by date then shop for ordering
    const sortedDates = Object.keys(db_data.deliveries || {}).filter(d => d >= s && d <= t).sort();

    sortedDates.forEach(date => {
      const shops = db_data.deliveries[date];
      // Get collected payments for this date per shop
      const dayPayments = db_data.debtPayments?.[date] || {};

      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        const shop = db_data.shops[i]?.name || ("Shop " + idx);

        // Find which sessions have data, to know which is the last
        const sessWithData = SESS.filter(sv => {
          const d = sess[sv.id];
          return d && (d.given?.kura > 0 || d.given?.damiryolu > 0);
        });
        const lastSessId = sessWithData.length ? sessWithData[sessWithData.length - 1].id : null;
        const collectedToday = dayPayments[i] || dayPayments[String(i)] || 0;

        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.damiryolu || 0; if (!k && !r) return;
          const lk = d.leftover?.kura || 0, lr = d.leftover?.damiryolu || 0;
          const rev = k * shopKura(i) + r * shopRail(i);

          // Advance running debt: add this delivery's revenue
          runningDebt[i] += rev;

          // Collected money: only on last session row for this shop/day
          const isLastSess = sv.id === lastSessId;
          let collected = 0;
          if (isLastSess && collectedToday > 0) {
            collected = collectedToday;
            runningDebt[i] -= collected;
          }

          const debtAfter = runningDebt[i];
          csv += `${date},${shop},${sv.label},${k},${r},${shopKura(i).toFixed(2)},${shopRail(i).toFixed(2)},${rev.toFixed(2)},${lk},${lr},${debtAfter.toFixed(2)},${collected > 0 ? collected.toFixed(2) : ""}\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `bread-delivery-${repPeriod}.csv`; a.click();
    toast$("Downloading CSV…");
  };

  const saveShops = async () => {
    const shops = shopEdits.map(s => ({ name: s.name.trim() || s.name, kura: s.kuraStr !== "" ? parseFloat(s.kuraStr) : null, damiryolu: s.railStr !== "" ? parseFloat(s.railStr) : null }));
    await upd({ ...db_data, shops }); toast$("Shops saved ✓");
  };
  const addShop = () => {
    if (!newShopName.trim()) return;
    const shops = [...db_data.shops, { name: newShopName.trim(), kura: null, damiryolu: null }];
    setShopEdits(shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
    setNewShopName("");
    upd({ ...db_data, shops });
  };
  const removeShop = (i) => {
    if (db_data.shops.length <= 1) return;
    const shops = db_data.shops.filter((_, x) => x !== i);
    setShopEdits(shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
    upd({ ...db_data, shops });
  };
  const savePrices = async () => { await upd({ ...db_data, prices: { kura: parseFloat(settPrices.kura) || 0, damiryolu: parseFloat(settPrices.damiryolu) || 0 } }); toast$("Prices saved ✓"); };
  const changePin = async () => {
    if (pinOld !== db_data.pin) { toast$("Wrong current PIN"); return; }
    if (pinNew.length !== 4 || !/^\d+$/.test(pinNew)) { toast$("PIN must be 4 digits"); return; }
    await upd({ ...db_data, pin: pinNew }); toast$("PIN changed ✓"); setPinOld(""); setPinNew("");
  };

  const { totGK, totGR, totLK, totLR, totRev, totCollected, ss } = calcStats(dashPeriod);
  const repStats = calcStats(repPeriod);

  if (loading) return (
    <div style={{ ...c.wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 14 }}>Loading…</div>
    </div>
  );

  const renderShopsScreen = () => (
    <div style={c.pad}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>{fmtDate(TODAY)}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Select shop</div>
      <div style={c.shopGrid}>
        {db_data.shops.map((s, i) => {
          const sd = db_data.deliveries?.[TODAY]?.[i] || {};
          const done = SESS.every(x => sd[x.id] && (sd[x.id].given?.kura || sd[x.id].given?.damiryolu));
          const debt = db_data.debts?.[i] || 0;
          return (
            <button key={i} style={c.shopBtn} onClick={() => { setSelShop(i); setView("session"); }}>
              {s.name}
              {done && <span style={{ ...c.tag, position: "absolute", top: 8, right: 8 }}>✓</span>}
              {debt > 0 && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>{debt.toFixed(2)} ₼ debt</div>}
              {debt < 0 && <div style={{ fontSize: 10, color: "var(--success-text)", marginTop: 4, fontWeight: 600 }}>{Math.abs(debt).toFixed(2)} ₼ credit</div>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSessionScreen = () => {
    const sd = db_data.deliveries?.[TODAY]?.[selShop] || {};
    const debt = db_data.debts?.[selShop] || 0;
    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={() => setView("shops")}>‹</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[selShop]?.name}</div>
            <div style={{ fontSize: 12, color: debt > 0 ? "#dc2626" : debt < 0 ? "var(--success-text)" : "var(--text2)" }}>
              {debt > 0 ? `Debt: ${debt.toFixed(2)} ₼` : debt < 0 ? `Credit: ${Math.abs(debt).toFixed(2)} ₼` : fmtDateShort(TODAY)}
            </div>
          </div>
        </div>
        <div style={c.pad}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Choose session</div>
          <div style={c.sessList}>
            {SESS_WITH_DEBT.map(s => {
              if (s.id === "debt") {
                const isCredit = debt < 0;
                return (
                  <button key="debt" style={{ ...c.sessBtn(false), borderColor: debt !== 0 ? (isCredit ? "var(--success-border)" : "#fca5a5") : "var(--border)" }} onClick={() => { setCollectedInput(""); setView("debt"); }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: isCredit ? "var(--success-text)" : debt > 0 ? "#dc2626" : "var(--text)" }}>💰 Debt</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                        {debt === 0 ? "No debt" : isCredit ? `Credit: ${Math.abs(debt).toFixed(2)} ₼` : `Owes: ${debt.toFixed(2)} ₼`}
                      </div>
                    </div>
                    <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                  </button>
                );
              }
              const d = sd[s.id] || {};
              const has = d.given && (d.given.kura > 0 || d.given.damiryolu > 0);
              let sub = s.sub;
              if (has) { sub = `Given: K ${d.given.kura} · R ${d.given.damiryolu}`; if (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.damiryolu > 0)) sub += ` | Left: K${d.leftover.kura} R${d.leftover.damiryolu}`; }
              return (
                <button key={s.id} style={c.sessBtn(has)} onClick={() => openDeliveryEntry(selShop, s.id)}>
                  <div><div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div><div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div></div>
                  <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDebtScreen = () => {
    const currentDebt = db_data.debts?.[selShop] || 0;
    const isCredit = currentDebt < 0;
    const newBalance = currentDebt - (parseFloat(collectedInput) || 0);
    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={() => setView("session")}>‹</button>
          <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[selShop]?.name} — Debt</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(TODAY)}</div></div>
        </div>
        <div style={c.pad}>
          <div style={{ ...c.block, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{isCredit ? "Credit (overpaid)" : "Current debt"}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: isCredit ? "var(--success-text)" : currentDebt > 0 ? "#dc2626" : "var(--text)" }}>
              {Math.abs(currentDebt).toFixed(2)} ₼
            </div>
          </div>
          <div style={c.block}>
            <div style={c.blockTitle}>Amount collected now</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number" min={0} step={0.01}
                value={collectedInput}
                onChange={e => setCollectedInput(e.target.value)}
                placeholder="0.00"
                style={{ flex: 1, padding: "10px 12px", fontSize: 20, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }}
              />
              <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
            </div>
            {collectedInput !== "" && (
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 8, textAlign: "right" }}>
                New balance: <strong style={{ color: newBalance < 0 ? "var(--success-text)" : newBalance > 0 ? "#dc2626" : "var(--text)" }}>
                  {newBalance.toFixed(2)} ₼
                </strong>
              </div>
            )}
          </div>
          <button style={c.primaryBtn} onClick={saveDebtCollection}>Save</button>
        </div>
      </div>
    );
  };

  const renderEntryForm = (vals, adjFn, saveFn, backFn, shopIdx, sessId, date) => {
    const s = SESS.find(x => x.id === sessId);
    const isMorn = sessId === "morning";
    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={backFn}>‹</button>
          <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[shopIdx]?.name} — {s?.label}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(date)}</div></div>
        </div>
        <div style={c.pad}>
          <div style={c.block}>
            <div style={c.blockTitle}>Given to shop</div>
            {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([t,lbl]) => (
              <div key={t} style={{ ...c.breadRow, marginBottom: t === "damiryolu" ? 0 : 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
                <div style={c.counter}>
                  <button style={c.cntBtn} onClick={() => adjFn("given", t, -1)}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 600, minWidth: 36, textAlign: "center" }}>{vals.given?.[t] || 0}</span>
                  <button style={c.cntBtn} onClick={() => adjFn("given", t, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          {isMorn && (
            <div style={c.block}>
              <div style={c.blockTitle}>Leftover collected (taken back)</div>
              {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([t,lbl]) => (
                <div key={t} style={{ ...c.breadRow, marginBottom: t === "damiryolu" ? 0 : 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
                  <div style={c.counter}>
                    <button style={c.cntBtn} onClick={() => adjFn("leftover", t, -1)}>−</button>
                    <span style={{ fontSize: 18, fontWeight: 600, minWidth: 36, textAlign: "center" }}>{vals.leftover?.[t] || 0}</span>
                    <button style={c.cntBtn} onClick={() => adjFn("leftover", t, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button style={c.primaryBtn} onClick={saveFn}>Save</button>
        </div>
      </div>
    );
  };

  const renderEditSection = () => {
    const isEditToday = editDate === todayStr();
    if (editView === "date-shops") {
      const sd = db_data.deliveries?.[editDate] || {};
      return (
        <div style={c.pad}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Edit deliveries by date</div>
          <div style={c.dateRow}>
            <button style={c.dateBtn(false)} onClick={() => setEditDate(d => addDays(d, -1))}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{isEditToday ? "Today — " : ""}{fmtDateShort(editDate)}</span>
            <button style={c.dateBtn(isEditToday)} onClick={() => { if (!isEditToday) setEditDate(d => addDays(d, 1)); }}>›</button>
          </div>
          <div style={{ ...c.shopGrid, marginTop: 12 }}>
            {db_data.shops.map((s, i) => {
              const done = SESS.every(x => sd[i]?.[x.id] && (sd[i][x.id].given?.kura || sd[i][x.id].given?.damiryolu));
              return (
                <button key={i} style={c.shopBtn} onClick={() => { setEditSelShop(i); setEditView("date-session"); }}>
                  {s.name}
                  {done && <span style={{ ...c.tag, position: "absolute", top: 8, right: 8 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    if (editView === "date-session") {
      const sd = db_data.deliveries?.[editDate]?.[editSelShop] || {};
      return (
        <div>
          <div style={c.topbar}>
            <button style={c.backBtn} onClick={() => setEditView("date-shops")}>‹</button>
            <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[editSelShop]?.name}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(editDate)}</div></div>
          </div>
          <div style={c.pad}>
            <div style={c.sessList}>
              {SESS.map(s => {
                const d = sd[s.id] || {};
                const has = d.given && (d.given.kura > 0 || d.given.damiryolu > 0);
                let sub = s.sub;
                if (has) { sub = `Given: K ${d.given.kura} · R ${d.given.damiryolu}`; if (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.damiryolu > 0)) sub += ` | Left: K${d.leftover.kura} R${d.leftover.damiryolu}`; }
                return (
                  <button key={s.id} style={c.sessBtn(has)} onClick={() => openEditEntry(editSelShop, s.id)}>
                    <div><div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div><div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div></div>
                    <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    if (editView === "date-entry") {
      return renderEntryForm(editEntryVals, adjEdit, saveEditEntry, () => setEditView("date-session"), editSelShop, editSelSess, editDate);
    }
  };

  // ── Dashboard ──
  const renderDashboard = () => {
    const totalDebt = Object.values(db_data.debts || {}).reduce((a, b) => a + b, 0);
    const revs = db_data.shops.map((s, i) => ({ name: s.name, rev: ss[i]?.rev || 0 })).filter(x => x.rev > 0).sort((a, b) => b.rev - a.rev);
    const maxR = revs.length ? revs[0].rev : 1;

    return (
      <div style={c.pad}>
        {/* Period selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
          {[["day","Today"],["week","7 days"],["month","30 days"]].map(([p,l]) => (
            <button key={p} style={c.periodBtn(dashPeriod===p)} onClick={() => setDashPeriod(p)}>{l}</button>
          ))}
        </div>

        {/* Revenue — full width */}
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totRev.toFixed(2)} ₼</div>
        </div>

        {/* Total Given with Kura / Damiryolu sub-rows */}
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>Total given</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{totGK + totGR}</div>
          </div>
          <div className="sub-metric">
            <span style={{ fontSize: 12, color: "var(--text2)" }}>Kura</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{totGK}</span>
          </div>
          <div className="sub-metric">
            <span style={{ fontSize: 12, color: "var(--text2)" }}>Damiryolu</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{totGR}</span>
          </div>
        </div>

        {/* Total Leftovers */}
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Total leftovers back</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{totLK + totLR}</div>
        </div>

        {/* Total Debt */}
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Total debt</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: totalDebt > 0 ? "#dc2626" : totalDebt < 0 ? "var(--success-text)" : "var(--text)" }}>
            {totalDebt.toFixed(2)} ₼
          </div>
        </div>

        {/* Total Collected — greenish */}
        <div style={{ ...c.metricGreen, marginBottom: "1rem" }}>
          <div style={{ fontSize: 11, color: "var(--collected-text)", marginBottom: 3, fontWeight: 600 }}>Total collected</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--collected-text)" }}>
            {totCollected.toFixed(2)} ₼
          </div>
        </div>

        {/* Debt by shop */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Debt by shop</div>
        <div style={c.listCard}>
          {(() => {
            const rows = db_data.shops.map((s, i) => ({ s, i, debt: db_data.debts?.[i] || 0 })).filter(x => x.debt !== 0);
            if (!rows.length) return <div style={{ padding: "1.5rem", textAlign: "center", fontSize: 13, color: "var(--text2)" }}>No outstanding debts.</div>;
            return rows.map(({ s, i, debt }, ri) => (
              <div key={i} style={c.listRow(ri === rows.length - 1)}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: debt < 0 ? "var(--success-text)" : "#dc2626" }}>
                  {debt < 0 ? `Credit: ${Math.abs(debt).toFixed(2)} ₼` : `${debt.toFixed(2)} ₼`}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Revenue by shop */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Revenue by shop</div>
        {revs.length ? revs.map(x => (
          <div key={x.name} className="bar-row">
            <span className="bar-label">{x.name}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(x.rev / maxR * 100)}%` }}></div></div>
            <span style={{ fontSize: 12, fontWeight: 500, minWidth: 40 }}>{x.rev.toFixed(1)}₼</span>
          </div>
        )) : <div style={{ textAlign: "center", padding: "1.5rem", fontSize: 13, color: "var(--text2)" }}>No data yet.</div>}
      </div>
    );
  };

  const renderReports = () => {
    const { ss: rss } = repStats;
    const t = todayStr(); let s = t;
    if (repPeriod === "week") s = addDays(t, -6);
    if (repPeriod === "month") s = addDays(t, -29);
    const dateRows = [];
    Object.entries(db_data?.deliveries || {}).sort().reverse().forEach(([date, shops]) => {
      if (date < s || date > t) return;
      let dGK = 0, dGR = 0, dLK = 0, dLR = 0, dRev = 0;
      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.damiryolu || 0;
          dGK += k; dGR += r; dRev += k * shopKura(i) + r * shopRail(i);
          if (sv.id === "morning") { dLK += d.leftover?.kura || 0; dLR += d.leftover?.damiryolu || 0; }
        });
      });
      if (dGK || dGR) dateRows.push({ date, dGK, dGR, dLK, dLR, dRev });
    });
    return (
      <div style={c.pad}>
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
          {[["day","Today"],["week","7 days"],["month","30 days"]].map(([p,l]) => <button key={p} style={c.periodBtn(repPeriod===p)} onClick={() => setRepPeriod(p)}>{l}</button>)}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>By date</div>
        <div style={c.listCard}>
          {dateRows.length ? dateRows.map((row, i) => (
            <div key={row.date} style={c.listRow(i === dateRows.length - 1)}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(row.date)}</div><div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>K: {row.dGK} · R: {row.dGR} · Left: {row.dLK + row.dLR}</div></div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{row.dRev.toFixed(2)} ₼</div>
            </div>
          )) : <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: 13, color: "var(--text2)" }}>No data for this period.</div>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>By shop</div>
        <div style={c.listCard}>
          {db_data.shops.filter((_, i) => rss[i] && (rss[i].kura || rss[i].damiryolu)).length
            ? db_data.shops.map((shop, i) => { const v = rss[i]; if (!v || (!v.kura && !v.damiryolu)) return null; return (<div key={i} style={c.listRow(i === db_data.shops.length - 1)}><div><div style={{ fontSize: 14, fontWeight: 600 }}>{shop.name}</div><div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>K: {v.kura} · R: {v.damiryolu} · Left: {v.leftK + v.leftR}</div></div><div style={{ fontSize: 14, fontWeight: 600 }}>{v.rev.toFixed(2)} ₼</div></div>); })
            : <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: 13, color: "var(--text2)" }}>No data for this period.</div>}
        </div>
        <button style={c.outlineBtn} onClick={exportCSV}>⬇ Export to CSV / Excel</button>
      </div>
    );
  };

  const renderShopsMgr = () => (
    <div style={c.pad}>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Leave price blank to use default.</div>
      <div style={c.listCard}>
        <div style={{ padding: "8px 14px" }}>
          <div className="shop-edit-hdr"><span>Name</span><span style={{ textAlign: "right" }}>Kura ₼</span><span style={{ textAlign: "right" }}>Rail ₼</span><span></span></div>
          {shopEdits.map((s, i) => (
            <div key={i} className="shop-edit-grid">
              <input type="text" value={s.name} onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <input type="number" value={s.kuraStr} placeholder={db_data.prices.kura.toFixed(2)} min="0" step="0.01" onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, kuraStr: e.target.value } : x))} />
              <input type="number" value={s.railStr} placeholder={db_data.prices.damiryolu.toFixed(2)} min="0" step="0.01" onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, railStr: e.target.value } : x))} />
              <button onClick={() => removeShop(i)}>🗑</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={newShopName} onChange={e => setNewShopName(e.target.value)} onKeyDown={e => e.key === "Enter" && addShop()} placeholder="New shop name…" style={{ flex: 1, padding: "9px 12px", fontSize: 14, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }} />
        <button onClick={addShop} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}>+ Add</button>
      </div>
      <button style={c.primaryBtn} onClick={saveShops}>Save all shops</button>
    </div>
  );

  const renderSettings = () => (
    <div style={c.pad}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Default bread prices</div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Applied to shops without a custom price.</div>
      <div style={c.listCard}>
        {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([k,lbl],i) => (
          <div key={k} style={c.settRow(i===1)}>
            <div><div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div><div style={{ fontSize: 11, color: "var(--text2)" }}>default per loaf</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <input type="number" min={0} step={0.01} value={settPrices[k]} onChange={e => setSettPrices(p => ({ ...p, [k]: e.target.value }))} style={{ width: 68, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
              <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
            </div>
          </div>
        ))}
      </div>
      <button style={{ ...c.primaryBtn, marginBottom: "1.25rem" }} onClick={savePrices}>Save default prices</button>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Change PIN</div>
      <div style={c.listCard}>
        {[["Current PIN", pinOld, setPinOld],["New PIN", pinNew, setPinNew]].map(([lbl,val,setter],i) => (
          <div key={lbl} style={c.settRow(i===1)}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div>
            <input type="password" maxLength={4} value={val} onChange={e => setter(e.target.value)} style={{ width: 80, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
          </div>
        ))}
      </div>
      <button style={c.outlineBtn} onClick={changePin}>Change PIN</button>
    </div>
  );

  const ownerTabs = [["dashboard","Dashboard"],["reports","Reports"],["edit","Edit dates"],["shops-mgr","Shops"],["settings","Settings"]];

  return (
    <div style={c.wrap}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" />
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "10px 22px", borderRadius: 30, fontSize: 14, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}
      <div style={c.nav}>
        {[["delivery","🚚","Delivery"],["owner","🔐","Owner"]].map(([key,icon,lbl]) => (
          <button key={key} style={c.navBtn(tab===key)} onClick={() => { setTab(key); if (key==="delivery") setView("shops"); }}>
            <span style={{ fontSize: 18 }}>{icon}</span>{lbl}
          </button>
        ))}
      </div>
      {tab === "delivery" && (
        <>
          {view === "shops" && renderShopsScreen()}
          {view === "session" && renderSessionScreen()}
          {view === "entry" && renderEntryForm(entryVals, adjDelivery, saveDeliveryEntry, () => setView("session"), selShop, selSess, TODAY)}
          {view === "debt" && renderDebtScreen()}
        </>
      )}
      {tab === "owner" && (
        <>
          {!ownerUnlocked && (
            <div style={{ minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "2rem" }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>Owner access</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Enter your PIN</div>
              <div style={{ display: "flex", gap: 12, margin: "4px 0" }}>{[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < pinBuf.length)}></div>)}</div>
              <div style={{ color: "#dc2626", fontSize: 13, minHeight: 18 }}>{pinErr}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: 220 }}>
                {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
                  <button key={k} style={c.pinKey} onClick={() => pinKey(k)}>{k==="clr"?"CLR":k==="del"?"⌫":k}</button>
                ))}
              </div>
            </div>
          )}
          {ownerUnlocked && (
            <div>
              <div style={{ padding: "1rem 1rem 0" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: "1rem", flexWrap: "wrap" }}>
                  {ownerTabs.map(([k,l]) => <button key={k} style={c.ownerNavBtn(ownerTab===k)} onClick={() => { setOwnerTab(k); if (k==="edit") setEditView("date-shops"); }}>{l}</button>)}
                </div>
              </div>
              {ownerTab === "dashboard" && renderDashboard()}
              {ownerTab === "reports" && renderReports()}
              {ownerTab === "edit" && renderEditSection()}
              {ownerTab === "shops-mgr" && renderShopsMgr()}
              {ownerTab === "settings" && renderSettings()}
              <div style={{ padding: "0 1rem 1.5rem" }}>
                <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setOwnerUnlocked(false); setPinBuf(""); }}>🔒 Lock</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
