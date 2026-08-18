import { useState, useEffect } from "react";
import { c } from "../../styles/styles";
import { fmtDateShort } from "../../utils/dates";
import { loadLogs } from "../../services/logger";
import { loadBackups, windowLabel, getOldestBackupAgeDays, deleteOldBackups } from "../../services/backup";
import { cleanupLegacyArchiveDocs, importArchiveFromBackup } from "../../services/archive";

const ACTION_LABELS = {
  delivery_save: "🚚 Çatdırılma",
  delivery_edit: "✏️ Çatdırılma düzəlişi",
  debt_collect: "💰 Borc yığıldı",
  debt_edit: "💳 Borc düzəldildi",
  collected_edit: "💵 Yığılan düzəldildi",
  expense_add: "🚗 Xərc əlavə edildi",
  expense_delete: "🗑 Xərc silindi",
  shop_add: "🏪 Mağaza əlavə edildi",
  shop_delete: "🏪 Mağaza silindi",
  shops_save: "🏪 Mağazalar saxlanıldı",
  prices_save: "💲 Qiymətlər dəyişdirildi",
  pin_change: "🔑 PIN dəyişdirildi",
  reset: "⚠️ SIFIRLAMA",
  reset_failed: "❌ Sıfırlama uğursuz",
  restore: "♻️ Bərpa edildi",
  login: "🔓 Giriş",
  logout: "🔒 Çıxış",
};

