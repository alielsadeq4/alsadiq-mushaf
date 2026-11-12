// Storage helpers — localStorage for small settings, IndexedDB for downloads & history
// Client-only

import type {
  PlayerSettings,
  NotificationSetting,
  ContinueListeningState,
  FavoriteItem,
  QueueItem,
  ListenHistoryItem,
  ListenSession,
  ListenGoal,
  DownloadedTrack,
} from "@/types/content";

const PREFIX = "sadik:";

// LocalStorage helpers
function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(PREFIX + key);
    if (!v) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error("[storage] lsSet failed", err);
  }
}

function lsRemove(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + key);
}

// Settings
export const settingsStorage = {
  get(): Partial<PlayerSettings> {
    return lsGet<Partial<PlayerSettings>>("settings", {});
  },
  set(settings: Partial<PlayerSettings>) {
    lsSet("settings", settings);
  },
  getReciterId(): string {
    return lsGet<string>("reciter-id", "alafasy");
  },
  setReciterId(id: string) {
    lsSet("reciter-id", id);
  },
  getTheme(): "light" | "dark" | "system" {
    return lsGet<"light" | "dark" | "system">("theme", "system");
  },
  setTheme(theme: "light" | "dark" | "system") {
    lsSet("theme", theme);
  },
  getRate(): number {
    return lsGet<number>("rate", 1);
  },
  setRate(rate: number) {
    lsSet("rate", rate);
  },
};

// Continue listening
export const continueStorage = {
  get(): ContinueListeningState | null {
    return lsGet<ContinueListeningState | null>("continue-listening", null);
  },
  set(state: ContinueListeningState) {
    lsSet("continue-listening", state);
  },
  clear() {
    lsRemove("continue-listening");
  },
};

// Favorites
export const favoriteStorage = {
  getAll(): FavoriteItem[] {
    return lsGet<FavoriteItem[]>("favorites", []);
  },
  add(item: FavoriteItem) {
    const list = this.getAll();
    const existing = list.findIndex((f) => f.trackId === item.trackId);
    if (existing === -1) {
      list.unshift(item);
      lsSet("favorites", list);
    }
  },
  remove(id: string) {
    const list = this.getAll().filter((f) => f.id !== id);
    lsSet("favorites", list);
  },
  isFavorite(trackId: string): boolean {
    return this.getAll().some((f) => f.trackId === trackId);
  },
  clear() {
    lsRemove("favorites");
  },
};

// Queue
export const queueStorage = {
  getAll(): QueueItem[] {
    return lsGet<QueueItem[]>("queue", []);
  },
  set(items: QueueItem[]) {
    lsSet("queue", items);
  },
  clear() {
    lsRemove("queue");
  },
};

// History
export const historyStorage = {
  getAll(): ListenHistoryItem[] {
    return lsGet<ListenHistoryItem[]>("history", []);
  },
  add(item: ListenHistoryItem) {
    const list = this.getAll();
    list.unshift(item);
    // Keep last 500 entries
    if (list.length > 500) list.length = 500;
    lsSet("history", list);
  },
  remove(id: string) {
    const list = this.getAll().filter((h) => h.id !== id);
    lsSet("history", list);
  },
  clear() {
    lsRemove("history");
  },
};

// Sessions — daily listening totals
export const sessionStorage = {
  getAll(): ListenSession[] {
    return lsGet<ListenSession[]>("sessions", []);
  },
  addSeconds(seconds: number) {
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    const list = this.getAll();
    let entry = list.find((s) => s.date === today);
    if (!entry) {
      entry = { date: today, totalSeconds: 0, sessionsCount: 0 };
      list.push(entry);
    }
    entry.totalSeconds += seconds;
    entry.sessionsCount += 1;
    lsSet("sessions", list);
  },
  addListenTime(seconds: number) {
    // For continuous playback — don't increment sessions count
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    const list = this.getAll();
    let entry = list.find((s) => s.date === today);
    if (!entry) {
      entry = { date: today, totalSeconds: 0, sessionsCount: 0 };
      list.push(entry);
    }
    entry.totalSeconds += seconds;
    lsSet("sessions", list);
  },
  clear() {
    lsRemove("sessions");
  },
};

// Goals
export const goalStorage = {
  get(): ListenGoal | null {
    return lsGet<ListenGoal | null>("goal", null);
  },
  set(goal: ListenGoal) {
    lsSet("goal", goal);
  },
  clear() {
    lsRemove("goal");
  },
};

// Notifications
export const notificationStorage = {
  getAll(): NotificationSetting[] {
    return lsGet<NotificationSetting[]>("notifications", []);
  },
  set(items: NotificationSetting[]) {
    lsSet("notifications", items);
  },
  clear() {
    lsRemove("notifications");
  },
};

// IndexedDB for downloads
const DB_NAME = "sadik-db";
const DB_VERSION = 1;
const STORE_DOWNLOADS = "downloads";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOWNLOADS)) {
        db.createObjectStore(STORE_DOWNLOADS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("audio-blobs")) {
        db.createObjectStore("audio-blobs", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const downloadsStorage = {
  async getAll(): Promise<DownloadedTrack[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DOWNLOADS, "readonly");
        const store = tx.objectStore(STORE_DOWNLOADS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as DownloadedTrack[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },
  async add(item: DownloadedTrack) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DOWNLOADS, "readwrite");
      tx.objectStore(STORE_DOWNLOADS).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async remove(id: string) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DOWNLOADS, "readwrite");
      tx.objectStore(STORE_DOWNLOADS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async getBlob(key: string): Promise<Blob | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("audio-blobs", "readonly");
        const store = tx.objectStore("audio-blobs");
        const req = store.get(key);
        req.onsuccess = () => {
          const result = req.result;
          if (result && result.blob) {
            resolve(result.blob as Blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  },
  async putBlob(key: string, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("audio-blobs", "readwrite");
      tx.objectStore("audio-blobs").put({ key, blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async removeBlob(key: string): Promise<void> {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("audio-blobs", "readwrite");
      tx.objectStore("audio-blobs").delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async estimateStorage(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
    }
    return { usage: 0, quota: 0 };
  },
};
