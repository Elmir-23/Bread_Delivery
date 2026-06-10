import { c } from "../../styles/styles";
import { fmtDate } from "../../utils/dates";
import { SESS, EXP_CATS } from "../../constants";

export default function ShopsScreen({ db_data, TODAY, setSelShop, setView, setExpView, expView, expVals, setExpVals, saveExpense, deleteExpense }) {
  const todayDeliveries = db_data.deliveries?.[TODAY] || {};
  const todayPayments = db_data.debtPayments?.[TODAY] || {};
  const todayExps = db_data.expenses?.[TODAY] || [];

  const shopRows = [];
  db_data.shops.forEach((shop, i) => {
    const sessDatas = todayDeliveries[i] || {};
    let hasAny = false;
    const rows = SESS.map(sv => {
      const d = sessDatas[sv.id];
      if (!d) return { sess: sv, gK: 0, gD: 0, lK: 0, lD: 0, empty: true };
      const gK = d.given?.kura || 0;
      const gD = d.given?.damiryolu || 0;
      const lK = sv.id === "morning" ? (d.leftover?.kura || 0) : 0;
      const lD = sv.id === "morning" ? (d.leftover?.damiryolu || 0) : 0;
      if (gK || gD) hasAny = true;
      return { sess: sv, gK, gD, lK, lD, empty: !gK && !gD };
    });
    if (!hasAny) return;
    const totGK = rows.reduce((a, r) => a + r.gK, 0);
    const totGD = rows.reduce((a, r) => a + r.gD, 0);
    const totLK = rows.reduce((a, r) => a + r.lK, 0);
    const totLD = rows.reduce((a, r) => a + r.lD, 0);
    shopRows.push({ shop, i, rows, totGK, totGD, totLK, totLD });
  });

  const grandGK = shopRows.reduce((a, r) => a + r.totGK, 0);
  const grandGD = shopRows.reduce((a, r) => a + r.totGD, 0);
  const grandLK = shopRows.reduce((a, r) => a + r.totLK, 0);
  const grandLD = shopRows.reduce((a, r) => a + r.totLD, 0);

  const th = (center, left) => ({
    padding: "5px 4px", fontSize: 10, fontWeight: 700,
    color: "var(--text2)", textAlign: center ? "center" : left ? "left" : "center",
    background: "var(--bg2)", border: "1px solid var(--border)", whiteSpace: "nowrap"
  });
  const td = (center, bold, color) => ({
    padding: "5px 4px", fontSize: 11, textAlign: center ? "center" : "left",
    border: "1px solid var(--border)", fontWeight: bold ? 600 : 400,
    color: color || "var(--text)", whiteSpace: "nowrap"
  });

  return (
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
              {debt > 0 && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>{debt.toFixed(2)} ₼ borc</div>}
              {debt < 0 && <div style={{ fontSize: 10, color: "var(--success-text)", marginTop: 4, fontWeight: 600 }}>{Math.abs(debt).toFixed(2)} ₼ kredit</div>}
            </button>
          );
        })}
      </div>

      {shopRows.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Günün xülasəsi</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ ...th(false, true), verticalAlign: "middle" }}>Mağaza</th>
                  <th rowSpan={2} style={{ ...th(true), verticalAlign: "middle" }}>Sessiya</th>
                  <th colSpan={3} style={{ ...th(true), borderBottom: "none" }}>Verilən</th>
                  <th colSpan={3} style={{ ...th(true), borderBottom: "none" }}>Qaytarılan</th>
                </tr>
                <tr>
                  <th style={th(true)}>K</th>
                  <th style={th(true)}>D</th>
                  <th style={th(true)}>Cəm</th>
                  <th style={th(true)}>K</th>
                  <th style={th(true)}>D</th>
                  <th style={th(true)}>Cəm</th>
                </tr>
              </thead>
              <tbody>
                {shopRows.map(({ shop, rows, totGK, totGD, totLK, totLD }, ri) => (
                  <>
                    {rows.filter(r => !r.empty).map((r, si) => (
                      <tr key={r.sess.id} style={{ background: ri % 2 === 0 ? "var(--bg)" : "var(--bg2)" }}>
                        {si === 0 && (
                          <td rowSpan={rows.filter(r => !r.empty).length + 1} style={{ ...td(false, true), verticalAlign: "middle", borderRight: "1px solid var(--border)" }}>
                            {shop.name}
                          </td>
                        )}
                        <td style={{ ...td(true), fontSize: 10, color: "var(--text2)" }}>{r.sess.icon} {r.sess.label}</td>
                        <td style={td(true)}>{r.gK || "—"}</td>
                        <td style={td(true)}>{r.gD || "—"}</td>
                        <td style={{ ...td(true), fontWeight: 600 }}>{(r.gK + r.gD) || "—"}</td>
                        <td style={td(true)}>{r.lK || "—"}</td>
                        <td style={td(true)}>{r.lD || "—"}</td>
                        <td style={{ ...td(true), fontWeight: 600 }}>{(r.lK + r.lD) || "—"}</td>
                      </tr>
                    ))}
                    <tr style={{ borderBottom: "2px solid var(--border2)" }}>
                      <td style={{ ...td(true), fontWeight: 700, background: "var(--bg2)", fontSize: 10 }}>Cəmi</td>
                      <td style={{ ...td(true), fontWeight: 700 }}>{totGK}</td>
                      <td style={{ ...td(true), fontWeight: 700 }}>{totGD}</td>
                      <td style={{ ...td(true), fontWeight: 700 }}>{totGK + totGD}</td>
                      <td style={{ ...td(true), fontWeight: 700 }}>{totLK || "—"}</td>
                      <td style={{ ...td(true), fontWeight: 700 }}>{totLD || "—"}</td>
                      <td style={{ ...td(true), fontWeight: 700 }}>{(totLK + totLD) || "—"}</td>
                    </tr>
                  </>
                ))}
                <tr style={{ background: "var(--bg2)", borderTop: "2px solid var(--border2)" }}>
                  <td style={{ ...td(false, true), fontWeight: 700 }}>Ümumi</td>
                  <td style={{ ...td(true), fontSize: 10, color: "var(--text2)" }}>—</td>
                  <td style={{ ...td(true), fontWeight: 700 }}>{grandGK}</td>
                  <td style={{ ...td(true), fontWeight: 700 }}>{grandGD}</td>
                  <td style={{ ...td(true), fontWeight: 700 }}>{grandGK + grandGD}</td>
                  <td style={{ ...td(true), fontWeight: 700 }}>{grandLK || "—"}</td>
                  <td style={{ ...td(true), fontWeight: 700 }}>{grandLD || "—"}</td>
                  <td style={{ ...td(true), fontWeight: 700 }}>{(grandLK + grandLD) || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>🚗 Maşın xərcləri</div>
        {expView === "add" ? (
          <div style={c.block}>
            <div style={{ ...c.blockTitle, marginBottom: 12 }}>Xərc əlavə et</div>
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
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button style={{ ...c.outlineBtn, flex: 1 }} onClick={() => setExpView("list")}>Ləğv et</button>
              <button style={{ ...c.primaryBtn, flex: 1 }} onClick={saveExpense}>Saxla</button>
            </div>
          </div>
        ) : (
          <>
            <button style={{ ...c.outlineBtn, marginBottom: 10 }} onClick={() => setExpView("add")}>+ Xərc əlavə et</button>
            {todayExps.length > 0 && (
              <div style={c.listCard}>
                {todayExps.map((e, i) => {
                  const cat = EXP_CATS.find(x => x.id === e.cat);
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{todayExps.reduce((a, e) => a + e.amount, 0).toFixed(2)} ₼</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
