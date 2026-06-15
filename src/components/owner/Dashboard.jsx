import { useState } from "react";
import { c } from "../../styles/styles";
import { todayStr, addDays } from "../../utils/dates";
import { EXP_CATS, SESS } from "../../constants";

export default function Dashboard({ db_data, dashPeriod, setDashPeriod, calcStats, calcExpenses, saveHandover, saveKassaAdjustment }) {
  const [handoverInput, setHandoverInput] = useState("");
  const [kassaInput, setKassaInput] = useState("");
  const [showKassaEdit, setShowKassaEdit] = useState(false);

  const { totGK, totGR, totLK, totLR, totRev, totCollected, ss } = calcStats(dashPeriod);
  const { totExp } = calcExpenses(dashPeriod);

  const t = todayStr();
  let s = t;
  if (dashPeriod === "week") s = addDays(t, -6);
  if (dashPeriod === "month") s = addDays(t, -29);

  const totHandover = Object.entries(db_data.handovers || {})
    .filter(([d]) => d >= s && d <= t)
    .reduce((a, [, v]) => a + v, 0);

  // Qaytarılan çörəyin dəyəri
  const totReturnVal = (() => {
    let val = 0;
    Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.entries(shops).forEach(([idx]) => {
        const i = parseInt(idx);
        const d = shops[idx]["morning"]; if (!d) return;
        const lk = d.leftover?.kura || 0;
        const lr = d.leftover?.damiryolu || 0;
        const kPrice = db_data.shops[i]?.kura ?? db_data.prices?.kura ?? 0.55;
        const rPrice = db_data.shops[i]?.damiryolu ?? db_data.prices?.damiryolu ?? 0.60;
        val += lk * kPrice + lr * rPrice;
      });
    });
    return parseFloat(val.toFixed(2));
  })();

  // Borclar tabı ilə eyni məntiq — seçilmiş dövr üçün borc hesablaması
  const calcDebtForPeriod = () => {
    let dayGiven = 0, prevDebt = 0, gunSonu = 0;
    db_data.shops.forEach((shop, i) => {
      let debtUpToEnd = 0, debtUpToStart = 0;
      Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
        const shopSess = shops[i] || {};
        SESS.forEach(sv => {
          const d = shopSess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0;
          const dd = d.given?.damiryolu || 0;
          const lk = sv.id === "morning" ? (d.leftover?.kura || 0) : 0;
          const ld = sv.id === "morning" ? (d.leftover?.damiryolu || 0) : 0;
          const val = Math.max(0, k - lk) * (shop.kura ?? db_data.prices.kura) +
                      Math.max(0, dd - ld) * (shop.damiryolu ?? db_data.prices.damiryolu);
          if (date <= t) debtUpToEnd += val;
          if (date < s)  debtUpToStart += val;
          if (date >= s && date <= t) dayGiven += val;
        });
      });
      Object.entries(db_data.debtPayments || {}).forEach(([date, payments]) => {
        const v = payments[i] || payments[String(i)] || 0;
        if (date <= t) debtUpToEnd -= v;
        if (date < s)  debtUpToStart -= v;
      });
      gunSonu += debtUpToEnd;
      prevDebt += debtUpToStart;
    });
    return {
      dayGiven: parseFloat(dayGiven.toFixed(2)),
      prevDebt: parseFloat(prevDebt.toFixed(2)),
      gunSonu: parseFloat(gunSonu.toFixed(2)),
    };
  };

  const { dayGiven, prevDebt, gunSonu } = calcDebtForPeriod();

  const kassaBalance = (() => {
    const allDates = [...new Set([
      ...Object.keys(db_data.debtPayments || {}),
      ...Object.keys(db_data.expenses || {}),
      ...Object.keys(db_data.handovers || {}),
    ])].sort();
    let kassa = db_data.kassaAdjustment || 0;
    allDates.forEach(date => {
      const yigilan = Object.values(db_data.debtPayments?.[date] || {}).reduce((a, b) => a + b, 0);
      const exp = (db_data.expenses?.[date] || []).reduce((a, e) => a + e.amount, 0);
      const tehvil = db_data.handovers?.[date] !== undefined ? db_data.handovers[date] : 0;
      kassa += yigilan - exp - tehvil;
    });
    return parseFloat(kassa.toFixed(2));
  })();

  const todayHandover = db_data.handovers?.[todayStr()] || 0;

  const revs = db_data.shops
    .map((shop, i) => ({ name: shop.name, rev: ss[i]?.rev || 0 }))
    .filter(x => x.rev > 0)
    .sort((a, b) => b.rev - a.rev);
  const maxR = revs.length ? revs[0].rev : 1;

  return (
    <div style={c.pad}>
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
        {[["day","Bu gün"],["week","7 gün"],["month","30 gün"]].map(([p,l]) => (
          <button key={p} style={c.periodBtn(dashPeriod===p)} onClick={() => setDashPeriod(p)}>{l}</button>
        ))}
      </div>

      {/* Dövriyyə */}
      <div style={{ ...c.metric, marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Dövriyyə</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{totRev.toFixed(2)} ₼</div>
      </div>

      {/* Borc bloku — Borclar tabı ilə eyni məntiq */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div style={c.metric}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Bu günkü borc</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: dayGiven > 0 ? "#dc2626" : "var(--text)" }}>
            {dayGiven > 0 ? dayGiven.toFixed(2) + " ₼" : "—"}
          </div>
        </div>
        <div style={c.metricGreen}>
          <div style={{ fontSize: 11, color: "var(--collected-text)", marginBottom: 3, fontWeight: 600 }}>Yığılan pul</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--collected-text)" }}>
            {totCollected > 0 ? totCollected.toFixed(2) + " ₼" : "—"}
          </div>
        </div>
        <div style={c.metric}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Qaytarılan çörək</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: totReturnVal > 0 ? "var(--success-text)" : "var(--text)" }}>
            {totReturnVal > 0 ? `-${totReturnVal.toFixed(2)} ₼` : "—"}
          </div>
          {(totLK > 0 || totLR > 0) && (
            <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>K:{totLK} · D:{totLR}</div>
          )}
        </div>
        <div style={{ ...c.metric, border: `1px solid ${gunSonu > 0 ? "#fca5a5" : "var(--border)"}` }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Gün sonu borcu</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: gunSonu > 0 ? "#dc2626" : gunSonu < 0 ? "var(--success-text)" : "var(--text)" }}>
            {gunSonu.toFixed(2)} ₼
          </div>
        </div>
      </div>

      {/* Kassa */}
      <div style={{ ...c.metric, marginBottom: 8, border: `1px solid ${kassaBalance >= 0 ? "var(--border)" : "#fca5a5"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>💵 Kassa</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: kassaBalance >= 0 ? "var(--text)" : "#dc2626" }}>
              {kassaBalance.toFixed(2)} ₼
            </div>
          </div>
          <button onClick={() => { setShowKassaEdit(!showKassaEdit); setKassaInput(kassaBalance.toFixed(2)); }}
            style={{ fontSize: 11, padding: "4px 10px", border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text2)", cursor: "pointer" }}>
            ✏️ Düzəlt
          </button>
        </div>
        {showKassaEdit && (
          <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6 }}>Kassanın olması lazım olan məbləğini daxil edin</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" step={0.01} value={kassaInput} onChange={e => setKassaInput(e.target.value)}
                placeholder={kassaBalance.toFixed(2)}
                style={{ flex: 1, padding: "8px 10px", fontSize: 15, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
              <span style={{ fontSize: 14, color: "var(--text2)" }}>₼</span>
              <button style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}
                onClick={() => { saveKassaAdjustment(kassaInput); setShowKassaEdit(false); }}>Saxla</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 6 }}>Cari kassa: {kassaBalance.toFixed(2)} ₼</div>
          </div>
        )}
      </div>

      {/* Təhvil verilən */}
      <div style={{ ...c.metric, marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Təhvil verilən</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{totHandover > 0 ? `${totHandover.toFixed(2)} ₼` : "—"}</div>
      </div>

      {/* Xərclər */}
      {totExp > 0 && (
        <div style={{ ...c.metric, marginBottom: 8, border: "1px solid #fca5a5" }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Xərclər</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>-{totExp.toFixed(2)} ₼</div>
          <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {EXP_CATS.filter(cat => {
              let sum = 0;
              Object.entries(db_data.expenses || {}).forEach(([date, entries]) => {
                if (date >= s && date <= t) entries.filter(e => e.cat === cat.id).forEach(e => { sum += e.amount; });
              });
              return sum > 0;
            }).map(cat => {
              let sum = 0;
              Object.entries(db_data.expenses || {}).forEach(([date, entries]) => {
                if (date >= s && date <= t) entries.filter(e => e.cat === cat.id).forEach(e => { sum += e.amount; });
              });
              return (
                <div key={cat.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>{cat.icon} {cat.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>{sum.toFixed(2)} ₼</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Təhvil daxil et */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Təhvil daxil et</div>
      <div style={{ ...c.block, marginBottom: "1rem" }}>
        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
          Sürücünün bu gün sahibkara verdiyi məbləğ
          {todayHandover > 0 && <span style={{ color: "var(--success-text)", marginLeft: 8 }}>Cari: {todayHandover.toFixed(2)} ₼</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="number" min={0} step={0.01} value={handoverInput} onChange={e => setHandoverInput(e.target.value)}
            placeholder="0.00"
            style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
          <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
          <button style={{ padding: "10px 16px", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}
            onClick={() => { saveHandover(handoverInput); setHandoverInput(""); }}>Saxla</button>
        </div>
      </div>

      {/* Çörək hesabatı */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Çörək hesabatı</div>
      <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "5px 8px", fontSize: 10, fontWeight: 700, color: "var(--text2)", textAlign: "left", background: "var(--bg2)", border: "1px solid var(--border)" }}></th>
              <th colSpan={3} style={{ padding: "5px 8px", fontSize: 10, fontWeight: 700, color: "var(--text2)", textAlign: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderBottom: "none" }}>Verilən</th>
              <th colSpan={3} style={{ padding: "5px 8px", fontSize: 10, fontWeight: 700, color: "var(--text2)", textAlign: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderBottom: "none" }}>Qaytarılan</th>
            </tr>
            <tr>
              <th style={{ padding: "5px 8px", fontSize: 10, fontWeight: 700, color: "var(--text2)", textAlign: "left", background: "var(--bg2)", border: "1px solid var(--border)" }}></th>
              {["Kura","Damiryolu","Ümumi","Kura","Damiryolu","Ümumi"].map((h,i) => (
                <th key={i} style={{ padding: "5px 8px", fontSize: 10, fontWeight: 700, color: "var(--text2)", textAlign: "center", background: "var(--bg2)", border: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 600, border: "1px solid var(--border)" }}>Cəmi</td>
              <td style={{ padding: "7px 8px", fontSize: 12, textAlign: "center", border: "1px solid var(--border)" }}>{totGK}</td>
              <td style={{ padding: "7px 8px", fontSize: 12, textAlign: "center", border: "1px solid var(--border)" }}>{totGR}</td>
              <td style={{ padding: "7px 8px", fontSize: 12, textAlign: "center", border: "1px solid var(--border)", fontWeight: 700 }}>{totGK + totGR}</td>
              <td style={{ padding: "7px 8px", fontSize: 12, textAlign: "center", border: "1px solid var(--border)" }}>{totLK || "—"}</td>
              <td style={{ padding: "7px 8px", fontSize: 12, textAlign: "center", border: "1px solid var(--border)" }}>{totLR || "—"}</td>
              <td style={{ padding: "7px 8px", fontSize: 12, textAlign: "center", border: "1px solid var(--border)", fontWeight: 700 }}>{(totLK + totLR) || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mağazalar üzrə gəlir */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mağazalar üzrə gəlir</div>
      {revs.length ? revs.map(x => (
        <div key={x.name} className="bar-row">
          <span className="bar-label">{x.name}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(x.rev / maxR * 100)}%` }}></div></div>
          <span style={{ fontSize: 12, fontWeight: 500, minWidth: 40 }}>{x.rev.toFixed(1)}₼</span>
        </div>
      )) : <div style={{ textAlign: "center", padding: "1.5rem", fontSize: 13, color: "var(--text2)" }}>Hələ məlumat yoxdur.</div>}
    </div>
  );
}
