// ============================================================================
// Unified Religious Content Provider with Fallback
// ============================================================================
// Single entry point for the UI. Handles:
//   - Source selection based on user settings
//   - Fallback sources when primary fails
//   - Offline cached content (via downloads storage)
//   - Validation that audio URLs exist
// ============================================================================

import type {
  AudioTrack,
  AdhkarSet,
  RuqyahCollection,
  SalawatForm,
  Category,
  QueueItem,
} from "@/types/content";
import {
  SURAHS,
  getSurahById,
} from "@/data/surahs";
import {
  RECITERS,
  getReciterById,
  buildAyahUrl,
  DEFAULT_RECITER_ID,
} from "@/data/reciters";
import {
  MORNING_ADHKAR,
  EVENING_ADHKAR,
} from "@/data/adhkar";
import { PRAYER_ADHKAR_GROUPS } from "@/data/prayer-adhkar";
import { MISC_ADHKAR_GROUPS } from "@/data/misc-adhkar";
import { NAMES_OF_ALLAH } from "@/data/names-of-allah";
import { RUQYAH_COLLECTIONS, getRuqyahById } from "@/data/ruqyah";
import { SALAWAT_FORMS, getSalawatById } from "@/data/salawat";

// =========================================================================
// Source configuration — can be changed by the user in Settings → Audio Sources
// =========================================================================

export interface AudioSourceConfig {
  /** Primary reciter for Quran */
  quranReciterId: string;
  /** Whether to use fallback reciter if primary fails */
  enableFallback: boolean;
  /** Reciter to fall back to if primary fails */
  fallbackReciterId: string;
  /** Whether to verify URLs before playback (slower but reliable) */
  verifyUrls: boolean;
}

const DEFAULT_CONFIG: AudioSourceConfig = {
  quranReciterId: DEFAULT_RECITER_ID,
  enableFallback: true,
  fallbackReciterId: "husary", // Al-Husary is the most widely cached
  verifyUrls: false, // Off by default for performance
};

const CONFIG_KEY = "sadik:audio-source-config";

export function getAudioSourceConfig(): AudioSourceConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_CONFIG;
}

export function setAudioSourceConfig(config: Partial<AudioSourceConfig>) {
  if (typeof window === "undefined") return;
  const current = getAudioSourceConfig();
  const next = { ...current, ...config };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
}

// =========================================================================
// URL verification — HEAD request to check URL availability
// =========================================================================

const verificationCache = new Map<string, boolean>();

export async function verifyAudioUrl(url: string): Promise<boolean> {
  if (verificationCache.has(url)) return verificationCache.get(url)!;
  try {
    const resp = await fetch(url, { method: "HEAD", mode: "cors" });
    const ok = resp.ok;
    verificationCache.set(url, ok);
    return ok;
  } catch {
    verificationCache.set(url, false);
    return false;
  }
}

// =========================================================================
// Quran track builders
// =========================================================================

/**
 * Build a per-ayah audio track.
 * Includes fallback URLs from the configured fallback reciter.
 */
export function buildAyahTrack(
  surahId: number,
  ayah: number,
  reciterId?: string
): AudioTrack | null {
  const surah = getSurahById(surahId);
  if (!surah) return null;
  if (ayah < 1 || ayah > surah.ayahCount) return null;

  const config = getAudioSourceConfig();
  const actualReciterId = reciterId || config.quranReciterId;
  const reciter = getReciterById(actualReciterId);
  if (!reciter || !reciter.supportsAyah) return null;

  const audioUrl = buildAyahUrl(actualReciterId, surahId, ayah);
  const fallbackUrls: string[] = [];

  // Add fallback reciter's URL if enabled
  if (config.enableFallback && config.fallbackReciterId !== actualReciterId) {
    const fallbackReciter = getReciterById(config.fallbackReciterId);
    if (fallbackReciter && fallbackReciter.supportsAyah) {
      fallbackUrls.push(buildAyahUrl(config.fallbackReciterId, surahId, ayah));
    }
  }

  return {
    id: `ayah-${surahId}-${ayah}-${actualReciterId}`,
    title: `${surah.name} — آية ${ayah}`,
    category: "quran" as Category,
    contentType: "ayah",
    reciterOrSpeaker: reciter.arabicName,
    audioUrl,
    fallbackUrls: fallbackUrls.length > 0 ? fallbackUrls : undefined,
    surahId,
    ayahStart: ayah,
    ayahEnd: ayah,
    downloadAllowed: reciter.downloadAllowed,
    verified: reciter.verified,
    textSource: `سورة ${surah.name} — ${surah.nameLatin} (آية ${ayah})`,
  };
}

