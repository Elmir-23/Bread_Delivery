import { useState, useEffect } from "react";
import { SESS, SESS_WITH_DEBT, EXP_CATS, DEFAULT_DB } from "./constants";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { todayStr, addDays, fmtDate, fmtDateShort } from "./utils/dates";
import { c } from "./styles/styles";
import { CSS } from "./styles/global";





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
  const [archives, setArchives] = useState([]);
  const [resetPinBuf, setResetPinBuf] = useState("");
  const [resetPinErr, setResetPinErr] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [editCollected, setEditCollected] = useState({});
  const [expView, setExpView] = useState("list");
  const [expVals, setExpVals] = useState({ benzin: "", moyka: "", baxim: "", diger: "", digerDesc: "" });
  const [editDebtShop, setEditDebtShop] = useState(null);
  const [editDebtVal, setEditDebtVal] = useState("");
  const [confirmDeleteShop, setConfirmDeleteShop] = useState(null);

  useEffect(() => {
    const ref = doc(db, "app", "data");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) { setDbData(snap.data()); }
      else { setDoc(ref, DEFAULT_DB); setDbData(DEFAULT_DB); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const upd = async (newData) => { setDbData(newData); await setDoc(doc(db, "app", "data"), newData); };
  const toast$ = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const shopKura = (i) => db_data?.shops[i]?.kura ?? db_data?.prices?.kura ?? 1.5;
  const shopRail = (i) => db_data?.shops[i]?.damiryolu ?? db_data?.prices?.damiryolu ?? 0.65;
  const TODAY = todayStr();




    Object.entries(debtPayments || {}).forEach(([, shopData]) => {
      Object.entries(shopData).forEach(([idx, amount]) => { runningDebt[parseInt(idx)] += amount; });
    });
    let csv = "Date,Shop,Session,Kura Given,Damiryolu Given,Kura Price,Damiryolu Price,Revenue,Leftover Kura,Leftover Damiryolu,Debt,Collected Money\n";
    let rowCount = 0;
    allDates.forEach(date => {
      const shopData = deliveries[date];
      const dayPayments = debtPayments?.[date] || {};
      Object.entries(shopData).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        const shopName = shops[i]?.name || ("Shop " + idx);
        const sessWithData = SESS_IDS.filter(sv => { const d = sess[sv]; return d && (d.given?.kura>0||d.given?.damiryolu>0); });
        const lastSessId = sessWithData.length ? sessWithData[sessWithData.length-1] : null;
        const collectedToday = dayPayments[i] || dayPayments[String(i)] || 0;
        SESS_IDS.forEach(sv => {
          const d = sess[sv]; if (!d) return;
          const k = d.given?.kura||0, r = d.given?.damiryolu||0; if (!k && !r) return;
          const lk = d.leftover?.kura||0, lr = d.leftover?.damiryolu||0;
          const rev = k*shopKuraP(i) + r*shopDamiP(i);
          runningDebt[i] += rev;
          let collected = 0;
          if (sv === lastSessId && collectedToday > 0) { collected = collectedToday; runningDebt[i] -= collected; }
          csv += `${date},${shopName},${SESS_LABELS[sv]},${k},${r},${shopKuraP(i).toFixed(2)},${shopDamiP(i).toFixed(2)},${rev.toFixed(2)},${lk},${lr},${runningDebt[i].toFixed(2)},${collected>0?collected.toFixed(2):""}\n`;
          rowCount++;
        });
      });
    });
    return { csv, rowCount, startDate: allDates[0], endDate: allDates[allDates.length-1] };
  };





  useEffect(() => {
    if (pinBuf.length < 4) return;
    if (pinBuf === db_data?.pin) {
      setOwnerUnlocked(true); setPinBuf(""); setPinErr("");
      setShopEdits(db_data.shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
      setSettPrices({ kura: String(db_data.prices.kura), damiryolu: String(db_data.prices.damiryolu) });
      triggerArchiveIfNeeded(db_data); loadArchives();
    } else {
      setPinErr("PIN yanlışdır. Yenidən cəhd edin.");
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
    await upd(nd); toast$("Saxlanıldı ✓"); setTimeout(() => setView("session"), 300);
  };

  const saveDebtCollection = async () => {
    const collected = parseFloat(collectedInput) || 0;
    if (collected <= 0) { toast$("Məbləğ daxil edin"); return; }
    const debts = { ...(db_data.debts || {}) };
    debts[selShop] = (debts[selShop] || 0) - collected;
    const debtPayments = { ...(db_data.debtPayments || {}) };
    if (!debtPayments[TODAY]) debtPayments[TODAY] = {};
    debtPayments[TODAY][selShop] = (debtPayments[TODAY][selShop] || 0) + collected;
    await upd({ ...db_data, debts, debtPayments });
    setCollectedInput("");
    toast$("Borc yeniləndi ✓");
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
    await upd(nd); toast$("Saxlanıldı ✓"); setTimeout(() => setEditView("date-session"), 300);
  };

  const saveEditDebt = async (shopIdx, newVal) => {
    const amount = parseFloat(newVal);
    if (isNaN(amount)) { toast$("Düzgün məbləğ daxil edin"); return; }
    const debts = { ...(db_data.debts || {}) };
    debts[shopIdx] = amount;
    await upd({ ...db_data, debts });
    setEditDebtShop(null); setEditDebtVal("");
    toast$("Borc yeniləndi ✓");
  };

  const saveExpense = async () => {
    const TODAY = todayStr();
    const entries = [];
    EXP_CATS.forEach(cat => {
      const amt = parseFloat(expVals[cat.id]);
      if (!isNaN(amt) && amt > 0) entries.push({ cat: cat.id, amount: amt, desc: cat.id === "diger" ? (expVals.digerDesc || "") : cat.label, time: Date.now() });
    });
    if (!entries.length) { toast$("Məbləğ daxil edin"); return; }
    const expenses = { ...(db_data.expenses || {}) };
    if (!expenses[TODAY]) expenses[TODAY] = [];
    expenses[TODAY] = [...expenses[TODAY], ...entries];
    await upd({ ...db_data, expenses });
    setExpVals({ benzin: "", moyka: "", baxim: "", diger: "", digerDesc: "" });
    toast$("Xərc saxlanıldı ✓");
    setExpView("list");
  };

  const deleteExpense = async (date, idx) => {
    const expenses = { ...(db_data.expenses || {}) };
    expenses[date] = expenses[date].filter((_, i) => i !== idx);
    if (!expenses[date].length) delete expenses[date];
    await upd({ ...db_data, expenses });
    toast$("Silindi ✓");
  };

  const saveEditCollected = async (shopIdx, date, newAmount) => {
    const amount = parseFloat(newAmount) || 0;
    const oldAmount = db_data.debtPayments?.[date]?.[shopIdx] || 0;
    const diff = amount - oldAmount;
    const debts = { ...(db_data.debts || {}) };
    debts[shopIdx] = (debts[shopIdx] || 0) - diff;
    const debtPayments = { ...(db_data.debtPayments || {}) };
    if (!debtPayments[date]) debtPayments[date] = {};
    if (amount === 0) { delete debtPayments[date][shopIdx]; } else { debtPayments[date][shopIdx] = amount; }
    await upd({ ...db_data, debts, debtPayments });
    toast$("Yığılan yeniləndi ✓");
  };

  const resetAllData = async () => {
    const built = buildCSV(db_data);
    if (built) {
      const { csv, rowCount, startDate, endDate } = built;
      await addDoc(collection(db, "archives"), { weekMonday: getThisWeekMonday(), archivedOn: todayStr(), rowCount, startDate, endDate, csv, note: "Sıfırlamadan əvvəl arxiv" });
    }
    await upd({ ...db_data, deliveries: {}, debtPayments: {}, debts: {} });
    setResetConfirm(false); setResetPinBuf(""); setResetPinErr("");
    await loadArchives();
    toast$("✓ Bütün məlumatlar sıfırlandı");
  };

  const calcStats = (period) => {
    if (!db_data) return { totGK: 0, totGR: 0, totLK: 0, totLR: 0, totRev: 0, totCollected: 0, ss: {} };
    const t = todayStr(); let s = t;
    if (period === "week") s = addDays(t, -6);
    if (period === "month") s = addDays(t, -29);
    let totGK = 0, totGR = 0, totLK = 0, totLR = 0, totRev = 0, totCollected = 0;
    const ss = {};
    db_data.shops.forEach((_, i) => ss[i] = { kura: 0, damiryolu: 0, leftK: 0, leftR: 0, rev: 0 });
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
          if (sv.id === "morning") { const lk = d.leftover?.kura || 0, lr = d.leftover?.damiryolu || 0; ss[i].leftK += lk; ss[i].leftR += lr; totLK += lk; totLR += lr; }
        });
      });
    });
    Object.entries(db_data.debtPayments || {}).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.values(shops).forEach(amount => { totCollected += amount; });
    });
    return { totGK, totGR, totLK, totLR, totRev, totCollected, ss };
  };


    Object.entries(db_data.debtPayments || {}).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.entries(shops).forEach(([idx, amount]) => { runningDebt[parseInt(idx)] += amount; });
    });
    let csv = "Date,Shop,Session,Kura Given,Damiryolu Given,Kura Price,Damiryolu Price,Revenue,Leftover Kura,Leftover Damiryolu,Debt,Collected Money\n";
    const sortedDates = Object.keys(db_data.deliveries || {}).filter(d => d >= s && d <= t).sort();
    sortedDates.forEach(date => {
      const shops = db_data.deliveries[date];
      const dayPayments = db_data.debtPayments?.[date] || {};
      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        const shop = db_data.shops[i]?.name || ("Shop " + idx);
        const sessWithData = SESS.filter(sv => { const d = sess[sv.id]; return d && (d.given?.kura > 0 || d.given?.damiryolu > 0); });
        const lastSessId = sessWithData.length ? sessWithData[sessWithData.length - 1].id : null;
        const collectedToday = dayPayments[i] || dayPayments[String(i)] || 0;
        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.damiryolu || 0; if (!k && !r) return;
          const lk = d.leftover?.kura || 0, lr = d.leftover?.damiryolu || 0;
          const rev = k * shopKura(i) + r * shopRail(i);
          runningDebt[i] += rev;
          let collected = 0;
          if (sv.id === lastSessId && collectedToday > 0) { collected = collectedToday; runningDebt[i] -= collected; }
          csv += `${date},${shop},${sv.label},${k},${r},${shopKura(i).toFixed(2)},${shopRail(i).toFixed(2)},${rev.toFixed(2)},${lk},${lr},${runningDebt[i].toFixed(2)},${collected > 0 ? collected.toFixed(2) : ""}\n`;
        });
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `bread-delivery-${repPeriod}.csv`; a.click();
    toast$("CSV yüklənir…");
  };

  const saveShops = async () => {
    const shops = shopEdits.map(s => ({ name: s.name.trim() || s.name, kura: s.kuraStr !== "" ? parseFloat(s.kuraStr) : null, damiryolu: s.railStr !== "" ? parseFloat(s.railStr) : null }));
    await upd({ ...db_data, shops }); toast$("Mağazalar saxlanıldı ✓");
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
    setConfirmDeleteShop(i);
  };

  const confirmRemoveShop = () => {
    const i = confirmDeleteShop;
    const shops = db_data.shops.filter((_, x) => x !== i);
    setShopEdits(shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
    upd({ ...db_data, shops });
    setConfirmDeleteShop(null);
  };

  const savePrices = async () => { await upd({ ...db_data, prices: { kura: parseFloat(settPrices.kura) || 0, damiryolu: parseFloat(settPrices.damiryolu) || 0 } }); toast$("Qiymətlər saxlanıldı ✓"); };

  const changePin = async () => {
    if (pinOld !== db_data.pin) { toast$("Cari PIN yanlışdır"); return; }
    if (pinNew.length !== 4 || !/^\d+$/.test(pinNew)) { toast$("PIN 4 rəqəm olmalıdır"); return; }
    await upd({ ...db_data, pin: pinNew }); toast$("PIN dəyişdirildi ✓"); setPinOld(""); setPinNew("");
  };

  const calcExpenses = (period) => {
    if (!db_data) return { totExp: 0, byCat: {} };
    const t = todayStr(); let s = t;
    if (period === "week") s = addDays(t, -6);
    if (period === "month") s = addDays(t, -29);
    let totExp = 0;
    const byCat = { benzin: 0, moyka: 0, baxim: 0, diger: 0 };
    Object.entries(db_data.expenses || {}).forEach(([date, entries]) => {
      if (date < s || date > t) return;
      entries.forEach(e => { totExp += e.amount; byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
    });
    return { totExp, byCat };
  };

  const { totGK, totGR, totLK, totLR, totRev, totCollected, ss } = calcStats(dashPeriod);
  const repStats = calcStats(repPeriod);

  if (loading) return (
    <div style={{ ...c.wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 14 }}>Yüklənir…</div>
    </div>
  );

  const renderShopsScreen = () => (
    <div style={c.pad}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>{fmtDate(TODAY)}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Mağaza seçin</div>
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
              {debt > 0 ? `Borc: ${debt.toFixed(2)} ₼` : debt < 0 ? `Kredit: ${Math.abs(debt).toFixed(2)} ₼` : fmtDateShort(TODAY)}
            </div>
          </div>
        </div>
        <div style={c.pad}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Sessiya seçin</div>
          <div style={c.sessList}>
            {SESS_WITH_DEBT.map(s => {
              if (s.id === "debt") {
                const isCredit = debt < 0;
                return (
                  <button key="debt" style={{ ...c.sessBtn(false), borderColor: debt !== 0 ? (isCredit ? "var(--success-border)" : "#fca5a5") : "var(--border)" }} onClick={() => { setCollectedInput(""); setView("debt"); }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: isCredit ? "var(--success-text)" : debt > 0 ? "#dc2626" : "var(--text)" }}>💰 Borc</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                        {debt === 0 ? "Borc yoxdur" : isCredit ? `Kredit: ${Math.abs(debt).toFixed(2)} ₼` : `Borc: ${debt.toFixed(2)} ₼`}
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
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{isCredit ? "Kredit (artıq ödənildi)" : "Cari borc"}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: isCredit ? "var(--success-text)" : currentDebt > 0 ? "#dc2626" : "var(--text)" }}>{Math.abs(currentDebt).toFixed(2)} ₼</div>
          </div>
          <div style={c.block}>
            <div style={c.blockTitle}>Amount collected now</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="number" min={0} step={0.01} value={collectedInput} onChange={e => setCollectedInput(e.target.value)} placeholder="0.00" style={{ flex: 1, padding: "10px 12px", fontSize: 20, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
              <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
            </div>
            {collectedInput !== "" && (
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 8, textAlign: "right" }}>
                New balance: <strong style={{ color: newBalance < 0 ? "var(--success-text)" : newBalance > 0 ? "#dc2626" : "var(--text)" }}>{newBalance.toFixed(2)} ₼</strong>
              </div>
            )}
          </div>
          <button style={c.primaryBtn} onClick={saveDebtCollection}>Saxla</button>
        </div>
      </div>
    );
  };

  const renderEntryForm = (vals, adjFn, saveFn, backFn, shopIdx, sessId, date) => {
    const s = SESS.find(x => x.id === sessId);
    const isMorn = sessId === "morning";
    const inputStyle = { fontSize: 18, fontWeight: 600, width: 52, textAlign: "center", border: "1px solid var(--border2)", borderRadius: 8, padding: "5px 4px", background: "var(--bg)", color: "var(--text)" };
    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={backFn}>‹</button>
          <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[shopIdx]?.name} — {s?.label}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(date)}</div></div>
        </div>
        <div style={c.pad}>
          <div style={c.block}>
            <div style={c.blockTitle}>Mağazaya verilən</div>
            {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([t,lbl]) => (
              <div key={t} style={{ ...c.breadRow, marginBottom: t === "damiryolu" ? 0 : 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
                <div style={c.counter}>
                  <button style={c.cntBtn} onClick={() => adjFn("given", t, -1)}>−</button>
                  <input type="number" min={0} value={vals.given?.[t] || ""} placeholder="0" onChange={e => { const v = parseInt(e.target.value); adjFn("given", t, (isNaN(v) ? 0 : v) - (vals.given?.[t] || 0)); }} style={inputStyle} />
                  <button style={c.cntBtn} onClick={() => adjFn("given", t, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          {isMorn && (
            <div style={c.block}>
              <div style={c.blockTitle}>Qalıq geri alındı</div>
              {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([t,lbl]) => (
                <div key={t} style={{ ...c.breadRow, marginBottom: t === "damiryolu" ? 0 : 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
                  <div style={c.counter}>
                    <button style={c.cntBtn} onClick={() => adjFn("leftover", t, -1)}>−</button>
                    <input type="number" min={0} value={vals.leftover?.[t] || ""} placeholder="0" onChange={e => { const v = parseInt(e.target.value); adjFn("leftover", t, (isNaN(v) ? 0 : v) - (vals.leftover?.[t] || 0)); }} style={inputStyle} />
                    <button style={c.cntBtn} onClick={() => adjFn("leftover", t, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button style={c.primaryBtn} onClick={saveFn}>Saxla</button>
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
            <span style={{ fontSize: 13, fontWeight: 600 }}>{isEditToday ? "Bu gün — " : ""}{fmtDateShort(editDate)}</span>
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
      const existingCollected = db_data.debtPayments?.[editDate]?.[editSelShop] || 0;
      const collKey = `${editDate}-${editSelShop}`;
      const collVal = editCollected[collKey] !== undefined ? editCollected[collKey] : String(existingCollected || "");
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
                if (has) { sub = `Verildi: K ${d.given.kura} · D ${d.given.damiryolu}`; if (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.damiryolu > 0)) sub += ` | Qalıq: K${d.leftover.kura} D${d.leftover.damiryolu}`; }
                return (
                  <button key={s.id} style={c.sessBtn(has)} onClick={() => openEditEntry(editSelShop, s.id)}>
                    <div><div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div><div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div></div>
                    <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                  </button>
                );
              })}
            </div>
            <div style={{ ...c.block, marginTop: 10 }}>
              <div style={c.blockTitle}>💰 Yığılan məbləği düzəlt</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" min={0} step={0.01} value={collVal} onChange={e => setEditCollected(prev => ({ ...prev, [collKey]: e.target.value }))} placeholder="0.00" style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
                <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
              </div>
              {existingCollected > 0 && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>Cari: {existingCollected.toFixed(2)} ₼</div>}
              <button style={{ ...c.primaryBtn, marginTop: 10 }} onClick={() => saveEditCollected(editSelShop, editDate, collVal)}>Saxla</button>
            </div>
            <div style={{ ...c.block, marginTop: 10 }}>
              <div style={c.blockTitle}>💳 Cari borcu düzəlt</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                Cari borc: <strong style={{ color: (db_data.debts?.[editSelShop] || 0) > 0 ? "#dc2626" : "var(--success-text)" }}>{(db_data.debts?.[editSelShop] || 0).toFixed(2)} ₼</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" step={0.01} value={editDebtShop === editSelShop ? editDebtVal : ""} onChange={e => { setEditDebtShop(editSelShop); setEditDebtVal(e.target.value); }} placeholder={(db_data.debts?.[editSelShop] || 0).toFixed(2)} style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
                <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
              </div>
              <button style={{ ...c.primaryBtn, marginTop: 10 }} onClick={() => saveEditDebt(editSelShop, editDebtVal)}>Saxla</button>
            </div>
          </div>
        </div>
      );
    }
    if (editView === "date-entry") {
      return renderEntryForm(editEntryVals, adjEdit, saveEditEntry, () => setEditView("date-session"), editSelShop, editSelSess, editDate);
    }
  };

  const renderDashboard = () => {
    const totalDebt = Object.values(db_data.debts || {}).reduce((a, b) => a + b, 0);
    const revs = db_data.shops.map((s, i) => ({ name: s.name, rev: ss[i]?.rev || 0 })).filter(x => x.rev > 0).sort((a, b) => b.rev - a.rev);
    const maxR = revs.length ? revs[0].rev : 1;
    return (
      <div style={c.pad}>
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
          {[["day","Bu gün"],["week","7 gün"],["month","30 gün"]].map(([p,l]) => (
            <button key={p} style={c.periodBtn(dashPeriod===p)} onClick={() => setDashPeriod(p)}>{l}</button>
          ))}
        </div>
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Gəlir</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totRev.toFixed(2)} ₼</div>
        </div>
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>Ümumi verilən</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{totGK + totGR}</div>
          </div>
          <div className="sub-metric"><span style={{ fontSize: 12, color: "var(--text2)" }}>Kura</span><span style={{ fontSize: 13, fontWeight: 500 }}>{totGK}</span></div>
          <div className="sub-metric"><span style={{ fontSize: 12, color: "var(--text2)" }}>Damiryolu</span><span style={{ fontSize: 13, fontWeight: 500 }}>{totGR}</span></div>
        </div>
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Ümumi qalıq</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{totLK + totLR}</div>
        </div>
        <div style={{ ...c.metric, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Ümumi borc</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: totalDebt > 0 ? "#dc2626" : totalDebt < 0 ? "var(--success-text)" : "var(--text)" }}>{totalDebt.toFixed(2)} ₼</div>
        </div>
        <div style={{ ...c.metricGreen, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "var(--collected-text)", marginBottom: 3, fontWeight: 600 }}>Ümumi yığılan</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--collected-text)" }}>{totCollected.toFixed(2)} ₼</div>
        </div>
        {(() => {
          const { totExp, byCat } = calcExpenses(dashPeriod);
          if (totExp === 0) return null;
          return (
            <div style={{ ...c.metric, marginBottom: "1rem", border: "1px solid #fca5a5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>🚗 Maşın xərcləri</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#dc2626" }}>{totExp.toFixed(2)} ₼</div>
              </div>
              {EXP_CATS.filter(cat => byCat[cat.id] > 0).map(cat => (
                <div key={cat.id} className="sub-metric">
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>{cat.icon} {cat.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#dc2626" }}>{byCat[cat.id].toFixed(2)} ₼</span>
                </div>
              ))}
            </div>
          );
        })()}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mağaza üzrə borc</div>
        <div style={c.listCard}>
          {(() => {
            const rows = db_data.shops.map((s, i) => ({ s, i, debt: db_data.debts?.[i] || 0 })).filter(x => x.debt !== 0);
            if (!rows.length) return <div style={{ padding: "1.5rem", textAlign: "center", fontSize: 13, color: "var(--text2)" }}>Borc yoxdur.</div>;
            return rows.map(({ s, i, debt }) => (
              <div key={i} style={{ ...c.listRow(false), flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: debt < 0 ? "var(--success-text)" : "#dc2626" }}>{debt < 0 ? `Kredit: ${Math.abs(debt).toFixed(2)} ₼` : `${debt.toFixed(2)} ₼`}</div>
                    <button onClick={() => { setEditDebtShop(editDebtShop === i ? null : i); setEditDebtVal(debt.toFixed(2)); }} style={{ fontSize: 11, padding: "3px 8px", border: "1px solid var(--border2)", borderRadius: 6, background: "none", color: "var(--text2)", cursor: "pointer" }}>✏️</button>
                  </div>
                </div>
                {editDebtShop === i && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="number" step={0.01} value={editDebtVal} onChange={e => setEditDebtVal(e.target.value)} style={{ flex: 1, padding: "6px 10px", fontSize: 14, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
                    <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
                    <button onClick={() => saveEditDebt(i, editDebtVal)} style={{ padding: "6px 12px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}>Saxla</button>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mağaza üzrə gəlir</div>
        {revs.length ? revs.map(x => (
          <div key={x.name} className="bar-row">
            <span className="bar-label">{x.name}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(x.rev / maxR * 100)}%` }}></div></div>
            <span style={{ fontSize: 12, fontWeight: 500, minWidth: 40 }}>{x.rev.toFixed(1)}₼</span>
          </div>
        )) : <div style={{ textAlign: "center", padding: "1.5rem", fontSize: 13, color: "var(--text2)" }}>Hələ məlumat yoxdur.</div>}
      </div>
    );
  };

  const renderExpenses = () => {
    const TODAY = todayStr();
    const todayExps = db_data.expenses?.[TODAY] || [];
    if (expView === "add") {
      return (
        <div>
          <div style={c.topbar}>
            <button style={c.backBtn} onClick={() => setExpView("list")}>‹</button>
            <div><div style={{ fontSize: 16, fontWeight: 500 }}>🚗 Maşın xərcləri</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(TODAY)}</div></div>
          </div>
          <div style={c.pad}>
            <div style={c.block}>
              {EXP_CATS.map(cat => (
                <div key={cat.id}>
                  <div style={{ ...c.breadRow, marginBottom: cat.id === "diger" ? 6 : 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.icon} {cat.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" min={0} step={0.01} value={expVals[cat.id]} onChange={e => setExpVals(p => ({ ...p, [cat.id]: e.target.value }))} placeholder="0.00" style={{ width: 80, padding: "7px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
                      <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
                    </div>
                  </div>
                  {cat.id === "diger" && (
                    <input type="text" value={expVals.digerDesc} onChange={e => setExpVals(p => ({ ...p, digerDesc: e.target.value }))} placeholder="Açıqlama…" style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)", marginBottom: 10 }} />
                  )}
                </div>
              ))}
            </div>
            <button style={c.primaryBtn} onClick={saveExpense}>Saxla</button>
          </div>
        </div>
      );
    }
    return (
      <div style={c.pad}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>{fmtDate(TODAY)}</div>
        <button style={{ ...c.primaryBtn, marginBottom: "1rem" }} onClick={() => setExpView("add")}>+ Xərc əlavə et</button>
        {todayExps.length === 0 ? (
          <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "2rem" }}>Bu gün xərc yoxdur.</div>
        ) : (
          <div style={c.listCard}>
            {todayExps.map((e, i) => {
              const cat = EXP_CATS.find(c => c.id === e.cat);
              return (
                <div key={i} style={c.listRow(i === todayExps.length - 1)}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{cat?.icon} {e.desc}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{cat?.label}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>{e.amount.toFixed(2)} ₼</div>
                    <button onClick={() => deleteExpense(TODAY, i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text2)" }}>🗑</button>
                  </div>
                </div>
              );
            })}
            <div style={{ padding: "10px 14px", background: "var(--bg2)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Cəmi</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{todayExps.reduce((a,e) => a+e.amount, 0).toFixed(2)} ₼</span>
            </div>
          </div>
        )}
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
          {[["day","Bu gün"],["week","7 gün"],["month","30 gün"]].map(([p,l]) => <button key={p} style={c.periodBtn(repPeriod===p)} onClick={() => setRepPeriod(p)}>{l}</button>)}
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
        <button style={c.outlineBtn} onClick={exportCSV}>⬇ CSV / Excel ixrac et</button>
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
        <input value={newShopName} onChange={e => setNewShopName(e.target.value)} onKeyDown={e => e.key === "Enter" && addShop()} placeholder="Yeni mağaza adı…" style={{ flex: 1, padding: "9px 12px", fontSize: 14, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }} />
        <button onClick={addShop} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}>+ Əlavə et</button>
      </div>
      <button style={c.primaryBtn} onClick={saveShops}>Bütün mağazaları saxla</button>
    </div>
  );

  const renderParametrler = () => {
    const downloadArchive = (arc) => {
      const blob = new Blob([arc.csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `bread-arxiv-${arc.weekMonday}.csv`;
      a.click();
      toast$("CSV yüklənir…");
    };
    const handleResetPin = (k) => {
      if (k === "clr") { setResetPinBuf(""); setResetPinErr(""); return; }
      if (k === "del") { setResetPinBuf(p => p.slice(0,-1)); return; }
      if (resetPinBuf.length >= 4) return;
      const next = resetPinBuf + k;
      setResetPinBuf(next);
      if (next.length === 4) {
        if (next === db_data?.pin) { resetAllData(); }
        else { setResetPinErr("PIN yanlışdır"); setTimeout(() => { setResetPinBuf(""); setResetPinErr(""); }, 900); }
      }
    };
    return (
      <div style={c.pad}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Standart çörək qiymətləri</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Xüsusi qiyməti olmayan mağazalara tətbiq edilir.</div>
        <div style={c.listCard}>
          {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([k,lbl],i) => (
            <div key={k} style={c.settRow(i===1)}>
              <div><div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div><div style={{ fontSize: 11, color: "var(--text2)" }}>hər çörəyə standart</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input type="number" min={0} step={0.01} value={settPrices[k]} onChange={e => setSettPrices(p => ({ ...p, [k]: e.target.value }))} style={{ width: 68, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
                <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
              </div>
            </div>
          ))}
        </div>
        <button style={{ ...c.primaryBtn, marginBottom: "1.25rem" }} onClick={savePrices}>Standart qiymətləri saxla</button>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>PIN-i dəyiş</div>
        <div style={c.listCard}>
          {[["Cari PIN", pinOld, setPinOld],["Yeni PIN", pinNew, setPinNew]].map(([lbl,val,setter],i) => (
            <div key={lbl} style={c.settRow(i===1)}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div>
              <input type="password" maxLength={4} value={val} onChange={e => setter(e.target.value)} style={{ width: 80, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
            </div>
          ))}
        </div>
        <button style={{ ...c.outlineBtn, marginBottom: "1.5rem" }} onClick={changePin}>PIN-i dəyiş</button>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Arxivlər</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Hər həftə giriş etdikdə avtomatik saxlanılır.</div>
        {archives.length === 0 ? (
          <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Hələ arxiv yoxdur.</div>
        ) : (
          <div style={{ ...c.listCard, marginBottom: "1.5rem" }}>
            {archives.map((arc, i) => (
              <div key={arc.id} style={{ ...c.listRow(i === archives.length - 1), gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateShort(arc.weekMonday)} həftəsi</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{fmtDateShort(arc.archivedOn)} · {arc.rowCount} sətir</div>
                </div>
                <button onClick={() => downloadArchive(arc)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text)", cursor: "pointer", flexShrink: 0 }}>⬇ CSV</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Məlumatları sıfırla</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Çatdırılma, borc və ödəniş məlumatları silinəcək. Mağazalar, qiymətlər və PIN saxlanılacaq. Sıfırlamadan əvvəl arxiv avtomatik yaradılır.</div>
        {!resetConfirm ? (
          <button style={{ ...c.outlineBtn, color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => setResetConfirm(true)}>🗑 Hamısını sıfırla</button>
        ) : (
          <div style={c.block}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 12, textAlign: "center" }}>Təsdiq üçün PIN daxil edin</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12 }}>
              {[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < resetPinBuf.length)}></div>)}
            </div>
            {resetPinErr && <div style={{ color: "#dc2626", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{resetPinErr}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
              {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
                <button key={k} style={{ ...c.pinKey, padding: 10, fontSize: 16 }} onClick={() => handleResetPin(k)}>{k==="clr"?"CLR":k==="del"?"⌫":k}</button>
              ))}
            </div>
            <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setResetConfirm(false); setResetPinBuf(""); setResetPinErr(""); }}>Ləğv et</button>
          </div>
        )}
      </div>
    );
  };

  const renderGundelik = () => {
    const TODAY = todayStr();
    const todayDeliveries = db_data.deliveries?.[TODAY] || {};
    const todayPayments = db_data.debtPayments?.[TODAY] || {};
    const shopRows = [];
    Object.entries(todayDeliveries).forEach(([idx, sess]) => {
      const i = parseInt(idx);
      const shop = db_data.shops[i];
      if (!shop) return;
      let totalK = 0, totalD = 0, sehK = 0, sehD = 0, gunK = 0, gunD = 0, axsK = 0, axsD = 0;
      SESS.forEach(sv => {
        const d = sess[sv.id]; if (!d) return;
        const k = d.given?.kura || 0, dd = d.given?.damiryolu || 0;
        totalK += k; totalD += dd;
        if (sv.id === "morning") { sehK += k; sehD += dd; }
        if (sv.id === "afternoon") { gunK += k; gunD += dd; }
        if (sv.id === "evening") { axsK += k; axsD += dd; }
      });
      if (!totalK && !totalD) return;
      const todayDebt = totalK * (shop.kura ?? db_data.prices.kura) + totalD * (shop.damiryolu ?? db_data.prices.damiryolu);
      const totalDebt = db_data.debts?.[i] || 0;
      const yigilan = todayPayments[i] || todayPayments[String(i)] || 0;
      shopRows.push({ i, name: shop.name, totalK, totalD, sehK, sehD, gunK, gunD, axsK, axsD, todayDebt, totalDebt, yigilan, qalanBorc: totalDebt });
    });
    const totK = shopRows.reduce((a, r) => a + r.totalK, 0);
    const totD = shopRows.reduce((a, r) => a + r.totalD, 0);
    const totSehK = shopRows.reduce((a, r) => a + r.sehK, 0), totSehD = shopRows.reduce((a, r) => a + r.sehD, 0);
    const totGunK = shopRows.reduce((a, r) => a + r.gunK, 0), totGunD = shopRows.reduce((a, r) => a + r.gunD, 0);
    const totAxsK = shopRows.reduce((a, r) => a + r.axsK, 0), totAxsD = shopRows.reduce((a, r) => a + r.axsD, 0);
    const totTodayDebt = shopRows.reduce((a, r) => a + r.todayDebt, 0);
    const totUmumi = shopRows.reduce((a, r) => a + r.totalDebt, 0);
    const totYigilan = shopRows.reduce((a, r) => a + r.yigilan, 0);
    const totQalan = shopRows.reduce((a, r) => a + r.qalanBorc, 0);
    const thStyle = (center) => ({ padding: "5px 4px", fontSize: 10, fontWeight: 700, color: "var(--text2)", textAlign: center ? "center" : "left", background: "var(--bg2)", border: "1px solid var(--border)", whiteSpace: "nowrap" });
    const tdStyle = (color, bg) => ({ padding: "5px 4px", fontSize: 11, textAlign: "center", border: "1px solid var(--border)", color: color || "var(--text)", background: bg || "transparent", whiteSpace: "nowrap" });
    const tdLStyle = (bold, bg) => ({ padding: "5px 6px", fontSize: 11, textAlign: "left", border: "1px solid var(--border)", color: "var(--text)", background: bg || "transparent", fontWeight: bold ? 700 : 400, whiteSpace: "nowrap" });
    return (
      <div style={{ padding: "1rem 0" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10, padding: "0 1rem" }}>{fmtDate(TODAY)}</div>
        {shopRows.length === 0 ? (
          <div style={{ ...c.block, margin: "0 1rem", textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "2rem" }}>Bu gün hələ çatdırılma yoxdur.</div>
        ) : (
          <div style={{ margin: "0 1rem", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ ...thStyle(false), verticalAlign: "middle" }}>Mağaza</th>
                  <th colSpan={3} style={{ ...thStyle(true), borderBottom: "none" }}>Çörək</th>
                  <th colSpan={4} style={{ ...thStyle(true), borderBottom: "none" }}>Borc</th>
                </tr>
                <tr>
                  <th style={thStyle(true)}>Kur</th>
                  <th style={thStyle(true)}>Dam</th>
                  <th style={thStyle(true)}>Cəm</th>
                  <th style={thStyle(true)}>Ümumi</th>
                  <th style={thStyle(true)}>Bugün</th>
                  <th style={thStyle(true)}>Yığılan</th>
                  <th style={thStyle(true)}>Qalıq</th>
                </tr>
              </thead>
              <tbody>
                {shopRows.map((r, ri) => (
                  <>
                    <tr key={r.i} style={{ background: ri % 2 === 0 ? "var(--bg)" : "var(--bg2)" }}>
                      <td style={tdLStyle(true)}>{r.name}</td>
                      <td style={tdStyle()}>{r.totalK}</td>
                      <td style={tdStyle()}>{r.totalD}</td>
                      <td style={{ ...tdStyle(), fontWeight: 600 }}>{r.totalK+r.totalD}</td>
                      <td style={tdStyle("#dc2626")}>{r.totalDebt.toFixed(1)}</td>
                      <td style={tdStyle("#dc2626")}>{r.todayDebt.toFixed(1)}</td>
                      <td style={tdStyle("var(--success-text)")}>{r.yigilan > 0 ? r.yigilan.toFixed(1) : "—"}</td>
                      <td style={tdStyle(r.qalanBorc > 0 ? "#dc2626" : "var(--success-text)")}>{r.qalanBorc.toFixed(1)}</td>
                    </tr>
                    {[["🌅 S", r.sehK, r.sehD], ["☀️ G", r.gunK, r.gunD], ["🌙 A", r.axsK, r.axsD]].map(([lbl, k, d]) =>
                      (k || d) ? (
                        <tr key={lbl+r.i} style={{ background: ri % 2 === 0 ? "var(--bg)" : "var(--bg2)", opacity: 0.7 }}>
                          <td style={{ ...tdLStyle(false), paddingLeft: 14, fontSize: 10, color: "var(--text2)" }}>{lbl}</td>
                          <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k}</td>
                          <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{d}</td>
                          <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k+d}</td>
                          <td colSpan={4} style={{ border: "1px solid var(--border)" }}></td>
                        </tr>
                      ) : null
                    )}
                  </>
                ))}
                <tr style={{ background: "var(--bg2)", fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                  <td style={tdLStyle(true, "var(--bg2)")}>📊 Cəmi</td>
                  <td style={{ ...tdStyle(), fontWeight: 700 }}>{totK}</td>
                  <td style={{ ...tdStyle(), fontWeight: 700 }}>{totD}</td>
                  <td style={{ ...tdStyle(), fontWeight: 700 }}>{totK+totD}</td>
                  <td style={{ ...tdStyle("#dc2626"), fontWeight: 700 }}>{totUmumi.toFixed(1)}</td>
                  <td style={{ ...tdStyle("#dc2626"), fontWeight: 700 }}>{totTodayDebt.toFixed(1)}</td>
                  <td style={{ ...tdStyle("var(--success-text)"), fontWeight: 700 }}>{totYigilan > 0 ? totYigilan.toFixed(1) : "—"}</td>
                  <td style={{ ...tdStyle(totQalan > 0 ? "#dc2626" : "var(--success-text)"), fontWeight: 700 }}>{totQalan.toFixed(1)}</td>
                </tr>
                {[["🌅 Səhər", totSehK, totSehD], ["☀️ Günorta", totGunK, totGunD], ["🌙 Axşam", totAxsK, totAxsD]].map(([lbl, k, d]) =>
                  (k || d) ? (
                    <tr key={lbl} style={{ background: "var(--bg2)", opacity: 0.8 }}>
                      <td style={{ ...tdLStyle(false, "var(--bg2)"), fontSize: 10, color: "var(--text2)" }}>{lbl}</td>
                      <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k}</td>
                      <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{d}</td>
                      <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k+d}</td>
                      <td colSpan={4} style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}></td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const ownerTabs = [["dashboard","İdarə paneli"],["reports","Hesabatlar"],["edit","Mağazaları tənzimlə"],["shops-mgr","Mağaza əlavə et"],["parametrler","Parametrlər"]];

  return (
    <div style={c.wrap}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" />
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "10px 22px", borderRadius: 30, fontSize: 14, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}

      {confirmDeleteShop !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Mağazanı sil</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: "1.5rem" }}>
              <strong style={{ color: "var(--text)" }}>{db_data.shops[confirmDeleteShop]?.name}</strong> mağazasını silmək istədiyinizdən əminsiniz?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteShop(null)} style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 10, background: "none", color: "var(--text)", cursor: "pointer" }}>Yox</button>
              <button onClick={confirmRemoveShop} style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, background: "#dc2626", color: "#fff", cursor: "pointer" }}>Hə, sil</button>
            </div>
          </div>
        </div>
      )}

      <div style={c.nav}>
        {[["delivery","🚚","Çatdırılma"],["gundelik","📋","Gündəlik"],["expenses","🚗","Xərclər"],["owner","🔐","Sahibkar"]].map(([key,icon,lbl]) => (
          <button key={key} style={c.navBtn(tab===key)} onClick={() => { setTab(key); if (key==="delivery") setView("shops"); if (key==="expenses") setExpView("list"); }}>
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
      {tab === "gundelik" && renderGundelik()}
      {tab === "expenses" && renderExpenses()}
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
              {ownerTab === "parametrler" && renderParametrler()}
              <div style={{ padding: "0 1rem 1.5rem" }}>
                <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setOwnerUnlocked(false); setPinBuf(""); }}>🔒 Kilidlə</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
