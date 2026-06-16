import { c } from "../../styles/styles";

export default function Parametrler({
  db_data, settPrices, setSettPrices, savePrices,
  pinOld, setPinOld, pinNew, setPinNew, changePin,
  shopEdits, setShopEdits, newShopName, setNewShopName, addShop, removeShop, saveShops,
}) {
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 };

  return (
    <div style={c.pad}>
      {/* ── Standart qiymətlər ── */}
      <div style={labelStyle}>Standart çörək qiymətləri</div>
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
      <button style={{ ...c.primaryBtn, marginBottom: "1.5rem" }} onClick={savePrices}>Standart qiymətləri saxla</button>

      {/* ── Mağazalar ── */}
      <div style={labelStyle}>Mağazalar</div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Qiymət boş buraxılsa, standart qiymət tətbiq edilir.</div>
      <div style={c.listCard}>
        <div style={{ padding: "8px 14px" }}>
          <div className="shop-edit-hdr"><span>Ad</span><span style={{ textAlign: "right" }}>Kura ₼</span><span style={{ textAlign: "right" }}>Damiryolu ₼</span><span></span></div>
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
      <button style={{ ...c.primaryBtn, marginBottom: "1.5rem" }} onClick={saveShops}>Bütün mağazaları saxla</button>

      {/* ── PIN ── */}
      <div style={labelStyle}>PIN-i dəyiş</div>
      <div style={c.listCard}>
        {[["Cari PIN", pinOld, setPinOld],["Yeni PIN", pinNew, setPinNew]].map(([lbl,val,setter],i) => (
          <div key={lbl} style={c.settRow(i===1)}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</div>
            <input type="password" maxLength={4} value={val} onChange={e => setter(e.target.value)} style={{ width: 80, padding: "5px 8px", textAlign: "right", fontSize: 14, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }} />
          </div>
        ))}
      </div>
      <button style={c.outlineBtn} onClick={changePin}>PIN-i dəyiş</button>
    </div>
  );
}
