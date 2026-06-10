import { c } from "../../styles/styles";
import { EXP_CATS } from "../../constants";

export default function Dashboard({ db_data, dashPeriod, setDashPeriod, calcStats, calcExpenses, editDebtShop, setEditDebtShop, editDebtVal, setEditDebtVal, saveEditDebt }) {
  const { totGK, totGR, totLK, totLR, totRev, totCollected } = calcStats(dashPeriod);
  const totalDebt = Object.values(db_data.debts || {}).reduce((a, b) => a + b, 0);

  const { totExp, byCat } = calcExpenses(dashPeriod);

  const revs = db_data.shops
    .map((s, i) => ({ name: s.name, rev: calcStats(dashPeriod).ss[i]?.rev || 0 }))
    .filter(x => x.rev > 0)
    .sort((a, b) => b.rev - a.rev);
  const maxR = revs.length ? revs[0].rev : 1;

  const thStyle = (center) => ({
    padding: "6px 8px", fontSize: 10, fontWeight: 700,
    color: "var(--text2)", textAlign: center ? "center" : "left",
    background: "var(--bg2)", border: "1px solid var(--border)", whiteSpace: "nowrap"
  });
  const tdStyle = (color, bold) => ({
    padding: "7px 8px", fontSize: 12, textAlign: "center",
    border: "1px solid var(--border)",
    color: color || "var(--text)",
    fontWeight: bold ? 700 : 400,
    whiteSpace: "nowrap"
  });
  const tdLStyle = (bold) => ({
    padding: "7px 10px", fontSize: 12, textAlign: "left",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontWeight: bold ? 700 : 400,
    whiteSpace: "nowrap"
  });

  return (
    <div style={c.pad}>
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
        {[["day","Bu gün"],["week","7 gün"],["month","30 gün"]].map(([p,l]) => (
          <button key={p} style={c.periodBtn(dashPeriod===p)} onClick={() => setDashPeriod(p)}>{l}</button>
        ))}
      </div>

      {/* Gəlir */}
      <div style={{ ...c.metric, marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Gəlir</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{totRev.toFixed(2)} ₼</div>
      </div>

      {/* Ümumi borc + yığılan */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div style={{ ...c.metric }}>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>Ümumi borc</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: totalDebt > 0 ? "#dc2626" : totalDebt < 0 ? "var(--success-text)" : "var(--text)" }}>
            {totalDebt.toFixed(2)} ₼
          </div>
        </div>
        <div style={{ ...c.metricGreen }}>
          <div style={{ fontSize: 11, color: "var(--collected-text)", marginBottom: 3, fontWeight: 600 }}>Ümumi yığılan</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--collected-text)" }}>
            {totCollected.toFixed(2)} ₼
          </div>
        </div>
      </div>

      {/* Xərclər */}
      {totExp > 0 && (
        <div style={{ ...c.metric, marginBottom: 8, border: "1px solid #fca5a5" }}>
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
      )}

      {/* Çörək hesabatı */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Çörək hesabatı</div>
      <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle(false)}></th>
              <th colSpan={3} style={{ ...thStyle(true), borderBottom: "none" }}>Verilən</th>
              <th colSpan={3} style={{ ...thStyle(true), borderBottom: "none" }}>Qaytarılan</th>
            </tr>
            <tr>
              <th style={thStyle(false)}></th>
              <th style={thStyle(true)}>Kura</th>
              <th style={thStyle(true)}>Damiryolu</th>
              <th style={thStyle(true)}>Ümumi</th>
              <th style={thStyle(true)}>Kura</th>
              <th style={thStyle(true)}>Damiryolu</th>
              <th style={thStyle(true)}>Ümumi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdLStyle(true)}>Cəmi</td>
              <td style={tdStyle()}>{totGK}</td>
              <td style={tdStyle()}>{totGR}</td>
              <td style={{ ...tdStyle(), fontWeight: 700 }}>{totGK + totGR}</td>
              <td style={tdStyle()}>{totLK || "—"}</td>
              <td style={tdStyle()}>{totLR || "—"}</td>
              <td style={{ ...tdStyle(), fontWeight: 700 }}>{(totLK + totLR) || "—"}</td>
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