/**
 * Build ALL ayah tracks for a complete surah (since surah-level audio is
 * unavailable on the free CDN — we build a queue of per-ayah tracks).
 *
 * The audio engine will play them sequentially and auto-advance.
 */
export function buildSurahQueueTracks(
  surahId: number,
  reciterId?: string
): AudioTrack[] {
  const surah = getSurahById(surahId);
  if (!surah) return [];

  const config = getAudioSourceConfig();
  const actualReciterId = reciterId || config.quranReciterId;
  const reciter = getReciterById(actualReciterId);
  if (!reciter) return [];

  const tracks: AudioTrack[] = [];
  for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
    const track = buildAyahTrack(surahId, ayah, actualReciterId);
    if (track) tracks.push(track);
  }
  return tracks;
}

/**
 * Build a "surah" AudioTrack — represents the entire surah.
 * Used for UI display (favorites, history, continue listening).
 * The actual playback uses buildSurahQueueTracks().
 */
export function buildSurahTrack(
  surahId: number,
  reciterId?: string
): AudioTrack | null {
  const surah = getSurahById(surahId);
  if (!surah) return null;

  const config = getAudioSourceConfig();
  const actualReciterId = reciterId || config.quranReciterId;
  const reciter = getReciterById(actualReciterId);
  if (!reciter) return null;

  // The audio URL is the first ayah — playback engine will replace with full queue
  const audioUrl = buildAyahUrl(actualReciterId, surahId, 1);
  const fallbackUrls: string[] = [];
  if (config.enableFallback && config.fallbackReciterId !== actualReciterId) {
    const fallbackReciter = getReciterById(config.fallbackReciterId);
    if (fallbackReciter && fallbackReciter.supportsAyah) {
      fallbackUrls.push(buildAyahUrl(config.fallbackReciterId, surahId, 1));
    }
  }

  return {
    id: `surah-${surahId}-${actualReciterId}`,
    title: `سورة ${surah.name}`,
    category: "quran" as Category,
    contentType: "surah",
    reciterOrSpeaker: reciter.arabicName,
    audioUrl,
    fallbackUrls: fallbackUrls.length > 0 ? fallbackUrls : undefined,
    surahId,
    ayahStart: 1,
    ayahEnd: surah.ayahCount,
    downloadAllowed: reciter.downloadAllowed,
    verified: reciter.verified,
    textSource: `سورة ${surah.name} — ${surah.nameLatin} (${surah.ayahCount} آية)`,
  };
}

export function buildRuqyahTrack(ruqyahId: string): AudioTrack | null {
  const ruqyah = getRuqyahById(ruqyahId);
  if (!ruqyah) return null;

  const config = getAudioSourceConfig();
  const reciter = getReciterById(config.quranReciterId) || RECITERS[0];

  // Use Al-Fatihah as the audio for ruqyah (universally accepted)
  const audioUrl = buildAyahUrl(config.quranReciterId, 1, 1);
  const fallbackUrls: string[] = [];
  if (config.enableFallback && config.fallbackReciterId !== config.quranReciterId) {
    fallbackUrls.push(buildAyahUrl(config.fallbackReciterId, 1, 1));
  }

  return {
    id: `ruqyah-${ruqyahId}`,
    title: ruqyah.title,
    category: "ruqyah" as Category,
    contentType: "ruqyah-collection",
    reciterOrSpeaker: reciter.arabicName,
    audioUrl,
    fallbackUrls: fallbackUrls.length > 0 ? fallbackUrls : undefined,
    duration: ruqyah.durationEstimate,
    downloadAllowed: ruqyah.downloadAllowed,
    verified: true,
    textSource: ruqyah.source,
  };
}

