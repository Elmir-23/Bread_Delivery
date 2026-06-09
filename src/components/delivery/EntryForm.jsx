import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";
import { SESS } from "../../constants";

export default function EntryForm({ db_data, vals, adjFn, saveFn, backFn, shopIdx, sessId, date }) {
  const s = SESS.find(x => x.id === sessId);
  const isMorn = sessId === "morning";
  const inputStyle = { fontSize: 18, fontWeight: 600, width: 52, textAlign: "center", border: "1px solid var(--border2)", borderRadius: 8, padding: "5px 4px", background: "var(--bg)", color: "var(--text)" };
  return (
    <div>
      <div style={c.topbar}>
        <button style={c.backBtn} onClick={backFn}>‹</button>
        <div><div style={{ fontSize: 16, fontWeight: 500 }}>{db_data.shops[shopIdx]?.name} — {s?.label}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDateShort(date)}</div></div>
      </div>
      <div style={c.pad}>
        <div style={c.block}>
          <div style={c.blockTitle}>Mağazaya verilən</div>
          {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([t,lbl]) => (
            <div key={t} style={{ ...c.breadRow, marginBottom: t === "damiryolu" ? 0 : 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
              <div style={c.counter}>
                <button style={c.cntBtn} onClick={() => adjFn("given", t, -1)}>−</button>
                <input type="number" min={0} value={vals.given?.[t] || ""} placeholder="0" onChange={e => { const v = parseInt(e.target.value); adjFn("given", t, (isNaN(v) ? 0 : v) - (vals.given?.[t] || 0)); }} style={inputStyle} />
                <button style={c.cntBtn} onClick={() => adjFn("given", t, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        {isMorn && (
          <div style={c.block}>
            <div style={c.blockTitle}>Qalıq geri alındı</div>
            {[["kura","Kura"],["damiryolu","Damiryolu"]].map(([t,lbl]) => (
              <div key={t} style={{ ...c.breadRow, marginBottom: t === "damiryolu" ? 0 : 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
                <div style={c.counter}>
                  <button style={c.cntBtn} onClick={() => adjFn("leftover", t, -1)}>−</button>
                  <input type="number" min={0} value={vals.leftover?.[t] || ""} placeholder="0" onChange={e => { const v = parseInt(e.target.value); adjFn("leftover", t, (isNaN(v) ? 0 : v) - (vals.leftover?.[t] || 0)); }} style={inputStyle} />
                  <button style={c.cntBtn} onClick={() => adjFn("leftover", t, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button style={c.primaryBtn} onClick={saveFn}>Saxla</button>
      </div>
    </div>
  );
}
