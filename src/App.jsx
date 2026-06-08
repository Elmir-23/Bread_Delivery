import { useState, useEffect } from "react";

const SESS = [
  { id: "morning", label: "Morning", icon: "🌅", sub: "Given + collect leftovers" },
  { id: "afternoon", label: "Afternoon", icon: "☀️", sub: "Given only" },
  { id: "evening", label: "Evening", icon: "🌙", sub: "Given only" },
];
const DEF_SHOPS = ["Shahin","Murad","Alasgar","50_Gapik","Fuad","Elbrus","Ramal","Suraddin","Khila","Kolya","Nur-S"];
const STORAGE_KEY = "bdapp_v1";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(s, n) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function fmtDate(s) { const d = new Date(s + "T00:00:00"); return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
function fmtDateShort(s) { const d = new Date(s + "T00:00:00"); return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.shops && typeof p.shops[0] === "string") p.shops = p.shops.map(n => ({ name: n, kura: null, railway: null }));
      return { pin: "1234", prices: { kura: 1.5, railway: 2.0 }, deliveries: {}, shops: DEF_SHOPS.map(n => ({ name: n, kura: null, railway: null })), ...p };
    }
  } catch {}
  return { pin: "1234", prices: { kura: 1.5, railway: 2.0 }, deliveries: {}, shops: DEF_SHOPS.map(n => ({ name: n, kura: null, railway: null })) };
}
function saveDB(db) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch {} }

