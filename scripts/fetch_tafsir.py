#!/usr/bin/env python3
"""
Fetch the complete Tafsir Al-Muyassar (التفسير الميسر) from Quran.com API v4
and store it as local JSON chunks (same chunking scheme as quran-text).

Source: https://api.quran.com/api/v4/tafsirs/16/by_ayah/{s}:{a}
Tafsir id 16 = ar-tafsir-muyassar (التفسير الميسر — مجمع الملك فهد).

Output: public/tafsir/chunk-{N}.json  (N = 0..11, 10 surahs per chunk)
        { "<surahId>": [ { "n": <ayah>, "key": "s:a", "text": "..." }, ... ] }
"""

import json
import html
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT = Path("/home/z/my-project")
OUT_DIR = PROJECT / "public" / "tafsir"
API = "https://api.quran.com/api/v4/tafsirs/16/by_ayah/{}:{}}"
API = API.replace("}}", "}")  # avoid format confusion
HEADERS = {"User-Agent": "SadikApp/1.0 (islamic audio platform; offline tafsir bundle)"}


def parse_surahs():
    """Extract (id, ayahCount) from src/data/surahs.ts"""
    src = (PROJECT / "src" / "data" / "surahs.ts").read_text(encoding="utf-8")
    pairs = re.findall(r"id:\s*(\d+),.*?ayahCount:\s*(\d+)", src)
    return [(int(s), int(a)) for s, a in pairs]


def clean_text(raw: str) -> str:
    """Strip HTML tags/entities, normalize whitespace."""
    t = re.sub(r"<span[^>]*>", "", raw)
    t = t.replace("</span>", "")
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    t = t.replace("\u200f", "").replace("\u200e", "")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def fetch_ayah(s: int, a: int, attempts: int = 4) -> tuple[int, int, str | None]:
    url = f"https://api.quran.com/api/v4/tafsirs/16/by_ayah/{s}:{a}"
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            text = data.get("tafsir", {}).get("text", "")
            if text:
                return s, a, clean_text(text)
            return s, a, None  # no tafsir for this verse (e.g. none)
        except Exception:
            if i < attempts - 1:
                time.sleep(0.6 * (i + 1))
    return s, a, None


def main():
    surahs = parse_surahs()
    total = sum(a for _, a in surahs)
    print(f"[tafsir] {len(surahs)} surahs, {total} verses total", flush=True)

    results: dict[int, dict[int, str]] = {}
    done = 0
    failed: list[tuple[int, int]] = []

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {}
        for s, count in surahs:
            for a in range(1, count + 1):
                futures[pool.submit(fetch_ayah, s, a)] = (s, a)
        for fut in as_completed(futures):
            s, a, text = fut.result()
            if text is None:
                failed.append((s, a))
            else:
                results.setdefault(s, {})[a] = text
            done += 1
            if done % 500 == 0:
                print(f"[tafsir] {done}/{total} done, {len(failed)} failed", flush=True)

    # Retry failures serially (gentler)
    if failed:
        print(f"[tafsir] retrying {len(failed)} failed verses...", flush=True)
        still_failed = []
        for s, a in failed:
            _, _, text = fetch_ayah(s, a, attempts=5)
            if text:
                results.setdefault(s, {})[a] = text
            else:
                still_failed.append((s, a))
            time.sleep(0.15)
        failed = still_failed

    # Write chunks (10 surahs per chunk, same scheme as textService)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for chunk in range(12):
        lo, hi = chunk * 10 + 1, min(chunk * 10 + 10, 114)
        chunk_data: dict[str, list] = {}
        for s in range(lo, hi + 1):
            verses_map = results.get(s, {})
            if not verses_map:
                continue
            verses = [
                {"n": a, "key": f"{s}:{a}", "text": verses_map[a]}
                for a in sorted(verses_map)
            ]
            chunk_data[str(s)] = verses
        out = OUT_DIR / f"chunk-{chunk}.json"
        out.write_text(json.dumps(chunk_data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    written = sum(len(v) for s in results.values() for v in [s])
    total_written = sum(len(m) for m in results.values())
    print(f"[tafsir] DONE: {total_written}/{total} verses written", flush=True)
    if failed:
        print(f"[tafsir] STILL FAILED ({len(failed)}): {failed[:40]}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
