import { db } from "../firebase";
import { doc, collection, getDocs, addDoc } from "firebase/firestore";
import { todayStr } from "../utils/dates";
import { SESS } from "../constants";

export function buildCSV(data) {
  const { deliveries, debtPayments, debts, shops, prices } = data;
  const shopKuraP = (i) => shops[i]?.kura ?? prices?.kura ?? 0.55;
  const shopDamiP = (i) => shops[i]?.damiryolu ?? prices?.damiryolu ?? 0.65;
  const SESS_IDS = ["morning", "afternoon", "evening"];
  const SESS_LABELS = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
  const allDates = Object.keys(deliveries || {}).sort();
  if (!allDates.length) return null;
  const runningDebt = {};
  shops.forEach((_, i) => { runningDebt[i] = debts?.[i] || 0; });
  Object.entries(deliveries || {}).forEach(([, shopData]) => {
    Object.entries(shopData).forEach(([idx, sess]) => {
      const i = parseInt(idx);
      SESS_IDS.forEach(sv => {
        const d = sess[sv]; if (!d) return;
        runningDebt[i] -= (d.given?.kura || 0) * shopKuraP(i) + (d.given?.damiryolu || 0) * shopDamiP(i);
      });
    });
  });
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
      const sessWithData = SESS_IDS.filter(sv => { const d = sess[sv]; return d && (d.given?.kura > 0 || d.given?.damiryolu > 0); });
      const lastSessId = sessWithData.length ? sessWithData[sessWithData.length - 1] : null;
      const collectedToday = dayPayments[i] || dayPayments[String(i)] || 0;
      SESS_IDS.forEach(sv => {
        const d = sess[sv]; if (!d) return;
        const k = d.given?.kura || 0, r = d.given?.damiryolu || 0; if (!k && !r) return;
        const lk = d.leftover?.kura || 0, lr = d.leftover?.damiryolu || 0;
        const rev = k * shopKuraP(i) + r * shopDamiP(i);
        runningDebt[i] += rev;
        let collected = 0;
        if (sv === lastSessId && collectedToday > 0) { collected = collectedToday; runningDebt[i] -= collected; }
        csv += `${date},${shopName},${SESS_LABELS[sv]},${k},${r},${shopKuraP(i).toFixed(2)},${shopDamiP(i).toFixed(2)},${rev.toFixed(2)},${lk},${lr},${runningDebt[i].toFixed(2)},${collected > 0 ? collected.toFixed(2) : ""}\n`;
        rowCount++;
      });
    });
  });
  return { csv, rowCount, startDate: allDates[0], endDate: allDates[allDates.length - 1] };
}

export function getThisWeekMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export async function loadArchives() {
  const snap = await getDocs(collection(db, "archives"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.weekMonday.localeCompare(a.weekMonday));
}

export async function triggerArchiveIfNeeded(data) {
  const thisMonday = getThisWeekMonday();
  const snap = await getDocs(collection(db, "archives"));
  const alreadyDone = snap.docs.some(d => d.data().weekMonday === thisMonday);
  if (alreadyDone) return;
  const built = buildCSV(data);
  if (!built) return;
  const { csv, rowCount, startDate, endDate } = built;
  await addDoc(collection(db, "archives"), { weekMonday: thisMonday, archivedOn: todayStr(), rowCount, startDate, endDate, csv });
}

export function exportCSVFile(db_data, repPeriod, shopKura, shopRail, addDaysFn, toast$) {
  const t = todayStr(); let s = t;
  if (repPeriod === "week") s = addDaysFn(t, -6);
  if (repPeriod === "month") s = addDaysFn(t, -29);
  const runningDebt = {};
  db_data.shops.forEach((_, i) => { runningDebt[i] = db_data.debts?.[i] || 0; });
  Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
    if (date < s || date > t) return;
    Object.entries(shops).forEach(([idx, sess]) => {
      const i = parseInt(idx);
      SESS.forEach(sv => { const d = sess[sv.id]; if (!d) return; const k = d.given?.kura || 0, r = d.given?.damiryolu || 0; runningDebt[i] -= k * shopKura(i) + r * shopRail(i); });
    });
  });
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
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bread-delivery-${repPeriod}.csv`;
  a.click();
  toast$("CSV yüklənir…");
}
