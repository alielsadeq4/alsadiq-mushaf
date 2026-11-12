// Global Audio Engine
// Singleton audio element + event emitter
// Survives route changes (kept at module level)

import type { AudioTrack, QueueItem, SleepTimerState, MemorizationState } from "@/types/content";

type Listener = () => void;

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<Listener> = new Set();
  private currentTrack: AudioTrack | null = null;
  private queue: QueueItem[] = [];
  private queueIndex: number = -1;
  private repeatMode: "off" | "track" | "surah" | "next" = "off";
  private sleepTimer: SleepTimerState = {
    active: false,
    endsAt: null,
    mode: "duration",
  };
  private sleepTimerId: ReturnType<typeof setTimeout> | null = null;
  private memorization: MemorizationState = {
    enabled: false,
    targetCount: 1,
    currentCount: 0,
    pauseMs: 0,
    pausingUntil: null,
  };
  private memorizationPauseTimer: ReturnType<typeof setTimeout> | null = null;
  private rate: number = 1;
  private volume: number = 1;
  private loading: boolean = false;
  private error: string | null = null;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.audio = new Audio();
    this.audio.preload = "metadata";
    // Append to DOM (hidden) — required by some browsers for autoplay policies
    // and Media Session API to work reliably.
    this.audio.style.display = "none";
    document.body.appendChild(this.audio);
    // Note: Do NOT set crossOrigin — most CDNs work fine without it,
    // and setting "anonymous" can break some audio sources that don't
    // send proper CORS headers.

    // Bind events
    const emit = () => this.emit();
    this.audio.addEventListener("play", emit);
    this.audio.addEventListener("pause", emit);
    this.audio.addEventListener("timeupdate", emit);
    this.audio.addEventListener("durationchange", emit);
    this.audio.addEventListener("volumechange", emit);
    this.audio.addEventListener("ratechange", emit);
    this.audio.addEventListener("loadstart", () => {
      this.loading = true;
      this.error = null;
      emit();
    });
    this.audio.addEventListener("canplay", () => {
      this.loading = false;
      emit();
    });
    this.audio.addEventListener("waiting", () => {
      this.loading = true;
      emit();
    });
    this.audio.addEventListener("playing", () => {
      this.loading = false;
      emit();
    });
    this.audio.addEventListener("ended", () => this.handleEnded());
    this.audio.addEventListener("error", (e) => {
      console.error("[AudioEngine] error", e);
      this.loading = false;
      // Try fallback URL if available
      if (this.currentTrack && this.currentTrack.fallbackUrls && this.currentTrack.fallbackUrls.length > 0) {
        const fallback = this.currentTrack.fallbackUrls[0];
        this.currentTrack.fallbackUrls = this.currentTrack.fallbackUrls.slice(1);
        this.audio!.src = fallback;
        this.audio!.load();
        this.audio!.play().catch(() => {
          this.error = "تعذر تشغيل الملف الصوتي حتى من المصدر الاحتياطي";
          emit();
        });
      } else {
        this.error = "تعذر تشغيل الملف الصوتي";
        emit();
      }
    });

    // Apply initial settings
    this.audio.playbackRate = this.rate;
    this.audio.volume = this.volume;

    this.initialized = true;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  // Getters
  getAudio() {
    return this.audio;
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  getQueue() {
    return this.queue;
  }

  getQueueIndex() {
    return this.queueIndex;
  }

  isPlaying() {
    return this.audio?.paused === false && !this.audio?.ended;
  }

  getCurrentTime() {
    return this.audio?.currentTime ?? 0;
  }

  getDuration() {
    const d = this.audio?.duration ?? 0;
    return Number.isFinite(d) ? d : 0;
  }

  getRate() {
    return this.rate;
  }

  getVolume() {
    return this.volume;
  }

  getRepeatMode() {
    return this.repeatMode;
  }

  getLoading() {
    return this.loading;
  }

  getError() {
    return this.error;
  }

  getSleepTimer() {
    return this.sleepTimer;
  }

  getMemorization() {
    return this.memorization;
  }

  // Setters
  setRate(rate: number) {
    this.rate = rate;
    if (this.audio) this.audio.playbackRate = rate;
    this.emit();
  }

  setVolume(vol: number) {
    this.volume = vol;
    if (this.audio) this.audio.volume = vol;
    this.emit();
  }

  setRepeatMode(mode: "off" | "track" | "surah" | "next") {
    this.repeatMode = mode;
    if (this.audio) {
      this.audio.loop = mode === "track";
    }
    this.emit();
  }

  seek(time: number) {
    if (this.audio && Number.isFinite(time)) {
      this.audio.currentTime = time;
      this.emit();
    }
  }

  // Playback control
  async playTrack(track: AudioTrack) {
    this.init();
    if (!this.audio) return;

    this.currentTrack = track;
    this.error = null;
    this.loading = true;

    // Memorization: when starting a fresh track, reset the per-ayah counter
    // (but keep `enabled`/`targetCount`/`pauseMs` — they apply to every ayah).
    if (this.memorization.enabled) {
      this.memorization.currentCount = 0;
      this.memorization.pausingUntil = null;
      if (this.memorizationPauseTimer) {
        clearTimeout(this.memorizationPauseTimer);
        this.memorizationPauseTimer = null;
      }
    }

    // Resolve the best URL: prefer downloaded (offline) blob over CDN
    let src = track.audioUrl;
    try {
      const { resolvePlayableUrl } = await import("@/lib/audio/offline-resolver");
      src = await resolvePlayableUrl(track);
    } catch {
      // Fallback to CDN
    }

    this.audio.src = src;
    this.audio.load();
    this.audio.playbackRate = this.rate;
    this.audio.volume = this.volume;
    this.audio.loop = this.repeatMode === "track";

    try {
      await this.audio.play();
      this.updateMediaSession(track);
      // Save continue listening state
      this.saveContinueListening(track);
      // Preload next track in queue for gapless playback
      this.preloadNext();
    } catch (err) {
      console.error("[AudioEngine] play failed", err);
      this.error = "تعذر التشغيل — قد يحتاج المتصفح إلى تفاعل من المستخدم";
    }
    this.emit();
  }

  // Preload the next queue track (silent <link rel=preload> style via Audio element)
  private preloadedUrl: string | null = null;
  private preloadedIndex: number = -1;
  private preloadAudio: HTMLAudioElement | null = null;

  private preloadNext() {
    try {
      const nextIdx = this.queueIndex + 1;
      if (nextIdx >= this.queue.length || nextIdx === this.preloadedIndex) return;
      const next = this.queue[nextIdx];
      if (!next) return;
      // Only preload small ayah files — skip if already preloaded
      this.preloadedIndex = nextIdx;
      const a = new Audio();
      a.preload = "auto";
      a.src = next.audioUrl;
      this.preloadAudio = a; // keep reference so browser does not cancel
    } catch {
      // non-fatal
    }
  }

  async togglePlay() {
    if (!this.audio || !this.currentTrack) return;
    if (this.audio.paused) {
      try {
        await this.audio.play();
        this.updateMediaSession(this.currentTrack);
      } catch (err) {
        console.error("[AudioEngine] togglePlay failed", err);
        this.error = "تعذر التشغيل";
      }
    } else {
      this.audio.pause();
    }
    this.emit();
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
      this.emit();
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = "";
      this.currentTrack = null;
      // Cancel any in-flight memorization pause
      if (this.memorizationPauseTimer) {
        clearTimeout(this.memorizationPauseTimer);
        this.memorizationPauseTimer = null;
      }
      if (this.memorization.enabled) {
        this.memorization.currentCount = 0;
        this.memorization.pausingUntil = null;
      }
      this.emit();
    }
  }

  // Queue management
  setQueue(items: QueueItem[], startIndex: number = 0) {
    this.queue = items;
    this.queueIndex = startIndex;
    this.emit();
  }

  addToQueue(item: QueueItem) {
    this.queue.push(item);
    this.emit();
  }

  removeFromQueue(index: number) {
    this.queue.splice(index, 1);
    if (this.queueIndex >= index && this.queueIndex > 0) {
      this.queueIndex--;
    }
    this.emit();
  }

  moveQueueItem(from: number, to: number) {
    const [item] = this.queue.splice(from, 1);
    this.queue.splice(to, 0, item);
    this.emit();
  }

  clearQueue() {
    this.queue = [];
    this.queueIndex = -1;
    this.emit();
  }

  async next() {
    if (this.queueIndex < this.queue.length - 1) {
      this.queueIndex++;
      const item = this.queue[this.queueIndex];
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
      await this.playTrack(track);
    } else if (this.repeatMode === "next") {
      // Loop queue
      if (this.queue.length > 0) {
        this.queueIndex = 0;
        const item = this.queue[0];
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
        await this.playTrack(track);
      }
    } else {
      // No more — stop
      this.pause();
    }
  }

  async previous() {
    if (this.audio && this.audio.currentTime > 3 && this.queueIndex >= 0) {
      // restart current track
      this.audio.currentTime = 0;
      return;
    }
    if (this.queueIndex > 0) {
      this.queueIndex--;
      const item = this.queue[this.queueIndex];
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
      await this.playTrack(track);
    }
  }

  private async handleEnded() {
    if (this.repeatMode === "track") {
      // Loop is handled by audio.loop
      return;
    }
    if (this.repeatMode === "surah") {
      if (this.audio) {
        this.audio.currentTime = 0;
        try {
          await this.audio.play();
        } catch (err) {
          console.error("[AudioEngine] repeat surah failed", err);
        }
      }
      return;
    }

    // Memorization mode: count this play, replay if not yet reached targetCount,
    // otherwise reset and advance to the next track.
    if (this.memorization.enabled && this.memorization.targetCount > 1) {
      this.memorization.currentCount += 1;
      if (this.memorization.currentCount < this.memorization.targetCount) {
        // Replay the same ayah — optionally after a silence gap.
        if (this.memorization.pauseMs > 0) {
          this.memorization.pausingUntil = Date.now() + this.memorization.pauseMs;
          this.emit();
          await new Promise<void>((resolve) => {
            this.memorizationPauseTimer = setTimeout(() => {
              this.memorization.pausingUntil = null;
              this.memorizationPauseTimer = null;
              resolve();
            }, this.memorization.pauseMs);
          });
          // User might have stopped during the pause
          if (!this.currentTrack || !this.audio) return;
        }
        if (this.audio) {
          this.audio.currentTime = 0;
          try {
            await this.audio.play();
            this.emit();
            return;
          } catch (err) {
            console.error("[AudioEngine] memorization replay failed", err);
            // fall through to next()
          }
        }
      } else {
        // Done repeating this ayah — reset counter and advance
        this.memorization.currentCount = 0;
        this.emit();
      }
    }

    // Default: go to next track in queue
    await this.next();
  }

  // Sleep timer
  startSleepTimer(minutes: number) {
    this.clearSleepTimer();
    const ms = minutes * 60 * 1000;
    this.sleepTimer = {
      active: true,
      endsAt: Date.now() + ms,
      mode: "duration",
      remainingMs: ms,
    };
    this.sleepTimerId = setTimeout(() => {
      this.fadeOutAndStop();
    }, ms);
    this.emit();
  }

  startSleepTimerEndOfTrack() {
    this.clearSleepTimer();
    this.sleepTimer = {
      active: true,
      endsAt: null,
      mode: "end-of-track",
    };
    this.emit();
  }

  cancelSleepTimer() {
    this.clearSleepTimer();
    this.sleepTimer = { active: false, endsAt: null, mode: "duration" };
    this.emit();
  }

  private clearSleepTimer() {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
  }

  // Memorization mode — repeat each ayah N times with optional silence gap.
  // Pass targetCount=1 (or call stopMemorization) to disable.
  startMemorization(targetCount: number, pauseMs: number = 0) {
    if (targetCount < 1) targetCount = 1;
    if (pauseMs < 0) pauseMs = 0;
    this.memorization = {
      enabled: targetCount > 1,
      targetCount,
      currentCount: 0,
      pauseMs,
      pausingUntil: null,
    };
    // Clear any in-flight pause timer
    if (this.memorizationPauseTimer) {
      clearTimeout(this.memorizationPauseTimer);
      this.memorizationPauseTimer = null;
    }
    // When memorization is on, disable "track" loop mode (the audio.loop
    // property) — we handle repetition ourselves so we can count and pause.
    if (this.memorization.enabled && this.audio) {
      this.audio.loop = false;
    }
    this.emit();
  }

  stopMemorization() {
    if (this.memorizationPauseTimer) {
      clearTimeout(this.memorizationPauseTimer);
      this.memorizationPauseTimer = null;
    }
    this.memorization = {
      enabled: false,
      targetCount: 1,
      currentCount: 0,
      pauseMs: 0,
      pausingUntil: null,
    };
    this.emit();
  }

  private async fadeOutAndStop() {
    if (!this.audio) return;
    // Fade out over 2 seconds
    const startVolume = this.audio.volume;
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      if (!this.audio) return;
      this.audio.volume = startVolume * (1 - i / steps);
      await new Promise((r) => setTimeout(r, 100));
    }
    this.audio.pause();
    this.audio.volume = startVolume;
    this.sleepTimer = { active: false, endsAt: null, mode: "duration" };
    this.emit();
  }

  // Media Session API integration
  private updateMediaSession(track: AudioTrack) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.reciterOrSpeaker,
      album: "الصادق — منصة الاستماع الإسلامي",
      artwork: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      this.togglePlay();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      this.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      this.previous();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      this.next();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) {
        this.seek(details.seekTime);
      }
    });
  }

  // Save continue listening state to localStorage
  private saveContinueListening(track: AudioTrack) {
    if (typeof window === "undefined") return;
    try {
      const state = {
        trackId: track.id,
        title: track.title,
        category: track.category,
        reciterOrSpeaker: track.reciterOrSpeaker,
        currentTime: 0,
        audioUrl: track.audioUrl,
        surahId: track.surahId,
        ayahStart: track.ayahStart,
        ayahEnd: track.ayahEnd,
        timestamp: Date.now(),
      };
      localStorage.setItem("sadik:continue-listening", JSON.stringify(state));
    } catch (err) {
      console.error("[AudioEngine] saveContinueListening failed", err);
    }
  }

  // Periodically save playback position
  savePosition() {
    if (!this.audio || !this.currentTrack) return;
    if (typeof window === "undefined") return;
    try {
      const state = JSON.parse(localStorage.getItem("sadik:continue-listening") || "{}");
      state.currentTime = this.audio.currentTime;
      state.timestamp = Date.now();
      localStorage.setItem("sadik:continue-listening", JSON.stringify(state));
    } catch (err) {
      // silent
    }
  }
}

// Singleton instance — created lazily on the client
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}

export { AudioEngine };
