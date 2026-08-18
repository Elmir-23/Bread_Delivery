import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { todayStr, addDays } from "../utils/dates";
import { SESS } from "../constants";

// Budanacaq / arxivlənəcək tarix-açarlı sahələr. `debts` bura DAXİL DEYİL —
// o, ayrıca idarə olunan cari balansdır və budama onu heç vaxt toxunmamalıdır.
const PRUNE_FIELDS = ["deliveries", "debtPayments", "expenses", "sweets", "handovers"];

// opts.from / opts.to verilərsə (YYYY-MM-DD), yalnız bu aralıqdakı sətirlər
// CSV-yə yazılır. Borc hesablaması isə HƏMİŞƏ tam tarixçə üzərində gedir —
// əks halda pəncərədən kənar illərin təsiri ilə balans səhv çıxar.
export function buildCSV(data, opts = {}) {
  const { from = null, to = null } = opts;
  const { deliveries, debtPayments, debts, shops, prices } = data;
  const shopKuraP = (i) => shops[i]?.kura ?? prices?.kura ?? 0.55;
  const shopDamiP = (i) => shops[i]?.damiryolu ?? prices?.damiryolu ?? 0.65;
  const SESS_IDS = ["morning", "afternoon", "evening"];
  const SESS_LABELS = { morning: "Səhər", afternoon: "Günorta", evening: "Axşam" };
  const allDates = Object.keys(deliveries || {}).sort();
  if (!allDates.length) return null;
  const inWindow = (d) => (!from || d >= from) && (!to || d <= to);

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
  let firstRowDate = null, lastRowDate = null;
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
        // Borc vəziyyəti yuxarıda YENİLƏNDİ — sətir yalnız pəncərə daxilindədirsə yazılır.
        if (!inWindow(date)) return;
        csv += `${date},${shopName},${SESS_LABELS[sv]},${k},${r},${shopKuraP(i).toFixed(2)},${shopDamiP(i).toFixed(2)},${rev.toFixed(2)},${lk},${lr},${runningDebt[i].toFixed(2)},${collected > 0 ? collected.toFixed(2) : ""}\n`;
        rowCount++;
        if (!firstRowDate) firstRowDate = date;
        lastRowDate = date;
      });
    });
  });
  if (!rowCount) return null;
  return { csv, rowCount, startDate: firstRowDate, endDate: lastRowDate };
}

export function getTodayKey() {
  return todayStr();
}

const CSV_HEADER = "Date,Shop,Session,Kura Given,Damiryolu Given,Kura Price,Damiryolu Price,Revenue,Leftover Kura,Leftover Damiryolu,Debt,Collected Money\n";
const yearDocId = (year) => `year_${year}`;
const META_DOC_ID = "meta"; // "bu gün artıq işlənib" yoxlaması üçün — Arxivlər siyahısında göstərilmir

export async function loadArchives() {
  const snap = await getDocs(collection(db, "archives"));
  return snap.docs
    .filter(d => d.id !== META_DOC_ID)
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.archivedOn || "").localeCompare(a.archivedOn || ""));
}

// Gündə bir dəfə: `keepDays`-dan köhnə tarixləri həmin ilin TƏK faylına ƏLAVƏ edir
// (yeni gün, yeni sənəd YOX — cari il faylı sadəcə YENİLƏNİR) və uğurlu yazıdan
// SONRA canlı sənəddən silir. Arxiv uğursuz olarsa budama HEÇ VAXT baş vermir.
// İl üzrə ayrı sənəd saxlanılır ki, fayl illər keçdikcə Firestore-un 1MB sənəd
// limitinə çatmasın (əks halda tək sonsuz fayl bir gün yenə bu problemi yaradar).
// Qaytarır: budanmış tam `data` obyekti (yazmaq üçün), və ya null (ediləcək iş yoxdursa).
export async function archiveAndPruneIfNeeded(data, keepDays = 60) {
  const today = todayStr();
  const metaRef = doc(db, "archives", META_DOC_ID);

  try {
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists() && metaSnap.data().lastPruneRun === today) return null; // bu gün artıq işlənib
  } catch (e) {
    console.error("archiveAndPruneIfNeeded (yoxlama) xətası:", e);
    return null;
  }

  const cutoff = addDays(today, -keepDays);
  const oldDateSet = new Set();
  PRUNE_FIELDS.forEach(f => {
    Object.keys(data?.[f] || {}).forEach(d => { if (d < cutoff) oldDateSet.add(d); });
  });

  if (oldDateSet.size === 0) {
    try { await setDoc(metaRef, { lastPruneRun: today }, { merge: true }); }
    catch (e) { console.error("archiveAndPruneIfNeeded (meta yazma) xətası:", e); }
    return null;
  }

  const built = buildCSV(data, { to: addDays(cutoff, -1) });
  if (built) {
    const year = built.endDate.slice(0, 4);
    const yearRef = doc(db, "archives", yearDocId(year));
    let existing = null;
    try {
      const s = await getDoc(yearRef);
      existing = s.exists() ? s.data() : null;
    } catch (e) {
      console.error(`archiveAndPruneIfNeeded (${year} oxuma) xətası:`, e);
      return null; // arxivə əlavə edilə bilmədi — budama BAŞ VERMİR
    }

    const newLines = built.csv.split("\n").slice(1).filter(Boolean); // başlıq sətrini atla
    const csv = (existing?.csv || CSV_HEADER) + newLines.join("\n") + (newLines.length ? "\n" : "");
    const rowCount = (existing?.rowCount || 0) + built.rowCount;
    const startDate = existing?.startDate && existing.startDate < built.startDate ? existing.startDate : built.startDate;
    const endDate = existing?.endDate && existing.endDate > built.endDate ? existing.endDate : built.endDate;

    try {
      await setDoc(yearRef, { archivedOn: endDate, year, csv, rowCount, startDate, endDate, updatedAt: Date.now() });
    } catch (e) {
      // Fayla yazıla bilmədi — budama DAYANDIRILIR, canlı data toxunulmaz qalır.
      console.error(`archiveAndPruneIfNeeded (${year} yazma) xətası:`, e);
      return null;
    }
  }

  try { await setDoc(metaRef, { lastPruneRun: today }, { merge: true }); }
  catch (e) { console.error("archiveAndPruneIfNeeded (meta yazma) xətası:", e); }

  // Arxiv uğurla yazıldı — indi köhnə açarları canlı obyektdən sil (dərin-kopya ilə).
  const pruned = {};
  PRUNE_FIELDS.forEach(f => {
    const src = data?.[f] || {};
    const copy = {};
    Object.entries(src).forEach(([d, v]) => { if (!(d < cutoff)) copy[d] = v; });
    pruned[f] = copy;
  });

  return { ...data, ...pruned };
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
