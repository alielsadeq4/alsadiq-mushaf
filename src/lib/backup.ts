// Backup / restore — export library data as JSON, import it back on any device.
// Includes: favorites, history, player settings, audio source config, tasbih totals.
// Audio downloads (blobs) are NOT included — they stay device-local by design.

import type { FavoriteItem, ListenHistoryItem } from "@/types/content";
import {
  favoriteStorage,
  historyStorage,
  settingsStorage,
} from "@/lib/storage";
import { getAudioSourceConfig, setAudioSourceConfig, type AudioSourceConfig } from "@/lib/providers/contentProvider";
import { toast } from "sonner";

export const BACKUP_VERSION = 1;

export interface BackupPayload {
  app: "sadik-backup";
  version: number;
  exportedAt: string;
  favorites: FavoriteItem[];
  history: ListenHistoryItem[];
  playerSettings: Partial<{
    reciterId: string;
    rate: number;
    theme: string;
  }>;
  audioSource: AudioSourceConfig | null;
  tasbih: { totalCount: number; rounds: number } | null;
}

const TASBIH_KEY = "sadik:tasbih";

export function buildBackup(): BackupPayload {
  return {
    app: "sadik-backup",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    favorites: favoriteStorage.getAll(),
    history: historyStorage.getAll(),
    playerSettings: {
      reciterId: settingsStorage.getReciterId(),
      rate: settingsStorage.getRate(),
      theme: settingsStorage.getTheme(),
    },
    audioSource: getAudioSourceConfig(),
    tasbih: readTasbih(),
  };
}

function readTasbih(): { totalCount: number; rounds: number } | null {
  try {
    const raw = localStorage.getItem(TASBIH_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.totalCount === "number" && typeof v?.rounds === "number") {
      return { totalCount: v.totalCount, rounds: v.rounds };
    }
  } catch {
    // ignore
  }
  return null;
}

export function downloadBackup(): boolean {
  try {
    const payload = buildBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sadik-backup-${d}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return true;
  } catch (err) {
    console.error("[backup] download failed", err);
    return false;
  }
}

export interface ImportResult {
  favoritesAdded: number;
  favoritesSkipped: number;
  historyAdded: number;
  historySkipped: number;
  settingsRestored: boolean;
  tasbihRestored: boolean;
}

export async function importBackup(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    favoritesAdded: 0,
    favoritesSkipped: 0,
    historyAdded: 0,
    historySkipped: 0,
    settingsRestored: false,
    tasbihRestored: false,
  };

  let data: BackupPayload;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("الملف غير صالح — ليس ملف JSON صحيحًا");
  }

  if (data?.app !== "sadik-backup" || !Array.isArray(data.favorites)) {
    throw new Error("الملف ليس نسخة احتياطية من الصادق");
  }

  // Merge favorites (dedupe by trackId)
  const existingFavs = favoriteStorage.getAll();
  const favTrackIds = new Set(existingFavs.map((f) => f.trackId));
  const mergedFavs = [...existingFavs];
  for (const f of data.favorites) {
    if (!f?.trackId || !f?.id) {
      result.favoritesSkipped++;
      continue;
    }
    if (favTrackIds.has(f.trackId)) {
      result.favoritesSkipped++;
      continue;
    }
    mergedFavs.push(f);
    favTrackIds.add(f.trackId);
    result.favoritesAdded++;
  }
  if (result.favoritesAdded > 0) {
    favoriteStorage.clear();
    for (const f of mergedFavs) favoriteStorage.add(f);
  }

  // Merge history (dedupe by id)
  const existingHist = historyStorage.getAll();
  const histIds = new Set(existingHist.map((h) => h.id));
  const mergedHist = [...existingHist];
  for (const h of data.history || []) {
    if (!h?.id) {
      result.historySkipped++;
      continue;
    }
    if (histIds.has(h.id)) {
      result.historySkipped++;
      continue;
    }
    mergedHist.push(h);
    histIds.add(h.id);
    result.historyAdded++;
  }
  if (result.historyAdded > 0) {
    mergedHist.sort((a, b) => (b.listenedAt || 0) - (a.listenedAt || 0));
    if (mergedHist.length > 500) mergedHist.length = 500;
    historyStorage.clear();
    for (const h of mergedHist) historyStorage.add(h);
  }

  // Restore player settings
  if (data.playerSettings) {
    try {
      if (data.playerSettings.reciterId) {
        settingsStorage.setReciterId(data.playerSettings.reciterId);
      }
      if (typeof data.playerSettings.rate === "number") {
        settingsStorage.setRate(data.playerSettings.rate);
      }
      if (data.playerSettings.theme) {
        settingsStorage.setTheme(
          data.playerSettings.theme as "light" | "dark" | "system"
        );
      }
      result.settingsRestored = true;
    } catch {
      // ignore
    }
  }

  // Restore audio source config
  if (data.audioSource?.quranReciterId) {
    try {
      setAudioSourceConfig(data.audioSource);
      result.settingsRestored = true;
    } catch {
      // ignore
    }
  }

  // Restore tasbih (max — never lose counts)
  if (data.tasbih && typeof data.tasbih.totalCount === "number") {
    try {
      const current = readTasbih() || { totalCount: 0, rounds: 0 };
      const next = {
        totalCount: Math.max(current.totalCount, data.tasbih.totalCount),
        rounds: Math.max(current.rounds, data.tasbih.rounds || 0),
      };
      localStorage.setItem(TASBIH_KEY, JSON.stringify(next));
      result.tasbihRestored = true;
    } catch {
      // ignore
    }
  }

  return result;
}

export function reportImportResult(r: ImportResult) {
  const parts: string[] = [];
  if (r.favoritesAdded > 0) parts.push(`${r.favoritesAdded} مفضلة`);
  if (r.historyAdded > 0) parts.push(`${r.historyAdded} سجل`);
  if (r.settingsRestored) parts.push("الإعدادات");
  if (r.tasbihRestored) parts.push("إجمالي السبحة");
  if (parts.length === 0) {
    toast.info("النسخة مطابقة لما لديك بالفعل — لا شيء جديد للاستيراد");
  } else {
    toast.success(`تم الاستيراد: ${parts.join("، ")}`);
  }
}

// Re-export for convenience in UI
export { toast as backupToast };
