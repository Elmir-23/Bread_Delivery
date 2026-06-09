import { c } from "../../styles/styles";
import { fmtDate } from "../../utils/dates";
import { SESS } from "../../constants";

export default function ShopsScreen({ db_data, TODAY, setSelShop, setView }) {
  return (
    <div style={c.pad}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>{fmtDate(TODAY)}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Mağaza seçin</div>
      <div style={c.shopGrid}>
        {db_data.shops.map((s, i) => {
          const sd = db_data.deliveries?.[TODAY]?.[i] || {};
          const done = SESS.every(x => sd[x.id] && (sd[x.id].given?.kura || sd[x.id].given?.damiryolu));
          const debt = db_data.debts?.[i] || 0;
          return (
            <button key={i} style={c.shopBtn} onClick={() => { setSelShop(i); setView("session"); }}>
              {s.name}
              {done && <span style={{ ...c.tag, position: "absolute", top: 8, right: 8 }}>✓</span>}
              {debt > 0 && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>{debt.toFixed(2)} ₼ debt</div>}
              {debt < 0 && <div style={{ fontSize: 10, color: "var(--success-text)", marginTop: 4, fontWeight: 600 }}>{Math.abs(debt).toFixed(2)} ₼ credit</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
