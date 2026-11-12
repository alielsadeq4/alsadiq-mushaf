"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  ListMusic,
  Clock,
  X,
  ChevronUp,
  ChevronDown,
  Gauge,
  Heart,
  Plus,
  Loader2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAudioEngine } from "@/lib/audio/engine";
import { useAudioEngineState, usePlayerStore } from "@/stores/player";
import { useLibraryStore } from "@/stores/library";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const RATES = [0.75, 1, 1.25, 1.5, 2];
const SLEEP_TIMES = [5, 10, 15, 30, 45, 60];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GlobalPlayerBar() {
  const engine = useAudioEngineState();
  const expanded = usePlayerStore((s) => s.expanded);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const queueOpen = usePlayerStore((s) => s.queueOpen);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);
  const sleepTimerOpen = usePlayerStore((s) => s.sleepTimerOpen);
  const setSleepTimerOpen = usePlayerStore((s) => s.setSleepTimerOpen);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const isFavorite = useLibraryStore((s) => s.isFavorite);
  const addToQueue = useLibraryStore((s) => s.addToQueue);

  const track = engine.getCurrentTrack();
  const isPlaying = engine.isPlaying();
  const currentTime = engine.getCurrentTime();
  const duration = engine.getDuration();
  const loading = engine.getLoading();
  const error = engine.getError();
  const rate = engine.getRate();
  const volume = engine.getVolume();
  const repeatMode = engine.getRepeatMode();
  const sleepTimer = engine.getSleepTimer();
  const memorization = engine.getMemorization();

  if (!track) return null;

  const fav = isFavorite(track.id);

  const handleSeek = (value: number[]) => {
    engine.seek(value[0]);
  };

  const handleVolume = (value: number[]) => {
    engine.setVolume(value[0] / 100);
  };

  const handleRate = (r: number) => {
    engine.setRate(r);
  };

  const handleRepeat = () => {
    const modes: Array<"off" | "track" | "surah" | "next"> = ["off", "track", "surah", "next"];
    const idx = modes.indexOf(repeatMode);
    const next = modes[(idx + 1) % modes.length];
    engine.setRepeatMode(next);
  };

  const handleSleepTimer = (minutes: number) => {
    engine.startSleepTimer(minutes);
    setSleepTimerOpen(false);
  };

  const handleSleepTimerEndOfTrack = () => {
    engine.startSleepTimerEndOfTrack();
    setSleepTimerOpen(false);
  };

  return (
    <>
      {/* Mini player bar */}
      <div
        className={cn(
          "fixed bottom-16 left-0 right-0 z-50 md:bottom-0 transition-transform",
          expanded ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0"
        )}
      >
        <div className="mx-auto max-w-6xl px-2 pb-1 md:pb-3">
          <div className="glass rounded-2xl border border-border shadow-2xl">
            {/* Progress bar — top of bar */}
            <div className="px-3 pt-2">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => engine.seek(Number(e.target.value))}
                className="audio-slider w-full"
                aria-label="شريط التقدم"
                style={{
                  background: `linear-gradient(to left, var(--accent) ${(currentTime / (duration || 1)) * 100}%, var(--muted) ${(currentTime / (duration || 1)) * 100}%)`,
                  borderRadius: "3px",
                }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Track info + controls */}
            <div className="flex items-center gap-3 px-3 py-2">
              {/* Track icon + title */}
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-3 flex-1 min-w-0 text-right"
                aria-label="فتح المشغل الكامل"
              >
                <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
                  <TrackIcon category={track.category} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.reciterOrSpeaker}</p>
                  {memorization.enabled && (
                    <span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <GraduationCap className="h-2.5 w-2.5" />
                      تسميع {memorization.currentCount + 1}/{memorization.targetCount}
                      {memorization.pausingUntil && " • وقفة"}
                    </span>
                  )}
                </div>
              </button>

              {/* Mobile: play/pause + expand */}
              <div className="flex items-center gap-1 md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => engine.togglePlay()}
                  aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                  disabled={!!error}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Desktop: full controls */}
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => engine.previous()}
                  aria-label="السابق"
                >
                  <SkipForward className="h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90"
                  onClick={() => engine.togglePlay()}
                  aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                  disabled={!!error}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => engine.next()}
                  aria-label="التالي"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Right side: favorite + queue + more */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => toggleFavorite(track)}
                  aria-label={fav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                >
                  <Heart className={cn("h-4 w-4", fav && "fill-current text-primary")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hidden md:flex"
                  onClick={() => setQueueOpen(true)}
                  aria-label="قائمة الانتظار"
                >
                  <ListMusic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setExpanded(true)}
                  aria-label="فتح المشغل الكامل"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-auto"
                    onClick={() => engine.playTrack(track)}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen expanded player */}
      <Sheet open={expanded} onOpenChange={setExpanded}>
        <SheetContent
          side="bottom"
          className="h-[100vh] p-0 rounded-t-3xl border-border"
        >
          <ExpandedPlayer
            track={track}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            loading={loading}
            error={error}
            rate={rate}
            volume={volume}
            repeatMode={repeatMode}
            fav={fav}
            sleepTimer={sleepTimer}
            memorization={memorization}
            onTogglePlay={() => engine.togglePlay()}
            onSeek={(v) => engine.seek(v)}
            onVolume={(v) => engine.setVolume(v / 100)}
            onRate={(r) => engine.setRate(r)}
            onRepeat={() => {
              const modes: Array<"off" | "track" | "surah" | "next"> = ["off", "track", "surah", "next"];
              const idx = modes.indexOf(repeatMode);
              engine.setRepeatMode(modes[(idx + 1) % modes.length]);
            }}
            onPrevious={() => engine.previous()}
            onNext={() => engine.next()}
            onFav={() => toggleFavorite(track)}
            onAddQueue={() => addToQueue(track)}
            onClose={() => setExpanded(false)}
            onQueueOpen={() => {
              setExpanded(false);
              setQueueOpen(true);
            }}
            onSleepTimerOpen={() => setSleepTimerOpen(true)}
            onSleepTimerCancel={() => engine.cancelSleepTimer()}
            onStopMemorization={() => engine.stopMemorization()}
          />
        </SheetContent>
      </Sheet>

      {/* Queue sheet */}
      <Sheet open={queueOpen} onOpenChange={setQueueOpen}>
        <SheetContent side="left" className="w-full sm:w-96 p-0">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              قائمة الانتظار
            </SheetTitle>
          </SheetHeader>
          <QueuePanel />
        </SheetContent>
      </Sheet>

      {/* Sleep timer dialog */}
      <Dialog open={sleepTimerOpen} onOpenChange={setSleepTimerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              مؤقت النوم
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {SLEEP_TIMES.map((min) => (
              <Button
                key={min}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSleepTimer(min)}
              >
                <Clock className="h-4 w-4 ml-2" />
                {min} دقيقة
              </Button>
            ))}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSleepTimerEndOfTrack}
            >
              <SkipForward className="h-4 w-4 ml-2" />
              نهاية المقطع الحالي
            </Button>
            {sleepTimer.active && (
              <>
                <div className="h-px bg-border my-2" />
                <Button
                  variant="ghost"
                  className="w-full text-destructive"
                  onClick={() => {
                    engine.cancelSleepTimer();
                    setSleepTimerOpen(false);
                  }}
                >
                  إيقاف المؤقت
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExpandedPlayer(props: {
  track: ReturnType<ReturnType<typeof getAudioEngine>["getCurrentTrack"]>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loading: boolean;
  error: string | null;
  rate: number;
  volume: number;
  repeatMode: "off" | "track" | "surah" | "next";
  fav: boolean;
  sleepTimer: ReturnType<ReturnType<typeof getAudioEngine>["getSleepTimer"]>;
  memorization: ReturnType<ReturnType<typeof getAudioEngine>["getMemorization"]>;
  onTogglePlay: () => void;
  onSeek: (v: number) => void;
  onVolume: (v: number) => void;
  onRate: (r: number) => void;
  onRepeat: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onFav: () => void;
  onAddQueue: () => void;
  onClose: () => void;
  onQueueOpen: () => void;
  onSleepTimerOpen: () => void;
  onSleepTimerCancel: () => void;
  onStopMemorization: () => void;
}) {
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);
  const track = props.track;
  if (!track) return null;

  useEffect(() => {
    if (!props.sleepTimer.active || !props.sleepTimer.endsAt) {
      setSleepRemaining(null);
      return;
    }
    const update = () => {
      if (!props.sleepTimer.endsAt) return;
      const remaining = Math.max(0, props.sleepTimer.endsAt - Date.now());
      setSleepRemaining(Math.ceil(remaining / 60000));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [props.sleepTimer]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={props.onClose} aria-label="إغلاق">
          <ChevronDown className="h-5 w-5" />
        </Button>
        <p className="text-xs text-muted-foreground font-medium">قيد التشغيل الآن</p>
        <Button variant="ghost" size="icon" onClick={props.onQueueOpen} aria-label="قائمة الانتظار">
          <ListMusic className="h-5 w-5" />
        </Button>
      </div>

      {/* Cover art */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="relative aspect-square w-full max-w-sm rounded-3xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 pattern-arabesque opacity-30" />
          <div className="relative z-10 text-primary-foreground">
            <TrackIcon category={track.category} size="lg" />
          </div>
          {props.isPlaying && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-primary-foreground/80 rounded-full equalizer-bar"
                  style={{ height: "100%", animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Track info */}
      <div className="px-6 py-4 text-center">
        <h2 className="text-xl font-bold mb-1 quran-text">{track.title}</h2>
        <p className="text-sm text-muted-foreground">{track.reciterOrSpeaker}</p>
        {track.category && (
          <Badge variant="secondary" className="mt-2">
            {categoryLabel(track.category)}
          </Badge>
        )}
        {props.memorization.enabled && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-xs text-accent">
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="font-semibold">
              وضع التسميع — التكرار {props.memorization.currentCount + 1} / {props.memorization.targetCount}
            </span>
            {props.memorization.pauseMs > 0 && (
              <span className="opacity-70">
                • وقفة {Math.round(props.memorization.pauseMs / 1000)}ث
              </span>
            )}
            {props.memorization.pausingUntil && (
              <span className="opacity-70 animate-pulse">• في الوقفة...</span>
            )}
            <button
              type="button"
              onClick={props.onStopMemorization}
              className="mr-1 rounded-full bg-accent/20 hover:bg-accent/30 px-2 py-0.5 text-[10px] transition-colors"
              aria-label="إيقاف وضع التسميع"
            >
              إيقاف
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3">
        <input
          type="range"
          min={0}
          max={props.duration || 0}
          value={props.currentTime}
          onChange={(e) => props.onSeek(Number(e.target.value))}
          className="audio-slider w-full"
          aria-label="شريط التقدم"
          style={{
            background: `linear-gradient(to left, var(--accent) ${(props.currentTime / (props.duration || 1)) * 100}%, var(--muted) ${(props.currentTime / (props.duration || 1)) * 100}%)`,
            borderRadius: "3px",
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(props.currentTime)}</span>
          <span>{formatTime(props.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={props.onFav}
            className="h-10 w-10"
            aria-label={props.fav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={cn("h-5 w-5", props.fav && "fill-current text-primary")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={props.onPrevious}
            className="h-12 w-12"
            aria-label="السابق"
          >
            <SkipForward className="h-6 w-6 rotate-180" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={props.onTogglePlay}
            className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-xl"
            aria-label={props.isPlaying ? "إيقاف" : "تشغيل"}
            disabled={!!props.error}
          >
            {props.loading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : props.isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={props.onNext}
            className="h-12 w-12"
            aria-label="التالي"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="المزيد">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={props.onAddQueue}>
                <ListMusic className="h-4 w-4 ml-2" />
                إضافة لقائمة الانتظار
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Repeat */}
          <Button
            variant="ghost"
            size="icon"
            onClick={props.onRepeat}
            className={cn("h-10 w-10", props.repeatMode !== "off" && "text-primary")}
            aria-label="وضع التكرار"
          >
            {props.repeatMode === "track" ? (
              <Repeat1 className="h-5 w-5" />
            ) : (
              <Repeat className="h-5 w-5" />
            )}
          </Button>

          {/* Speed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 px-3" aria-label="سرعة التشغيل">
                <Gauge className="h-4 w-4 ml-1" />
                {props.rate}x
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>سرعة التشغيل</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {RATES.map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => props.onRate(r)}
                  className={cn(props.rate === r && "bg-primary/10 text-primary")}
                >
                  {r}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sleep timer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => props.sleepTimer.active ? props.onSleepTimerCancel() : props.onSleepTimerOpen()}
            className={cn("h-10 w-10", props.sleepTimer.active && "text-primary")}
            aria-label="مؤقت النوم"
          >
            <Clock className="h-5 w-5" />
            {sleepRemaining !== null && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {sleepRemaining}
              </span>
            )}
          </Button>

          {/* Volume */}
          <div className="flex items-center gap-2 w-32">
            <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[props.volume * 100]}
              onValueChange={(v) => props.onVolume(v[0])}
              max={100}
              step={1}
              aria-label="مستوى الصوت"
            />
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </div>

        {props.error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{props.error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 mr-auto"
              onClick={() => getAudioEngine().playTrack(track)}
            >
              إعادة المحاولة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function QueuePanel() {
  const queue = useLibraryStore((s) => s.queue);
  const removeFromQueue = useLibraryStore((s) => s.removeFromQueue);
  const playQueue = useLibraryStore((s) => s.playQueue);
  const clearQueue = useLibraryStore((s) => s.clearQueue);
  const engine = useAudioEngineState();
  const currentIndex = engine.getQueueIndex();

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <ListMusic className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">قائمة الانتظار فارغة</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          أضف المحتوى من زر "+" في المشغل
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{queue.length} عنصر</span>
        <Button variant="ghost" size="sm" onClick={clearQueue} className="text-destructive">
          مسح الكل
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {queue.map((item, idx) => (
          <div
            key={`${item.trackId}-${idx}`}
            className={cn(
              "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border/50",
              idx === currentIndex && "bg-primary/10"
            )}
            onClick={() => playQueue(idx)}
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <TrackIcon category={item.category} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.reciterOrSpeaker}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                removeFromQueue(idx);
              }}
              aria-label="إزالة من القائمة"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackIcon({
  category,
  size = "sm",
}: {
  category?: string;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "h-24 w-24" : "h-5 w-5 sm:h-6 sm:w-6";
  const stroke = size === "lg" ? 1 : 1.8;
  switch (category) {
    case "quran":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={stroke}>
          <path d="M12 4v16M4 6c2 0 4 1 8 2 4-1 6-2 8-2v12c-2 0-4 1-8 2-4-1-6-2-8-2V6z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ruqyah":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={stroke}>
          <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "morning-azkar":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={stroke}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      );
    case "evening-azkar":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={stroke}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "salawat":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={stroke}>
          <path d="M12 21s-7-4.5-9.5-9C0 7 4 3 7 4.5c2 1 5 4.5 5 4.5s3-3.5 5-4.5C20 3 24 7 21.5 12c-2.5 4.5-9.5 9-9.5 9z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={stroke}>
          <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
  }
}

function categoryLabel(c: string): string {
  switch (c) {
    case "quran": return "القرآن الكريم";
    case "ruqyah": return "الرقية الشرعية";
    case "morning-azkar": return "أذكار الصباح";
    case "evening-azkar": return "أذكار المساء";
    case "salawat": return "الصلاة على النبي ﷺ";
    case "adhkar-general": return "أذكار";
    default: return c;
  }
}
