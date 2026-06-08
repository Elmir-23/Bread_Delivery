import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { deliveries, debtPayments, debts, shops, prices } = req.body;

    // ── Auth ──
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // ── Helper: get shop price ──
    const shopKura = (i) => shops[i]?.kura ?? prices?.kura ?? 0.55;
    const shopDami = (i) => shops[i]?.damiryolu ?? prices?.damiryolu ?? 0.65;

    // ── Build CSV ──
    const SESS = ["morning", "afternoon", "evening"];
    const SESS_LABELS = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

    // Get date range (all data)
    const allDates = Object.keys(deliveries || {}).sort();
    if (!allDates.length) {
      return res.status(200).json({ message: "No data to archive" });
    }

    const startDate = allDates[0];
    const endDate = allDates[allDates.length - 1];

    // Build running debt map starting from current debts,
    // unwinding all deliveries and payments to get starting balance
    const runningDebt = {};
    shops.forEach((_, i) => { runningDebt[i] = debts?.[i] || 0; });

    // Subtract all deliveries to get starting balance
    Object.entries(deliveries || {}).forEach(([date, shopData]) => {
      Object.entries(shopData).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        SESS.forEach(sv => {
          const d = sess[sv]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.damiryolu || 0;
          runningDebt[i] -= k * shopKura(i) + r * shopDami(i);
        });
      });
    });

    // Add back all payments
    Object.entries(debtPayments || {}).forEach(([date, shopData]) => {
      Object.entries(shopData).forEach(([idx, amount]) => {
        runningDebt[parseInt(idx)] += amount;
      });
    });

    let csv = "Date,Shop,Session,Kura Given,Damiryolu Given,Kura Price,Damiryolu Price,Revenue,Leftover Kura,Leftover Damiryolu,Debt,Collected Money\n";

    allDates.forEach(date => {
      const shopData = deliveries[date];
      const dayPayments = debtPayments?.[date] || {};

      Object.entries(shopData).forEach(([idx, sess]) => {
        const i = parseInt(idx);
        const shopName = shops[i]?.name || ("Shop " + idx);

        const sessWithData = SESS.filter(sv => {
          const d = sess[sv];
          return d && (d.given?.kura > 0 || d.given?.damiryolu > 0);
        });
        const lastSessId = sessWithData.length ? sessWithData[sessWithData.length - 1] : null;
        const collectedToday = dayPayments[i] || dayPayments[String(i)] || 0;

        SESS.forEach(sv => {
          const d = sess[sv]; if (!d) return;
          const k = d.given?.kura || 0, r = d.given?.damiryolu || 0;
          if (!k && !r) return;
          const lk = d.leftover?.kura || 0, lr = d.leftover?.damiryolu || 0;
          const rev = k * shopKura(i) + r * shopDami(i);

          runningDebt[i] += rev;

          const isLastSess = sv === lastSessId;
          let collected = 0;
          if (isLastSess && collectedToday > 0) {
            collected = collectedToday;
            runningDebt[i] -= collected;
          }

          csv += `${date},${shopName},${SESS_LABELS[sv]},${k},${r},${shopKura(i).toFixed(2)},${shopDami(i).toFixed(2)},${rev.toFixed(2)},${lk},${lr},${runningDebt[i].toFixed(2)},${collected > 0 ? collected.toFixed(2) : ""}\n`;
        });
      });
    });

    // ── Upload to Google Drive ──
    const fileName = `bread-archive-${startDate}-to-${endDate}.csv`;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Check if file with same name already exists (avoid duplicates)
    const existing = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: "files(id)",
    });

    if (existing.data.files.length > 0) {
      return res.status(200).json({ message: "Already archived for this period", fileName });
    }

    const { Readable } = await import("stream");
    const stream = Readable.from([csv]);

    await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "text/csv",
        parents: [folderId],
      },
      media: {
        mimeType: "text/csv",
        body: stream,
      },
    });

    return res.status(200).json({ success: true, fileName });

  } catch (err) {
    console.error("Archive error:", err);
    return res.status(500).json({ error: err.message });
  }
}
