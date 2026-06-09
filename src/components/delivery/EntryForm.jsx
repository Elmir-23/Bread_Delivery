import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";
import { SESS } from "../../constants";

export default function EntryForm({ db_data, vals, adjFn, saveFn, backFn, shopIdx, sessId, date }) {
  const s = SESS.find(x => x.id === sessId);
  const isMorn = sessId === "morning";
  const kPrice = db_data.shops[shopIdx]?.kura ?? db_data.prices?.kura ?? 0.55;
  const rPrice = db_data.shops[shopIdx]?.damiryolu ?? db_data.prices?.damiryolu ?? 0.65;

  const inputStyle = {
    fontSize: 16, fontWeight: 600, width: 48, textAlign: "center",
    border: "1px solid var(--border2)", borderRadius: 8, padding: "5px 4px",
    background: "var(--bg)", color: "var(--text)"
  };

  const prices = { kura: kPrice, damiryolu: rPrice };
  const labels = { kura: "Kura", damiryolu: "Damiryolu" };

  return (
    <div>
      <div style={c.topbar}>
        <button style={c.backBtn} onClick={backFn}>‹</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[shopIdx]?.name} — {s?.label}</div>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(date)}</div>
        </div>
      </div>
      <div style={c.pad}>
        <div style={c.block}>
          <div style={c.blockTitle}>Mağazaya verilən</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 10px", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" }}>Çörək</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", textAlign: "center" }}>Qiymət</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", textAlign: "center" }}>Miqdar</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", textAlign: "right" }}>Cəmi</div>
          </div>
          {["kura", "damiryolu"].map(t => {
            const qty = vals.given?.[t] || 0;
            const total = qty * prices[t];
            return (
              <div key={t} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 10px", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{labels[t]}</div>
                <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", minWidth: 44 }}>{prices[t].toFixed(2)}₼</div>
                <div style={c.counter}>
                  <button style={c.cntBtn} onClick={() => adjFn("given", t, -1)}>−</button>
                  <input
                    type="number" min={0} value={qty || ""}
                    placeholder="0"
                    onChange={e => { const v = parseInt(e.target.value); adjFn("given", t, (isNaN(v) ? 0 : v) - qty); }}
                    style={inputStyle}
                  />
                  <button style={c.cntBtn} onClick={() => adjFn("given", t, 1)}>+</button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, textAlign: "right", minWidth: 48, color: qty > 0 ? "var(--text)" : "var(--text2)" }}>
                  {qty > 0 ? `${total.toFixed(2)}₼` : "—"}
                </div>
              </div>
            );
          })}
          {(vals.given?.kura > 0 || vals.given?.damiryolu > 0) && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>Cəmi</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {((vals.given?.kura || 0) * kPrice + (vals.given?.damiryolu || 0) * rPrice).toFixed(2)}₼
              </span>
            </div>
          )}
        </div>

{isMorn && (
  <div style={c.block}>
    <div style={c.blockTitle}>Qalıq geri alındı</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 10px", alignItems: "center", marginBottom: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase" }}>Çörək</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", textAlign: "center" }}>Qiymət</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", textAlign: "center" }}>Miqdar</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", textAlign: "right" }}>Azalma</div>
    </div>
    {["kura", "damiryolu"].map(t => {
      const qty = vals.leftover?.[t] || 0;
      const reduction = qty * prices[t];
      return (
        <div key={t} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 10px", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{labels[t]}</div>
          <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", minWidth: 44 }}>{prices[t].toFixed(2)}₼</div>
          <div style={c.counter}>
            <button style={c.cntBtn} onClick={() => adjFn("leftover", t, -1)}>−</button>
            <input
              type="number" min={0}
              value={qty || ""}
              placeholder="0"
              onChange={e => { const v = parseInt(e.target.value); adjFn("leftover", t, (isNaN(v) ? 0 : v) - qty); }}
              style={inputStyle}
            />
            <button style={c.cntBtn} onClick={() => adjFn("leftover", t, 1)}>+</button>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, textAlign: "right", minWidth: 48, color: qty > 0 ? "var(--success-text)" : "var(--text2)" }}>
            {qty > 0 ? `-${reduction.toFixed(2)}₼` : "—"}
          </div>
        </div>
      );
    })}
    {(vals.leftover?.kura > 0 || vals.leftover?.damiryolu > 0) && (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text2)" }}>Borc azalması</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--success-text)" }}>
          -{((vals.leftover?.kura || 0) * kPrice + (vals.leftover?.damiryolu || 0) * rPrice).toFixed(2)}₼
        </span>
      </div>
    )}
  </div>
)}

        <button style={c.primaryBtn} onClick={saveFn}>Saxla</button>
      </div>
    </div>
  );
}
