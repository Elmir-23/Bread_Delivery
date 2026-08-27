// Kassa (nağd pul) hesablamaları — useAppData, Dashboard və Borclar arasında ORTAQ.
// Əvvəllər hər üç yerdə ayrı-ayrı təkrarlanırdı; "günə başlanan qalıq" gecə yarısı
// canlı tarixə görə sıçrayırdı, çünki heç bir donmuş anchor yox idi (bax: calcKassa).

// Köhnə {tarix: rəqəm} formatını normallaşdırır (geriyə uyğunluq)
export const normalizeHandover = (raw) => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return { amount: raw, confirmed: true };
  if (typeof raw === "object" && "amount" in raw) return raw;
  return null;
};

// Yalnız təsdiqlənmiş təhvili kassa üçün sayır
export const confirmedAmount = (raw) => {
  const h = normalizeHandover(raw);
  if (!h) return 0;
  return h.confirmed ? (h.amount || 0) : 0;
};

const round2 = (n) => parseFloat(n.toFixed(2));

// Kassa qalığı + "günə başlanan qalıq" (dashboard/Borclar üçün ortaq hesablama).
//
// kassaBalance — kassaAdjustment + bütün tarixlər üzrə (yığılan + şirniyyat − xərc − TƏSDİQLƏNMİŞ_təhvil).
//
// kassaStart — əvvəllər hər renderdə "bu günün tarixindən əvvəlki günlər" kimi CANLI
// hesablanırdı. Bunun nəticəsi: gecə saat 00:00 keçəndə, "dünən" bir anda "bugündən
// əvvəlki" sırasına düşür və dünənin bütün günü üzrə xalis dəyişikliyi (yığılan +
// şirniyyat − xərc − təhvil) sükutla "günə başlanan qalıq"-a əlavə olunurdu — sahibkar
// heç nə etmədən, sadəcə tətbiqi gecə yarısından sonra açanda rəqəm dəyişirdi.
//
// İndi: sahibkar bir günün təhvilini TƏSDİQLƏYƏNDƏ həmin an balans db_data.dayStart-da
// DONDURULUR (bax useAppData._advanceDayStart) və elə bu dondurulmuş dəyər göstərilir —
// saat neçə olur-olsun dəyişmir. Sonrakı təhvil prosesi (axşam) balansı təbii şəkildə
// yenidən tənzimləyir, ona görə burda əlavə "dəyişib" xəbərdarlığı YOXDUR.
export function calcKassa(db_data, today = null) {
  const allDates = [...new Set([
    ...Object.keys(db_data.debtPayments || {}),
    ...Object.keys(db_data.expenses || {}),
    ...Object.keys(db_data.handovers || {}),
    ...Object.keys(db_data.sweets || {}),
  ])].sort();

  const dayStart = db_data.dayStart || null;
  const base = db_data.kassaAdjustment || 0;
  let kassa = base;
  let liveStart = base; // dayStart heç vaxt qoyulmayıbsa fallback (köhnə/yeni data)

  allDates.forEach(date => {
    const yigilan = Object.values(db_data.debtPayments?.[date] || {}).reduce((a, b) => a + b, 0);
    const sweet = db_data.sweets?.[date] || 0;
    const exp = (db_data.expenses?.[date] || []).reduce((a, e) => a + e.amount, 0);
    const tehvil = confirmedAmount(db_data.handovers?.[date]);
    const delta = yigilan + sweet - exp - tehvil;
    kassa += delta;
    if (today && date < today) liveStart += delta;
  });

  const kassaBalance = round2(kassa);
  const kassaStart = dayStart ? round2(dayStart.balance) : round2(liveStart);
  return { kassaBalance, kassaStart };
}
