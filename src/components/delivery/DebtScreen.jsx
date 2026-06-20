import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";

export default function DebtScreen({ db_data, TODAY, selShop, collectedInput, setCollectedInput, saveDebtCollection, setView }) {
  return (
    <div>
      <div style={c.topbar}>
        <button style={c.backBtn} onClick={() => setView("session")}>‹</button>
        <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[selShop]?.name} — Borc yığımı</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(TODAY)}</div></div>
      </div>
      <div style={c.pad}>
        <div style={c.block}>
          <div style={c.blockTitle}>Yığılan məbləğ</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" min={0} step={0.01} value={collectedInput} onChange={e => setCollectedInput(e.target.value)} placeholder="0.00" style={{ flex: 1, padding: "10px 12px", fontSize: 20, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
            <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
            Mağazanın borc məlumatı «Borclar» bölməsində göstərilir.
          </div>
        </div>
        <button style={{ ...c.primaryBtn, marginTop: 16 }} onClick={saveDebtCollection}>Saxla</button>
      </div>
    </div>
  );
}
