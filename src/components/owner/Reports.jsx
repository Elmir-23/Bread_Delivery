import { c } from "../../styles/styles";
import { todayStr, addDays, fmtDate } from "../../utils/dates";
import { SESS } from "../../constants";
import { exportCSVFile } from "../../services/archive";

export default function Reports({ db_data, repPeriod, setRepPeriod, calcStats, shopKura, shopRail, toast$ }) {
  const { ss: rss } = calcStats(repPeriod);
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
        {[["day","Bu gün"],["week","7 gün"],["month","30 gün"]].map(([p,l]) => (
          <button key={p} style={c.periodBtn(repPeriod===p)} onClick={() => setRepPeriod(p)}>{l}</button>
        ))}
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
      <button style={c.outlineBtn} onClick={() => exportCSVFile(db_data, repPeriod, shopKura, shopRail, addDays, toast$)}>⬇ CSV / Excel ixrac et</button>
    </div>
  );
}
