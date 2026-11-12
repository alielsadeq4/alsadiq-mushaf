"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, RotateCcw, Check, Target, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SALAWAT_FORMS } from "@/data/salawat";
import { cn } from "@/lib/utils";

export default function SalawatPage() {
  const [selectedId, setSelectedId] = useState(SALAWAT_FORMS[0].id);
  const [target, setTarget] = useState(100);
  const [count, setCount] = useState(0);
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(SALAWAT_FORMS[0].id);

  const selected = SALAWAT_FORMS.find((s) => s.id === selectedId)!;

  useEffect(() => {
    setCount(0);
  }, [selectedId, target]);

  const handleTap = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const handleReset = () => setCount(0);

  const isComplete = count >= target;
  const progress = Math.min(100, (count / target) * 100);

  // Persist count across reloads
  useEffect(() => {
    const saved = localStorage.getItem(`sadik:salawat:${selectedId}:${target}`);
    if (saved) setCount(parseInt(saved, 10) || 0);
  }, [selectedId, target]);

  useEffect(() => {
    localStorage.setItem(`sadik:salawat:${selectedId}:${target}`, String(count));
  }, [count, selectedId, target]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="rounded-2xl bg-gradient-to-br from-rose-700 to-rose-950 text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2">
            <Heart className="h-3 w-3 ml-1" />
            الصلاة على النبي ﷺ
          </Badge>
          <h1 className="text-3xl font-bold mb-2 quran-text">الصلاة على النبي ﷺ</h1>
          <p className="text-primary-foreground/80 text-sm max-w-2xl">
            ﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾
          </p>
          <p className="text-primary-foreground/60 text-xs mt-2">الأحزاب 56</p>
        </div>
      </div>

      {/* Virtue card */}
      <Card className="p-4 border-rose-500/30 bg-rose-500/5">
        <p className="text-sm leading-relaxed">
          قال رسول الله ﷺ: «مَن صلَّى علي صلاةً واحدةً، صلَّى اللهُ عليه بها عشرًا»
          <span className="block text-xs text-muted-foreground mt-2">رواه مسلم</span>
        </p>
      </Card>

      {/* Target selector */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">اختر هدفك</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[10, 100, 500, 1000].map((t) => (
            <Button
              key={t}
              variant={target === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTarget(t)}
              className={cn(
                target === t && "bg-rose-700 hover:bg-rose-800"
              )}
            >
              {t} مرة
            </Button>
          ))}
          <Button
            variant={target === customTarget ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const val = prompt("أدخل العدد المخصص:");
              if (val) {
                const n = parseInt(val, 10);
                if (!isNaN(n) && n > 0) {
                  setCustomTarget(n);
                  setTarget(n);
                }
              }
            }}
          >
            مخصص
          </Button>
        </div>
      </Card>

      {/* Selected form card */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-700 to-rose-950 opacity-5" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">
              {selected.reference}
            </Badge>
            {isComplete && (
              <Badge className="bg-emerald-500 text-white text-[10px]">
                <Check className="h-3 w-3 ml-1" />
                تم الهدف
              </Badge>
            )}
          </div>

          <div className="min-h-32 flex items-center justify-center text-center">
            <p className="quran-text text-xl md:text-2xl leading-loose">
              {selected.arabicText}
            </p>
          </div>

          {selected.virtue && (
            <p className="text-xs text-muted-foreground text-center italic border-t border-border pt-3">
              ✨ {selected.virtue}
            </p>
          )}

          {/* Counter */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="text-5xl md:text-6xl font-bold tabular-nums text-rose-700 dark:text-rose-500">
              {count}
            </div>
            <div className="text-sm text-muted-foreground">من {target}</div>
            <Progress value={progress} className="h-2 max-w-xs" />
          </div>

          {/* Tap button */}
          <Button
            onClick={handleTap}
            disabled={isComplete}
            className={cn(
              "w-full h-20 rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-[0.98]",
              isComplete
                ? "bg-emerald-500 hover:bg-emerald-500"
                : "bg-gradient-to-br from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white"
            )}
          >
            {isComplete ? (
              <>
                <Check className="h-6 w-6 ml-2" />
                أكملت الهدف
              </>
            ) : (
              <>
                <Heart className="h-6 w-6 ml-2" />
                اللهم صلِّ على محمد
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 ml-1" />
              تصفير
            </Button>
          </div>
        </div>
      </Card>

      {/* Other forms list */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">صيغ الصلاة على النبي ﷺ</h3>
        <div className="space-y-2">
          {SALAWAT_FORMS.map((form) => {
            const isOpen = openId === form.id;
            const isSelected = selectedId === form.id;
            return (
              <div
                key={form.id}
                className={cn(
                  "rounded-lg border transition-colors",
                  isSelected ? "border-rose-500/40 bg-rose-500/5" : "border-border"
                )}
              >
                <button
                  onClick={() => {
                    setOpenId(isOpen ? null : form.id);
                  }}
                  className="w-full flex items-center gap-2 p-3 text-right"
                >
                  <Heart className={cn("h-4 w-4 flex-shrink-0", isSelected && "fill-current text-rose-600")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{form.reference}</p>
                    <p className="text-sm font-medium truncate">
                      {form.arabicText.slice(0, 80)}...
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <div className="p-3 pt-0 space-y-2">
                    <p className="quran-text text-base leading-loose">
                      {form.arabicText}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      📖 {form.source}
                    </p>
                    {form.virtue && (
                      <p className="text-xs text-muted-foreground italic">
                        ✨ {form.virtue}
                      </p>
                    )}
                    {!isSelected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedId(form.id);
                          setOpenId(null);
                        }}
                      >
                        استخدام هذه الصيغة
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
