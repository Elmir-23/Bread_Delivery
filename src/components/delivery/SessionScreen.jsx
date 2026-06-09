import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";
import { SESS_WITH_DEBT } from "../../constants";

export default function SessionScreen({ db_data, TODAY, selShop, setView, setCollectedInput, openDeliveryEntry }) {
  const sd = db_data.deliveries?.[TODAY]?.[selShop] || {};
  const debt = db_data.debts?.[selShop] || 0;
  return (
    <div>
      <div style={c.topbar}>
        <button style={c.backBtn} onClick={() => setView("shops")}>‹</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[selShop]?.name}</div>
          <div style={{ fontSize: 12, color: debt > 0 ? "#dc2626" : debt < 0 ? "var(--success-text)" : "var(--text2)" }}>
            {debt > 0 ? `Borc: ${debt.toFixed(2)} ₼` : debt < 0 ? `Kredit: ${Math.abs(debt).toFixed(2)} ₼` : fmtDateShort(TODAY)}
          </div>
        </div>
      </div>
      <div style={c.pad}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Sessiya seçin</div>
        <div style={c.sessList}>
          {SESS_WITH_DEBT.map(s => {
            if (s.id === "debt") {
              const isCredit = debt < 0;
              return (
                <button key="debt" style={{ ...c.sessBtn(false), borderColor: debt !== 0 ? (isCredit ? "var(--success-border)" : "#fca5a5") : "var(--border)" }} onClick={() => { setCollectedInput(""); setView("debt"); }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: isCredit ? "var(--success-text)" : debt > 0 ? "#dc2626" : "var(--text)" }}>💰 Borc</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                      {debt === 0 ? "Borc yoxdur" : isCredit ? `Kredit: ${Math.abs(debt).toFixed(2)} ₼` : `Borc: ${debt.toFixed(2)} ₼`}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
                </button>
              );
            }
            const d = sd[s.id] || {};
            const has = d.given && (d.given.kura > 0 || d.given.damiryolu > 0);
            const kPrice = db_data.shops[selShop]?.kura ?? db_data.prices?.kura ?? 0.55;
const rPrice = db_data.shops[selShop]?.damiryolu ?? db_data.prices?.damiryolu ?? 0.65;
let sub = has
  ? `Verildi: K ${d.given.kura} · D ${d.given.damiryolu}` + (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.damiryolu > 0) ? ` | Qalıq: K${d.leftover.kura} D${d.leftover.damiryolu}` : "")
  : `Kura ${kPrice.toFixed(2)}₼ · Damiryolu ${rPrice.toFixed(2)}₼`;
return (
  <button key={s.id} style={c.sessBtn(has)} onClick={() => openDeliveryEntry(selShop, s.id)}>
    <div><div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div><div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div></div>
    <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
  </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
