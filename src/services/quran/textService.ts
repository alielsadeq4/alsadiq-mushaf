// Quran text service — loads Uthmani text from local chunks (lazy loaded)
// Source: quran.com API (Uthmani script) — fetched and bundled locally

export interface QuranVerse {
  n: number; // ayah number in surah
  key: string; // "1:1"
  text: string; // Uthmani text
}

// Chunk cache
const chunkCache = new Map<number, Record<string, QuranVerse[]>>();
const pendingLoads = new Map<number, Promise<Record<string, QuranVerse[]>>>();

function chunkIndexForSurah(surah: number): number {
  return Math.min(11, Math.floor((surah - 1) / 10));
}

async function loadChunk(chunk: number): Promise<Record<string, QuranVerse[]>> {
  if (chunkCache.has(chunk)) return chunkCache.get(chunk)!;
  if (pendingLoads.has(chunk)) return pendingLoads.get(chunk)!;

  const promise = (async () => {
    const resp = await fetch(`/quran-text/chunk-${chunk}.json`);
    if (!resp.ok) throw new Error(`Failed to load chunk ${chunk}`);
    const data = await resp.json();
    chunkCache.set(chunk, data);
    pendingLoads.delete(chunk);
    return data;
  })();

  pendingLoads.set(chunk, promise);
  return promise;
}

/**
 * Get the Uthmani text for a full surah. Lazy-loads the chunk if needed.
 * Note: the stored `n` is the global ayah id — we remap to the in-surah
 * number using verse_key ("surah:ayah").
 */
export async function getSurahText(surah: number): Promise<QuranVerse[]> {
  const chunk = chunkIndexForSurah(surah);
  try {
    const data = await loadChunk(chunk);
    const verses = data[String(surah)] || [];
    return verses.map((v, idx) => ({
      n: parseAyahFromKey(v.key) ?? idx + 1,
      key: v.key,
      text: v.text,
    }));
  } catch (err) {
    console.error("[quran-text] load failed", err);
    return [];
  }
}

function parseAyahFromKey(key: string): number | null {
  const idx = key.indexOf(":");
  if (idx === -1) return null;
  const n = parseInt(key.slice(idx + 1), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Get text for a single ayah.
 */
export async function getAyahText(surah: number, ayah: number): Promise<string> {
  const verses = await getSurahText(surah);
  const v = verses.find((x) => x.n === ayah);
  return v?.text || "";
}
