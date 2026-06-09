import { c } from "../styles/styles";
import { todayStr, fmtDate } from "../utils/dates";
import { SESS } from "../constants";

export default function Gundelik({ db_data }) {
  const TODAY = todayStr();
  const todayDeliveries = db_data.deliveries?.[TODAY] || {};
  const todayPayments = db_data.debtPayments?.[TODAY] || {};
  const shopRows = [];

  Object.entries(todayDeliveries).forEach(([idx, sess]) => {
    const i = parseInt(idx);
    const shop = db_data.shops[i];
    if (!shop) return;
    let totalK = 0, totalD = 0, sehK = 0, sehD = 0, gunK = 0, gunD = 0, axsK = 0, axsD = 0;
    SESS.forEach(sv => {
      const d = sess[sv.id]; if (!d) return;
      const k = d.given?.kura || 0, dd = d.given?.damiryolu || 0;
      totalK += k; totalD += dd;
      if (sv.id === "morning") { sehK += k; sehD += dd; }
      if (sv.id === "afternoon") { gunK += k; gunD += dd; }
      if (sv.id === "evening") { axsK += k; axsD += dd; }
    });
    if (!totalK && !totalD) return;
    const todayDebt = totalK * (shop.kura ?? db_data.prices.kura) + totalD * (shop.damiryolu ?? db_data.prices.damiryolu);
    const totalDebt = db_data.debts?.[i] || 0;
    const yigilan = todayPayments[i] || todayPayments[String(i)] || 0;
    shopRows.push({ i, name: shop.name, totalK, totalD, sehK, sehD, gunK, gunD, axsK, axsD, todayDebt, totalDebt, yigilan, qalanBorc: totalDebt });
  });

  const totK = shopRows.reduce((a, r) => a + r.totalK, 0);
  const totD = shopRows.reduce((a, r) => a + r.totalD, 0);
  const totSehK = shopRows.reduce((a, r) => a + r.sehK, 0), totSehD = shopRows.reduce((a, r) => a + r.sehD, 0);
  const totGunK = shopRows.reduce((a, r) => a + r.gunK, 0), totGunD = shopRows.reduce((a, r) => a + r.gunD, 0);
  const totAxsK = shopRows.reduce((a, r) => a + r.axsK, 0), totAxsD = shopRows.reduce((a, r) => a + r.axsD, 0);
  const totTodayDebt = shopRows.reduce((a, r) => a + r.todayDebt, 0);
  const totUmumi = shopRows.reduce((a, r) => a + r.totalDebt, 0);
  const totYigilan = shopRows.reduce((a, r) => a + r.yigilan, 0);
  const totQalan = shopRows.reduce((a, r) => a + r.qalanBorc, 0);

  const thStyle = (center) => ({ padding: "5px 4px", fontSize: 10, fontWeight: 700, color: "var(--text2)", textAlign: center ? "center" : "left", background: "var(--bg2)", border: "1px solid var(--border)", whiteSpace: "nowrap" });
  const tdStyle = (color, bg) => ({ padding: "5px 4px", fontSize: 11, textAlign: "center", border: "1px solid var(--border)", color: color || "var(--text)", background: bg || "transparent", whiteSpace: "nowrap" });
  const tdLStyle = (bold, bg) => ({ padding: "5px 6px", fontSize: 11, textAlign: "left", border: "1px solid var(--border)", color: "var(--text)", background: bg || "transparent", fontWeight: bold ? 700 : 400, whiteSpace: "nowrap" });

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10, padding: "0 1rem" }}>{fmtDate(TODAY)}</div>
      {shopRows.length === 0 ? (
        <div style={{ ...c.block, margin: "0 1rem", textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "2rem" }}>Bu gün hələ çatdırılma yoxdur.</div>
      ) : (
        <div style={{ margin: "0 1rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ ...thStyle(false), verticalAlign: "middle" }}>Mağaza</th>
                <th colSpan={3} style={{ ...thStyle(true), borderBottom: "none" }}>Çörək</th>
                <th colSpan={4} style={{ ...thStyle(true), borderBottom: "none" }}>Borc</th>
              </tr>
              <tr>
                <th style={thStyle(true)}>Kur</th>
                <th style={thStyle(true)}>Dam</th>
                <th style={thStyle(true)}>Cəm</th>
                <th style={thStyle(true)}>Ümumi</th>
                <th style={thStyle(true)}>Bugün</th>
                <th style={thStyle(true)}>Yığılan</th>
                <th style={thStyle(true)}>Qalıq</th>
              </tr>
            </thead>
            <tbody>
              {shopRows.map((r, ri) => (
                <>
                  <tr key={r.i} style={{ background: ri % 2 === 0 ? "var(--bg)" : "var(--bg2)" }}>
                    <td style={tdLStyle(true)}>{r.name}</td>
                    <td style={tdStyle()}>{r.totalK}</td>
                    <td style={tdStyle()}>{r.totalD}</td>
                    <td style={{ ...tdStyle(), fontWeight: 600 }}>{r.totalK+r.totalD}</td>
                    <td style={tdStyle("#dc2626")}>{r.totalDebt.toFixed(1)}</td>
                    <td style={tdStyle("#dc2626")}>{r.todayDebt.toFixed(1)}</td>
                    <td style={tdStyle("var(--success-text)")}>{r.yigilan > 0 ? r.yigilan.toFixed(1) : "—"}</td>
                    <td style={tdStyle(r.qalanBorc > 0 ? "#dc2626" : "var(--success-text)")}>{r.qalanBorc.toFixed(1)}</td>
                  </tr>
                  {[["🌅 S", r.sehK, r.sehD], ["☀️ G", r.gunK, r.gunD], ["🌙 A", r.axsK, r.axsD]].map(([lbl, k, d]) =>
                    (k || d) ? (
                      <tr key={lbl+r.i} style={{ background: ri % 2 === 0 ? "var(--bg)" : "var(--bg2)", opacity: 0.7 }}>
                        <td style={{ ...tdLStyle(false), paddingLeft: 14, fontSize: 10, color: "var(--text2)" }}>{lbl}</td>
                        <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k}</td>
                        <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{d}</td>
                        <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k+d}</td>
                        <td colSpan={4} style={{ border: "1px solid var(--border)" }}></td>
                      </tr>
                    ) : null
                  )}
                </>
              ))}
              <tr style={{ background: "var(--bg2)", fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                <td style={tdLStyle(true, "var(--bg2)")}>📊 Cəmi</td>
                <td style={{ ...tdStyle(), fontWeight: 700 }}>{totK}</td>
                <td style={{ ...tdStyle(), fontWeight: 700 }}>{totD}</td>
                <td style={{ ...tdStyle(), fontWeight: 700 }}>{totK+totD}</td>
                <td style={{ ...tdStyle("#dc2626"), fontWeight: 700 }}>{totUmumi.toFixed(1)}</td>
                <td style={{ ...tdStyle("#dc2626"), fontWeight: 700 }}>{totTodayDebt.toFixed(1)}</td>
                <td style={{ ...tdStyle("var(--success-text)"), fontWeight: 700 }}>{totYigilan > 0 ? totYigilan.toFixed(1) : "—"}</td>
                <td style={{ ...tdStyle(totQalan > 0 ? "#dc2626" : "var(--success-text)"), fontWeight: 700 }}>{totQalan.toFixed(1)}</td>
              </tr>
              {[["🌅 Səhər", totSehK, totSehD], ["☀️ Günorta", totGunK, totGunD], ["🌙 Axşam", totAxsK, totAxsD]].map(([lbl, k, d]) =>
                (k || d) ? (
                  <tr key={lbl} style={{ background: "var(--bg2)", opacity: 0.8 }}>
                    <td style={{ ...tdLStyle(false, "var(--bg2)"), fontSize: 10, color: "var(--text2)" }}>{lbl}</td>
                    <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k}</td>
                    <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{d}</td>
                    <td style={{ ...tdStyle(), fontSize: 10, color: "var(--text2)" }}>{k+d}</td>
                    <td colSpan={4} style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}></td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
