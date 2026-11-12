"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Sparkles, Search, RotateCcw, Plus, X, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NAMES_OF_ALLAH } from "@/data/names-of-allah";
import type { NameOfAllah } from "@/types/content";
import { cn } from "@/lib/utils";

const COUNTS_KEY = "sadik:names-tasbih-counts";

function loadCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(COUNTS_KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function saveCounts(counts: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  } catch (err) {
    console.error("[names] failed to persist counts", err);
  }
}

export default function NamesOfAllahPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<NameOfAllah | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCounts(loadCounts());
    setMounted(true);
  }, []);

  const increment = useCallback((id: string) => {
    setCounts((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      saveCounts(next);
      return next;
    });
  }, []);

  const resetName = useCallback((id: string) => {
    setCounts((prev) => {
      const next = { ...prev, [id]: 0 };
      saveCounts(next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return NAMES_OF_ALLAH;
    return NAMES_OF_ALLAH.filter(
      (n) => n.name.includes(q) || n.meaning.includes(q)
    );
  }, [query]);

  const totalTasbih = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const praisedCount = useMemo(
    () => Object.values(counts).filter((c) => c > 0).length,
    [counts]
  );

  const selectedCount = selected ? counts[selected.id] || 0 : 0;

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
        <div className="relative z-10">
          <Badge
            variant="secondary"
            className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2"
          >
            <Sparkles className="h-3 w-3 ml-1" />
            أسماء الله الحسنى
          </Badge>
          <h1 className="text-3xl font-bold mb-2">أسماء الله الحسنى</h1>
          <p className="text-primary-foreground/80 text-sm max-w-2xl leading-relaxed">
            تسعة وتسعون اسمًا بمعانٍ مختصرة — «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً
            إِلَّا وَاحِدًا مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ» — رواه البخاري.
          </p>
          <p className="text-primary-foreground/60 text-xs mt-2">
            المعاني مختصرة من تيسير الكريم الرحمن للسعدي والنهاية لابن الأثير — بأسلوب مبسط.
          </p>
        </div>
      </div>

      {/* Progress summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <BadgeCheck className="h-5 w-5 text-gold flex-shrink-0" />
            <p className="text-sm font-semibold truncate">
              أحصيت {praisedCount} من {NAMES_OF_ALLAH.length} اسمًا
            </p>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-2xl font-bold text-primary tabular-nums leading-none">
              {mounted ? totalTasbih.toLocaleString("ar-EG") : "0"}
            </p>
            <p className="text-[10px] text-muted-foreground">إجمالي التسبيح</p>
          </div>
        </div>
        <Progress
          value={(praisedCount / NAMES_OF_ALLAH.length) * 100}
          className="h-2"
        />
        <p className="text-[10px] text-muted-foreground mt-2">
          العدّ محفوظ على جهازك تلقائيًا — اضغط أي اسم وسبّحه من البطاقة المنبثقة.
        </p>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في الأسماء أو المعاني..."
          className="pr-10 rounded-xl"
          aria-label="بحث في أسماء الله الحسنى"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="مسح البحث"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Names grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((n) => {
          const count = counts[n.id] || 0;
          return (
            <button
              key={n.id}
              onClick={() => setSelected(n)}
              className="text-right"
              aria-label={`اسم ${n.name}`}
            >
              <Card
                className={cn(
                  "p-4 h-full rounded-2xl hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden",
                  count > 0 && "border-gold/50"
                )}
              >
                {count > 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-gold/20 text-[9px] font-bold text-primary px-1.5 py-0.5 tabular-nums">
                    {count}
                  </span>
                )}
                <p
                  className="text-xl font-bold text-primary leading-tight mb-1"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {n.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {n.meaning}
                </p>
              </Card>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">لا نتائج مطابقة لـ «{query}»</p>
        </Card>
      )}

      {/* Detail dialog with per-name tasbih */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle
                  className="text-4xl text-center text-primary pt-2"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {selected.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pb-2">
                <p className="text-center text-sm md:text-base text-foreground leading-relaxed border-y border-border py-4">
                  {selected.meaning}
                </p>

                {/* Mini tasbih */}
                <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">سبحة هذا الاسم</p>
                  <p
                    className="text-5xl font-bold text-primary tabular-nums"
                    style={{ fontFamily: "var(--font-arabic)" }}
                  >
                    {selectedCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    «فَادْعُوهُ بِهَا» — كل ضغطة تسبيحة محفوظة على جهازك
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Button
                      onClick={() => increment(selected.id)}
                      className="rounded-xl bg-gold text-burgundy hover:bg-gold/90 font-bold gap-1"
                      aria-label="سبّح هذا الاسم"
                    >
                      <Plus className="h-4 w-4" />
                      سبّح
                    </Button>
                    <Button
                      onClick={() => resetName(selected.id)}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      aria-label="تصفير عداد هذا الاسم"
                    >
                      <RotateCcw className="h-4 w-4 ml-1" />
                      تصفير
                    </Button>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  المصدر: أسماء مجمعة من الكتاب والسنة كما استقرت في كتب الأسماء الحسنى —
                  الحديث الأصلي رواه البخاري عن أبي هريرة رضي الله عنه.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
