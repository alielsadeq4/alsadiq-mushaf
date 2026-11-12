"use client";

import { create } from "zustand";
import { getAudioEngine } from "@/lib/audio/engine";
import { settingsStorage } from "@/lib/storage";

interface PlayerUiState {
  // Track which is currently shown in the global player bar (synced with engine)
  // We trigger re-render via a counter — engine stores the actual values.
  tick: number;
  // Whether the player bar should be expanded (full-screen on mobile)
  expanded: boolean;
  // Whether the queue panel is open
  queueOpen: boolean;
  // Whether the sleep timer dialog is open
  sleepTimerOpen: boolean;
  // Currently selected reciter (quran only)
  reciterId: string;
  // Whether the player has been initialized
  initialized: boolean;

  init: () => void;
  setExpanded: (v: boolean) => void;
  setQueueOpen: (v: boolean) => void;
  setSleepTimerOpen: (v: boolean) => void;
  setReciterId: (id: string) => void;
  forceUpdate: () => void;
}

export const usePlayerStore = create<PlayerUiState>((set, get) => ({
  tick: 0,
  expanded: false,
  queueOpen: false,
  sleepTimerOpen: false,
  reciterId: "alafasy",
  initialized: false,

  init: () => {
    if (get().initialized) return;
    const reciterId = settingsStorage.getReciterId();
    set({ reciterId, initialized: true });
    // Subscribe to engine changes to force re-render
    const engine = getAudioEngine();
    engine.subscribe(() => {
      set({ tick: get().tick + 1 });
    });
  },

  setExpanded: (v) => set({ expanded: v }),
  setQueueOpen: (v) => set({ queueOpen: v }),
  setSleepTimerOpen: (v) => set({ sleepTimerOpen: v }),

  setReciterId: (id) => {
    settingsStorage.setReciterId(id);
    set({ reciterId: id });
  },

  forceUpdate: () => set({ tick: get().tick + 1 }),
}));

// Hook for accessing engine state reactively
export function useAudioEngineState() {
  const tick = usePlayerStore((s) => s.tick);
  const engine = getAudioEngine();
  // touch tick so React re-renders
  void tick;
  return engine;
}
