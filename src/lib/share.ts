// Share helpers — Web Share API with clipboard fallback
// Deep links: /quran/{surahId}?ayah={n}

import { getSurahById } from "@/data/surahs";
import { getAyahText } from "@/services/quran/textService";
import { toast } from "sonner";

function appOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function buildAyahUrl(surahId: number, ayah: number): string {
  return `${appOrigin()}/quran/${surahId}?ayah=${ayah}`;
}

export function buildSurahUrl(surahId: number): string {
  return `${appOrigin()}/quran/${surahId}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Race with a timeout — some browsers delay/queue clipboard permission
    // prompts; we never want the share flow to hang silently.
    const viaApi = await Promise.race([
      navigator.clipboard.writeText(text).then(() => true),
      new Promise<boolean>((res) => setTimeout(() => res(false), 1500)),
    ]);
    if (viaApi) return true;
  } catch {
    // fall through to legacy path
  }
  // Fallback: textarea trick
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

async function shareOrCopy(title: string, text: string, url: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      // User cancelled — AbortError — do nothing
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Otherwise fall through to clipboard
    }
  }
  const ok = await copyToClipboard(`${text}\n\n${title}\n${url}`);
  if (ok) {
    toast.success("تم نسخ النص والرابط — شاركه مع من تحب");
  } else {
    toast.error("تعذر النسخ — حاول مرة أخرى");
  }
}

/** Share a single ayah with its text, source and deep link. */
export async function shareAyah(surahId: number, ayah: number): Promise<void> {
  const surah = getSurahById(surahId);
  if (!surah) return;
  const text = await getAyahText(surahId, ayah);
  const url = buildAyahUrl(surahId, ayah);
  const title = `سورة ${surah.name} — الآية ${ayah}`;
  await shareOrCopy(title, text ? `﴿ ${text} ﴾` : title, url);
}

/** Share a full surah link. */
export async function shareSurah(surahId: number): Promise<void> {
  const surah = getSurahById(surahId);
  if (!surah) return;
  const url = buildSurahUrl(surahId);
  await shareOrCopy(`سورة ${surah.name} — منصة الصادق`, `سورة ${surah.name} (${surah.nameLatin})`, url);
}
