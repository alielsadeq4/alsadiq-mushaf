import type { Reciter } from "@/types/content";

// ============================================================================
// Verified Quran Reciters
// ============================================================================
// Source: mirrors.quranicaudio.com/everyayah — the official mirror of QuranicAudio.com
// URL pattern: https://mirrors.quranicaudio.com/everyayah/{reciter_slug}/{surah}{ayah}.mp3
//   - surah: 3-digit zero-padded (001..114)
//   - ayah: 3-digit zero-padded (001..286)
//
// All reciters verified working as of 2026-08-30.
// CORS-enabled (Access-Control-Allow-Origin: *).
// License: QuranicAudio.com — free for non-commercial use with attribution.
// ============================================================================

export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    arabicName: "مشاري راشد العفاسي",
    style: "Murattal — هادئ ومريح",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Alafasy_128kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false, // Surah-level via queue of per-ayah files
    downloadAllowed: true,
    source: "QuranicAudio.com — مشاري العفاسي (مرتل، 128kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "husary",
    name: "Mahmoud Khalil Al-Husary",
    arabicName: "محمود خليل الحصري",
    style: "Murattal — تجويد دقيق",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Husary_128kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — محمود الحصري (مرتل، 128kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "husary-muallim",
    name: "Mahmoud Khalil Al-Husary (Muallim)",
    arabicName: "محمود خليل الحصري (معلم)",
    style: "Muallim — تعليمي بطيء",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — محمود الحصري (معلم، 128kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "abdulbasit-murattal",
    name: "Abdul Basit Abdus Samad (Murattal)",
    arabicName: "عبد الباسط عبد الصمد (مرتل)",
    style: "Murattal",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Abdul_Basit_Murattal_192kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — عبد الباسط (مرتل، 192kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "sudais",
    name: "Abdurrahman As-Sudais",
    arabicName: "عبد الرحمن السديس",
    style: "إمام الحرم المكي",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Abdurrahmaan_As-Sudais_192kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — السديس (192kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "shuraim",
    name: "Saud Al-Shuraim",
    arabicName: "سعود الشريم",
    style: "إمام الحرم المكي",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Saood_ash-Shuraym_128kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — الشريم (128kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "minshawi",
    name: "Mohamed Siddiq Al-Minshawi",
    arabicName: "محمد صديق المنشاوي",
    style: "Murattal — مرتل",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Minshawy_Murattal_128kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — المنشاوي (مرتل، 128kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "ghamdi",
    name: "Saad Al-Ghamdi",
    arabicName: "سعد الغامدي",
    style: "Murattal — هادئ",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Ghamadi_40kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — الغامدي (40kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "hudhaify",
    name: "Ali Al-Hudhaify",
    arabicName: "علي الحذيفي",
    style: "إمام المسجد النبوي",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Hudhaify_128kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — الحذيفي (128kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
  {
    id: "tablawi",
    name: "Mohamed al-Tablawi",
    arabicName: "محمد الطبلاوي",
    style: "Murattal",
    baseUrl: "https://mirrors.quranicaudio.com/everyayah/Mohammad_al_Tablaway_128kbps",
    format: "mp3",
    supportsAyah: true,
    supportsSurah: false,
    downloadAllowed: true,
    source: "QuranicAudio.com — الطبلاوي (128kbps)",
    licenseUrl: "https://quranicaudio.com",
    verified: true,
  },
];

export const DEFAULT_RECITER_ID = "alafasy";

export function getReciterById(id: string): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

/**
 * Build the per-ayah audio URL for a given reciter.
 * Pattern: {baseUrl}/{surah 3-digit}{ayah 3-digit}.mp3
 */
export function buildAyahUrl(reciterId: string, surah: number, ayah: number): string {
  const reciter = getReciterById(reciterId);
  if (!reciter) return "";
  const surahStr = String(surah).padStart(3, "0");
  const ayahStr = String(ayah).padStart(3, "0");
  return `${reciter.baseUrl}/${surahStr}${ayahStr}.${reciter.format}`;
}

/**
 * Surah-level audio is built from per-ayah files concatenated in a queue.
 * The content provider will turn this into a queue of N tracks (one per ayah).
 * For backward compat, we return the first ayah here — the provider replaces
 * this with the actual queue at play time.
 */
export function buildSurahUrl(reciterId: string, surah: number): string {
  return buildAyahUrl(reciterId, surah, 1);
}
