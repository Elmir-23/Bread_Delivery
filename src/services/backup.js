import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, query, where, orderBy, limit, writeBatch } from "firebase/firestore";

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

// Backup-ları ən yenidən köhnəyə doğru qaytarır.
// Panel yalnız son N backup-ı göstərir (heç nə SİLİNMİR — köhnələr Firestore-da qalır,
// Firebase Console → backups koleksiyasından əl ilə əlçatandır).
export async function loadBackups(max = 90) {
  try {
    const q = query(collection(db, "backups"), orderBy("snapshotAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("loadBackups xətası:", e);
    return [];
  }
}

// Ən köhnə backup-ın neçə gün əvvələ aid olduğunu qaytarır (xatırlatma üçün).
// Heç nə silmir — yalnız oxuyur. Backup yoxdursa null.
export async function getOldestBackupAgeDays() {
  try {
    const q = query(collection(db, "backups"), orderBy("snapshotAt", "asc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const oldest = snap.docs[0].data();
    if (!oldest.snapshotAt) return null;
    const diffMs = Date.now() - oldest.snapshotAt;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch (e) {
    console.error("getOldestBackupAgeDays xətası:", e);
    return null;
  }
}

// `keepDays`-dan köhnə backup sənədlərini toplu şəkildə silir (Firebase Console-a
// getmədən). Firestore batch limiti 500 əməliyyatdır — buna görə 450-lik hissələrə
// bölünür. Developer roluna Firestore Rules-də delete icazəsi verilməlidir, əks
// halda bu funksiya permission-denied xətası ilə uğursuz olar.
// Qaytarır: silinən sənəd sayı.
export async function deleteOldBackups(keepDays = 30) {
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  const q = query(collection(db, "backups"), where("snapshotAt", "<", cutoff));
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const refs = snap.docs.map(d => d.ref);
  let deleted = 0;
  for (let i = 0; i < refs.length; i += 450) {
    const chunk = refs.slice(i, i + 450);
    const batch = writeBatch(db);
    chunk.forEach(ref => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}
