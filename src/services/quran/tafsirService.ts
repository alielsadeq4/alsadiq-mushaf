// Tafsir Al-Muyassar service — loads from local chunks (lazy, same scheme as textService)
// Source: التفسير الميسر — مجمع الملك فهد لطباعة المصحف الشريف
// Distributed via Quran.com API v4 (tafsir id 16, ar-tafsir-muyassar)

export interface TafsirVerse {
  n: number; // ayah number in surah
  key: string; // "1:1"
  text: string; // plain text tafsir
}

const chunkCache = new Map<number, Record<string, TafsirVerse[]>>();
const pendingLoads = new Map<number, Promise<Record<string, TafsirVerse[]>>>();

function chunkIndexForSurah(surah: number): number {
  return Math.min(11, Math.floor((surah - 1) / 10));
}

async function loadChunk(chunk: number): Promise<Record<string, TafsirVerse[]>> {
  if (chunkCache.has(chunk)) return chunkCache.get(chunk)!;
  if (pendingLoads.has(chunk)) return pendingLoads.get(chunk)!;

  const promise = (async () => {
    const resp = await fetch(`/tafsir/chunk-${chunk}.json`);
    if (!resp.ok) throw new Error(`Failed to load tafsir chunk ${chunk}`);
    const data = await resp.json();
    chunkCache.set(chunk, data);
    pendingLoads.delete(chunk);
    return data;
  })();

  pendingLoads.set(chunk, promise);
  return promise;
}

/** Get tafsir for a whole surah. Returns empty array if unavailable. */
export async function getSurahTafsir(surah: number): Promise<TafsirVerse[]> {
  const chunk = chunkIndexForSurah(surah);
  try {
    const data = await loadChunk(chunk);
    const verses = data[String(surah)] || [];
    return verses.map((v) => ({ n: v.n, key: v.key, text: v.text }));
  } catch (err) {
    console.error("[tafsir] load failed", err);
    return [];
  }
}

/** Get tafsir for a single ayah. Returns empty string if unavailable. */
export async function getAyahTafsir(surah: number, ayah: number): Promise<string> {
  const verses = await getSurahTafsir(surah);
  return verses.find((v) => v.n === ayah)?.text || "";
}

export const TAFSIR_SOURCE = "التفسير الميسر — مجمع الملك فهد لطباعة المصحف الشريف";
