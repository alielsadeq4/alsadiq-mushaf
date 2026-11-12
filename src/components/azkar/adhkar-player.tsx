"use client";

import { useState, useEffect, useCallback } from "react";
import { Sunrise, Moon, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Check, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MORNING_ADHKAR, EVENING_ADHKAR } from "@/data/adhkar";
import type { AdhkarSet, DhikrItem } from "@/types/content";
import { cn } from "@/lib/utils";

interface AdhkarPlayerState {
  currentIndex: number;
  currentCount: number;
  isPlaying: boolean;
}

export function AdhkarPlayer({
  adhkarSet,
  themeColor = "amber",
}: {
  adhkarSet: AdhkarSet;
  themeColor?: "amber" | "indigo" | "burgundy";
}) {
  const [state, setState] = useState<AdhkarPlayerState>({
    currentIndex: 0,
    currentCount: 0,
    isPlaying: false,
  });
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const items = adhkarSet.items;
  const currentItem = items[state.currentIndex];
  const isComplete = state.currentIndex >= items.length;

  // Reset state when adhkar set changes
  useEffect(() => {
    setState({ currentIndex: 0, currentCount: 0, isPlaying: false });
    setCompleted(new Set());
  }, [adhkarSet.id]);

  // Auto-advance when count reached (if playing)
  useEffect(() => {
    if (!state.isPlaying || !currentItem) return;
    if (state.currentCount >= currentItem.count) {
      // Mark complete
      setCompleted((prev) => new Set(prev).add(state.currentIndex));
      // Move to next after a brief delay
      const timer = setTimeout(() => {
        setState((prev) => ({
          currentIndex: prev.currentIndex + 1,
          currentCount: 0,
          isPlaying: true,
        }));
      }, 800);
      return () => clearTimeout(timer);
    }
    // Auto-increment when playing (simulating audio playback pace)
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        currentCount: prev.currentCount + 1,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [state.isPlaying, state.currentCount, currentItem, state.currentIndex]);

  const handleIncrement = useCallback(() => {
    if (!currentItem) return;
    if (state.currentCount >= currentItem.count - 1) {
      // Last tap — mark complete and move next
      setCompleted((prev) => new Set(prev).add(state.currentIndex));
      setState((prev) => ({
        currentIndex: prev.currentIndex + 1,
        currentCount: 0,
        isPlaying: false,
      }));
    } else {
      setState((prev) => ({ ...prev, currentCount: prev.currentCount + 1 }));
    }
  }, [currentItem, state.currentCount, state.currentIndex]);

  const handlePrev = () => {
    setState((prev) => ({
      currentIndex: Math.max(0, prev.currentIndex - 1),
      currentCount: 0,
      isPlaying: false,
    }));
  };

  const handleNext = () => {
    setState((prev) => ({
      currentIndex: Math.min(items.length, prev.currentIndex + 1),
      currentCount: 0,
      isPlaying: false,
    }));
  };

  const handleReset = () => {
    setState({ currentIndex: 0, currentCount: 0, isPlaying: false });
    setCompleted(new Set());
  };

  const togglePlay = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  if (isComplete) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">أتممت الأذكار</h2>
        <p className="text-sm text-muted-foreground mb-4">
          تقبل الله منك — تم إكمال {items.length} ذكر من {adhkarSet.title}
        </p>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="h-4 w-4 ml-2" />
          إعادة
        </Button>
      </Card>
    );
  }

  const gradient =
    themeColor === "amber"
      ? "from-amber-500 to-orange-700"
      : themeColor === "burgundy"
      ? "from-burgundy to-gold"
      : "from-indigo-700 to-purple-900";
  const progressColor =
    themeColor === "amber"
      ? "text-amber-600"
      : themeColor === "burgundy"
      ? "text-primary"
      : "text-indigo-600";

  return (
    <div className="space-y-4">
      {/* Header card with progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">{adhkarSet.source}</p>
            <p className="text-sm font-semibold mt-1">
              الذكر {state.currentIndex + 1} من {items.length}
            </p>
          </div>
          <Badge variant="secondary">
            {Math.round(((state.currentIndex) / items.length) * 100)}% مكتمل
          </Badge>
        </div>
        <Progress value={(state.currentIndex / items.length) * 100} className="h-2" />
      </Card>

      {/* Main dhikr card */}
      <Card className="p-6 relative overflow-hidden">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", gradient)} />
        <div className="relative z-10 space-y-4">
          {/* Reference */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">
              {currentItem.reference}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {completed.has(state.currentIndex) ? "✓ مكتمل" : "قيد التلاوة"}
            </Badge>
          </div>

          {/* Dhikr text */}
          <div className="min-h-32 flex items-center justify-center">
            <p className="quran-text text-xl md:text-2xl leading-loose text-center">
              {currentItem.text}
            </p>
          </div>

          {/* Guided note (عمل لا ذكرٌ منطوق) */}
          {currentItem.textNote && (
            <p className="text-xs text-amber-700 dark:text-amber-400 text-center italic border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/5">
              {currentItem.textNote}
            </p>
          )}

          {/* Virtue */}
          {currentItem.virtue && (
            <p className="text-xs text-muted-foreground text-center italic border-t border-border pt-3">
              ✨ {currentItem.virtue}
            </p>
          )}

          {/* Counter */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">التكرار</p>
              <div className="relative">
                <div className={cn("text-4xl font-bold tabular-nums", progressColor)}>
                  {state.currentCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  / {currentItem.count}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar for current dhikr */}
          <Progress
            value={(state.currentCount / currentItem.count) * 100}
            className={cn("h-1.5", progressColor)}
          />

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={state.currentIndex === 0}
              className="h-10 w-10"
              aria-label="السابق"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
              className="h-12 w-12 rounded-full"
              aria-label={state.isPlaying ? "إيقاف" : "تشغيل تلقائي"}
            >
              {state.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleIncrement}
              className={cn(
                "h-16 px-8 rounded-2xl bg-gradient-to-br text-white shadow-lg",
                gradient
              )}
            >
              <Volume2 className="h-5 w-5 ml-2" />
              اضغط للعدّ
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-10 w-10"
              aria-label="التالي"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-2">
            اضغط على زر "اضغط للعدّ" لكل تكرار، أو شغّل التشغيل التلقائي
          </p>
        </div>
      </Card>

      {/* All items list */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">قائمة الأذكار</h3>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {items.map((item, idx) => {
            const isActive = idx === state.currentIndex;
            const isDone = completed.has(idx) || idx < state.currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => setState({ currentIndex: idx, currentCount: 0, isPlaying: false })}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg text-right transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0",
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                </div>
                <p className="text-xs truncate flex-1">
                  {item.text.slice(0, 60)}...
                </p>
                <Badge variant="outline" className="text-[9px] flex-shrink-0">
                  × {item.count}
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Reset button */}
      <Button variant="ghost" onClick={handleReset} className="w-full text-muted-foreground">
        <RotateCcw className="h-4 w-4 ml-2" />
        إعادة من البداية
      </Button>
    </div>
  );
}

