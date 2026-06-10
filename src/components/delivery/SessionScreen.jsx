import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";
import { SESS_WITH_DEBT } from "../../constants";

export default function SessionScreen({ db_data, TODAY, selShop, setView, setCollectedInput, openDeliveryEntry }) {
  const sd = db_data.deliveries?.[TODAY]?.[selShop] || {};
  const debt = db_data.debts?.[selShop] || 0;
  const shop = db_data.shops[selShop];
  const kPrice = shop?.kura ?? db_data.prices?.kura ?? 0.55;
  const rPrice = shop?.damiryolu ?? db_data.prices?.damiryolu ?? 0.65;

  let totalGK = 0, totalGD = 0, totalLK = 0, totalLD = 0;
  ["morning", "afternoon", "evening"].forEach(sv => {
    const d = sd[sv]; if (!d) return;
    totalGK += d.given?.kura || 0;
    totalGD += d.given?.damiryolu || 0;
    if (sv === "morning") {
      totalLK += d.leftover?.kura || 0;
      totalLD += d.leftover?.damiryolu || 0;
    }
  });
  const netK = Math.max(0, totalGK - totalLK);
  const netD = Math.max(0, totalGD - totalLD);
  const givenVal = totalGK * kPrice + totalGD * rPrice;
  const leftVal = totalLK * kPrice + totalLD * rPrice;
  const todayYigilan = Object.values(db_data.debtPayments?.[TODAY]?.[selShop] !== undefined 
   ? { [selShop]: db_data.debtPayments?.[TODAY]?.[selShop] } 
   : {}).reduce((a, b) => a + b, 0);
  const todayDebt = givenVal - leftVal - todayYigilan;
  const hasAny = totalGK > 0 || totalGD > 0;

  const thS = { padding: "4px 6px", fontSize: 11, fontWeight: 500, color: "var(--text2)", textAlign: "center" };
  const tdS = (right, bold, color) => ({ padding: "6px", fontSize: 12, textAlign: right ? "right" : "center", fontWeight: bold ? 600 : 400, color: color || "var(--text)" });

  return (
    <div>
      <div style={c.topbar}>
        <button style={c.backBtn} onClick={() => setView("shops")}>‹</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{shop?.name}</div>
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
            let sub = has
              ? `Verildi: K ${d.given.kura} · D ${d.given.damiryolu}` + (s.id === "morning" && d.leftover && (d.leftover.kura > 0 || d.leftover.damiryolu > 0) ? ` | Qalıq: K${d.leftover.kura} D${d.leftover.damiryolu}` : "")
              : `Kura ${kPrice.toFixed(2)}₼ · Damiryolu ${rPrice.toFixed(2)}₼`;
            return (
              <button key={s.id} style={c.sessBtn(has)} onClick={() => openDeliveryEntry(selShop, s.id)}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: has ? "var(--success-text)" : "var(--text)" }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize: 12, color: has ? "var(--success-text)" : "var(--text2)", marginTop: 2 }}>{sub}</div>
                </div>
                <span style={{ fontSize: 16, opacity: 0.4 }}>›</span>
              </button>
            );
          })}
        </div>

        {hasAny && (
          <div style={{ ...c.block, marginTop: 16, background: "var(--bg2)" }}>
            <div style={c.blockTitle}>Günün xülasəsi</div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ ...thS, textAlign: "left" }}></th>
                  <th style={thS}>Kura</th>
                  <th style={thS}>Damiryolu</th>
                  <th style={thS}>Cəmi</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...tdS(false), color: "var(--text2)", fontSize: 11 }}>Verilən</td>
                  <td style={tdS()}>{totalGK}</td>
                  <td style={tdS()}>{totalGD}</td>
                  <td style={{ ...tdS(), fontWeight: 600 }}>{totalGK + totalGD}</td>
                </tr>
                {(totalLK > 0 || totalLD > 0) && (
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...tdS(false), color: "var(--text2)", fontSize: 11 }}>Qaytarılan</td>
                    <td style={tdS()}>{totalLK}</td>
                    <td style={tdS()}>{totalLD}</td>
                    <td style={{ ...tdS(), fontWeight: 600 }}>{totalLK + totalLD}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ ...tdS(false), fontWeight: 600, fontSize: 11 }}>Yekun</td>
                  <td style={{ ...tdS(), fontWeight: 600 }}>{netK}</td>
                  <td style={{ ...tdS(), fontWeight: 600 }}>{netD}</td>
                  <td style={{ ...tdS(), fontWeight: 600 }}>{netK + netD}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ height: "0.5px", background: "var(--border)", marginBottom: 8 }}></div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ ...tdS(false), color: "var(--text2)", fontSize: 11 }}>Verilənə görə</td>
                  <td style={{ ...tdS(true), color: "#dc2626" }}>+{givenVal.toFixed(2)} ₼</td>
                </tr>
                {leftVal > 0 && (
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...tdS(false), color: "var(--text2)", fontSize: 11 }}>Qaytarilana görə</td>
                    <td style={{ ...tdS(true), color: "var(--success-text)" }}>−{leftVal.toFixed(2)} ₼</td>
                  </tr>
                )}
                <tr>
                  <td style={{ ...tdS(false), fontWeight: 600, fontSize: 11 }}>Bu günkü borc</td>
                  <td style={{ ...tdS(true), fontWeight: 600, color: "#dc2626" }}>{todayDebt.toFixed(2)} ₼</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
