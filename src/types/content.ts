// Unified Religious Content Types
// Core type definitions for the entire platform

export type Category =
  | "quran"
  | "ruqyah"
  | "morning-azkar"
  | "evening-azkar"
  | "salawat"
  | "adhkar-general";

export type ContentType =
  | "surah"
  | "ayah"
  | "ayah-range"
  | "ruqyah-collection"
  | "ruqyah-section"
  | "adhkar-set"
  | "dhikr-item"
  | "salawat-form"
  | "audio-clip";

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  baseUrl: string;
  format: "mp3" | "m4a" | "ogg";
  supportsAyah: boolean;
  supportsSurah: boolean;
  downloadAllowed: boolean;
  source: string;
  licenseUrl?: string;
  verified: boolean;
}

export interface Surah {
  id: number;
  name: string;
  nameLatin: string;
  nameTranslation: string;
  ayahCount: number;
  revelationType: "meccan" | "medinan";
  juzList: number[];
}

export interface AudioTrack {
  id: string;
  title: string;
  category: Category;
  contentType: ContentType;
  reciterOrSpeaker: string;
  audioUrl: string;
  fallbackUrls?: string[];
  duration?: number;
  surahId?: number;
  ayahStart?: number;
  ayahEnd?: number;
  textSource?: string;
  reference?: string;
  downloadAllowed: boolean;
  verified: boolean;
}

export interface DhikrItem {
  id: string;
  text: string;
  count: number;
  reference: string;
  source: string;
  /** ملاحظة إرشادية توضّح أن البند عملٌ لا ذكرٌ منطوق (مثل جلسة الذكر) */
  textNote?: string;
  audioUrl?: string;
  translation?: string;
  virtue?: string;
}

export interface AdhkarSet {
  id: string;
  title: string;
  category: "morning-azkar" | "evening-azkar";
  description: string;
  source: string;
  items: DhikrItem[];
  audioUrl?: string;
}

/**
 * أذكار ما بعد الصلاة — كل ذكر مرتبط بمجموعة صلوات.
 * appliesTo: "all" = بعد كل صلاة مكتوبة، "fajr" خاص بالفجر،
 * "maghrib-isha" خاص بالمغرب والعشاء، "witr" بعد الوتر.
 */
export type AfterPrayerSlot = "all" | "fajr" | "maghrib-isha" | "witr";

export interface PrayerAdhkarGroup {
  id: string;
  title: string;
  slot: AfterPrayerSlot;
  description: string;
  source: string;
  items: DhikrItem[];
}

/** أسماء الله الحسنى — 99 اسمًا بمعانٍ مختصرة موثقة */
export interface NameOfAllah {
  id: string;
  name: string;
  meaning: string;
}

/** مجموعة أذكار متنوعة (نوم/منزل/طعام/سفر/كرب...) من حصن المسلم */
export interface MiscAdhkarGroup {
  id: string;
  title: string;
  description: string;
  source: string;
  items: DhikrItem[];
}

export interface RuqyahSection {
  id: string;
  title: string;
  text: string;
  source: string;
  reference?: string;
  audioUrl?: string;
  repeat?: number;
}

export interface RuqyahCollection {
  id: string;
  title: string;
  description: string;
  category: "ruqyah";
  ruqyahType:
    | "shamilah"
    | "tahseen"
    | "ayn-hasad"
    | "sihr"
    | "khawf-waswas"
    | "organized";
  sections: RuqyahSection[];
  durationEstimate?: number;
  source: string;
  audioUrl?: string;
  downloadAllowed: boolean;
}

export interface SalawatForm {
  id: string;
  text: string;
  arabicText: string;
  source: string;
  reference: string;
  audioUrl?: string;
  suggestedCounts: number[];
  virtue?: string;
}

export interface ContinueListeningState {
  trackId: string;
  title: string;
  category: Category;
  reciterOrSpeaker: string;
  currentTime: number;
  duration?: number;
  audioUrl: string;
  surahId?: number;
  ayahStart?: number;
  ayahEnd?: number;
  timestamp: number;
}

export interface QueueItem {
  trackId: string;
  title: string;
  category: Category;
  reciterOrSpeaker: string;
  audioUrl: string;
  duration?: number;
  surahId?: number;
  ayahStart?: number;
  ayahEnd?: number;
  addedAt: number;
}

export interface FavoriteItem {
  id: string;
  trackId: string;
  title: string;
  category: Category;
  reciterOrSpeaker: string;
  audioUrl: string;
  surahId?: number;
  ayahStart?: number;
  ayahEnd?: number;
  addedAt: number;
}

export interface DownloadedTrack {
  id: string;
  trackId: string;
  title: string;
  category: Category;
  reciterOrSpeaker: string;
  size: number;
  blobKey: string;
  duration?: number;
  downloadedAt: number;
  surahId?: number;
  ayahStart?: number;
  ayahEnd?: number;
}

export interface ListenHistoryItem {
  id: string;
  trackId: string;
  title: string;
  category: Category;
  reciterOrSpeaker: string;
  listenedAt: number;
  duration: number;
  position: number;
}

export interface ListenSession {
  date: string;
  totalSeconds: number;
  sessionsCount: number;
}

export interface ListenGoal {
  type: "minutes-daily" | "surah-daily" | "custom";
  target: number;
  createdAt: number;
}

export interface PlayerSettings {
  reciterId: string;
  playbackRate: number;
  volume: number;
  repeatMode: "off" | "track" | "surah" | "next";
  autoNext: boolean;
  theme: "light" | "dark" | "system";
  reducedMotion: boolean;
}

export interface NotificationSetting {
  id: string;
  type:
    | "quran"
    | "morning-azkar"
    | "evening-azkar"
    | "ruqyah"
    | "after-prayer"
    | "salawat";
  enabled: boolean;
  time: string;
  label: string;
}

export interface SleepTimerState {
  active: boolean;
  endsAt: number | null;
  mode: "duration" | "end-of-track";
  remainingMs?: number;
}

/**
 * Memorization / Hifdh mode — repeat the current ayah a fixed number of times
 * with an optional silence gap between repeats, then auto-advance.
 *
 * - targetCount: how many times the ayah should play in total (>= 1).
 *   1 means "play once then advance" (effectively off).
 * - currentCount: how many times it has played so far in the current cycle.
 * - pauseMs: silence between repeats in milliseconds (0 = no gap).
 * - pausingUntil: timestamp until which we are in the inter-repeat gap (null if not).
 */
export interface MemorizationState {
  enabled: boolean;
  targetCount: number;
  currentCount: number;
  pauseMs: number;
  pausingUntil: number | null;
}
