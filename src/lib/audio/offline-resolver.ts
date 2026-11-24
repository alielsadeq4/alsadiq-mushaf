// Offline playback resolution — checks IndexedDB downloads before CDN
"use client";

import { downloadsStorage } from "@/lib/storage";
import type { AudioTrack } from "@/types/content";

// In-memory cache of downloaded blob URLs (revoked when no longer needed)
const urlCache = new Map<string, string>(); // trackId -> blob URL

/**
 * Resolve the best playable URL for a track:
 * 1. If the track is downloaded (IndexedDB), use the local blob URL (offline-friendly)
 * 2. Otherwise, use the CDN URL
 */
export async function resolvePlayableUrl(track: AudioTrack): Promise<string> {
  // Check in-memory cache first
  const cached = urlCache.get(track.id);
  if (cached) return cached;

  try {
    const downloads = await downloadsStorage.getAll();
    // Exact match on trackId OR surah+ayah match (for ayah-level tracks)
    const match = downloads.find(
      (d) =>
        d.trackId === track.id ||
        (d.surahId === track.surahId && d.ayahStart === track.ayahStart)
    );

    if (match) {
      const blob = await downloadsStorage.getBlob(match.blobKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        urlCache.set(track.id, url);
        return url;
      }
    }
  } catch (err) {
    console.error("[offline-resolver] failed", err);
  }

  // Fall back to CDN URL
  return track.audioUrl;
}