/**
 * Build a Ruqyah audio queue (multiple ayahs that constitute the ruqyah).
 * Used for actual playback.
 */
export function buildRuqyahQueueTracks(ruqyahId: string): AudioTrack[] {
  const ruqyah = getRuqyahById(ruqyahId);
  if (!ruqyah) return [];

  // Al-Fatihah (1-7), Ayat al-Kursi (2:255), last 2 ayahs of Baqarah (2:285-286),
  // Al-Ikhlas (112), Al-Falaq (113), An-Nas (114) — these are the core ruqyah verses.
  const ruqyahAyahs: Array<[number, number]> = [
    [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], // Al-Fatihah
    [2, 255], // Ayat al-Kursi
    [2, 285], [2, 286], // last 2 of Baqarah
    [112, 1], [112, 2], [112, 3], [112, 4], // Al-Ikhlas
    [113, 1], [113, 2], [113, 3], [113, 4], [113, 5], // Al-Falaq
    [114, 1], [114, 2], [114, 3], [114, 4], [114, 5], [114, 6], // An-Nas
  ];

  return ruqyahAyahs
    .map(([surahId, ayah]) => buildAyahTrack(surahId, ayah))
    .filter(Boolean) as AudioTrack[];
}

// =========================================================================
// Dhikr / Salawat tracks (text-based, no audio)
// =========================================================================


// =========================================================================
// Search — مع تطبيع عربي (إزالة التشكيل وتوحيد الهمزات) ليعمل البحث
// سواء كتب المستخدم النص مشكولًا أو مجردًا
// =========================================================================

/** إزالة التشكيل والتطويل وتوحيد الهمزات/الألف/الياء — للبحث فقط، لا يغير النص المعروض */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g, "") // الحركات وعلامات التشكيل
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // آ أ إ ٱ → ا
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/\u0640/g, ""); // ـ التطويل
}

export interface SearchResult {
  type:
    | "surah"
    | "reciter"
    | "ruqyah"
    | "adhkar-morning"
    | "adhkar-evening"
    | "adhkar-group"
    | "name-of-allah"
    | "salawat"
    | "dhikr-item";
  id: string;
  title: string;
  subtitle?: string;
  category?: Category;
}

