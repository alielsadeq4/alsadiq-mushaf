"use client";

import { create } from "zustand";
import type {
  FavoriteItem,
  QueueItem,
  ListenHistoryItem,
  AudioTrack,
  ContinueListeningState,
} from "@/types/content";
import {
  favoriteStorage,
  queueStorage,
  historyStorage,
  continueStorage,
  sessionStorage,
} from "@/lib/storage";
import { getAudioEngine } from "@/lib/audio/engine";

interface LibraryState {
  favorites: FavoriteItem[];
  queue: QueueItem[];
  history: ListenHistoryItem[];
  continueListening: ContinueListeningState | null;
  initialized: boolean;

  init: () => void;
  toggleFavorite: (track: AudioTrack) => void;
  isFavorite: (trackId: string) => boolean;
  removeFromFavorites: (id: string) => void;

  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (index: number) => void;
  moveQueueItem: (from: number, to: number) => void;
  clearQueue: () => void;
  playQueue: (index?: number) => void;

  recordHistory: (track: AudioTrack, duration: number, position: number) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  setContinueListening: (state: ContinueListeningState) => void;
  clearContinueListening: () => void;

  addListenTime: (seconds: number) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  favorites: [],
  queue: [],
  history: [],
  continueListening: null,
  initialized: false,

  init: () => {
    if (get().initialized) return;
    set({
      favorites: favoriteStorage.getAll(),
      queue: queueStorage.getAll(),
      history: historyStorage.getAll(),
      continueListening: continueStorage.get(),
      initialized: true,
    });
  },

  toggleFavorite: (track: AudioTrack) => {
    const existing = get().favorites.find((f) => f.trackId === track.id);
    if (existing) {
      favoriteStorage.remove(existing.id);
      set({
        favorites: get().favorites.filter((f) => f.id !== existing.id),
      });
    } else {
      const item: FavoriteItem = {
        id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        trackId: track.id,
        title: track.title,
        category: track.category,
        reciterOrSpeaker: track.reciterOrSpeaker,
        audioUrl: track.audioUrl,
        surahId: track.surahId,
        ayahStart: track.ayahStart,
        ayahEnd: track.ayahEnd,
        addedAt: Date.now(),
      };
      favoriteStorage.add(item);
      set({ favorites: [item, ...get().favorites] });
    }
  },

  isFavorite: (trackId: string) => {
    return get().favorites.some((f) => f.trackId === trackId);
  },

  removeFromFavorites: (id: string) => {
    favoriteStorage.remove(id);
    set({ favorites: get().favorites.filter((f) => f.id !== id) });
  },

  addToQueue: (track: AudioTrack) => {
    const item: QueueItem = {
      trackId: track.id,
      title: track.title,
      category: track.category,
      reciterOrSpeaker: track.reciterOrSpeaker,
      audioUrl: track.audioUrl,
      duration: track.duration,
      surahId: track.surahId,
      ayahStart: track.ayahStart,
      ayahEnd: track.ayahEnd,
      addedAt: Date.now(),
    };
    const newQueue = [...get().queue, item];
    queueStorage.set(newQueue);
    set({ queue: newQueue });
    // Also add to audio engine queue
    const engine = getAudioEngine();
    engine.addToQueue(item);
  },

  removeFromQueue: (index: number) => {
    const newQueue = [...get().queue];
    newQueue.splice(index, 1);
    queueStorage.set(newQueue);
    set({ queue: newQueue });
    const engine = getAudioEngine();
    engine.removeFromQueue(index);
  },

  moveQueueItem: (from: number, to: number) => {
    const newQueue = [...get().queue];
    const [item] = newQueue.splice(from, 1);
    newQueue.splice(to, 0, item);
    queueStorage.set(newQueue);
    set({ queue: newQueue });
    const engine = getAudioEngine();
    engine.moveQueueItem(from, to);
  },

  clearQueue: () => {
    queueStorage.clear();
    set({ queue: [] });
    const engine = getAudioEngine();
    engine.clearQueue();
  },

  playQueue: (index: number = 0) => {
    const queue = get().queue;
    if (queue.length === 0) return;
    const engine = getAudioEngine();
    engine.setQueue(queue, index);
    const item = queue[index];
    const track: AudioTrack = {
      id: item.trackId,
      title: item.title,
      category: item.category,
      contentType: "audio-clip",
      reciterOrSpeaker: item.reciterOrSpeaker,
      audioUrl: item.audioUrl,
      duration: item.duration,
      surahId: item.surahId,
      ayahStart: item.ayahStart,
      ayahEnd: item.ayahEnd,
      downloadAllowed: false,
      verified: true,
    };
    engine.playTrack(track);
  },

  recordHistory: (track: AudioTrack, duration: number, position: number) => {
    const item: ListenHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      trackId: track.id,
      title: track.title,
      category: track.category,
      reciterOrSpeaker: track.reciterOrSpeaker,
      listenedAt: Date.now(),
      duration,
      position,
    };
    historyStorage.add(item);
    set({ history: [item, ...get().history].slice(0, 500) });
  },

  removeFromHistory: (id: string) => {
    historyStorage.remove(id);
    set({ history: get().history.filter((h) => h.id !== id) });
  },

  clearHistory: () => {
    historyStorage.clear();
    set({ history: [] });
  },

  setContinueListening: (state: ContinueListeningState) => {
    continueStorage.set(state);
    set({ continueListening: state });
  },

  clearContinueListening: () => {
    continueStorage.clear();
    set({ continueListening: null });
  },

  addListenTime: (seconds: number) => {
    sessionStorage.addListenTime(seconds);
  },
}));
