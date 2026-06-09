import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";

export default function DebtScreen({ db_data, TODAY, selShop, collectedInput, setCollectedInput, saveDebtCollection, setView }) {
  const currentDebt = db_data.debts?.[selShop] || 0;
  const isCredit = currentDebt < 0;
  const newBalance = currentDebt - (parseFloat(collectedInput) || 0);
  return (
    <div>
      <div style={c.topbar}>
        <button style={c.backBtn} onClick={() => setView("session")}>‹</button>
        <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[selShop]?.name} — Debt</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(TODAY)}</div></div>
      </div>
      <div style={c.pad}>
        <div style={{ ...c.block, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{isCredit ? "Kredit (artıq ödənildi)" : "Cari borc"}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: isCredit ? "var(--success-text)" : currentDebt > 0 ? "#dc2626" : "var(--text)" }}>{Math.abs(currentDebt).toFixed(2)} ₼</div>
        </div>
        <div style={c.block}>
          <div style={c.blockTitle}>Amount collected now</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" min={0} step={0.01} value={collectedInput} onChange={e => setCollectedInput(e.target.value)} placeholder="0.00" style={{ flex: 1, padding: "10px 12px", fontSize: 20, fontWeight: 600, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", textAlign: "right" }} />
            <span style={{ fontSize: 16, color: "var(--text2)" }}>₼</span>
          </div>
          {collectedInput !== "" && (
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 8, textAlign: "right" }}>
              New balance: <strong style={{ color: newBalance < 0 ? "var(--success-text)" : newBalance > 0 ? "#dc2626" : "var(--text)" }}>{newBalance.toFixed(2)} ₼</strong>
            </div>
          )}
        </div>
        <button style={c.primaryBtn} onClick={saveDebtCollection}>Saxla</button>
      </div>
    </div>
  );
}
