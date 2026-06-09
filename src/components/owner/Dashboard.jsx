import { c } from "../../styles/styles";
import { EXP_CATS } from "../../constants";

export default function Dashboard({ db_data, dashPeriod, setDashPeriod, calcStats, calcExpenses, editDebtShop, setEditDebtShop, editDebtVal, setEditDebtVal, saveEditDebt }) {
  const { totGK, totGR, totLK, totLR, totRev, totCollected, ss } = calcStats(dashPeriod);
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
}
