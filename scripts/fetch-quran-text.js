// Download the full Uthmani Quran text from quran.com API and save as JSON chunks
const fs = require("fs");
const path = require("path");

const OUT_DIR = "/home/z/my-project/src/data/quran-text";
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  console.log("Fetching surah list...");
  const allText = {};

  for (let surah = 1; surah <= 114; surah++) {
    const url = `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const verses = (data.verses || []).map((v) => ({
        n: v.id,
        key: v.verse_key,
        text: v.text_uthmani,
      }));
      allText[surah] = verses;
      process.stdout.write(`\r${surah}/114`);
    } catch (err) {
      console.error(`\nFailed surah ${surah}: ${err.message}`);
      allText[surah] = [];
    }
  }
  console.log("\nDone fetching");

  // Save as chunks of 10 surahs for lazy loading
  for (let chunk = 0; chunk < 12; chunk++) {
    const start = chunk * 10 + 1;
    const end = Math.min(114, (chunk + 1) * 10);
    const chunkData = {};
    for (let s = start; s <= end; s++) {
      if (allText[s]) chunkData[s] = allText[s];
    }
    const fname = path.join(OUT_DIR, `chunk-${chunk}.json`);
    fs.writeFileSync(fname, JSON.stringify(chunkData, null, 0));
    console.log(`Saved chunk-${chunk}.json (surahs ${start}-${end})`);
  }

  // Save a small index for surah 1-114 ayah counts in text
  const index = {};
  Object.keys(allText).forEach((s) => {
    index[s] = allText[s].length;
  });
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index));
  console.log("Saved index.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
