import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc, collection, addDoc } from "firebase/firestore";
import { todayStr, addDays } from "../utils/dates";
import { SESS, EXP_CATS, DEFAULT_DB } from "../constants";
import { buildCSV, loadArchives, triggerArchiveIfNeeded, getTodayKey } from "../services/archive";
import { logAction } from "../services/logger";

export function useAppData(userEmail) {
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

  useEffect(() => {
    if (pinBuf.length < 4) return;
    if (pinBuf === db_data?.pin) {
      setOwnerUnlocked(true); setPinBuf(""); setPinErr("");
      setShopEdits(db_data.shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
      setSettPrices({ kura: String(db_data.prices.kura), damiryolu: String(db_data.prices.damiryolu) });
      triggerArchiveIfNeeded(db_data).catch(e => console.error(e));
      loadArchives().then(setArchives).catch(e => console.error(e));
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
    const ex = db_data?.deliveries?.[todayStr()]?.[shopIdx]?.[sessId] || {};
    setEntryVals({ given: { kura: ex.given?.kura || 0, damiryolu: ex.given?.damiryolu || 0 }, leftover: { kura: ex.leftover?.kura || 0, damiryolu: ex.leftover?.damiryolu || 0 } });
    setView("entry");
  };

  const adjDelivery = (g, t, d) => setEntryVals(prev => ({ ...prev, [g]: { ...prev[g], [t]: Math.max(0, (prev[g]?.[t] || 0) + d) } }));

  const saveDeliveryEntry = async () => {
    const TODAY = todayStr();
    const nd = { ...db_data, deliveries: { ...db_data.deliveries, [TODAY]: { ...(db_data.deliveries?.[TODAY] || {}), [selShop]: { ...(db_data.deliveries?.[TODAY]?.[selShop] || {}) } } } };
    const obj = { given: { ...entryVals.given } };
    if (selSess === "morning") obj.leftover = { ...entryVals.leftover };
    const prev = nd.deliveries[TODAY][selShop][selSess];
    const prevVal = prev ? (prev.given?.kura || 0) * shopKura(selShop) + (prev.given?.damiryolu || 0) * shopRail(selShop) : 0;
    const netKura = (entryVals.given?.kura || 0) - (entryVals.leftover?.kura || 0);
    const netRail = (entryVals.given?.damiryolu || 0) - (entryVals.leftover?.damiryolu || 0);
    const newVal = Math.max(0, netKura) * shopKura(selShop) + Math.max(0, netRail) * shopRail(selShop);
    nd.deliveries[TODAY][selShop][selSess] = obj;
    const debts = { ...(nd.debts || {}) };
    debts[selShop] = (debts[selShop] || 0) - prevVal + newVal;
    nd.debts = debts;
    await upd(nd);
    logAction("delivery_save", userEmail, {
      shop: db_data.shops[selShop]?.name,
      session: selSess,
      before: prev || null,
      after: obj,
    });
    toast$("Saxlanıldı ✓"); setTimeout(() => setView("session"), 300);
  };

  const saveDebtCollection = async () => {
    const collected = parseFloat(collectedInput) || 0;
    if (collected <= 0) { toast$("Məbləğ daxil edin"); return; }
    const TODAY = todayStr();
    const debts = { ...(db_data.debts || {}) };
    const before = debts[selShop] || 0;
    debts[selShop] = before - collected;
    const debtPayments = { ...(db_data.debtPayments || {}) };
    if (!debtPayments[TODAY]) debtPayments[TODAY] = {};
    debtPayments[TODAY][selShop] = (debtPayments[TODAY][selShop] || 0) + collected;
    await upd({ ...db_data, debts, debtPayments });
    logAction("debt_collect", userEmail, {
      shop: db_data.shops[selShop]?.name,
      collected,
      debtBefore: before,
      debtAfter: debts[selShop],
    });
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
    const prev = db_data.deliveries?.[editDate]?.[editSelShop]?.[editSelSess] || null;
    nd.deliveries[editDate][editSelShop][editSelSess] = obj;
    await upd(nd);
    logAction("delivery_edit", userEmail, {
      date: editDate,
      shop: db_data.shops[editSelShop]?.name,
      session: editSelSess,
      before: prev,
      after: obj,
    });
    toast$("Saxlanıldı ✓"); setTimeout(() => setEditView("date-session"), 300);
  };

  const saveEditDebt = async (shopIdx, newVal) => {
    const amount = parseFloat(newVal);
    if (isNaN(amount)) { toast$("Düzgün məbləğ daxil edin"); return; }
    const debts = { ...(db_data.debts || {}) };
    const before = debts[shopIdx] || 0;
    debts[shopIdx] = amount;
    await upd({ ...db_data, debts });
    logAction("debt_edit", userEmail, {
      shop: db_data.shops[shopIdx]?.name,
      before,
      after: amount,
    });
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
    logAction("expense_add", userEmail, { entries });
    setExpVals({ benzin: "", moyka: "", baxim: "", diger: "", digerDesc: "" });
    toast$("Xərc saxlanıldı ✓");
    setExpView("list");
  };

  const deleteExpense = async (date, idx) => {
    const expenses = { ...(db_data.expenses || {}) };
    const deleted = expenses[date]?.[idx] || null;
    expenses[date] = expenses[date].filter((_, i) => i !== idx);
    if (!expenses[date].length) delete expenses[date];
    await upd({ ...db_data, expenses });
    logAction("expense_delete", userEmail, { date, deleted });
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
    logAction("collected_edit", userEmail, {
      date,
      shop: db_data.shops[shopIdx]?.name,
      before: oldAmount,
      after: amount,
    });
    toast$("Yığılan yeniləndi ✓");
  };

  const resetAllData = async () => {
    try {
      const built = buildCSV(db_data);
      const csvHeader = "Date,Shop,Session,Kura Given,Damiryolu Given,Kura Price,Damiryolu Price,Revenue,Leftover Kura,Leftover Damiryolu,Debt,Collected Money\n";
      const csv = built ? built.csv : csvHeader;
      const rowCount = built ? built.rowCount : 0;
      const startDate = built ? built.startDate : todayStr();
      const endDate = built ? built.endDate : todayStr();

      const archiveRef = await addDoc(collection(db, "archives"), {
        weekMonday: getTodayKey(),
        archivedOn: todayStr(),
        rowCount, startDate, endDate, csv,
        note: "Sıfırlamadan əvvəl arxiv",
        resetBy: userEmail || "unknown",
      });

      if (!archiveRef || !archiveRef.id) {
        toast$("❌ Arxiv yaradıla bilmədi — sıfırlama DAYANDIRILDI");
        logAction("reset_failed", userEmail, { reason: "archive_failed" });
        return;
      }

      await logAction("reset", userEmail, {
        archiveId: archiveRef.id,
        rowCount,
        debtsBefore: db_data.debts || {},
      });

      await upd({ ...db_data, deliveries: {}, debtPayments: {}, debts: {} });
      setResetConfirm(false); setResetPinBuf(""); setResetPinErr("");
      const list = await loadArchives(); setArchives(list);
      toast$("✓ Arxivləndi və sıfırlandı");
    } catch (e) {
      console.error(e);
      logAction("reset_failed", userEmail, { reason: String(e) });
      toast$("❌ Xəta baş verdi — sıfırlama edilmədi");
    }
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

  const saveShops = async () => {
    const before = db_data.shops;
    const shops = shopEdits.map(s => ({ name: s.name.trim() || s.name, kura: s.kuraStr !== "" ? parseFloat(s.kuraStr) : null, damiryolu: s.railStr !== "" ? parseFloat(s.railStr) : null }));
    await upd({ ...db_data, shops });
    logAction("shops_save", userEmail, { before, after: shops });
    toast$("Mağazalar saxlanıldı ✓");
  };

  const addShop = () => {
    if (!newShopName.trim()) return;
    const shops = [...db_data.shops, { name: newShopName.trim(), kura: null, damiryolu: null }];
    setShopEdits(shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
    logAction("shop_add", userEmail, { name: newShopName.trim() });
    setNewShopName("");
    upd({ ...db_data, shops });
  };

  const removeShop = (i) => {
    if (db_data.shops.length <= 1) return;
    setConfirmDeleteShop(i);
  };

  const confirmRemoveShop = () => {
    const i = confirmDeleteShop;
    const deleted = db_data.shops[i];
    const shops = db_data.shops.filter((_, x) => x !== i);
    setShopEdits(shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.damiryolu !== null ? String(s.damiryolu) : "" })));
    upd({ ...db_data, shops });
    logAction("shop_delete", userEmail, { deleted });
    setConfirmDeleteShop(null);
  };

  const savePrices = async () => {
    const before = db_data.prices;
    const after = { kura: parseFloat(settPrices.kura) || 0, damiryolu: parseFloat(settPrices.damiryolu) || 0 };
    await upd({ ...db_data, prices: after });
    logAction("prices_save", userEmail, { before, after });
    toast$("Qiymətlər saxlanıldı ✓");
  };

  const changePin = async () => {
    if (pinOld !== db_data.pin) { toast$("Cari PIN yanlışdır"); return; }
    if (pinNew.length !== 4 || !/^\d+$/.test(pinNew)) { toast$("PIN 4 rəqəm olmalıdır"); return; }
    await upd({ ...db_data, pin: pinNew });
    logAction("pin_change", userEmail, {});
    toast$("PIN dəyişdirildi ✓"); setPinOld(""); setPinNew("");
  };

const saveHandover = async (amount) => {
  const TODAY = todayStr();
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) { toast$("Məbləğ daxil edin"); return; }

  const handovers = { ...(db_data.handovers || {}) };
  const oldHandover = handovers[TODAY] || 0;
  handovers[TODAY] = amt;

  const todayYigilan = Object.values(db_data.debtPayments?.[TODAY] || {})
    .reduce((a, b) => a + b, 0);
  const todayExp = (db_data.expenses?.[TODAY] || [])
    .reduce((a, e) => a + e.amount, 0);

  const prevKassa = db_data.kassaBalance || 0;
  const newKassaBalance = parseFloat((prevKassa + oldHandover - amt + todayYigilan - todayExp - oldHandover).toFixed(2));

  await upd({ ...db_data, handovers, kassaBalance: newKassaBalance });
  logAction("handover_save", userEmail, { date: TODAY, amount: amt, kassaBalance: newKassaBalance });
  toast$("Təhvil saxlanıldı ✓");
};

  return {
    db_data, loading, tab, setTab, view, setView,
    selShop, setSelShop, selSess, setSelSess,
    entryVals, collectedInput, setCollectedInput,
    ownerUnlocked, setOwnerUnlocked, ownerTab, setOwnerTab,
    pinBuf, pinErr, pinKey,
    dashPeriod, setDashPeriod, repPeriod, setRepPeriod,
    editDate, setEditDate, editView, setEditView,
    editSelShop, setEditSelShop, editSelSess, setEditSelSess,
    editEntryVals, adjEdit,
    toast, shopEdits, setShopEdits,
    newShopName, setNewShopName,
    settPrices, setSettPrices,
    pinOld, setPinOld, pinNew, setPinNew,
    archives, resetPinBuf, setResetPinBuf,
    resetPinErr, setResetPinErr,
    resetConfirm, setResetConfirm,
    editCollected, setEditCollected,
    expView, setExpView, expVals, setExpVals,
    editDebtShop, setEditDebtShop,
    editDebtVal, setEditDebtVal,
    confirmDeleteShop, setConfirmDeleteShop,
    shopKura, shopRail, upd, toast$,
    openDeliveryEntry, adjDelivery, saveDeliveryEntry,
    saveDebtCollection, openEditEntry, saveEditEntry,
    saveEditDebt, saveEditCollected, saveExpense, deleteExpense,
    resetAllData, calcStats, calcExpenses,
    saveShops, addShop, removeShop, confirmRemoveShop,
    savePrices, changePin, saveHandover,
  };
}
