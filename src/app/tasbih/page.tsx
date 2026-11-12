"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Vibrate, Trophy, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Digital Tasbih counter — all data stays on device (localStorage)

const STORAGE_KEY = "sadik:tasbih";

interface TasbihState {
  totalCount: number; // lifetime dhikr count
  rounds: number; // completed sets
}

interface Preset {
  id: string;
  label: string;
  dhikr: string;
  target: number;
  source?: string;
}

const PRESETS: Preset[] = [
  { id: "subhan", label: "سبحان الله", dhikr: "سُبْحَانَ اللَّهِ", target: 33 },
  { id: "hamd", label: "الحمد لله", dhikr: "الْحَمْدُ لِلَّهِ", target: 33 },
  { id: "akbar", label: "الله أكبر", dhikr: "اللَّهُ أَكْبَرُ", target: 34 },
  {
    id: "tahlil",
    label: "لا إله إلا الله",
    dhikr: "لَا إِلَهَ إِلَّا اللَّهُ",
    target: 100,
    source: "متفق عليه — البخاري ومسلم",
  },
  {
    id: "istighfar",
    label: "أستغفر الله",
    dhikr: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    target: 100,
  },
  {
    id: "salawat",
    label: "الصلاة على النبي",
    dhikr: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّد",
    target: 100,
  },
  { id: "free", label: "عدّاد حر", dhikr: "اذكر الله كما تحب", target: 0 },
];

function loadState(): TasbihState {
  if (typeof window === "undefined") return { totalCount: 0, rounds: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { totalCount: 0, rounds: 0, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { totalCount: 0, rounds: 0 };
}

export default function TasbihPage() {
  const [presetId, setPresetId] = useState<string>("subhan");
  const [count, setCount] = useState(0);
  const [state, setState] = useState<TasbihState>({ totalCount: 0, rounds: 0 });
  const [mounted, setMounted] = useState(false);

  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  const target = preset.target;
  const progress = target > 0 ? Math.min(1, count / target) : 0;

  useEffect(() => {
    setMounted(true);
    setState(loadState());
    try {
      const savedPreset = localStorage.getItem(`${STORAGE_KEY}:preset`);
      if (savedPreset && PRESETS.some((p) => p.id === savedPreset)) {
        setPresetId(savedPreset);
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((next: TasbihState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  // Persist whenever totals change
  useEffect(() => {
    if (mounted) persist(state);
  }, [state, mounted, persist]);

  const selectPreset = (id: string) => {
    setPresetId(id);
    setCount(0);
    try {
      localStorage.setItem(`${STORAGE_KEY}:preset`, id);
    } catch {
      // ignore
    }
  };

  // Functional updates — rapid taps are never lost
  const tap = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(60);
    }
    setCount((c) => c + 1);
    setState((s) => ({ ...s, totalCount: s.totalCount + 1 }));
  };

  // Completion: when count reaches target → count a round and reset
  useEffect(() => {
    if (target <= 0 || count < target) return;
    setCount(0);
    setState((s) => ({ ...s, rounds: s.rounds + 1 }));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 80, 200]);
    }
    toast.success(`اكتمل العدد — ${target} ${preset.label} بارك الله فيك`);
  }, [count, target, preset.label]);

  const undo = () => {
    setCount((c) => Math.max(0, c - 1));
    setState((s) => ({ ...s, totalCount: Math.max(0, s.totalCount - 1) }));
  };

  const resetCount = () => {
    setCount(0);
    toast.info("تم تصفير العداد الحالي");
  };

  // Circumference for progress ring (r = 46 in a 100-unit viewBox)
  const CIRC = 2 * Math.PI * 46;

  if (!mounted) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        جارٍ تحميل السبحة...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">السبحة الرقمية</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          عدّاد الأذكار — بياناتك محفوظة على جهازك فقط
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPreset(p.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              p.id === presetId
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {p.label}
            {p.target > 0 && (
              <span className="mr-1 text-[10px] opacity-70">({p.target})</span>
            )}
          </button>
        ))}
      </div>

      {/* Counter circle */}
      <Card className="p-6 rounded-2xl">
        <p className="quran-text text-center text-2xl md:text-3xl text-primary mb-6 min-h-10">
          {preset.dhikr}
        </p>
        {preset.source && (
          <p className="text-center text-[11px] text-muted-foreground -mt-4 mb-4">
            {preset.source}
          </p>
        )}

        <div className="relative mx-auto w-56 h-56 select-none" dir="ltr">
          {/* Progress ring */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="6"
            />
            {target > 0 && (
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
                className="transition-all duration-200"
              />
            )}
          </svg>

          {/* Tap button */}
          <button
            type="button"
            onClick={tap}
            aria-label="عدّ"
            className="absolute inset-2 rounded-full bg-gradient-to-br from-burgundy to-burgundy/90 text-primary-foreground flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-6xl font-bold tabular-nums">{count}</span>
            <span className="mt-1 text-xs opacity-70">
              {target > 0 ? `من ${target}` : "اضغط للعدّ"}
            </span>
          </button>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={undo} title="تراجع">
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetCount} title="تصفير">
            <RotateCcw className="h-4 w-4 ml-1" />
            تصفير
          </Button>
          <Badge variant="secondary" className="text-xs gap-1 py-1.5">
            <Vibrate className="h-3 w-3" />
            اهتزاز عند الاكتمال
          </Badge>
        </div>
      </Card>

      {/* Lifetime totals */}
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">إجمالي ما سبق</p>
            <p className="text-xs text-muted-foreground">محفوظ على جهازك — لا يُرسل لأي مكان</p>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold tabular-nums text-primary">
              {state.totalCount.toLocaleString("ar-EG")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              دورات مكتملة: {state.rounds.toLocaleString("ar-EG")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