const c = {
  wrap: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: "var(--text)" },
  nav: { display: "flex", borderBottom: "1px solid var(--border)" },
  navBtn: a => ({ flex: 1, padding: "10px 4px 13px", background: "none", border: "none", borderBottom: a ? "2.5px solid var(--text)" : "2.5px solid transparent", fontSize: 12, fontWeight: a ? 600 : 400, color: a ? "var(--text)" : "var(--text2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
  topbar: { display: "flex", alignItems: "center", gap: 10, padding: "14px 1rem 12px", borderBottom: "1px solid var(--border)" },
  backBtn: { background: "none", border: "1px solid var(--border2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  dateRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 1rem", background: "var(--bg2)" },
  dateBtn: { background: "none", border: "1px solid var(--border2)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "var(--text)", fontSize: 16 },
  pad: { padding: "1rem" },
  shopGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  shopBtn: { padding: "18px 12px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg)", color: "var(--text)", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", position: "relative" },
  sessList: { display: "flex", flexDirection: "column", gap: 8 },
  sessBtn: done => ({ padding: "14px 16px", border: done ? "1px solid var(--success-border)" : "1px solid var(--border)", borderRadius: 12, background: done ? "var(--success-bg)" : "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }),
  block: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem", marginBottom: 10 },
  blockTitle: { fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 },
  breadRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  counter: { display: "flex", alignItems: "center", gap: 8 },
  cntBtn: { width: 36, height: 36, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg2)", color: "var(--text)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  primaryBtn: { width: "100%", padding: 13, fontSize: 15, fontWeight: 600, background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 12, cursor: "pointer" },
  outlineBtn: { width: "100%", padding: 11, fontSize: 14, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 12, background: "none", color: "var(--text)", cursor: "pointer" },
  metric: { background: "var(--bg2)", borderRadius: 10, padding: "12px 14px" },
  listCard: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: "1rem" },
  listRow: last => ({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }),
  periodBtn: a => ({ flex: 1, padding: "7px 4px", fontSize: 12, border: "1px solid var(--border2)", borderRadius: 8, background: a ? "var(--text)" : "none", color: a ? "var(--bg)" : "var(--text2)", cursor: "pointer", borderColor: a ? "transparent" : "var(--border2)" }),
  settRow: last => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }),
  pinDot: filled => ({ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--border2)", background: filled ? "var(--text)" : "var(--bg2)" }),
  pinKey: { padding: 14, fontSize: 20, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 12, background: "var(--bg)", color: "var(--text)", cursor: "pointer", textAlign: "center" },
  ownerNavBtn: a => ({ flex: 1, padding: "7px 4px", fontSize: 11, border: "1px solid var(--border2)", borderRadius: 8, background: a ? "var(--text)" : "none", color: a ? "var(--bg)" : "var(--text2)", cursor: "pointer" }),
  tag: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "var(--success-bg)", color: "var(--success-text)", fontWeight: 600 },
};

const CSS = `
  :root { --bg:#fff; --bg2:#f5f5f4; --text:#1a1a1a; --text2:#6b7280; --border:#e5e7eb; --border2:#d1d5db; --success-bg:#dcfce7; --success-text:#15803d; --success-border:#86efac; }
  @media(prefers-color-scheme:dark){ :root { --bg:#1c1c1e; --bg2:#2c2c2e; --text:#f2f2f7; --text2:#8e8e93; --border:#3a3a3c; --border2:#48484a; --success-bg:#052e16; --success-text:#86efac; --success-border:#166534; } }
  *{box-sizing:border-box;margin:0;padding:0} body{background:var(--bg)} button,input{font-family:inherit}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  input[type=number]{-moz-appearance:textfield}
  .shop-edit-grid{display:grid;grid-template-columns:1fr 58px 58px 30px;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
  .shop-edit-grid:last-child{border-bottom:none}
  .shop-edit-grid input[type=text]{padding:7px 9px;font-size:13px;border:1px solid var(--border2);border-radius:8px;background:var(--bg);color:var(--text);width:100%}
  .shop-edit-grid input[type=number]{padding:7px 5px;font-size:13px;border:1px solid var(--border2);border-radius:8px;background:var(--bg);color:var(--text);width:100%;text-align:right}
  .shop-edit-grid button{width:30px;height:30px;border:1px solid var(--border2);border-radius:7px;background:none;cursor:pointer;color:var(--text2);display:flex;align-items:center;justify-content:center}
  .shop-edit-hdr{display:grid;grid-template-columns:1fr 58px 58px 30px;gap:6px;padding-bottom:6px;border-bottom:1px solid var(--border);margin-bottom:4px}
  .shop-edit-hdr span{font-size:10px;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .bar-label{font-size:12px;color:var(--text2);width:72px;text-align:right;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bar-track{flex:1;height:20px;background:var(--bg2);border-radius:4px;overflow:hidden}
  .bar-fill{height:100%;background:var(--text);border-radius:4px}
`;

export default function App() {
  const [db, setDB] = useState(() => loadDB());
  const [tab, setTab] = useState("delivery");
  const [curDate, setCurDate] = useState(todayStr());
  const [view, setView] = useState("shops"); // shops | session | entry
  const [selShop, setSelShop] = useState(null);
  const [selSess, setSelSess] = useState(null);
  const [entryVals, setEntryVals] = useState({});
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const [ownerTab, setOwnerTab] = useState("dashboard");
  const [pinBuf, setPinBuf] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [dashPeriod, setDashPeriod] = useState("day");
  const [repPeriod, setRepPeriod] = useState("day");
  const [toast, setToast] = useState("");
  const [shopEdits, setShopEdits] = useState([]);
  const [newShopName, setNewShopName] = useState("");
  const [settPrices, setSettPrices] = useState({ kura: "", railway: "" });
  const [pinOld, setPinOld] = useState("");
  const [pinNew, setPinNew] = useState("");

  const upd = (newDB) => { setDB(newDB); saveDB(newDB); };
  const toast$ = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const shopKura = (i) => db.shops[i]?.kura ?? db.prices.kura;
  const shopRail = (i) => db.shops[i]?.railway ?? db.prices.railway;

  const isToday = curDate === todayStr();

  // PIN
  useEffect(() => {
    if (pinBuf.length < 4) return;
    if (pinBuf === db.pin) {
      setOwnerUnlocked(true); setPinBuf(""); setPinErr("");
      setShopEdits(db.shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.railway !== null ? String(s.railway) : "" })));
      setSettPrices({ kura: String(db.prices.kura), railway: String(db.prices.railway) });
    } else {
      setPinErr("Wrong PIN. Try again.");
      setTimeout(() => { setPinBuf(""); setPinErr(""); }, 900);
    }
  }, [pinBuf]);

  const pinKey = (k) => {
    if (k === "clr") { setPinBuf(""); setPinErr(""); return; }
    if (k === "del") { setPinBuf(p => p.slice(0, -1)); return; }
    if (pinBuf.length >= 4) return;
    setPinBuf(p => p + k);
  };

  // Entry
  const openEntry = (shopIdx, sessId) => {
    setSelShop(shopIdx);
    setSelSess(sessId);
    const ex = (db.deliveries[curDate]?.[shopIdx]?.[sessId]) || {};
    setEntryVals({ given: { kura: ex.given?.kura || 0, railway: ex.given?.railway || 0 }, leftover: { kura: ex.leftover?.kura || 0, railway: ex.leftover?.railway || 0 } });
    setView("entry");
  };

  const adj = (g, t, d) => setEntryVals(prev => ({ ...prev, [g]: { ...prev[g], [t]: Math.max(0, (prev[g]?.[t] || 0) + d) } }));

  const saveEntry = () => {
    const nd = { ...db, deliveries: { ...db.deliveries, [curDate]: { ...(db.deliveries[curDate] || {}), [selShop]: { ...(db.deliveries[curDate]?.[selShop] || {}) } } } };
    const obj = { given: { ...entryVals.given } };
    if (selSess === "morning") obj.leftover = { ...entryVals.leftover };
    nd.deliveries[curDate][selShop][selSess] = obj;
    upd(nd); toast$("Saved ✓"); setTimeout(() => setView("session"), 300);
  };

  // Stats
  const calcStats = (period) => {
    const t = todayStr(); let s = t;
    if (period === "week") s = addDays(t, -6);
    if (period === "month") s = addDays(t, -29);
    let totGK = 0, totGR = 0, totLK = 0, totLR = 0, totRev = 0;
    const ss = {};
    db.shops.forEach((_, i) => ss[i] = { kura: 0, railway: 0, leftK: 0, leftR: 0, rev: 0 });
    Object.entries(db.deliveries).forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.railway || 0;
          const rev = k * shopKura(i) + r * shopRail(i);
          if (!ss[i]) ss[i] = { kura: 0, railway: 0, leftK: 0, leftR: 0, rev: 0 };
          ss[i].kura += k; ss[i].railway += r; ss[i].rev += rev;
          totGK += k; totGR += r; totRev += rev;
          if (sv.id === "morning") { const lk = d.leftover?.kura || 0, lr = d.leftover?.railway || 0; ss[i].leftK += lk; ss[i].leftR += lr; totLK += lk; totLR += lr; }
        });
      });
    });
    return { totGK, totGR, totLK, totLR, totRev, ss };
  };

  // CSV export — rows grouped by date
  const exportCSV = () => {
    const t = todayStr(); let s = t;
    if (repPeriod === "week") s = addDays(t, -6);
    if (repPeriod === "month") s = addDays(t, -29);
    let csv = "Date,Shop,Session,Kura Given,Railway Given,Kura Price,Railway Price,Revenue,Leftover Kura,Leftover Railway\n";
    Object.entries(db.deliveries).sort().forEach(([date, shops]) => {
      if (date < s || date > t) return;
      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        const shop = db.shops[i]?.name || ("Shop " + idx);
        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.railway || 0; if (!k && !r) return;
          const lk = d.leftover?.kura || 0, lr = d.leftover?.railway || 0;
          const rev = (k * shopKura(i) + r * shopRail(i)).toFixed(2);
          csv += `${date},${shop},${sv.label},${k},${r},${shopKura(i).toFixed(2)},${shopRail(i).toFixed(2)},${rev},${lk},${lr}\n`;
        });
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `bread-delivery-${repPeriod}.csv`; a.click();
    toast$("Downloading CSV…");
  };

  // Owner: save shops
  const saveShops = () => {
    const shops = shopEdits.map(s => ({ name: s.name.trim() || s.name, kura: s.kuraStr !== "" ? parseFloat(s.kuraStr) : null, railway: s.railStr !== "" ? parseFloat(s.railStr) : null }));
    upd({ ...db, shops }); toast$("Shops saved ✓");
  };
  const addShop = () => {
    if (!newShopName.trim()) return;
    const shops = [...db.shops, { name: newShopName.trim(), kura: null, railway: null }];
    upd({ ...db, shops });
    setShopEdits(shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.railway !== null ? String(s.railway) : "" })));
    setNewShopName("");
  };
  const removeShop = (i) => {
    if (db.shops.length <= 1) return;
    const shops = db.shops.filter((_, x) => x !== i);
    upd({ ...db, shops });
    setShopEdits(shops.map(s => ({ ...s, kuraStr: s.kura !== null ? String(s.kura) : "", railStr: s.railway !== null ? String(s.railway) : "" })));
  };
  const savePrices = () => {
    upd({ ...db, prices: { kura: parseFloat(settPrices.kura) || 0, railway: parseFloat(settPrices.railway) || 0 } });
    toast$("Default prices saved ✓");
  };
  const changePin = () => {
    if (pinOld !== db.pin) { toast$("Wrong current PIN"); return; }
    if (pinNew.length !== 4 || !/^\d+$/.test(pinNew)) { toast$("PIN must be 4 digits"); return; }
    upd({ ...db, pin: pinNew }); toast$("PIN changed ✓"); setPinOld(""); setPinNew("");
  };

  const { totGK, totGR, totLK, totLR, totRev, ss } = calcStats(ownerUnlocked ? dashPeriod : "day");
  const repStats = calcStats(repPeriod);

  // Delivery screens
  const renderShopsScreen = () => (
    <div>
      <div style={c.dateRow}>
        <button style={c.dateBtn} onClick={() => setCurDate(d => addDays(d, -1))}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{isToday ? "Today — " : ""}{fmtDateShort(curDate)}</span>
        <button style={{ ...c.dateBtn, opacity: isToday ? 0.3 : 1 }} onClick={() => { if (!isToday) setCurDate(d => addDays(d, 1)); }}>›</button>
      </div>
      <div style={c.pad}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Select shop</div>
        <div style={c.shopGrid}>
          {db.shops.map((s, i) => {
            const sd = db.deliveries[curDate]?.[i] || {};
            const done = SESS.some(x => sd[x.id] && (sd[x.id].given?.kura || sd[x.id].given?.railway));
            return (
              <button key={i} style={c.shopBtn} onClick={() => { setSelShop(i); setView("session"); }}>
                {s.name}
                {done && <span style={{ ...c.tag, position: "absolute", top: 8, right: 8 }}>✓ Done</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSessionScreen = () => {
    const sd = db.deliveries[curDate]?.[selShop] || {};
    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={() => setView("shops")}>‹</button>
          <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db.shops[selShop]?.name}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(curDate)}</div></div>
        </div>
        <div style={c.pad}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Choose session</div>
          <div style={c.sessList}>
            {SESS.map(s => {
              const d = sd[s.id] || {};
              const has = d.given && (d.given.kura > 0 || d.given.railway > 0);
              let sub = s.sub;
              if (has) { sub = `Given: K ${d.given.kura} · R ${d.given.railway}`; if (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.railway > 0)) sub += ` | Left: K${d.leftover.kura} R${d.leftover.railway}`; }
              return (
                <button key={s.id} style={c.sessBtn(has)} onClick={() => openEntry(selShop, s.id)}>
                  <div><div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div><div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div></div>
                  <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderEntryScreen = () => {
    const s = SESS.find(x => x.id === selSess);
    const isMorn = selSess === "morning";
    return (
      <div>
        <div style={c.topbar}>
          <button style={c.backBtn} onClick={() => setView("session")}>‹</button>
          <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db.shops[selShop]?.name} — {s?.label}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(curDate)}</div></div>
        </div>
        <div style={c.pad}>
          <div style={c.block}>
            <div style={c.blockTitle}>Given to shop</div>
            {[["kura", "Kura"], ["railway", "Railway"]].map(([t, lbl]) => (
              <div key={t} style={{ ...c.breadRow, marginBottom: t === "railway" ? 0 : 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
                <div style={c.counter}>
                  <button style={c.cntBtn} onClick={() => adj("given", t, -1)}>−</button>
                  <span style={{ fontSize: 18, fontWeight: 600, minWidth: 36, textAlign: "center" }}>{entryVals.given?.[t] || 0}</span>
                  <button style={c.cntBtn} onClick={() => adj("given", t, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          {isMorn && (
            <div style={c.block}>
              <div style={c.blockTitle}>Leftover collected (taken back)</div>
              {[["kura", "Kura"], ["railway", "Railway"]].map(([t, lbl]) => (
                <div key={t} style={{ ...c.breadRow, marginBottom: t === "railway" ? 0 : 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
                  <div style={c.counter}>
                    <button style={c.cntBtn} onClick={() => adj("leftover", t, -1)}>−</button>
                    <span style={{ fontSize: 18, fontWeight: 600, minWidth: 36, textAlign: "center" }}>{entryVals.leftover?.[t] || 0}</span>
                    <button style={c.cntBtn} onClick={() => adj("leftover", t, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button style={c.primaryBtn} onClick={saveEntry}>Save</button>
        </div>
      </div>
    );
  };

  // Owner screens
  const renderDashboard = () => {
    const revs = db.shops.map((s, i) => ({ name: s.name, rev: ss[i]?.rev || 0 })).filter(x => x.rev > 0).sort((a, b) => b.rev - a.rev);
    const maxR = revs.length ? revs[0].rev : 1;
    return (
      <div style={c.pad}>
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
          {[["day","Today"],["week","7 days"],["month","30 days"]].map(([p,l]) => <button key={p} style={c.periodBtn(dashPeriod===p)} onClick={() => setDashPeriod(p)}>{l}</button>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
          {[["Revenue", totRev.toFixed(2)+" ₼"],["Total given",totGK+totGR],["Kura given",totGK],["Railway given",totGR],["Leftovers back",totLK+totLR],["Net delivered",(totGK+totGR)-(totLK+totLR)]].map(([l,v]) => (
            <div key={l} style={c.metric}><div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3 }}>{l}</div><div style={{ fontSize: 20, fontWeight: 600 }}>{v}</div></div>
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Revenue by shop</div>
        {revs.length ? revs.map(x => (
          <div key={x.name} className="bar-row">
            <span className="bar-label">{x.name}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(x.rev / maxR * 100)}%` }}></div></div>
            <span style={{ fontSize: 12, fontWeight: 500, minWidth: 40 }}>{x.rev.toFixed(1)}₼</span>
          </div>
        )) : <div style={{ textAlign: "center", padding: "1.5rem", fontSize: 13, color: "var(--text2)" }}>No data yet.</div>}
      </div>
    );
  };

  const renderReports = () => {
    const { ss: rss } = repStats;
    // Build date-level summary for the table
    const t = todayStr(); let s = t;
    if (repPeriod === "week") s = addDays(t, -6);
    if (repPeriod === "month") s = addDays(t, -29);
    const dateRows = [];
    Object.entries(db.deliveries).sort().reverse().forEach(([date, shops]) => {
      if (date < s || date > t) return;
      let dGK = 0, dGR = 0, dLK = 0, dLR = 0, dRev = 0;
      Object.entries(shops).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        SESS.forEach(sv => {
          const d = sess[sv.id]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.railway || 0;
          dGK += k; dGR += r; dRev += k * shopKura(i) + r * shopRail(i);
          if (sv.id === "morning") { dLK += d.leftover?.kura || 0; dLR += d.leftover?.railway || 0; }
        });
      });
      if (dGK || dGR) dateRows.push({ date, dGK, dGR, dLK, dLR, dRev });
    });
    return (
      <div style={c.pad}>
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
          {[["day","Today"],["week","7 days"],["month","30 days"]].map(([p,l]) => <button key={p} style={c.periodBtn(repPeriod===p)} onClick={() => setRepPeriod(p)}>{l}</button>)}
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
          {db.shops.filter((_, i) => rss[i] && (rss[i].kura || rss[i].railway)).length ? db.shops.map((shop, i) => {
            const v = rss[i]; if (!v || (!v.kura && !v.railway)) return null;
            return (
              <div key={i} style={c.listRow(i === db.shops.length - 1)}>
                <div><div style={{ fontSize: 14, fontWeight: 600 }}>{shop.name}</div><div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>K: {v.kura} · R: {v.railway} · Left: {v.leftK + v.leftR}</div></div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v.rev.toFixed(2)} ₼</div>
              </div>
            );
          }) : <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: 13, color: "var(--text2)" }}>No data for this period.</div>}
        </div>
        <button style={c.outlineBtn} onClick={exportCSV}>⬇ Export to CSV / Excel</button>
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
              <input type="number" value={s.kuraStr} placeholder={db.prices.kura.toFixed(2)} min="0" step="0.01" onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, kuraStr: e.target.value } : x))} />
              <input type="number" value={s.railStr} placeholder={db.prices.railway.toFixed(2)} min="0" step="0.01" onChange={e => setShopEdits(prev => prev.map((x, j) => j === i ? { ...x, railStr: e.target.value } : x))} />
              <button onClick={() => removeShop(i)}>🗑</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={newShopName} onChange={e => setNewShopName(e.target.value)} onKeyDown={e => e.key === "Enter" && addShop()} placeholder="New shop name…" style={{ flex: 1, padding: "9px 12px", fontSize: 14, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }} />
        <button onClick={addShop} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer" }}>+ Add</button>
      </div>
      <button style={c.primaryBtn} onClick={saveShops}>Save all shops</button>
    </div>
  );

  const renderSettings = () => (
    <div style={c.pad}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Default bread prices</div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Applied to shops without a custom price.</div>
      <div style={c.listCard}>
        {[["kura", "Kura", "kura"], ["railway", "Railway", "railway"]].map(([k, lbl, field], i) => (
          <div key={k} style={c.settRow(i === 1)}>
            <div><div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div><div style={{ fontSize: 11, color: "var(--text2)" }}>default per loaf</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <input type="number" min={0} step={0.01} value={settPrices[field]} onChange={e => setSettPrices(p => ({ ...p, [field]: e.target.value }))} style={{ width: 68, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
              <span style={{ fontSize: 13, color: "var(--text2)" }}>₼</span>
            </div>
          </div>
        ))}
      </div>
      <button style={{ ...c.primaryBtn, marginBottom: "1.25rem" }} onClick={savePrices}>Save default prices</button>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Change PIN</div>
      <div style={c.listCard}>
        {[["Current PIN", pinOld, setPinOld], ["New PIN", pinNew, setPinNew]].map(([lbl, val, setter], i) => (
          <div key={lbl} style={c.settRow(i === 1)}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div>
            <input type="password" maxLength={4} value={val} onChange={e => setter(e.target.value)} style={{ width: 80, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
          </div>
        ))}
      </div>
      <button style={c.outlineBtn} onClick={changePin}>Change PIN</button>
    </div>
  );

  const renderPinScreen = () => (
    <div style={{ minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "2rem" }}>
      <div style={{ fontSize: 18, fontWeight: 500 }}>Owner access</div>
      <div style={{ fontSize: 13, color: "var(--text2)" }}>Enter your PIN</div>
      <div style={{ display: "flex", gap: 12, margin: "4px 0" }}>
        {[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < pinBuf.length)}></div>)}
      </div>
      <div style={{ color: "var(--danger, #dc2626)", fontSize: 13, minHeight: 18 }}>{pinErr}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: 220 }}>
        {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
          <button key={k} style={c.pinKey} onClick={() => pinKey(k)}>{k === "clr" ? "CLR" : k === "del" ? "⌫" : k}</button>
        ))}
      </div>
    </div>
  );

  const ownerTabs = [["dashboard","Dashboard"],["reports","Reports"],["shops-mgr","Shops"],["settings","Settings"]];

  return (
    <div style={c.wrap}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" />

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "10px 22px", borderRadius: 30, fontSize: 14, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}

      <div style={c.nav}>
        {[["delivery","🚚","Delivery"],["owner","🔐","Owner"]].map(([key,icon,lbl]) => (
          <button key={key} style={c.navBtn(tab===key)} onClick={() => { setTab(key); if (key === "delivery") { setView("shops"); } }}>
            <span style={{ fontSize: 18 }}>{icon}</span>{lbl}
          </button>
        ))}
      </div>

      {tab === "delivery" && (
        <>
          {view === "shops" && renderShopsScreen()}
          {view === "session" && renderSessionScreen()}
          {view === "entry" && renderEntryScreen()}
        </>
      )}

      {tab === "owner" && (
        <>
          {!ownerUnlocked && renderPinScreen()}
          {ownerUnlocked && (
            <div>
              <div style={{ padding: "1rem 1rem 0" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
                  {ownerTabs.map(([k,l]) => <button key={k} style={c.ownerNavBtn(ownerTab===k)} onClick={() => setOwnerTab(k)}>{l}</button>)}
                </div>
              </div>
              {ownerTab === "dashboard" && renderDashboard()}
              {ownerTab === "reports" && renderReports()}
              {ownerTab === "shops-mgr" && renderShopsMgr()}
              {ownerTab === "settings" && renderSettings()}
              <div style={{ padding: "0 1rem 1.5rem" }}>
                <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setOwnerUnlocked(false); setPinBuf(""); }}>🔒 Lock</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
