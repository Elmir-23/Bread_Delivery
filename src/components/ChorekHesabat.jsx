import { useState } from "react";
import { c } from "../styles/styles";
import { todayStr, addDays, fmtDate } from "../utils/dates";
import { SESS } from "../constants";

export default function ChorekHesabat({ db_data }) {
  const [period, setPeriod] = useState("day");
  const [rangeStart, setRangeStart] = useState(addDays(todayStr(), -6));
  const [rangeEnd, setRangeEnd] = useState(todayStr());

  let s, e;
  if (period === "yesterday") {
    s = e = addDays(todayStr(), -1);
  } else if (period === "range") {
    s = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    e = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
  } else {
    s = e = todayStr();
  }
  const t = e;

  const shopRows = [];
  let grandGK = 0, grandGD = 0, grandLK = 0, grandLD = 0;

  db_data.shops.forEach((shop, i) => {
    const rows = [];
    let totGK = 0, totGD = 0, totLK = 0, totLD = 0;

    SESS.forEach(sv => {
      let gK = 0, gD = 0, lK = 0, lD = 0;
      Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
        if (date < s || date > t) return;
        const d = shops[i]?.[sv.id];
        if (!d) return;
        gK += d.given?.kura || 0;
        gD += d.given?.damiryolu || 0;
        if (sv.id === "morning") {
          lK += d.leftover?.kura || 0;
          lD += d.leftover?.damiryolu || 0;
        }
      });
      rows.push({ sess: sv, gK, gD, lK, lD });
      totGK += gK; totGD += gD; totLK += lK; totLD += lD;
    });

    if (totGK || totGD) {
      shopRows.push({ shop, i, rows, totGK, totGD, totLK, totLD });
      grandGK += totGK; grandGD += totGD; grandLK += totLK; grandLD += totLD;
    }
  });

  const th = (center, left) => ({
    padding: "5px 6px", fontSize: 10, fontWeight: 700,
    color: "var(--text2)", textAlign: center ? "center" : left ? "left" : "center",
    background: "var(--bg2)", border: "1px solid var(--border)", whiteSpace: "nowrap"
  });
  const td = (center, bold, color) => ({
    padding: "5px 6px", fontSize: 11, textAlign: center ? "center" : "left",
    border: "1px solid var(--border)", fontWeight: bold ? 600 : 400,
    color: color || "var(--text)", whiteSpace: "nowrap"
  });

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ padding: "0 1rem 10px", display: "flex", gap: 6 }}>
        {[["day","Bu gün"],["yesterday","Dünən"],["range","Tarix aralığı"]].map(([p,l]) => (
          <button key={p} style={c.periodBtn(period===p)} onClick={() => setPeriod(p)}>{l}</button>
        ))}
      </div>

      {period === "range" && (
        <div style={{ padding: "0 1rem 10px", display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={rangeStart}
            max={todayStr()}
            onChange={ev => setRangeStart(ev.target.value)}
            style={{
              flex: 1, padding: "7px 8px", fontSize: 13, borderRadius: 8,
              border: "1px solid var(--border2)", background: "var(--bg)", color: "var(--text)"
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text2)" }}>—</span>
          <input
            type="date"
            value={rangeEnd}
            max={todayStr()}
            onChange={ev => setRangeEnd(ev.target.value)}
            style={{
              flex: 1, padding: "7px 8px", fontSize: 13, borderRadius: 8,
              border: "1px solid var(--border2)", background: "var(--bg)", color: "var(--text)"
            }}
          />
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10, padding: "0 1rem" }}>
        {s === t ? fmtDate(t) : `${fmtDate(s)} — ${fmtDate(t)}`}
      </div>

      {/* Yuxarıda xülasə kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 1rem", marginBottom: "1rem" }}>
        {/* Verilən — sesssiyalara görə */}
        <div style={c.metric}>
          <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>Verilən</div>
          {(() => {
            const sessTotals = SESS.map(sv => {
              let k = 0, d = 0;
              db_data.shops.forEach((_, i) => {
                Object.entries(db_data.deliveries || {}).forEach(([date, shops]) => {
                  if (date < s || date > t) return;
                  const dd = shops[i]?.[sv.id]; if (!dd) return;
                  k += dd.given?.kura || 0;
                  d += dd.given?.damiryolu || 0;
                });
              });
              return { sv, k, d };
            });
            return sessTotals.map(({ sv, k, d }) => (
              <div key={sv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--text2)" }}>{sv.icon} {sv.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {(k || d) ? `K:${k} · D:${d}` : "—"}
                </span>
              </div>
            ));
          })()}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>Cəmi</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>K:{grandGK} · D:{grandGD}</span>
          </div>
        </div>

        {/* Qaytarılan — sadəcə saylar */}
        <div style={c.metric}>
          <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>Qaytarılan</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>Kura</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{grandLK || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>Damiryolu</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{grandLD || "—"}</span>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>Cəmi</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{(grandLK + grandLD) || "—"}</span>
          </div>
        </div>
      </div>

      {/* Cədvəl */}
      {shopRows.length === 0 ? (
        <div style={{ ...c.block, margin: "0 1rem", textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "2rem" }}>
          Bu dövr üçün məlumat yoxdur.
        </div>
      ) : (
        <div style={{ margin: "0 1rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ ...th(false, true), verticalAlign: "middle" }}>Mağaza</th>
                <th rowSpan={2} style={{ ...th(true), verticalAlign: "middle" }}>Sessiya</th>
                <th colSpan={3} style={{ ...th(true), borderBottom: "none" }}>Verilən</th>
                <th colSpan={3} style={{ ...th(true), borderBottom: "none" }}>Qaytarılan</th>
              </tr>
              <tr>
                <th style={th(true)}>K</th>
                <th style={th(true)}>D</th>
                <th style={th(true)}>Cəm</th>
                <th style={th(true)}>K</th>
                <th style={th(true)}>D</th>
                <th style={th(true)}>Cəm</th>
              </tr>
            </thead>
            <tbody>
              {shopRows.map(({ shop, rows, totGK, totGD, totLK, totLD }, ri) => (
                <>
                  {rows.map((r, si) => (
                    <tr key={r.sess.id} style={{ background: ri % 2 === 0 ? "var(--bg)" : "var(--bg2)" }}>
                      {si === 0 && (
                        <td rowSpan={rows.length + 1} style={{ ...td(false, true), verticalAlign: "middle", borderRight: "1px solid var(--border)" }}>
                          {shop.name}
                        </td>
                      )}
                      <td style={{ ...td(true), fontSize: 10, color: "var(--text2)" }}>{r.sess.icon} {r.sess.label}</td>
                      <td style={td(true)}>{r.gK || "—"}</td>
                      <td style={td(true)}>{r.gD || "—"}</td>
                      <td style={{ ...td(true), fontWeight: 600 }}>{(r.gK + r.gD) || "—"}</td>
                      <td style={td(true)}>{r.lK || "—"}</td>
                      <td style={td(true)}>{r.lD || "—"}</td>
                      <td style={{ ...td(true), fontWeight: 600 }}>{(r.lK + r.lD) || "—"}</td>
                    </tr>
                  ))}
                  <tr style={{ borderBottom: "2px solid var(--border2)" }}>
                    <td style={{ ...td(true), fontWeight: 700, background: "var(--bg2)", fontSize: 10 }}>Cəmi</td>
                    <td style={{ ...td(true), fontWeight: 700 }}>{totGK}</td>
                    <td style={{ ...td(true), fontWeight: 700 }}>{totGD}</td>
                    <td style={{ ...td(true), fontWeight: 700 }}>{totGK + totGD}</td>
                    <td style={{ ...td(true), fontWeight: 700 }}>{totLK || "—"}</td>
                    <td style={{ ...td(true), fontWeight: 700 }}>{totLD || "—"}</td>
                    <td style={{ ...td(true), fontWeight: 700 }}>{(totLK + totLD) || "—"}</td>
                  </tr>
                </>
              ))}
              <tr style={{ background: "var(--bg2)", borderTop: "2px solid var(--border2)" }}>
                <td style={{ ...td(false, true), fontWeight: 700 }}>Ümumi</td>
                <td style={{ ...td(true), fontSize: 10, color: "var(--text2)" }}>—</td>
                <td style={{ ...td(true), fontWeight: 700 }}>{grandGK}</td>
                <td style={{ ...td(true), fontWeight: 700 }}>{grandGD}</td>
                <td style={{ ...td(true), fontWeight: 700 }}>{grandGK + grandGD}</td>
                <td style={{ ...td(true), fontWeight: 700 }}>{grandLK || "—"}</td>
                <td style={{ ...td(true), fontWeight: 700 }}>{grandLD || "—"}</td>
                <td style={{ ...td(true), fontWeight: 700 }}>{(grandLK + grandLD) || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
