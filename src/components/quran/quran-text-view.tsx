"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookOpenText,
  ChevronDown,
  Share2,
  Play,
  FileText,
  Languages,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getSurahText,
  type QuranVerse,
} from "@/services/quran/textService";
import { getSurahTafsir, TAFSIR_SOURCE } from "@/services/quran/tafsirService";
import {
  getSurahTranslation,
  TRANSLATION_SOURCE,
  type TranslationVerse,
} from "@/services/quran/translationService";
import { shareAyah } from "@/lib/share";
import { cn } from "@/lib/utils";

interface QuranTextViewProps {
  surahId: number;
  currentAyah?: number;
  autoScroll?: boolean;
  /** Scroll to this ayah once on load (deep link ?ayah=N) */
  initialAyah?: number;
  /** Called when the user taps play on an ayah row */
  onPlayAyah?: (ayah: number) => void;
  className?: string;
}

export function QuranTextView({
  surahId,
  currentAyah = 0,
  autoScroll = true,
  initialAyah = 0,
  onPlayAyah,
  className,
}: QuranTextViewProps) {
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // English translation (global toggle — loaded lazily for the whole surah)
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationMap, setTranslationMap] = useState<Record<number, string>>({});
  const [translationLoading, setTranslationLoading] = useState(false);
  const translationLoadedFor = useRef<number | null>(null);

  // Tafsir state (loaded lazily for the whole surah on first open)
  const [tafsirMap, setTafsirMap] = useState<Record<number, string>>({});
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [openTafsir, setOpenTafsir] = useState<Set<number>>(new Set());
  const tafsirLoadedFor = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const initialScrolledFor = useRef<string | null>(null);

  // Load Quran text
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSurahText(surahId)
      .then((data) => {
        if (cancelled) return;
        setVerses(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("تعذر تحميل نص السورة");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [surahId]);

  // Reset tafsir state when surah changes
  useEffect(() => {
    setOpenTafsir(new Set());
    setTafsirMap({});
    tafsirLoadedFor.current = null;
    translationLoadedFor.current = null;
  }, [surahId]);

  // Persist translation preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sadik:show-translation");
      if (saved === "1") setShowTranslation(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleTranslation = () => {
    setShowTranslation((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sadik:show-translation", next ? "1" : "0");
      } catch {
        // ignore
      }
      if (next) void ensureTranslation();
      return next;
    });
  };

  const ensureTranslation = async () => {
    if (translationLoadedFor.current === surahId || translationLoading) return;
    setTranslationLoading(true);
    try {
      const data = await getSurahTranslation(surahId);
      const map: Record<number, string> = {};
      for (const v of data) map[v.n] = v.text;
      setTranslationMap(map);
    } finally {
      setTranslationLoading(false);
      translationLoadedFor.current = surahId;
    }
  };

  // Follow the recitation
  useEffect(() => {
    if (!autoScroll || !currentAyah || !activeRef.current) return;
    activeRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentAyah, autoScroll]);

  // Deep link: scroll to ?ayah=N once after text loads
  useEffect(() => {
    if (!initialAyah || loading) return;
    const stamp = `${surahId}:${initialAyah}`;
    if (initialScrolledFor.current === stamp) return;
    const el = document.getElementById(`ayah-${surahId}-${initialAyah}`);
    if (el) {
      initialScrolledFor.current = stamp;
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [initialAyah, loading, surahId]);

  const ensureTafsir = async () => {
    if (tafsirLoadedFor.current === surahId || tafsirLoading) return;
    setTafsirLoading(true);
    try {
      const data = await getSurahTafsir(surahId);
      const map: Record<number, string> = {};
      for (const v of data) map[v.n] = v.text;
      setTafsirMap(map);
    } finally {
      setTafsirLoading(false);
      tafsirLoadedFor.current = surahId;
    }
  };

  const toggleTafsir = (n: number) => {
    setOpenTafsir((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        next.add(n);
        void ensureTafsir();
      }
      return next;
    });
  };

  const handleShare = async (n: number) => {
    try {
      await shareAyah(surahId, n);
    } catch {
      // shareAyah handles its own fallbacks; silent here
    }
  };

  // ============ Loading skeleton ============
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="max-h-[420px] overflow-hidden p-4 space-y-4" dir="rtl" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="h-7 w-7 flex-shrink-0 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 rounded bg-muted animate-pulse"
                  style={{ width: `${88 - (i % 3) * 14}%`, animationDelay: `${i * 120}ms` }}
                />
                <div
                  className="h-4 rounded bg-muted animate-pulse"
                  style={{ width: `${55 - (i % 2) * 12}%`, animationDelay: `${i * 120 + 60}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (verses.length === 0) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <p className="text-sm text-muted-foreground">لا يوجد نص متاح</p>
      </Card>
    );
  }

  // ============ Verses ============
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Toolbar — translation toggle */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {verses.length} آية
        </span>
        <button
          type="button"
          onClick={toggleTranslation}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
            showTranslation
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="إظهار معاني القرآن بالإنجليزية"
        >
          <Languages className="h-3.5 w-3.5" />
          الترجمة الإنجليزية
        </button>
      </div>
      <div
        ref={containerRef}
        className="max-h-[460px] overflow-y-auto p-3 space-y-1.5"
        dir="rtl"
      >
        {verses.map((verse) => {
          const isActive = verse.n === currentAyah;
          const isPast = currentAyah > 0 && verse.n < currentAyah;
          const tafsirOpen = openTafsir.has(verse.n);
          return (
            <div
              key={verse.n}
              ref={isActive ? activeRef : undefined}
              className={cn(
                "rounded-xl transition-all duration-300",
                isActive
                  ? "bg-primary/10 ring-1 ring-gold/50 shadow-sm animate-ayah-pulse"
                  : "hover:bg-muted/40",
                tafsirOpen && !isActive && "bg-muted/30"
              )}
              id={`ayah-${surahId}-${verse.n}`}
              data-ayah-active={isActive ? verse.n : undefined}
            >
              <div className="flex items-start gap-3 p-3">
                <button
                  type="button"
                  onClick={() => onPlayAyah?.(verse.n)}
                  title="تشغيل من هذه الآية"
                  className={cn(
                    "flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full text-[11px] font-bold tabular-nums transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  )}
                >
                  {isActive ? <Play className="h-3.5 w-3.5 fill-current" /> : verse.n}
                </button>
                <p
                  className={cn(
                    "quran-text text-xl md:text-2xl leading-loose flex-1 text-right",
                    isActive ? "text-primary font-medium" : "",
                    isPast && "text-muted-foreground/70"
                  )}
                >
                  {verse.text}
                  <span className="inline-block mx-1 text-accent text-sm">۝{verse.n}</span>
                </p>
              </div>

              {/* English translation */}
              {showTranslation && (
                <div className="px-10 pb-1" dir="ltr">
                  {translationLoading && translationMap[verse.n] === undefined ? (
                    <div className="space-y-1.5 py-1">
                      <div className="h-3 w-11/12 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                    </div>
                  ) : translationMap[verse.n] ? (
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      {translationMap[verse.n]}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Ayah actions */}
              <div className="flex items-center gap-1 px-3 pb-2 -mt-1">
                <button
                  type="button"
                  onClick={() => toggleTafsir(verse.n)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-colors",
                    tafsirOpen
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <BookOpenText className="h-3.5 w-3.5" />
                  التفسير
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", tafsirOpen && "rotate-180")}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => void handleShare(verse.n)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  مشاركة
                </button>
              </div>

              {/* Tafsir panel */}
              {tafsirOpen && (
                <div className="mx-3 mb-3 rounded-lg border border-border/70 bg-card/60 px-4 py-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-accent">
                    <BookOpenText className="h-3.5 w-3.5" />
                    التفسير الميسر — الآية {verse.n}
                  </p>
                  {tafsirLoading && tafsirMap[verse.n] === undefined ? (
                    <div className="space-y-2 py-1">
                      <div className="h-3.5 w-full rounded bg-muted animate-pulse" />
                      <div className="h-3.5 w-4/5 rounded bg-muted animate-pulse" />
                    </div>
                  ) : tafsirMap[verse.n] ? (
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {tafsirMap[verse.n]}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      لا يوجد تفسير متاح لهذه الآية
                    </p>
                  )}
                  <p className="mt-2 border-t border-border/50 pt-1.5 text-[10px] text-muted-foreground">
                    {TAFSIR_SOURCE}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showTranslation && (
        <p className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground" dir="rtl">
          {TRANSLATION_SOURCE}
        </p>
      )}
    </Card>
  );
}
