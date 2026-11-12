// Hijri date utilities — computed locally via Intl (islamic-umalqura calendar).
// No external API needed — works offline and forever.

export interface HijriInfo {
  day: number;
  month: number;
  monthName: string;
  year: number;
}

const HIJRI_MONTH_NAMES = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

const RAMADAN = 9;

function makeFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function readParts(date: Date, fmt: Intl.DateTimeFormat): HijriInfo | null {
  try {
    const parts = fmt.formatToParts(date);
    const day = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);
    const month = parseInt(parts.find((p) => p.type === "month")?.value || "0", 10);
    const year = parseInt(parts.find((p) => p.type === "year")?.value || "0", 10);
    if (!day || !month || !year) return null;
    return { day, month, monthName: HIJRI_MONTH_NAMES[month - 1] || "", year };
  } catch {
    return null;
  }
}

/** Current hijri date (umalqura). */
export function getHijriInfo(): HijriInfo | null {
  try {
    return readParts(new Date(), makeFormatter());
  } catch {
    return null;
  }
}

export interface RamadanStatus {
  isRamadan: boolean;
  /** 1..29/30 during Ramadan; 0 otherwise */
  ramadanDay: number;
  /** Days until next Ramadan starts (0 during Ramadan) */
  daysUntilRamadan: number;
  /** Approximate remaining days of Ramadan (null when unknown/off-season) */
  ramadanDaysRemaining: number | null;
  hijri: HijriInfo | null;
}

/**
 * Ramadan status for today. Iterates up to 400 days ahead to locate the next
 * Ramadan 1 (runs once on mount — cheap enough on-device).
 */
export function getRamadanStatus(): RamadanStatus {
  const today = getHijriInfo();
  const base: RamadanStatus = {
    isRamadan: false,
    ramadanDay: 0,
    daysUntilRamadan: 0,
    ramadanDaysRemaining: null,
    hijri: today,
  };
  if (!today) return base;

  if (today.month === RAMADAN) {
    // Remaining days: find Ramadan 1 of next year — iterate forward
    let fmt: Intl.DateTimeFormat;
    try {
      fmt = makeFormatter();
    } catch {
      return { ...base, isRamadan: true, ramadanDay: today.day };
    }
    const probe = new Date();
    let daysRemaining: number | null = null;
    for (let i = 1; i <= 60; i++) {
      probe.setDate(probe.getDate() + 1);
      const h = readParts(probe, fmt);
      if (!h) continue;
      if (h.month === RAMADAN) {
        // still in Ramadan
        continue;
      } else {
        // We passed the last day — days remaining = i - 1 from today
        daysRemaining = i - 1;
        break;
      }
    }
    return {
      isRamadan: true,
      ramadanDay: today.day,
      daysUntilRamadan: 0,
      ramadanDaysRemaining: daysRemaining,
      hijri: today,
    };
  }

  // Off-season: find next Ramadan 1
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = makeFormatter();
  } catch {
    return base;
  }
  const probe = new Date();
  for (let i = 1; i <= 400; i++) {
    probe.setDate(probe.getDate() + 1);
    const h = readParts(probe, fmt);
    if (!h) continue;
    if (h.month === RAMADAN && h.day === 1) {
      return { ...base, daysUntilRamadan: i, hijri: today };
    }
  }
  return base;
}

/** Formatted hijri date string, e.g. "١٢ رمضان ١٤٤٧ هـ" (Arabic-Indic optional). */
export function formatHijri(h: HijriInfo | null): string {
  if (!h) return "";
  return `${h.day} ${h.monthName} ${h.year} هـ`;
}