// Page wrapper components
export function MorningAdhkarPage() {
  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2">
            <Sunrise className="h-3 w-3 ml-1" />
            أذكار الصباح
          </Badge>
          <h1 className="text-3xl font-bold mb-2">أذكار الصباح</h1>
          <p className="text-primary-foreground/80 text-sm max-w-2xl">
            {MORNING_ADHKAR.description}
          </p>
          <p className="text-primary-foreground/60 text-xs mt-2">
            المصدر: {MORNING_ADHKAR.source}
          </p>
        </div>
      </div>
      <AdhkarPlayer adhkarSet={MORNING_ADHKAR} themeColor="amber" />
    </div>
  );
}

export function EveningAdhkarPage() {
  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-900 text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2">
            <Moon className="h-3 w-3 ml-1" />
            أذكار المساء
          </Badge>
          <h1 className="text-3xl font-bold mb-2">أذكار المساء</h1>
          <p className="text-primary-foreground/80 text-sm max-w-2xl">
            {EVENING_ADHKAR.description}
          </p>
          <p className="text-primary-foreground/60 text-xs mt-2">
            المصدر: {EVENING_ADHKAR.source}
          </p>
        </div>
      </div>
      <AdhkarPlayer adhkarSet={EVENING_ADHKAR} themeColor="indigo" />
    </div>
  );
}
