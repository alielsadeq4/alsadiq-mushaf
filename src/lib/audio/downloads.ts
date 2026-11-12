// Download Manager — download audio files for offline playback
// Uses IndexedDB (via downloadsStorage) for blob storage
"use client";

import type { AudioTrack } from "@/types/content";
import { downloadsStorage } from "@/lib/storage";
import { toast } from "sonner";

export interface DownloadProgress {
  trackId: string;
  loaded: number;
  total: number;
  percent: number;
  status: "downloading" | "completed" | "error";
  error?: string;
}

const listeners = new Set<(progress: DownloadProgress) => void>();
const activeDownloads = new Map<string, AbortController>();

export function subscribeToDownloads(
  listener: (progress: DownloadProgress) => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(progress: DownloadProgress) {
  listeners.forEach((l) => l(progress));
}

/**
 * Download a single audio track (single MP3 file).
 * Saves the blob to IndexedDB.
 */
export async function downloadTrack(track: AudioTrack): Promise<boolean> {
  if (!track.downloadAllowed) {
    toast.error("هذا المحتوى غير قابل للتنزيل");
    return false;
  }

  if (activeDownloads.has(track.id)) {
    toast.info("التنزيل قيد التشغيل بالفعل");
    return false;
  }

  const controller = new AbortController();
  activeDownloads.set(track.id, controller);

  try {
    const response = await fetch(track.audioUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const total = parseInt(response.headers.get("content-length") || "0", 10);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to read response body");
    }

    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        emit({
          trackId: track.id,
          loaded,
          total,
          percent: total > 0 ? (loaded / total) * 100 : 0,
          status: "downloading",
        });
      }
    }

    const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
    const blobKey = `blob-${track.id}-${Date.now()}`;
    await downloadsStorage.putBlob(blobKey, blob);

    const downloaded = {
      id: `dl-${track.id}-${Date.now()}`,
      trackId: track.id,
      title: track.title,
      category: track.category,
      reciterOrSpeaker: track.reciterOrSpeaker,
      size: blob.size,
      blobKey,
      duration: track.duration,
      downloadedAt: Date.now(),
      surahId: track.surahId,
      ayahStart: track.ayahStart,
      ayahEnd: track.ayahEnd,
    };
    await downloadsStorage.add(downloaded);

    emit({
      trackId: track.id,
      loaded: blob.size,
      total: blob.size,
      percent: 100,
      status: "completed",
    });

    toast.success(`تم تنزيل: ${track.title} (${formatSize(blob.size)})`);
    return true;
  } catch (err: any) {
    if (err.name === "AbortError") {
      toast.info("تم إلغاء التنزيل");
    } else {
      console.error("[download] failed", err);
      emit({
        trackId: track.id,
        loaded: 0,
        total: 0,
        percent: 0,
        status: "error",
        error: err.message,
      });
      toast.error(`فشل التنزيل: ${err.message}`);
    }
    return false;
  } finally {
    activeDownloads.delete(track.id);
  }
}

/**
 * Download a full surah (queue of all ayah tracks).
 * Note: This is intentionally NOT automatic — only when user requests.
 */
export async function downloadSurah(
  surahId: number,
  reciterId: string,
  surahName: string
): Promise<number> {
  const { buildSurahQueueTracks, surahTracksToQueueItems } = await import(
    "@/lib/providers/contentProvider"
  );
  const tracks = buildSurahQueueTracks(surahId, reciterId);
  if (tracks.length === 0) {
    toast.error("لا توجد ملفات صوتية للتنزيل");
    return 0;
  }

  toast.info(`بدء تنزيل سورة ${surahName} (${tracks.length} آية)`);
  let successCount = 0;
  for (const track of tracks) {
    const ok = await downloadTrack(track);
    if (ok) successCount++;
  }
  toast.success(`اكتمل تنزيل سورة ${surahName}: ${successCount}/${tracks.length} آية`);
  return successCount;
}

/**
 * Cancel an active download.
 */
export function cancelDownload(trackId: string) {
  const controller = activeDownloads.get(trackId);
  if (controller) {
    controller.abort();
    activeDownloads.delete(trackId);
  }
}

/**
 * Delete a downloaded track from IndexedDB.
 */
export async function deleteDownload(id: string, blobKey: string) {
  await downloadsStorage.remove(id);
  await downloadsStorage.removeBlob(blobKey);
  toast.success("تم حذف التنزيل");
}

/**
 * Get the local URL for a downloaded track (blob URL).
 */
export async function getDownloadedUrl(blobKey: string): Promise<string | null> {
  const blob = await downloadsStorage.getBlob(blobKey);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * Format bytes as human-readable size.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
