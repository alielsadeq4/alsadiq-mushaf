// Fetch English translation (Saheeh International, resource 20) from Quran.com API v4
// and store it as local chunks matching the tafsir/text chunk scheme:
//   public/translations/en/chunk-{0..11}.json  →  { "<surah>": [{ n, key, text }] }
// Chunking: chunk = floor((surah-1)/10)
// Source: Quran.com API v4 — Saheeh International (non-commercial use, attributed).
// License note: distributed with attribution on the sources page; content itself
// is public-facing English meaning-translation used by quran.com apps.

const fs = require("fs");
const path = require("path");

const API = "https://api.quran.com/api/v4/verses/by_chapter";
const OUT_DIR = path.join(__dirname, "..", "public", "translations", "en");

function stripTags(text) {
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const SURAHS = require(path.join(__dirname, "..", "src", "data", "surahs.json"));

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chunks = {};
  for (let i = 0; i < 12; i++) chunks[i] = {};

  let done = 0;
  for (const s of SURAHS) {
    const resp = await fetch(`${API}/${s.id}?translations=20&per_page=300`);
    if (!resp.ok) {
      console.error(`Failed surah ${s.id}: HTTP ${resp.status}`);
      process.exit(1);
    }
    const data = await resp.json();
    const verses = [];
    for (const v of data.verses) {
      const t = v.translations && v.translations[0];
      if (!t) continue;
      verses.push({
        n: v.verse_number,
        key: v.verse_key,
        text: stripTags(t.text),
      });
    }
    if (verses.length !== s.ayahCount) {
      console.warn(`Surah ${s.id}: expected ${s.ayahCount} verses, got ${verses.length}`);
    }
    const chunk = Math.min(11, Math.floor((s.id - 1) / 10));
    chunks[chunk][String(s.id)] = verses;
    done++;
    console.log(`Surah ${s.id} (${s.nameLatin}) — ${verses.length} verses [chunk ${chunk}]`);
    // Be gentle with the API
    await new Promise((r) => setTimeout(r, 350));
  }

  for (let i = 0; i < 12; i++) {
    const file = path.join(OUT_DIR, `chunk-${i}.json`);
    fs.writeFileSync(file, JSON.stringify(chunks[i], null, 1), "utf8");
    console.log(`Wrote chunk-${i}.json (${Object.keys(chunks[i]).length} surahs)`);
  }
  console.log(`\nDone — ${done} surahs fetched.`);
})();
