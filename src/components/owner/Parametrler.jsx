import { c } from "../../styles/styles";

export default function Parametrler({ db_data, settPrices, setSettPrices, savePrices, pinOld, setPinOld, pinNew, setPinNew, changePin }) {
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
      <button style={c.outlineBtn} onClick={changePin}>PIN-i dəyiş</button>
    </div>
  );
}
