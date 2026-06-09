import { useAppData } from "./hooks/useAppData";
import { todayStr, fmtDateShort } from "./utils/dates";
import { c } from "./styles/styles";
import { CSS } from "./styles/global";
import { exportCSVFile } from "./services/archive";
import { SESS, EXP_CATS } from "./constants";
import { addDays, fmtDate } from "./utils/dates";
import ShopsScreen from "./components/delivery/ShopsScreen";
import SessionScreen from "./components/delivery/SessionScreen";
import EntryForm from "./components/delivery/EntryForm";
import DebtScreen from "./components/delivery/DebtScreen";
import Expenses from "./components/Expenses";
import Gundelik from "./components/Gundelik";

export default function App() {
  const {
    db_data, loading, tab, setTab, view, setView,
    selShop, setSelShop, selSess, setSelSess,
    entryVals, collectedInput, setCollectedInput,
    ownerUnlocked, setOwnerUnlocked, ownerTab, setOwnerTab,
    pinBuf, pinErr, pinKey,
    dashPeriod, setDashPeriod, repPeriod, setRepPeriod,
    editDate, setEditDate, editView, setEditView,
    editSelShop, setEditSelShop, editSelSess, setEditSelSess,
    editEntryVals, adjEdit,
    toast, shopEdits, setShopEdits,
    newShopName, setNewShopName,
    settPrices, setSettPrices,
    pinOld, setPinOld, pinNew, setPinNew,
    archives, resetPinBuf, setResetPinBuf,
    resetPinErr, setResetPinErr,
    resetConfirm, setResetConfirm,
    editCollected, setEditCollected,
    expView, setExpView, expVals, setExpVals,
    editDebtShop, setEditDebtShop,
    editDebtVal, setEditDebtVal,
    confirmDeleteShop, setConfirmDeleteShop,
    shopKura, shopRail, toast$,
    openDeliveryEntry, adjDelivery, saveDeliveryEntry,
    saveDebtCollection, openEditEntry, saveEditEntry,
    saveEditDebt, saveEditCollected, saveExpense, deleteExpense,
    resetAllData, calcStats, calcExpenses,
    saveShops, addShop, removeShop, confirmRemoveShop,
    savePrices, changePin,
  } = useAppData();

  const TODAY = todayStr();

  const { totGK, totGR, totLK, totLR, totRev, totCollected, ss } = calcStats(dashPeriod);
  const repStats = calcStats(repPeriod);

  if (loading) return (
    <div style={{ ...c.wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 14 }}>Yüklənir…</div>
    </div>
  );

  const renderEditSection = () => {
    const isEditToday = editDate === todayStr();
    if (editView === "date-shops") {
      const sd = db_data.deliveries?.[editDate] || {};
      return (
        <div style={c.pad}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Edit deliveries by date</div>
          <div style={c.dateRow}>
            <button style={c.dateBtn(false)} onClick={() => setEditDate(d => addDays(d, -1))}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{isEditToday ? "Bu gün — " : ""}{fmtDateShort(editDate)}</span>
            <button style={c.dateBtn(isEditToday)} onClick={() => { if (!isEditToday) setEditDate(d => addDays(d, 1)); }}>›</button>
          </div>
          <div style={{ ...c.shopGrid, marginTop: 12 }}>
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
            <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[editSelShop]?.name}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(editDate)}</div></div>
          </div>
          <div style={c.pad}>
            <div style={c.sessList}>
              {SESS.map(s => {
                const d = sd[s.id] || {};
                const has = d.given && (d.given.kura > 0 || d.given.damiryolu > 0);
                let sub = s.sub;
                if (has) { sub = `Verildi: K ${d.given.kura} · D ${d.given.damiryolu}`; if (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.damiryolu > 0)) sub += ` | Qalıq: K${d.leftover.kura} D${d.leftover.damiryolu}`; }
                return (
                  <button key={s.id} style={c.sessBtn(has)} onClick={() => openEditEntry(editSelShop, s.id)}>
                    <div><div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div><div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div></div>
                    <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                  </button>
                );
              })}
            </div>
            <div style={{ ...c.block, marginTop: 10 }}>
              <div style={c.blockTitle}>💰 Yığılan məbləği düzəlt</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" min={0} step={0.01} value={collVal} onChange={e => setEditCollected(prev => ({ ...prev, [collKey]: e.target.value }))} placeholder="0.00" style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
                <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
              </div>
              {existingCollected > 0 && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>Cari: {existingCollected.toFixed(2)} ₼</div>}
              <button style={{ ...c.primaryBtn, marginTop: 10 }} onClick={() => saveEditCollected(editSelShop, editDate, collVal)}>Saxla</button>
            </div>
            <div style={{ ...c.block, marginTop: 10 }}>
              <div style={c.blockTitle}>💳 Cari borcu düzəlt</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                Cari borc: <strong style={{ color: (db_data.debts?.[editSelShop] || 0) > 0 ? "#dc2626" : "var(--success-text)" }}>{(db_data.debts?.[editSelShop] || 0).toFixed(2)} ₼</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" step={0.01} value={editDebtShop === editSelShop ? editDebtVal : ""} onChange={e => { setEditDebtShop(editSelShop); setEditDebtVal(e.target.value); }} placeholder={(db_data.debts?.[editSelShop] || 0).toFixed(2)} style={{ flex: 1, padding: "10px 12px", fontSize: 18, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
                <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
              </div>
              <button style={{ ...c.primaryBtn, marginTop: 10 }} onClick={() => saveEditDebt(editSelShop, editDebtVal)}>Saxla</button>
            </div>
          </div>
        </div>
      );
    }
    if (editView === "date-entry") {
      return <EntryForm db_data={db_data} vals={editEntryVals} adjFn={adjEdit} saveFn={saveEditEntry} backFn={() => setEditView("date-session")} shopIdx={editSelShop} sessId={editSelSess} date={editDate} />;
    }
  };

  const renderDashboard = () => {
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
  };

  
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
  };

  const renderReports = () => {
    const { ss: rss } = repStats;
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
          {[["day","Bu gün"],["week","7 gün"],["month","30 gün"]].map(([p,l]) => <button key={p} style={c.periodBtn(repPeriod===p)} onClick={() => setRepPeriod(p)}>{l}</button>)}
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
  };

  const renderShopsMgr = () => (
    <div style={c.pad}>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Leave price blank to use default.</div>
      <div style={c.listCard}>
        <div style={{ padding: "8px 14px" }}>
          <div className="shop-edit-hdr"><span>Name</span><span style={{ textAlign: "right" }}>Kura ₼</span><span style={{ textAlign: "right" }}>Rail ₼</span><span></span></div>
          {shopEdits.map((s, i) => (
            <div key={i} className="shop-edit-grid">
              <input type="text" value={s.name} onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <input type="number" value={s.kuraStr} placeholder={db_data.prices.kura.toFixed(2)} min="0" step="0.01" onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, kuraStr: e.target.value } : x))} />
              <input type="number" value={s.railStr} placeholder={db_data.prices.damiryolu.toFixed(2)} min="0" step="0.01" onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, railStr: e.target.value } : x))} />
              <button onClick={() => removeShop(i)}>🗑</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={newShopName} onChange={e => setNewShopName(e.target.value)} onKeyDown={e => e.key === "Enter" && addShop()} placeholder="Yeni mağaza adı…" style={{ flex: 1, padding: "9px 12px", fontSize: 14, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }} />
        <button onClick={addShop} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}>+ Əlavə et</button>
      </div>
      <button style={c.primaryBtn} onClick={saveShops}>Bütün mağazaları saxla</button>
    </div>
  );

  const renderParametrler = () => {
    const downloadArchive = (arc) => {
      const blob = new Blob([arc.csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `bread-arxiv-${arc.weekMonday}.csv`;
      a.click();
      toast$("CSV yüklənir…");
    };
    const handleResetPin = (k) => {
      if (k === "clr") { setResetPinBuf(""); setResetPinErr(""); return; }
      if (k === "del") { setResetPinBuf(p => p.slice(0,-1)); return; }
      if (resetPinBuf.length >= 4) return;
      const next = resetPinBuf + k;
      setResetPinBuf(next);
      if (next.length === 4) {
        if (next === db_data?.pin) { resetAllData(); }
        else { setResetPinErr("PIN yanlışdır"); setTimeout(() => { setResetPinBuf(""); setResetPinErr(""); }, 900); }
      }
    };
    return (
      <div style={c.pad}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Standart çörək qiymətləri</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Xüsusi qiyməti olmayan mağazalara tətbiq edilir.</div>
        <div style={c.listCard}>
          {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([k,lbl],i) => (
            <div key={k} style={c.settRow(i===1)}>
              <div><div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div><div style={{ fontSize: 11, color: "var(--text2)" }}>hər çörəyə standart</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input type="number" min={0} step={0.01} value={settPrices[k]} onChange={e => setSettPrices(p => ({ ...p, [k]: e.target.value }))} style={{ width: 68, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
                <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
              </div>
            </div>
          ))}
        </div>
        <button style={{ ...c.primaryBtn, marginBottom: "1.25rem" }} onClick={savePrices}>Standart qiymətləri saxla</button>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>PIN-i dəyiş</div>
        <div style={c.listCard}>
          {[["Cari PIN", pinOld, setPinOld],["Yeni PIN", pinNew, setPinNew]].map(([lbl,val,setter],i) => (
            <div key={lbl} style={c.settRow(i===1)}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div>
              <input type="password" maxLength={4} value={val} onChange={e => setter(e.target.value)} style={{ width: 80, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
            </div>
          ))}
        </div>
        <button style={{ ...c.outlineBtn, marginBottom: "1.5rem" }} onClick={changePin}>PIN-i dəyiş</button>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Arxivlər</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Hər həftə giriş etdikdə avtomatik saxlanılır.</div>
        {archives.length === 0 ? (
          <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Hələ arxiv yoxdur.</div>
        ) : (
          <div style={{ ...c.listCard, marginBottom: "1.5rem" }}>
            {archives.map((arc, i) => (
              <div key={arc.id} style={{ ...c.listRow(i === archives.length - 1), gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateShort(arc.weekMonday)} həftəsi</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{fmtDateShort(arc.archivedOn)} · {arc.rowCount} sətir</div>
                </div>
                <button onClick={() => downloadArchive(arc)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text)", cursor: "pointer", flexShrink: 0 }}>⬇ CSV</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Məlumatları sıfırla</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Çatdırılma, borc və ödəniş məlumatları silinəcək. Mağazalar, qiymətlər və PIN saxlanılacaq. Sıfırlamadan əvvəl arxiv avtomatik yaradılır.</div>
        {!resetConfirm ? (
          <button style={{ ...c.outlineBtn, color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => setResetConfirm(true)}>🗑 Hamısını sıfırla</button>
        ) : (
          <div style={c.block}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 12, textAlign: "center" }}>Təsdiq üçün PIN daxil edin</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12 }}>
              {[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < resetPinBuf.length)}></div>)}
            </div>
            {resetPinErr && <div style={{ color: "#dc2626", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{resetPinErr}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
              {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
                <button key={k} style={{ ...c.pinKey, padding: 10, fontSize: 16 }} onClick={() => handleResetPin(k)}>{k==="clr"?"CLR":k==="del"?"⌫":k}</button>
              ))}
            </div>
            <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setResetConfirm(false); setResetPinBuf(""); setResetPinErr(""); }}>Ləğv et</button>
          </div>
        )}
      </div>
    );
  };


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
  };

  const ownerTabs = [["dashboard","İdarə paneli"],["reports","Hesabatlar"],["edit","Mağazaları tənzimlə"],["shops-mgr","Mağaza əlavə et"],["parametrler","Parametrlər"]];

  return (
    <div style={c.wrap}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" />
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "10px 22px", borderRadius: 30, fontSize: 14, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}

      {confirmDeleteShop !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Mağazanı sil</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: "1.5rem" }}>
              <strong style={{ color: "var(--text)" }}>{db_data.shops[confirmDeleteShop]?.name}</strong> mağazasını silmək istədiyinizdən əminsiniz?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteShop(null)} style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 10, background: "none", color: "var(--text)", cursor: "pointer" }}>Yox</button>
              <button onClick={confirmRemoveShop} style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, background: "#dc2626", color: "#fff", cursor: "pointer" }}>Hə, sil</button>
            </div>
          </div>
        </div>
      )}

      <div style={c.nav}>
        {[["delivery","🚚","Çatdırılma"],["gundelik","📋","Gündəlik"],["expenses","🚗","Xərclər"],["owner","🔐","Sahibkar"]].map(([key,icon,lbl]) => (
          <button key={key} style={c.navBtn(tab===key)} onClick={() => { setTab(key); if (key==="delivery") setView("shops"); if (key==="expenses") setExpView("list"); }}>
            <span style={{ fontSize: 18 }}>{icon}</span>{lbl}
          </button>
        ))}
      </div>

      {tab === "delivery" && (
        <>
          {view === "shops" && <ShopsScreen db_data={db_data} TODAY={TODAY} setSelShop={setSelShop} setView={setView} />}
          {view === "session" && <SessionScreen db_data={db_data} TODAY={TODAY} selShop={selShop} setView={setView} setCollectedInput={setCollectedInput} openDeliveryEntry={openDeliveryEntry} />}
          {view === "entry" && <EntryForm db_data={db_data} vals={entryVals} adjFn={adjDelivery} saveFn={saveDeliveryEntry} backFn={() => setView("session")} shopIdx={selShop} sessId={selSess} date={TODAY} />}
          {view === "debt" && <DebtScreen db_data={db_data} TODAY={TODAY} selShop={selShop} collectedInput={collectedInput} setCollectedInput={setCollectedInput} saveDebtCollection={saveDebtCollection} setView={setView} />}
        </>
      )}
      {tab === "gundelik" && <Gundelik db_data={db_data} />}
      {tab === "expenses" && <Expenses db_data={db_data} expView={expView} setExpView={setExpView} expVals={expVals} setExpVals={setExpVals} saveExpense={saveExpense} deleteExpense={deleteExpense} />}
      {tab === "owner" && (
        <>
          {!ownerUnlocked && (
            <div style={{ minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "2rem" }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>Owner access</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Enter your PIN</div>
              <div style={{ display: "flex", gap: 12, margin: "4px 0" }}>{[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < pinBuf.length)}></div>)}</div>
              <div style={{ color: "#dc2626", fontSize: 13, minHeight: 18 }}>{pinErr}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: 220 }}>
                {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
                  <button key={k} style={c.pinKey} onClick={() => pinKey(k)}>{k==="clr"?"CLR":k==="del"?"⌫":k}</button>
                ))}
              </div>
            </div>
          )}
          {ownerUnlocked && (
            <div>
              <div style={{ padding: "1rem 1rem 0" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: "1rem", flexWrap: "wrap" }}>
                  {ownerTabs.map(([k,l]) => <button key={k} style={c.ownerNavBtn(ownerTab===k)} onClick={() => { setOwnerTab(k); if (k==="edit") setEditView("date-shops"); }}>{l}</button>)}
                </div>
              </div>
              {ownerTab === "dashboard" && renderDashboard()}
              {ownerTab === "reports" && renderReports()}
              {ownerTab === "edit" && renderEditSection()}
              {ownerTab === "shops-mgr" && renderShopsMgr()}
              {ownerTab === "parametrler" && renderParametrler()}
              <div style={{ padding: "0 1rem 1.5rem" }}>
                <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setOwnerUnlocked(false); setPinBuf(""); }}>🔒 Kilidlə</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