export function searchContent(query: string): SearchResult[] {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim().toLowerCase();
  const qn = normalizeArabic(q); // نسخة مطبعة للمقارنة مع النصوص المشكولة
  // مساعد: يتحقق من تطابق النص الخام أو المطبّع
  const match = (text: string) =>
    text.includes(q) || normalizeArabic(text).includes(qn);
  const results: SearchResult[] = [];

  for (const surah of SURAHS) {
    if (
      match(surah.name) ||
      surah.nameLatin.toLowerCase().includes(q) ||
      surah.nameTranslation.toLowerCase().includes(q) ||
      String(surah.id) === q
    ) {
      results.push({
        type: "surah",
        id: String(surah.id),
        title: `سورة ${surah.name}`,
        subtitle: `${surah.nameLatin} — ${surah.ayahCount} آية`,
        category: "quran",
      });
    }
  }

  for (const r of RECITERS) {
    if (
      match(r.arabicName) ||
      r.name.toLowerCase().includes(q) ||
      match(r.style)
    ) {
      results.push({
        type: "reciter",
        id: r.id,
        title: r.arabicName,
        subtitle: r.style,
      });
    }
  }

  for (const r of RUQYAH_COLLECTIONS) {
    if (match(r.title) || match(r.description)) {
      results.push({
        type: "ruqyah",
        id: r.id,
        title: r.title,
        subtitle: r.description.slice(0, 60) + "...",
        category: "ruqyah",
      });
    }
  }

  if (match(MORNING_ADHKAR.title) || match(MORNING_ADHKAR.description)) {
    results.push({
      type: "adhkar-morning",
      id: MORNING_ADHKAR.id,
      title: MORNING_ADHKAR.title,
      subtitle: MORNING_ADHKAR.description.slice(0, 60) + "...",
      category: "morning-azkar",
    });
  }
  for (const item of MORNING_ADHKAR.items) {
    if (match(item.text) || match(item.reference)) {
      results.push({
        type: "dhikr-item",
        id: item.id,
        title: item.text.slice(0, 80) + "...",
        subtitle: item.reference,
        category: "morning-azkar",
      });
    }
  }

  if (match(EVENING_ADHKAR.title) || match(EVENING_ADHKAR.description)) {
    results.push({
      type: "adhkar-evening",
      id: EVENING_ADHKAR.id,
      title: EVENING_ADHKAR.title,
      subtitle: EVENING_ADHKAR.description.slice(0, 60) + "...",
      category: "evening-azkar",
    });
  }
  for (const item of EVENING_ADHKAR.items) {
    if (match(item.text) || match(item.reference)) {
      results.push({
        type: "dhikr-item",
        id: item.id,
        title: item.text.slice(0, 80) + "...",
        subtitle: item.reference,
        category: "evening-azkar",
      });
    }
  }

  for (const s of SALAWAT_FORMS) {
    if (match(s.text) || match(s.reference) || match(s.source)) {
      results.push({
        type: "salawat",
        id: s.id,
        title: "الصلاة على النبي ﷺ",
        subtitle: s.text.slice(0, 80) + "...",
        category: "salawat",
      });
    }
  }

  // أذكار ما بعد الصلاة والمتنوعة — على مستوى المجموعة والبند
  for (const g of [...PRAYER_ADHKAR_GROUPS, ...MISC_ADHKAR_GROUPS]) {
    if (match(g.title) || match(g.description)) {
      results.push({
        type: "adhkar-group",
        id: g.id,
        title: g.title,
        subtitle: g.description.slice(0, 60) + "...",
        category: "adhkar-general",
      });
    }
    for (const item of g.items) {
      if (match(item.text) || match(item.reference)) {
        results.push({
          type: "dhikr-item",
          id: item.id,
          title: item.text.slice(0, 80) + "...",
          subtitle: item.reference,
          category: "adhkar-general",
        });
      }
    }
  }

  // أسماء الله الحسنى
  for (const n of NAMES_OF_ALLAH) {
    if (match(n.name) || match(n.meaning)) {
      results.push({
        type: "name-of-allah",
        id: n.id,
        title: n.name,
        subtitle: n.meaning,
      });
    }
  }

  return results.slice(0, 60);
}

// =========================================================================
// Helper: play a surah as a queue of ayahs
// =========================================================================

export function surahTracksToQueueItems(tracks: AudioTrack[]): QueueItem[] {
  return tracks.map((t) => ({
    trackId: t.id,
    title: t.title,
    category: t.category,
    reciterOrSpeaker: t.reciterOrSpeaker,
    audioUrl: t.audioUrl,
    duration: t.duration,
    surahId: t.surahId,
    ayahStart: t.ayahStart,
    ayahEnd: t.ayahEnd,
    addedAt: Date.now(),
  }));
}

// =========================================================================
// Re-exports
// =========================================================================

export {
  SURAHS,
  getSurahById,
  RECITERS,
  getReciterById,
  buildAyahUrl,
  MORNING_ADHKAR,
  EVENING_ADHKAR,
  PRAYER_ADHKAR_GROUPS,
  MISC_ADHKAR_GROUPS,
  NAMES_OF_ALLAH,
  RUQYAH_COLLECTIONS,
  getRuqyahById,
  SALAWAT_FORMS,
  getSalawatById,
  DEFAULT_RECITER_ID,
};
