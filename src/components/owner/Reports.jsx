import { useState } from "react";
import { c } from "../../styles/styles";
import { todayStr, addDays, fmtDate } from "../../utils/dates";
import { SESS } from "../../constants";
import { exportCSVFile } from "../../services/archive";

export default function Reports({ db_data, repPeriod, setRepPeriod, calcStats, shopKura, shopRail, toast$ }) {
  const t = todayStr();
  const [rangeFrom, setRangeFrom] = useState(addDays(t, -6));
  const [rangeTo, setRangeTo] = useState(t);
  const [expandedDate, setExpandedDate] = useState(null);

  let s = t;
  if (repPeriod === "week")  s = addDays(t, -6);
  if (repPeriod === "month") s = addDays(t, -29);
  if (repPeriod === "range") s = rangeFrom;
  const end = repPeriod === "range" ? rangeTo : t;

  const dateRows = [];
  Object.entries(db_data?.deliveries || {}).sort().reverse().forEach(([date, shops]) => {
    if (date < s || date > end) return;
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
    if (dGK || dGR) {
      const yigilan = Object.values(db_data.debtPayments?.[date] || {}).reduce((a, b) => a + b, 0);
      const xercler = (db_data.expenses?.[date] || []).reduce((a, e) => a + e.amount, 0);
      const tehvil  = db_data.handovers?.[date] || 0;
      dateRows.push({ date, dGK, dGR, dLK, dLR, dRev, yigilan, xercler, tehvil });
    }
  });

  const totalRev = dateRows.reduce((a, r) => a + r.dRev, 0);

  const Cell = ({ label, value, color }) => (
    <div style={{ background: "var(--bg)", borderRadius: 10, padding: "8px 12px", border: `1px solid ${color === "red" ? "#fca5a5" : "var(--border)"}` }}>
      <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color === "red" ? "#dc2626" : color === "green" ? "var(--success-text)" : "var(--text)" }}>{value}</div>
    </div>
  );

  return (
    <div style={c.pad}>
      {/* Period buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {[["day","Bu gün"],["week","7 gün"],["month","30 gün"],["range","Aralıq"]].map(([p,l]) => (
          <button key={p} style={c.periodBtn(repPeriod===p)} onClick={() => setRepPeriod(p)}>{l}</button>
        ))}
      </div>

      {/* Tarix aralığı */}
      {repPeriod === "range" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <input type="date" value={rangeFrom} max={rangeTo}
            onChange={e => setRangeFrom(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }} />
          <span style={{ color: "var(--text2)", fontSize: 13 }}>—</span>
          <input type="date" value={rangeTo} min={rangeFrom} max={t}
            onChange={e => setRangeTo(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }} />
        </div>
      )}

      {/* Ümumi xülasə banneri */}
      {dateRows.length > 0 && (
        <div style={{ background: "var(--accent)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--bg)", fontWeight: 600 }}>{dateRows.length} gün · Ümumi dövriyyə</span>
          <span style={{ fontSize: 16, color: "var(--bg)", fontWeight: 700 }}>{totalRev.toFixed(2)} ₼</span>
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Tarix üzrə</div>
      <div style={c.listCard}>
        {dateRows.length ? dateRows.map((row, i) => {
          const isOpen = expandedDate === row.date;
          const kassaNet = row.yigilan - row.xercler - row.tehvil;
          const isLast = i === dateRows.length - 1;
          return (
            <div key={row.date}>
              {/* Tarix sətri */}
              <div
                style={{ ...c.listRow(isLast && !isOpen), cursor: "pointer", userSelect: "none" }}
                onClick={() => setExpandedDate(isOpen ? null : row.date)}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(row.date)}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                    Kura: {row.dGK} · Damiryolu: {row.dGR} · Qaytarılan: {row.dLK + row.dLR}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{row.dRev.toFixed(2)} ₼</span>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Açılan detal */}
              {isOpen && (
                <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "12px 14px", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                  {/* Çörək məlumatları */}
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Çörək</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                    <Cell label="Kura verilən"       value={row.dGK} />
                    <Cell label="Damiryolu verilən"  value={row.dGR} />
                    <Cell label="Qaytarılan"         value={row.dLK + row.dLR || "—"} />
                  </div>

                  {/* Maliyyə məlumatları */}
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Maliyyə</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    <Cell label="Dövriyyə"         value={row.dRev.toFixed(2) + " ₼"} />
                    <Cell label="Yığılan pul"      value={row.yigilan > 0 ? row.yigilan.toFixed(2) + " ₼" : "—"} color={row.yigilan > 0 ? "green" : ""} />
                    <Cell label="Xərclər"          value={row.xercler > 0 ? "-" + row.xercler.toFixed(2) + " ₼" : "—"} color={row.xercler > 0 ? "red" : ""} />
                    <Cell label="Sahibkara verilən" value={row.tehvil > 0 ? row.tehvil.toFixed(2) + " ₼" : "—"} />
                  </div>

                  {/* Kassa qalığı */}
                  <div style={{ background: kassaNet >= 0 ? "var(--bg)" : "#fff1f1", borderRadius: 10, padding: "10px 14px", border: `1px solid ${kassaNet >= 0 ? "var(--border)" : "#fca5a5"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>💵 Kassa qalığı (o gün)</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: kassaNet >= 0 ? "var(--text)" : "#dc2626" }}>{kassaNet.toFixed(2)} ₼</span>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: 13, color: "var(--text2)" }}>Bu dövr üçün məlumat yoxdur.</div>
        )}
      </div>

      <button style={c.outlineBtn} onClick={() => exportCSVFile(db_data, repPeriod, shopKura, shopRail, addDays, toast$)}>
        ⬇ CSV / Excel ixrac et
      </button>
    </div>
  );
}
