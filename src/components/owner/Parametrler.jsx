import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";

export default function Parametrler({ db_data, archives, settPrices, setSettPrices, savePrices, pinOld, setPinOld, pinNew, setPinNew, changePin, resetConfirm, setResetConfirm, resetPinBuf, setResetPinBuf, resetPinErr, setResetPinErr, resetAllData, toast$ }) {
  const downloadArchive = (arc) => {
    const blob = new Blob([arc.csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bread-arxiv-${arc.weekMonday}.csv`;
    a.click();
    toast$("CSV yüklənir…");
  };

  const handleResetPin = (k) => {
    if (k === "clr") { setResetPinBuf(""); setResetPinErr(""); return; }
    if (k === "del") { setResetPinBuf(p => p.slice(0,-1)); return; }
    if (resetPinBuf.length >= 4) return;
    const next = resetPinBuf + k;
    setResetPinBuf(next);
    if (next.length === 4) {
      if (next === db_data?.pin) { resetAllData(); }
      else { setResetPinErr("PIN yanlışdır"); setTimeout(() => { setResetPinBuf(""); setResetPinErr(""); }, 900); }
    }
  };

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
      <button style={{ ...c.outlineBtn, marginBottom: "1.5rem" }} onClick={changePin}>PIN-i dəyiş</button>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Arxivlər</div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Hər həftə giriş etdikdə avtomatik saxlanılır.</div>
      {archives.length === 0 ? (
        <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Hələ arxiv yoxdur.</div>
      ) : (
        <div style={{ ...c.listCard, marginBottom: "1.5rem" }}>
          {archives.map((arc, i) => (
            <div key={arc.id} style={{ ...c.listRow(i === archives.length - 1), gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateShort(arc.weekMonday)} həftəsi</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{fmtDateShort(arc.archivedOn)} · {arc.rowCount} sətir</div>
              </div>
              <button onClick={() => downloadArchive(arc)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text)", cursor: "pointer", flexShrink: 0 }}>⬇ CSV</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Məlumatları sıfırla</div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Çatdırılma, borc və ödəniş məlumatları silinəcək. Mağazalar, qiymətlər və PIN saxlanılacaq. Sıfırlamadan əvvəl arxiv avtomatik yaradılır.</div>
      {!resetConfirm ? (
        <button style={{ ...c.outlineBtn, color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => setResetConfirm(true)}>🗑 Hamısını sıfırla</button>
      ) : (
        <div style={c.block}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 12, textAlign: "center" }}>Təsdiq üçün PIN daxil edin</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12 }}>
            {[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < resetPinBuf.length)}></div>)}
          </div>
          {resetPinErr && <div style={{ color: "#dc2626", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{resetPinErr}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
            {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
              <button key={k} style={{ ...c.pinKey, padding: 10, fontSize: 16 }} onClick={() => handleResetPin(k)}>{k==="clr"?"CLR":k==="del"?"⌫":k}</button>
            ))}
          </div>
          <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setResetConfirm(false); setResetPinBuf(""); setResetPinErr(""); }}>Ləğv et</button>
        </div>
      )}
    </div>
  );
}
