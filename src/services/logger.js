import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "firebase/firestore";

export async function logAction(action, email, details = {}) {
  try {
    await addDoc(collection(db, "logs"), {
      action,
      email: email || "unknown",
      details,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Log yazıla bilmədi:", e);
  }
}

export async function loadLogs(count = 50) {
  const q = query(collection(db, "logs"), orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
