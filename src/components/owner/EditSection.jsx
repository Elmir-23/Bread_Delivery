import { useState } from "react";
import { c } from "../../styles/styles";
import { todayStr, addDays, fmtDateShort } from "../../utils/dates";
import { SESS, EXP_CATS } from "../../constants";
import EntryForm from "../delivery/EntryForm";

export default function EditSection({ db_data, editDate, setEditDate, editView, setEditView, editSelShop, setEditSelShop, editSelSess, editEntryVals, adjEdit, saveEditEntry, openEditEntry, editCollected, setEditCollected, saveEditCollected, saveHandover, saveExpense, deleteExpense, saveSweet }) {
  const isEditToday = editDate === todayStr();
  const [handoverEditVal, setHandoverEditVal] = useState("");
  const [sweetEditVal, setSweetEditVal] = useState("");
  const [showExpAdd, setShowExpAdd] = useState(false);
  const [editExpVals, setEditExpVals] = useState({ benzin: "", moyka: "", baxim: "", maas: "", diger: "", digerDesc: "" });

  if (editView === "date-shops") {
    const sd = db_data.deliveries?.[editDate] || {};

    // Günün xülasəsi hesablamaları
    let dayRev = 0;
    Object.entries(sd).forEach(([idx, sess]) => {
      const i = parseInt(idx);
      SESS.forEach(sv => {
        const d = sess[sv.id]; if (!d) return;
        const kPrice = db_data.shops[i]?.kura ?? db_data.prices?.kura ?? 0.55;
        const rPrice = db_data.shops[i]?.damiryolu ?? db_data.prices?.damiryolu ?? 0.60;
        const net = Math.max(0, (d.given?.kura || 0) - (sv.id === "morning" ? (d.leftover?.kura || 0) : 0));
        const netr = Math.max(0, (d.given?.damiryolu || 0) - (sv.id === "morning" ? (d.leftover?.damiryolu || 0) : 0));
        dayRev += net * kPrice + netr * rPrice;
      });
    });
    const dayCollected = Object.values(db_data.debtPayments?.[editDate] || {}).reduce((a, b) => a + b, 0);
    const dayExp = (db_data.expenses?.[editDate] || []).reduce((a, e) => a + e.amount, 0);
    const daySweet = db_data.sweets?.[editDate] || 0;
    const existingHandover = db_data.handovers?.[editDate] || 0;

    return (
      <div style={c.pad}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Tarixə görə çatdırılmanı düzəlt</div>

        {/* Tarix naviqasiyası */}
        <div style={c.dateRow}>
          <button style={c.dateBtn(false)} onClick={() => setEditDate(d => addDays(d, -1))}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{isEditToday ? "Bu gün — " : ""}{fmtDateShort(editDate)}</span>
          <button style={c.dateBtn(isEditToday)} onClick={() => { if (!isEditToday) setEditDate(d => addDays(d, 1)); }}>›</button>
        </div>

        {/* Günün xülasəsi */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14, marginBottom: 14 }}>
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Dövriyyə</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{dayRev.toFixed(2)} ₼</div>
          </div>
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Yığılan pul</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: dayCollected > 0 ? "var(--success-text)" : "var(--text)" }}>{dayCollected > 0 ? dayCollected.toFixed(2) + " ₼" : "—"}</div>
          </div>
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "10px 12px", border: dayExp > 0 ? "1px solid #fca5a5" : "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Xərclər</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: dayExp > 0 ? "#dc2626" : "var(--text)" }}>{dayExp > 0 ? "-" + dayExp.toFixed(2) + " ₼" : "—"}</div>
          </div>
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Şirniyyat gəliri</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: daySweet > 0 ? "var(--success-text)" : "var(--text)" }}>{daySweet > 0 ? daySweet.toFixed(2) + " ₼" : "—"}</div>
          </div>
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3 }}>Təhvil verilən</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{existingHandover > 0 ? existingHandover.toFixed(2) + " ₼" : "—"}</div>
          </div>
        </div>

        {/* Şirniyyat gəliri düzəlt */}
        <div style={{ ...c.block, marginBottom: 10 }}>
          <div style={c.blockTitle}>🍬 Şirniyyat gəlirini düzəlt</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="number" min={0} step={0.01}
              value={sweetEditVal}
              onChange={e => setSweetEditVal(e.target.value)}
              placeholder={daySweet > 0 ? daySweet.toFixed(2) : "0.00"}
              style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }}
            />
            <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
          </div>
          <button style={{ ...c.primaryBtn, marginTop: 10 }} onClick={() => { saveSweet(sweetEditVal, editDate); setSweetEditVal(""); }}>Saxla</button>
        </div>

        {/* Təhvil verilən məbləği düzəlt */}
        <div style={{ ...c.block, marginBottom: 10 }}>
          <div style={c.blockTitle}>💵 Təhvil verilən məbləği düzəlt</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="number" min={0} step={0.01}
              value={handoverEditVal}
              onChange={e => setHandoverEditVal(e.target.value)}
              placeholder={existingHandover > 0 ? existingHandover.toFixed(2) : "0.00"}
              style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }}
            />
            <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
          </div>
          <button style={{ ...c.primaryBtn, marginTop: 10 }} onClick={() => { saveHandover(handoverEditVal, editDate); setHandoverEditVal(""); }}>Saxla</button>
        </div>


        {/* Xərclər bloku */}
        <div style={{ ...c.block, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={c.blockTitle}>💸 Xərclər</div>
            {!showExpAdd && <button style={{ fontSize: 12, padding: "4px 10px", border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text2)", cursor: "pointer" }} onClick={() => setShowExpAdd(true)}>+ Əlavə et</button>}
          </div>

          {/* Mövcud xərclər */}
          {(db_data.expenses?.[editDate] || []).length > 0 && (
            <div style={{ marginBottom: showExpAdd ? 12 : 0 }}>
              {(db_data.expenses?.[editDate] || []).map((e, i) => {
                const cat = EXP_CATS.find(x => x.id === e.cat);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13 }}>{cat?.icon} {e.desc}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>{e.amount.toFixed(2)} ₼</span>
                      <button onClick={() => deleteExpense(editDate, i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--text2)" }}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(db_data.expenses?.[editDate] || []).length === 0 && !showExpAdd && (
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Bu gün xərc yoxdur.</div>
          )}

          {/* Yeni xərc əlavə et */}
          {showExpAdd && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              {EXP_CATS.map(cat => (
                <div key={cat.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: cat.id === "diger" ? 4 : 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.icon} {cat.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" min={0} step={0.01} value={editExpVals[cat.id]} onChange={e => setEditExpVals(p => ({ ...p, [cat.id]: e.target.value }))} placeholder="0.00" style={{ width: 80, padding: "6px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
                      <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
                    </div>
                  </div>
                  {cat.id === "diger" && (
                    <input type="text" value={editExpVals.digerDesc} onChange={e => setEditExpVals(p => ({ ...p, digerDesc: e.target.value }))} placeholder="Açıqlama…" style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)", marginBottom: 8 }} />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button style={{ ...c.outlineBtn, flex: 1 }} onClick={() => { setShowExpAdd(false); setEditExpVals({ benzin: "", moyka: "", baxim: "", maas: "", diger: "", digerDesc: "" }); }}>Ləğv et</button>
                <button style={{ ...c.primaryBtn, flex: 1 }} onClick={() => { saveExpense(editDate, editExpVals); setShowExpAdd(false); setEditExpVals({ benzin: "", moyka: "", baxim: "", maas: "", diger: "", digerDesc: "" }); }}>Saxla</button>
              </div>
            </div>
          )}
        </div>

        {/* Mağaza siyahısı */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mağazalar</div>
        <div style={{ ...c.shopGrid }}>
          {db_data.shops.map((s, i) => {
            const done = SESS.every(x => sd[i]?.[x.id] && (sd[i][x.id].given?.kura || sd[i][x.id].given?.damiryolu));
            return (
              <button key={i} style={c.shopBtn} onClick={() => { setEditSelShop(i); setEditView("date-session"); }}>
                {s.name}
                {done && <span style={{ ...c.tag, position: "absolute", top: 8, right: 8 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (editView === "date-session") {
    const sd = db_data.deliveries?.[editDate]?.[editSelShop] || {};
    const existingCollected = db_data.debtPayments?.[editDate]?.[editSelShop] || 0;
    const collKey = `${editDate}-${editSelShop}`;
    const collVal = editCollected[collKey] !== undefined ? editCollected[collKey] : String(existingCollected || "");

    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={() => setEditView("date-shops")}>‹</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[editSelShop]?.name}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(editDate)}</div>
          </div>
        </div>
        <div style={c.pad}>
          <div style={c.sessList}>
            {SESS.map(s => {
              const d = sd[s.id] || {};
              const has = d.given && (d.given.kura > 0 || d.given.damiryolu > 0);
              let sub = s.sub;
              if (has) {
                sub = `Verildi: K ${d.given.kura} · D ${d.given.damiryolu}`;
                if (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.damiryolu > 0)) sub += ` | Qalıq: K${d.leftover.kura} D${d.leftover.damiryolu}`;
              }
              return (
                <button key={s.id} style={c.sessBtn(has)} onClick={() => openEditEntry(editSelShop, s.id)}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div>
                    <div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div>
                  </div>
                  <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                </button>
              );
            })}
          </div>

          {/* Yığılan məbləği düzəlt */}
          <div style={{ ...c.block, marginTop: 10 }}>
            <div style={c.blockTitle}>💰 Yığılan məbləği düzəlt</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="number" min={0} step={0.01} value={collVal} onChange={e => setEditCollected(prev => ({ ...prev, [collKey]: e.target.value }))} placeholder="0.00" style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
              <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
            </div>
            {existingCollected > 0 && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>Cari: {existingCollected.toFixed(2)} ₼</div>}
            <button style={{ ...c.primaryBtn, marginTop: 10 }} onClick={() => saveEditCollected(editSelShop, editDate, collVal)}>Saxla</button>
          </div>
        </div>
      </div>
    );
  }

  if (editView === "date-entry") {
    return <EntryForm db_data={db_data} vals={editEntryVals} adjFn={adjEdit} saveFn={saveEditEntry} backFn={() => setEditView("date-session")} shopIdx={editSelShop} sessId={editSelSess} date={editDate} />;
  }
}
