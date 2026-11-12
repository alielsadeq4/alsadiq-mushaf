// Helpers for playing surah as a queue of ayahs
"use client";

import { getAudioEngine } from "@/lib/audio/engine";
import {
  buildSurahQueueTracks,
  buildSurahTrack,
  surahTracksToQueueItems,
  getAudioSourceConfig,
  setAudioSourceConfig,
  type AudioSourceConfig,
} from "@/lib/providers/contentProvider";
import type { AudioTrack, QueueItem } from "@/types/content";
import { getSurahById } from "@/data/surahs";
import { toast } from "sonner";

/**
 * Play a full surah. Builds a queue of all ayah tracks and starts playback.
 * The "surah track" (displayable) is the first item in the queue.
 */
export async function playSurah(surahId: number, reciterId?: string) {
  const surah = getSurahById(surahId);
  if (!surah) {
    toast.error("السورة غير موجودة");
    return;
  }

  const engine = getAudioEngine();
  const tracks = buildSurahQueueTracks(surahId, reciterId);

  if (tracks.length === 0) {
    toast.error("لا توجد ملفات صوتية متاحة لهذه السورة");
    return;
  }

  // Build queue items
  const queueItems: QueueItem[] = surahTracksToQueueItems(tracks);

  // Set up the queue and start playing from index 0
  engine.setQueue(queueItems, 0);

  // The first track becomes the current track (the engine's playTrack
  // will be called via the queue's flow). We need to play the first track:
  const firstTrack = tracks[0];
  // But show it as a "surah" track in the UI for nice title
  const displayTrack: AudioTrack = {
    ...firstTrack,
    id: `surah-${surahId}-${reciterId || getAudioSourceConfig().quranReciterId}`,
    title: `سورة ${surah.name}`,
    contentType: "surah",
    ayahStart: 1,
    ayahEnd: surah.ayahCount,
    textSource: `سورة ${surah.name} — ${surah.nameLatin} (${surah.ayahCount} آية)`,
  };

  await engine.playTrack(displayTrack);

  toast.success(`تشغيل سورة ${surah.name} — ${surah.ayahCount} آية`);
}

/**
 * Play an ayah range (from X to Y) within a surah.
 */
export async function playAyahRange(
  surahId: number,
  fromAyah: number,
  toAyah: number,
  reciterId?: string
) {
  const surah = getSurahById(surahId);
  if (!surah) return;

  const engine = getAudioEngine();
  const tracks: AudioTrack[] = [];
  for (let a = fromAyah; a <= toAyah; a++) {
    const t = buildSurahQueueTracks(surahId, reciterId).find(
      (track) => track.ayahStart === a
    );
    if (t) tracks.push(t);
  }
  if (tracks.length === 0) return;

  const queueItems: QueueItem[] = surahTracksToQueueItems(tracks);
  engine.setQueue(queueItems, 0);
  await engine.playTrack(tracks[0]);
  toast.success(`تشغيل ${surah.name} من آية ${fromAyah} إلى ${toAyah}`);
}

export { getAudioSourceConfig, setAudioSourceConfig };
export type { AudioSourceConfig };

/**
 * Memorization (Hifdh) mode — play a single ayah N times with an optional
 * silence gap between repeats. The user picks the ayah, the repeat count,
 * and the inter-repeat pause; the engine replays the same track and advances
 * automatically once the target count is reached.
 *
 * Use 0 for `pauseSeconds` to disable the gap (immediate replay).
 */
export async function playAyahMemorization(
  surahId: number,
  ayah: number,
  reciterId: string | undefined,
  repeatCount: number,
  pauseSeconds: number = 0
) {
  const surah = getSurahById(surahId);
  if (!surah) {
    toast.error("السورة غير موجودة");
    return;
  }
  if (ayah < 1 || ayah > surah.ayahCount) {
    toast.error("رقم الآية خارج النطاق");
    return;
  }

  const engine = getAudioEngine();
  // Build a single-item queue containing only the chosen ayah.
  // We don't extend the queue past it — the engine will stop after the
  // last repeat of the ayah (or the user can queue more afterwards).
  const allTracks = buildSurahQueueTracks(surahId, reciterId);
  const ayahTrack = allTracks.find((t) => typeof t.ayahStart === "number" && t.ayahStart === ayah);
  if (!ayahTrack) {
    toast.error("لا توجد ملفات صوتية متاحة لهذه الآية");
    return;
  }

  const queueItems: QueueItem[] = surahTracksToQueueItems([ayahTrack]);
  engine.setQueue(queueItems, 0);

  // Configure memorization BEFORE playTrack so handleEnded honors it.
  engine.startMemorization(Math.max(1, repeatCount), Math.max(0, pauseSeconds * 1000));

  await engine.playTrack(ayahTrack);
  toast.success(
    `بدأ وضع التسميع — آية ${ayah} من ${surah.name} (${Math.max(1, repeatCount)}×)`
  );
}

/**
 * Convenience: memorize an ayah range — each ayah in the range plays N times,
 * then the engine advances to the next ayah in the queue, also N times.
 */
export async function playAyahRangeMemorization(
  surahId: number,
  fromAyah: number,
  toAyah: number,
  reciterId: string | undefined,
  repeatCount: number,
  pauseSeconds: number = 0
) {
  const surah = getSurahById(surahId);
  if (!surah) return;

  const engine = getAudioEngine();
  const allTracks = buildSurahQueueTracks(surahId, reciterId);
  const tracks = allTracks.filter(
    (t) => typeof t.ayahStart === "number" && t.ayahStart >= fromAyah && t.ayahStart <= toAyah
  );
  if (tracks.length === 0) {
    toast.error("لا توجد ملفات صوتية متاحة في هذا المدى");
    return;
  }

  const queueItems: QueueItem[] = surahTracksToQueueItems(tracks);
  engine.setQueue(queueItems, 0);
  engine.startMemorization(Math.max(1, repeatCount), Math.max(0, pauseSeconds * 1000));
  await engine.playTrack(tracks[0]);
  toast.success(
    `بدأ وضع التسميع — ${tracks.length} آية (${Math.max(1, repeatCount)}× لكل آية)`
  );
}

/** Disable memorization mode (returns to normal queue flow). */
export function stopMemorization() {
  const engine = getAudioEngine();
  engine.stopMemorization();
  toast.info("تم إيقاف وضع التسميع");
}
