// English translation service — loads from local chunks (lazy, same scheme as tafsirService)
// Source: Saheeh International — distributed via Quran.com API v4 (translation resource id 20)
// Stored at public/translations/en/chunk-{0..11}.json

export interface TranslationVerse {
  n: number; // ayah number in surah
  key: string; // "2:255"
  text: string; // plain English text
}

export const TRANSLATION_SOURCE =
  "معاني القرآن بالإنجليزية — Saheeh International (عبر Quran.com)";

const chunkCache = new Map<number, Record<string, TranslationVerse[]>>();
const pendingLoads = new Map<number, Promise<Record<string, TranslationVerse[]>>>();

function chunkIndexForSurah(surah: number): number {
  return Math.min(11, Math.floor((surah - 1) / 10));
}

async function loadChunk(chunk: number): Promise<Record<string, TranslationVerse[]>> {
  if (chunkCache.has(chunk)) return chunkCache.get(chunk)!;
  if (pendingLoads.has(chunk)) return pendingLoads.get(chunk)!;

  const promise = (async () => {
    const resp = await fetch(`/translations/en/chunk-${chunk}.json`);
    if (!resp.ok) throw new Error(`Failed to load translation chunk ${chunk}`);
    const data = await resp.json();
    chunkCache.set(chunk, data);
    pendingLoads.delete(chunk);
    return data;
  })();

  pendingLoads.set(chunk, promise);
  return promise;
}

/** Get translation for a whole surah. Returns empty array if unavailable. */
export async function getSurahTranslation(surah: number): Promise<TranslationVerse[]> {
  const chunk = chunkIndexForSurah(surah);
  try {
    const data = await loadChunk(chunk);
    const verses = data[String(surah)] || [];
    return verses.map((v) => ({ n: v.n, key: v.key, text: v.text }));
  } catch (err) {
    console.error("[translation] load failed", err);
    return [];
  }
}

/** Get translation for a single ayah. Returns empty string if unavailable. */
export async function getAyahTranslation(surah: number, ayah: number): Promise<string> {
  const verses = await getSurahTranslation(surah);
  return verses.find((v) => v.n === ayah)?.text || "";
}