export default function Developer({ db_data, archives, resetConfirm, setResetConfirm, resetPinBuf, setResetPinBuf, resetPinErr, setResetPinErr, resetAllData, restoreBackup, toast$ }) {
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [oldestAge, setOldestAge] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restorePinBuf, setRestorePinBuf] = useState("");
  const [restorePinErr, setRestorePinErr] = useState("");
  const [cleanupConfirm, setCleanupConfirm] = useState(false);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [archiveCleanupConfirm, setArchiveCleanupConfirm] = useState(false);
  const [archiveCleanupRunning, setArchiveCleanupRunning] = useState(false);
  const [archiveImportRunning, setArchiveImportRunning] = useState(false);

  useEffect(() => {
    loadLogs(50).then(l => { setLogs(l); setLogsLoading(false); }).catch(e => { console.error(e); setLogsLoading(false); });
    loadBackups().then(b => { setBackups(b); setBackupsLoading(false); }).catch(e => { console.error(e); setBackupsLoading(false); });
    getOldestBackupAgeDays().then(setOldestAge).catch(e => console.error(e));
  }, []);

  const handleRestorePin = async (k) => {
    if (k === "clr") { setRestorePinBuf(""); setRestorePinErr(""); return; }
    if (k === "del") { setRestorePinBuf(p => p.slice(0, -1)); return; }
    if (restorePinBuf.length >= 4) return;
    const next = restorePinBuf + k;
    setRestorePinBuf(next);
    if (next.length === 4) {
      if (next === db_data?.pin) {
        const bk = restoreTarget;
        const label = bk ? `${bk.workDate} · ${windowLabel(bk.window)}` : "";
        const ok = await restoreBackup(bk?.data, label);
        setRestoreTarget(null); setRestorePinBuf(""); setRestorePinErr("");
        if (!ok) toast$("❌ Bərpa edilmədi");
      } else {
        setRestorePinErr("PIN yanlışdır");
        setTimeout(() => { setRestorePinBuf(""); setRestorePinErr(""); }, 900);
      }
    }
  };

  const refreshBackups = () => {
    setBackupsLoading(true);
    loadBackups().then(b => { setBackups(b); setBackupsLoading(false); }).catch(e => { console.error(e); setBackupsLoading(false); });
    getOldestBackupAgeDays().then(setOldestAge).catch(e => console.error(e));
  };

  // 30 gündən köhnə backup-ları toplu şəkildə silir. Firestore Rules-də developer
  // üçün delete icazəsi olmalıdır — əks halda permission-denied xətası göstərilir.
  const handleCleanupBackups = async () => {
    setCleanupRunning(true);
    try {
      const count = await deleteOldBackups(30);
      toast$(count > 0 ? `✓ ${count} köhnə backup silindi` : "Silinəcək köhnə backup yoxdur");
      refreshBackups();
    } catch (e) {
      console.error("deleteOldBackups xətası:", e);
      toast$(`❌ Silinmədi — ${e?.message || "naməlum xəta"}`);
    } finally {
      setCleanupRunning(false);
      setCleanupConfirm(false);
    }
  };

  // BİR DƏFƏLİK: yeni illik-fayl sisteminə keçməzdən əvvəlki fərdi arxiv sənədlərini
  // təmizləyir. Uğurlu köçürmədən sonra səhifə yenilənir ki, siyahı yenilənsin.
  const handleCleanupLegacyArchives = async () => {
    setArchiveCleanupRunning(true);
    try {
      const count = await cleanupLegacyArchiveDocs();
      toast$(count > 0 ? `✓ ${count} köhnə arxiv sənədi təmizləndi` : "Təmizlənəcək köhnə arxiv yoxdur");
      if (count > 0) setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      console.error("cleanupLegacyArchiveDocs xətası:", e);
      toast$(`❌ Təmizlənmədi — ${e?.message || "naməlum xəta"}`);
    } finally {
      setArchiveCleanupRunning(false);
      setArchiveCleanupConfirm(false);
    }
  };

  // Backup JSON faylından köhnə pəncərəni bərpa edib il faylına əlavə edir.
  // Fayl seçən kimi işə düşür — canlı data-ya toxunmur, yalnız arxiv faylını yeniləyir.
  const handleImportArchiveFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // eyni faylı təkrar seçmək mümkün olsun deyə
    if (!file) return;
    setArchiveImportRunning(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const backupData = parsed.data || parsed; // backup JSON {..., data: {...}} formatındadır
      const result = await importArchiveFromBackup(backupData);
      if (result.imported > 0) {
        toast$(`✓ ${result.imported} sətir ${result.year} faylına əlavə edildi`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast$("Bu fayldan əlavə ediləcək köhnə data tapılmadı");
      }
    } catch (e2) {
      console.error("importArchiveFromBackup xətası:", e2);
      toast$(`❌ İdxal olunmadı — ${e2?.message || "naməlum xəta"}`);
    } finally {
      setArchiveImportRunning(false);
    }
  };

  // Backup-ın tam JSON-unu fayl kimi endirir (copy-paste ilə bərpa üçün)
  const downloadBackup = (bk) => {
    const json = JSON.stringify(bk.data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bread-backup-${bk.id}.json`;
    a.click();
    toast$("JSON yüklənir…");
  };

  const fmtBackupTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const downloadArchive = (arc) => {
    const blob = new Blob(["\uFEFF" + arc.csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bread-arxiv-${arc.archivedOn}.csv`;
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

  const fmtLogTime = (log) => {
    if (!log.createdAt) return "";
    const d = new Date(log.createdAt);
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div style={c.pad}>
      {/* Loglar */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>📋 Son əməliyyatlar (50)</div>
      {logsLoading ? (
        <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Yüklənir…</div>
      ) : logs.length === 0 ? (
        <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Hələ log yoxdur.</div>
      ) : (
        <div style={{ ...c.listCard, marginBottom: "1.5rem", maxHeight: 400, overflowY: "auto" }}>
          {logs.map((log, i) => (
            <div key={log.id} style={{ borderBottom: i === logs.length - 1 ? "none" : "1px solid var(--border)" }}>
              <div
                style={{ padding: "9px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: log.action === "reset" ? "#dc2626" : "var(--text)" }}>
                    {ACTION_LABELS[log.action] || log.action}
                    {log.details?.shop && <span style={{ fontWeight: 400, color: "var(--text2)" }}> — {log.details.shop}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{log.email} · {fmtLogTime(log)}</div>
                </div>
                <span style={{ fontSize: 12, opacity: 0.4, flexShrink: 0 }}>{expandedLog === log.id ? "▲" : "▼"}</span>
              </div>
              {expandedLog === log.id && (
                <pre style={{ margin: 0, padding: "8px 14px 12px", fontSize: 10, color: "var(--text2)", background: "var(--bg2)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Backuplar (JSON snapshot) */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>💾 Backuplar (JSON)</div>

      {oldestAge !== null && oldestAge >= 30 && (
        <div style={{ ...c.block, border: "1px solid #fbbf24", background: "rgba(251,191,36,0.08)", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>
            🧹 Backupları təmizləmək vaxtıdır
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
            Ən köhnə backup {oldestAge} gün əvvələ aiddir. (Heç nə avtomatik silinmir.)
          </div>
          <button
            onClick={() => setCleanupConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontSize: 12, fontWeight: 600, border: "1px solid #fbbf24", borderRadius: 8, background: "none", color: "#92400e", cursor: "pointer" }}
          >
            🧹 30 gündən köhnə backupları sil
          </button>
        </div>
      )}

      {cleanupConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#92400e", marginBottom: 8, textAlign: "center" }}>🧹 Backupları sil</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, textAlign: "center" }}>
              30 gündən köhnə bütün backup snapshot-ları silinəcək. Bu, canlı data-ya təsir etmir — yalnız köhnə JSON snapshot-larıdır.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...c.outlineBtn, color: "var(--text2)", flex: 1 }} onClick={() => setCleanupConfirm(false)} disabled={cleanupRunning}>Ləğv et</button>
              <button
                style={{ ...c.outlineBtn, color: "#92400e", borderColor: "#fbbf24", flex: 1 }}
                onClick={handleCleanupBackups}
                disabled={cleanupRunning}
              >
                {cleanupRunning ? "Silinir…" : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>
        Hər sessiyada (səhər / günorta / axşam) avtomatik götürülür. Bərpa üçün JSON-u endirib Firebase Console-da <strong>app/data</strong> sənədinə yapışdırın.
      </div>
      {backupsLoading ? (
        <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Yüklənir…</div>
      ) : backups.length === 0 ? (
        <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Hələ backup yoxdur.</div>
      ) : (
        <div style={{ ...c.listCard, marginBottom: "1.5rem", maxHeight: 360, overflowY: "auto" }}>
          {backups.map((bk, i) => (
            <div key={bk.id} style={{ ...c.listRow(i === backups.length - 1), gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {fmtDateShort(bk.workDate)} · {windowLabel(bk.window)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                  Snapshot: {fmtBackupTime(bk.snapshotAt)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => downloadBackup(bk)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text)", cursor: "pointer" }}>⬇ JSON</button>
                <button onClick={() => { setRestoreTarget(bk); setRestorePinBuf(""); setRestorePinErr(""); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "1px solid #fca5a5", borderRadius: 8, background: "none", color: "#dc2626", cursor: "pointer" }}>♻️ Bərpa</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {restoreTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", marginBottom: 8, textAlign: "center" }}>♻️ Bərpa et</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6, textAlign: "center" }}>Hazırkı bütün məlumat bu vəziyyət ilə əvəz olunacaq:</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14, textAlign: "center" }}>
              {restoreTarget.workDate} · {windowLabel(restoreTarget.window)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12, textAlign: "center" }}>Təsdiq üçün PIN daxil edin</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12 }}>
              {[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < restorePinBuf.length)}></div>)}
            </div>
            {restorePinErr && <div style={{ color: "#dc2626", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{restorePinErr}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
              {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
                <button key={k} style={{ ...c.pinKey, padding: 10, fontSize: 16 }} onClick={() => handleRestorePin(k)}>{k==="clr"?"CLR":k==="del"?"⌫":k}</button>
              ))}
            </div>
            <button style={{ ...c.outlineBtn, color: "var(--text2)" }} onClick={() => { setRestoreTarget(null); setRestorePinBuf(""); setRestorePinErr(""); }}>Ləğv et</button>
          </div>
        </div>
      )}

      {/* Arxivlər */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>📦 Arxivlər</div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Hər gün giriş edildikdə avtomatik saxlanılır.</div>
      {archives.length === 0 ? (
        <div style={{ ...c.block, textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "1.5rem", marginBottom: "1.5rem" }}>Hələ arxiv yoxdur.</div>
      ) : (
        <div style={{ ...c.listCard, marginBottom: 12 }}>
          {archives.map((arc, i) => (
            <div key={arc.id} style={{ ...c.listRow(i === archives.length - 1), gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateShort(arc.archivedOn)}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                  {arc.rowCount} sətir{arc.note ? ` · ${arc.note}` : ""}{arc.resetBy ? ` · ${arc.resetBy}` : ""}
                </div>
              </div>
              <button onClick={() => downloadArchive(arc)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text)", cursor: "pointer", flexShrink: 0 }}>⬇ CSV</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        <button
          onClick={() => setArchiveCleanupConfirm(true)}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontSize: 12, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text2)", cursor: "pointer" }}
        >
          🧹 Köhnə fərdi arxivləri təmizlə
        </button>
        <label
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontSize: 12, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 8, background: "none", color: "var(--text2)", cursor: archiveImportRunning ? "default" : "pointer", opacity: archiveImportRunning ? 0.6 : 1 }}
        >
          {archiveImportRunning ? "İdxal olunur…" : "📥 Backup-dan bərpa et"}
          <input type="file" accept=".json,application/json" onChange={handleImportArchiveFile} disabled={archiveImportRunning} style={{ display: "none" }} />
        </label>
      </div>

      {archiveCleanupConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8, textAlign: "center" }}>🧹 Köhnə arxivləri təmizlə</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, textAlign: "center" }}>
              Yeni illik-fayl sisteminə keçməzdən əvvəlki fərdi arxiv sənədləri təmizlənəcək. Real data itmir — lazım olan hissə il faylına köçürülür, qalanı artıq canlı data-da mövcuddur.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...c.outlineBtn, color: "var(--text2)", flex: 1 }} onClick={() => setArchiveCleanupConfirm(false)} disabled={archiveCleanupRunning}>Ləğv et</button>
              <button
                style={{ ...c.outlineBtn, color: "var(--text)", flex: 1 }}
                onClick={handleCleanupLegacyArchives}
                disabled={archiveCleanupRunning}
              >
                {archiveCleanupRunning ? "Təmizlənir…" : "Təmizlə"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset */}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>⚠️ Məlumatları sıfırla</div>
      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>
        Çatdırılma, borc və ödəniş məlumatları silinəcək. Mağazalar, qiymətlər və PIN saxlanılacaq.
        Sıfırlamadan əvvəl arxiv yaradılır — arxiv uğursuz olarsa sıfırlama dayandırılır.
      </div>
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
