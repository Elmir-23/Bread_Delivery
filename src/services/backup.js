import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, query, orderBy } from "firebase/firestore";

// ── Backup pəncərələri (bitişik, boşluqsuz) ──
// Səhər:   06:00 – 11:59
// Günorta: 12:00 – 15:59
// Axşam:   16:00 – 05:59 (ertəsi gün, gecəni əhatə edir)
//
// Qayda: istənilən data yazısından sonra çağırılır. Cari vaxtın hansı pəncərəyə
// düşdüyü hesablanır və həmin (gün + pəncərə) üçün snapshot ÜSTÜNƏ yazılır.
// Beləcə pəncərə daxilində sonuncu yazı son vəziyyəti saxlayır.

// Verilən tarix/saata əsasən backup açarını qaytarır: { workDate, window, key }
// workDate — backup-ın aid olduğu "iş günü" (gecə saatları əvvəlki günə aid edilir)
export function getBackupSlot(now = new Date()) {
  const h = now.getHours();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  let windowName;
  let workDate; // Date obyekti, sonra YYYY-MM-DD-ə çevrilir

  if (h >= 6 && h < 12) {
    windowName = "morning";
    workDate = new Date(y, m, d);
  } else if (h >= 12 && h < 16) {
    windowName = "afternoon";
    workDate = new Date(y, m, d);
  } else if (h >= 16) {
    // 16:00 – 23:59 → bu günün axşamı
    windowName = "evening";
    workDate = new Date(y, m, d);
  } else {
    // 00:00 – 05:59 → əvvəlki günün axşamına aid (gecə smeni)
    windowName = "evening";
    workDate = new Date(y, m, d - 1); // bir gün geri
  }

  const ds = `${workDate.getFullYear()}-${String(workDate.getMonth() + 1).padStart(2, "0")}-${String(workDate.getDate()).padStart(2, "0")}`;
  return { workDate: ds, window: windowName, key: `${ds}_${windowName}` };
}

const WINDOW_LABELS = { morning: "Səhər", afternoon: "Günorta", evening: "Axşam" };
export function windowLabel(w) { return WINDOW_LABELS[w] || w; }

// Cari pəncərə üçün snapshot-ı yaradır/üstünə yazır.
// data — app/data sənədinin tam surəti.
// Sənəd ID-si sabit (key) olduğu üçün setDoc avtomatik üstünə yazır.
export async function triggerBackupIfNeeded(data) {
  try {
    if (!data || typeof data !== "object") return;
    const slot = getBackupSlot(new Date());
    const ref = doc(db, "backups", slot.key);
    await setDoc(ref, {
      workDate: slot.workDate,
      window: slot.window,
      snapshotAt: Date.now(),
      data, // tam app/data surəti — copy-paste ilə bərpa üçün
    });
  } catch (e) {
    // Backup uğursuz olsa, əsas əməliyyatı bloklamamalıdır — yalnız log
    console.error("triggerBackupIfNeeded xətası:", e);
  }
}

// Bütün backup-ları ən yenidən köhnəyə doğru qaytarır
export async function loadBackups() {
  try {
    const q = query(collection(db, "backups"), orderBy("snapshotAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("loadBackups xətası:", e);
    return [];
  }
}
