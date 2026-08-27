import { useState } from "react";
import { c } from "../styles/styles";
import { todayStr, addDays, fmtDate } from "../utils/dates";
import { SESS } from "../constants";
import { calcKassa } from "../utils/kassa";

export default function Borclar({ db_data }) {
  const TODAY = todayStr();
  const [selDate, setSelDate] = useState(TODAY);
  const isToday = selDate === TODAY;

  const selDeliveries = db_data.deliveries?.[selDate] || {};
  const selPayments = db_data.debtPayments?.[selDate] || {};

  const shopRows = [];

  db_data.shops.forEach((shop, i) => {
    const sessDatas = selDeliveries[i] || {};
    let dayGiven = 0;
    let dayReturn = 0;

    SESS.forEach(sv => {
      const d = sessDatas[sv.id];
      if (!d) return;
      const k = d.given?.kura || 0;
      const dd = d.given?.damiryolu || 0;
      const lk = sv.id === "morning" ? (d.leftover?.kura || 0) : 0;
      const ld = sv.id === "morning" ? (d.leftover?.damiryolu || 0) : 0;
      const netK = Math.max(0, k - lk);
      const netD = Math.max(0, dd - ld);
      dayGiven += netK * (shop.kura ?? db_data.prices.kura) + netD * (shop.damiryolu ?? db_data.prices.damiryolu);
      dayReturn += lk * (shop.kura ?? db_data.prices.kura) + ld * (shop.damiryolu ?? db_data.prices.damiryolu);
    });

    const yigilan = selPayments[i] || selPayments[String(i)] || 0;

    // Gün sonuna qədər borc — bugünkü authoritative db_data.debts[i]-dən GERİYƏ
    // hesablanır (əvvəllər olduğu kimi ən erkən tarixdən SIFIRDAN irəli YOX).
    // Bu üsul arxivləşdirmə (60 gündən köhnə datanın silinməsi) və açılış
    // balanslarından TƏSİRLƏNMİR, çünki yalnız selDate-dən bu günə qədər olan
    // (həmişə canlı qalan) araliqdaki hərəkətlərdən istifadə edir.
    let debtUpToDate = db_data.debts?.[i] || 0;
    if (!isToday) {
      Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
        if (date <= selDate || date > TODAY) return;
        const shopSess = shops[i] || {};
        SESS.forEach(sv => {
          const d = shopSess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0;
          const dd = d.given?.damiryolu || 0;
          const lk = sv.id === "morning" ? (d.leftover?.kura || 0) : 0;
          const ld = sv.id === "morning" ? (d.leftover?.damiryolu || 0) : 0;
          debtUpToDate -= Math.max(0, k - lk) * (shop.kura ?? db_data.prices.kura);
          debtUpToDate -= Math.max(0, dd - ld) * (shop.damiryolu ?? db_data.prices.damiryolu);
        });
      });
      Object.entries(db_data.debtPayments || {}).forEach(([date, payments]) => {
        if (date <= selDate || date > TODAY) return;
        debtUpToDate += payments[i] || payments[String(i)] || 0;
      });
    }

    const gunSonu = parseFloat(debtUpToDate.toFixed(2));
    const evvelki = parseFloat((gunSonu - dayGiven + yigilan).toFixed(2));

    if (dayGiven === 0 && evvelki === 0 && yigilan === 0 && dayReturn === 0) return;

    shopRows.push({ i, name: shop.name, evvelki, dayGiven, yigilan, dayReturn, gunSonu });
  });

  const totEvvelki   = shopRows.reduce((a, r) => a + r.evvelki, 0);
  const totDayGiven  = shopRows.reduce((a, r) => a + r.dayGiven, 0);
  const totYigilan   = shopRows.reduce((a, r) => a + r.yigilan, 0);
  const totReturn    = shopRows.reduce((a, r) => a + r.dayReturn, 0);
  const totGunSonu   = shopRows.reduce((a, r) => a + r.gunSonu, 0);
  const totUmumiBorc = parseFloat((totEvvelki + totDayGiven).toFixed(2));

  // Kassa qalığı — Dashboard ilə eyni ortaq hesablama (src/utils/kassa.js).
  // kassaStart ("günə başlanan qalıq") təhvil təsdiqlənən anda dondurulur, canlı
  // saata görə gecə yarısı sıçramır.
  const { kassaBalance, kassaStart, dayStartStale, dayStartDate, dayStartDrift } = calcKassa(db_data, TODAY);

  const thStyle = (center) => ({
    padding: "6px 8px", fontSize: 10, fontWeight: 700,
    color: "var(--text2)", textAlign: center ? "center" : "left",
    background: "var(--bg2)", border: "1px solid var(--border)", whiteSpace: "nowrap"
  });
  const tdStyle = (color, bold, bg) => ({
    padding: "8px 8px", fontSize: 12, textAlign: "center",
    border: "1px solid var(--border)",
    color: color || "var(--text)",
    fontWeight: bold ? 700 : 400,
    background: bg || "transparent",
    whiteSpace: "nowrap"
  });
  const tdLStyle = (bold, bg) => ({
    padding: "8px 10px", fontSize: 12, textAlign: "left",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontWeight: bold ? 700 : 400,
    background: bg || "transparent",
    whiteSpace: "nowrap"
  });

  return (
    <div style={{ padding: "1rem 0" }}>

      {/* Kassa qalığı — daimi, read-only (tarixdən asılı deyil) */}
      <div style={{ padding: "0 1rem", marginBottom: 14 }}>
        <div style={{ ...c.metric, border: `1px solid ${kassaBalance >= 0 ? "var(--border)" : "#fca5a5"}` }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>💵 Kassa qalığı</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: kassaBalance >= 0 ? "var(--text)" : "#dc2626" }}>
            {kassaBalance.toFixed(2)} ₼
          </div>
          <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
            Günə başlanan qalıq: <span style={{ fontWeight: 600, color: "var(--text)" }}>{kassaStart.toFixed(2)} ₼</span>
          </div>
          {dayStartStale && (
            <div style={{ fontSize: 11, color: "#b45309", marginTop: 4, lineHeight: 1.5 }}>
              ⚠️ {fmtDate(dayStartDate)} tarixinə aid data gün bağlandıqdan sonra dəyişib
              (fərq: {dayStartDrift > 0 ? "+" : ""}{dayStartDrift.toFixed(2)} ₼).
              Yuxarıdan həmin tarixə keçib yoxlayın — sonradan silinmiş/dəyişdirilmiş
              yığılan pul, xərc və ya şirniyyat qeydi ola bilər.
            </div>
          )}
        </div>
      </div>

      {/* Tarix naviqasiyası */}
      <div style={{ ...c.dateRow, padding: "0 1rem", marginBottom: 12 }}>
        <button style={c.dateBtn(false)} onClick={() => setSelDate(d => addDays(d, -1))}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{isToday ? "Bu gün — " : ""}{fmtDate(selDate)}</span>
        <button style={c.dateBtn(isToday)} onClick={() => { if (!isToday) setSelDate(d => addDays(d, 1)); }}>›</button>
      </div>

      {/* Kartlar — 3 sırada: Yığılan → Qaytarılan → Gün sonu */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 1rem", marginBottom: "1rem" }}>
        <div style={c.metricGreen}>
          <div style={{ fontSize: 10, color: "var(--collected-text)", marginBottom: 3, fontWeight: 600 }}>Yığılan pul</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--collected-text)" }}>
            {totYigilan > 0 ? totYigilan.toFixed(2) + " ₼" : "—"}
          </div>
        </div>
        <div style={c.metric}>
          <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Qaytarılan çörək</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            {totReturn > 0 ? `-${totReturn.toFixed(2)} ₼` : "—"}
          </div>
        </div>
        <div style={{ ...c.metric, border: `1px solid ${totGunSonu > 0 ? "#fca5a5" : "var(--border)"}` }}>
          <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Gün sonu borc</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: totGunSonu > 0 ? "#dc2626" : totGunSonu < 0 ? "var(--success-text)" : "var(--text)" }}>
            {totGunSonu.toFixed(2)} ₼
          </div>
        </div>
      </div>

      {/* Cədvəl */}
      {shopRows.length === 0 ? (
        <div style={{ ...c.block, margin: "0 1rem", textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "2rem" }}>
          Bu tarix üçün məlumat yoxdur.
        </div>
      ) : (
        <div style={{ margin: "0 1rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th style={thStyle(false)}>Mağaza</th>
                <th style={thStyle(true)}>Əvvəlki borc</th>
                <th style={thStyle(true)}>Bu günkü</th>
                <th style={thStyle(true)}>Yığılan</th>
                <th style={thStyle(true)}>Qaytarılan</th>
                <th style={thStyle(true)}>Gün sonu</th>
              </tr>
            </thead>
            <tbody>
              {shopRows.map((r, ri) => (
                <tr key={r.i} style={{ background: ri % 2 === 0 ? "var(--bg)" : "var(--bg2)" }}>
                  <td style={tdLStyle(true)}>{r.name}</td>
                  <td style={tdStyle(r.evvelki > 0 ? "#dc2626" : r.evvelki < 0 ? "var(--success-text)" : "var(--text2)")}>
                    {r.evvelki !== 0 ? r.evvelki.toFixed(2) : "—"}
                  </td>
                  <td style={tdStyle("#dc2626")}>
                    {r.dayGiven > 0 ? r.dayGiven.toFixed(2) : "—"}
                  </td>
                  <td style={tdStyle("var(--success-text)")}>
                    {r.yigilan > 0 ? r.yigilan.toFixed(2) : "—"}
                  </td>
                  <td style={tdStyle("var(--text2)")}>
                    {r.dayReturn > 0 ? `-${r.dayReturn.toFixed(2)}` : "—"}
                  </td>
                  <td style={tdStyle(r.gunSonu > 0 ? "#dc2626" : r.gunSonu < 0 ? "var(--success-text)" : "var(--text2)", true)}>
                    {r.gunSonu !== 0 ? r.gunSonu.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
              {/* Cəmi sətiri */}
              <tr style={{ background: "var(--bg2)", borderTop: "2px solid var(--border2)" }}>
                <td style={tdLStyle(true, "var(--bg2)")}>📊 Cəmi</td>
                <td style={tdStyle(totEvvelki > 0 ? "#dc2626" : totEvvelki < 0 ? "var(--success-text)" : "var(--text2)", true, "var(--bg2)")}>
                  {totEvvelki !== 0 ? totEvvelki.toFixed(2) : "—"}
                </td>
                <td style={tdStyle("#dc2626", true, "var(--bg2)")}>
                  {totDayGiven > 0 ? totDayGiven.toFixed(2) : "—"}
                </td>
                <td style={tdStyle("var(--success-text)", true, "var(--bg2)")}>
                  {totYigilan > 0 ? totYigilan.toFixed(2) : "—"}
                </td>
                <td style={tdStyle("var(--text2)", true, "var(--bg2)")}>
                  {totReturn > 0 ? `-${totReturn.toFixed(2)}` : "—"}
                </td>
                <td style={tdStyle(totGunSonu > 0 ? "#dc2626" : totGunSonu < 0 ? "var(--success-text)" : "var(--text2)", true, "var(--bg2)")}>
                  {totGunSonu.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
