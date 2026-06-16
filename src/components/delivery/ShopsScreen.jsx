import { useState } from "react";
import { c } from "../../styles/styles";
import { fmtDate } from "../../utils/dates";
import { SESS, EXP_CATS } from "../../constants";

export default function ShopsScreen({ db_data, TODAY, setSelShop, setView, setExpView, expView, expVals, setExpVals, saveExpense, deleteExpense, saveHandover }) {
  const todayExps = db_data.expenses?.[TODAY] || [];
  const [handoverInput, setHandoverInput] = useState("");

  // Bugünkü təhvilin mövcud vəziyyəti
  const rawHandover = db_data.handovers?.[TODAY];
  const todayHandover = rawHandover !== null && rawHandover !== undefined
    ? (typeof rawHandover === "number"
        ? { amount: rawHandover, confirmed: true }
        : rawHandover)
    : null;
  const isConfirmed = todayHandover?.confirmed === true;

  // Xərc formu açılanda mövcud məbləğləri doldur
  const openEdit = () => {
    const prefilled = { benzin: "", moyka: "", baxim: "", maas: "", diger: "", digerDesc: "" };
    todayExps.forEach(e => {
      if (e.cat in prefilled) prefilled[e.cat] = String(e.amount);
      if (e.cat === "diger") prefilled.digerDesc = e.desc || "";
    });
    setExpVals(prefilled);
    setExpView("add");
  };

  const handleSaveHandover = () => {
    const val = parseFloat(handoverInput);
    if (isNaN(val) || val < 0) return;
    saveHandover(handoverInput);
    setHandoverInput("");
  };

  return (
    <div style={c.pad}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>{fmtDate(TODAY)}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Mağaza seçin</div>
      <div style={c.shopGrid}>
        {db_data.shops.map((s, i) => {
          const sd = db_data.deliveries?.[TODAY]?.[i] || {};
          const done = SESS.every(x => sd[x.id] && (sd[x.id].given?.kura || sd[x.id].given?.damiryolu));
          return (
            <button key={i} style={c.shopBtn} onClick={() => { setSelShop(i); setView("session"); }}>
              {s.name}
              {done && <span style={{ ...c.tag, position: "absolute", top: 8, right: 8 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* ── Xərclər ── */}
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>💸 Xərclər</div>

        {expView === "add" ? (
          <div style={c.block}>
            <div style={{ ...c.blockTitle, marginBottom: 12 }}>Xərc daxil et</div>
            {EXP_CATS.map(cat => (
              <div key={cat.id}>
                <div style={{ ...c.breadRow, marginBottom: cat.id === "diger" ? 6 : 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.icon} {cat.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="number" min={0} step={0.01}
                      value={expVals[cat.id]}
                      onChange={e => setExpVals(p => ({ ...p, [cat.id]: e.target.value }))}
                      placeholder="0.00"
                      style={{ width: 80, padding: "7px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
                  </div>
                </div>
                {cat.id === "diger" && (
                  <input
                    type="text" value={expVals.digerDesc}
                    onChange={e => setExpVals(p => ({ ...p, digerDesc: e.target.value }))}
                    placeholder="Açıqlama…"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)", marginBottom: 10 }}
                  />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button style={{ ...c.outlineBtn, flex: 1 }} onClick={() => setExpView("list")}>Ləğv et</button>
              <button style={{ ...c.primaryBtn, flex: 1 }} onClick={() => saveExpense()}>Saxla</button>
            </div>
          </div>
        ) : (
          <>
            {/* Bugünkü xərclər siyahısı */}
            {todayExps.length > 0 ? (
              <div style={{ ...c.listCard, marginBottom: 10 }}>
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
                        <button
                          onClick={() => deleteExpense(TODAY, i)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text2)", padding: 4 }}
                        >🗑</button>
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: "10px 14px", background: "var(--bg2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Cəmi</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{todayExps.reduce((a, e) => a + e.amount, 0).toFixed(2)} ₼</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10, padding: "10px 0" }}>Bu gün xərc yoxdur.</div>
            )}

            {/* Əlavə et / Düzəlt düyməsi */}
            <button style={c.outlineBtn} onClick={openEdit}>
              {todayExps.length > 0 ? "✏️ Xərcləri düzəlt" : "+ Xərc əlavə et"}
            </button>
          </>
        )}
      </div>

      {/* ── Sahibkara Təhvil ── */}
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>💵 Sahibkara Təhvil</div>

        {isConfirmed ? (
          /* Təsdiqlənib — sürücü artıq dəyişə bilməz */
          <div style={{ ...c.block, borderColor: "var(--success, #22c55e)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success-text, #16a34a)" }}>
                  {todayHandover.amount.toFixed(2)} ₼ — Sahibkar tərəfindən təsdiqlənib
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Bu günün təhvili bağlandı</div>
              </div>
            </div>
          </div>
        ) : todayHandover ? (
          /* Daxil edilib, sahibkar gözlənilir */
          <div style={c.block}>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10 }}>
              Daxil etdiniz:{" "}
              <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 16 }}>{todayHandover.amount.toFixed(2)} ₼</span>
              <span style={{ marginLeft: 8, fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>⏳ Sahibkar təsdiqini gözləyir</span>
            </div>
            {/* Məbləği dəyişdirmə imkanı — hələ təsdiqlənməyib */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number" min={0} step={0.01}
                value={handoverInput}
                onChange={e => setHandoverInput(e.target.value)}
                placeholder={todayHandover.amount.toFixed(2)}
                style={{ flex: 1, padding: "9px 12px", fontSize: 16, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }}
              />
              <span style={{ fontSize: 14, color: "var(--text2)" }}>₼</span>
              <button
                style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer", whiteSpace: "nowrap" }}
                onClick={handleSaveHandover}
              >
                Yenilə
              </button>
            </div>
          </div>
        ) : (
          /* Hələ daxil edilməyib */
          <div style={c.block}>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10 }}>
              Sahibkara verdiyiniz məbləği daxil edin
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number" min={0} step={0.01}
                value={handoverInput}
                onChange={e => setHandoverInput(e.target.value)}
                placeholder="0.00"
                style={{ flex: 1, padding: "9px 12px", fontSize: 16, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }}
              />
              <span style={{ fontSize: 14, color: "var(--text2)" }}>₼</span>
              <button
                style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}
                onClick={handleSaveHandover}
              >
                Saxla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
