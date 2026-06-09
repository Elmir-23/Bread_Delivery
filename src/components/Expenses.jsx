import { c } from "../styles/styles";
import { todayStr, fmtDate, fmtDateShort } from "../utils/dates";
import { EXP_CATS } from "../constants";

export default function Expenses({ db_data, expView, setExpView, expVals, setExpVals, saveExpense, deleteExpense }) {
  const TODAY = todayStr();
  const todayExps = db_data.expenses?.[TODAY] || [];

  if (expView === "add") {
    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={() => setExpView("list")}>‹</button>
          <div><div style={{ fontSize: 16, fontWeight: 500 }}>🚗 Maşın xərcləri</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(TODAY)}</div></div>
        </div>
        <div style={c.pad}>
          <div style={c.block}>
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
          </div>
          <button style={c.primaryBtn} onClick={saveExpense}>Saxla</button>
        </div>
      </div>
    );
  }

  return (
    <div style={c.pad}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>{fmtDate(TODAY)}</div>
      <button style={{ ...c.primaryBtn, marginBottom: "1rem" }} onClick={() => setExpView("add")}>+ Xərc əlavə et</button>
      {todayExps.length === 0 ? (
        <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "2rem" }}>Bu gün xərc yoxdur.</div>
      ) : (
        <div style={c.listCard}>
          {todayExps.map((e, i) => {
            const cat = EXP_CATS.find(c => c.id === e.cat);
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
            <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{todayExps.reduce((a,e) => a+e.amount, 0).toFixed(2)} ₼</span>
          </div>
        </div>
      )}
    </div>
  );
}
