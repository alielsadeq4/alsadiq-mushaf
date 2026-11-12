"use client";

import { useEffect, ReactNode } from "react";
import { getAudioEngine } from "@/lib/audio/engine";
import { usePlayerStore } from "@/stores/player";
import { useLibraryStore } from "@/stores/library";
import { settingsStorage } from "@/lib/storage";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const initPlayer = usePlayerStore((s) => s.init);
  const initLibrary = useLibraryStore((s) => s.init);

  useEffect(() => {
    // Initialize engine on client
    const engine = getAudioEngine();
    engine.init();
    // Restore settings
    const rate = settingsStorage.getRate();
    engine.setRate(rate);

    initPlayer();
    initLibrary();

    // Periodic history save while playing
    let lastSaved = 0;
    const interval = setInterval(() => {
      const currentTrack = engine.getCurrentTrack();
      if (!currentTrack || !engine.isPlaying()) return;
      const now = Date.now();
      if (now - lastSaved >= 30000) {
        // Save every 30 seconds
        const elapsed = (now - lastSaved) / 1000;
        useLibraryStore.getState().addListenTime(elapsed);
        lastSaved = now;
      }
    }, 10000);

    // Save on track change & unload
    const onBeforeUnload = () => {
      engine.savePosition();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [initPlayer, initLibrary]);

  return <>{children}</>;
}
