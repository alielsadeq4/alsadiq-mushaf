"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookMarked,
  RotateCcw,
  Plus,
  Minus,
  Check,
  GraduationCap,
  CalendarDays,
  Target,
  Trophy,
  ChevronLeft,
  Info,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SURAHS, getSurahById } from "@/data/surahs";
import { getHijriInfo } from "@/lib/hijri";

// ============================================================================
// الحفظ والختمة — tracker for Quran memorization + khatmah completion
// Storage: localStorage (device-only, privacy-first)
//   sadik:khatmah = { completedJuz: number[], startedAt: number }
//   sadik:hifdh   = { [surahId]: memorizedAyahCount }
// ============================================================================

const KHATMAH_KEY = "sadik:khatmah";
const HIFDH_KEY = "sadik:hifdh";
const TOTAL_AYAHS = 6236; // standard count of Quran ayahs
const TOTAL_PAGES = 604; // standard madani mushaf pages

interface KhatmahState {
  completedJuz: number[];
  startedAt: number;
}

interface HifdhState {
  [surahId: number]: number; // memorized ayah count per surah
}

function loadKhatmah(): KhatmahState {
  if (typeof window === "undefined") return { completedJuz: [], startedAt: Date.now() };
  try {
    const raw = localStorage.getItem(KHATMAH_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (Array.isArray(v?.completedJuz)) {
        return { completedJuz: v.completedJuz, startedAt: v.startedAt || Date.now() };
      }
    }
  } catch {
    // ignore
  }
  return { completedJuz: [], startedAt: Date.now() };
}

function loadHifdh(): HifdhState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HIFDH_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (v && typeof v === "object") return v;
    }
  } catch {
    // ignore
  }
  return {};
}

// Surah groups for memorization
const JUZ_AMMA_RANGE: [number, number] = [78, 114];
const QISAR_RANGE: [number, number] = [49, 114]; // المفصّل تقريبًا
const TAWAL_RANGE: [number, number] = [2, 7]; // السبع الطوال

type GroupFilter = "all" | "juz-amma" | "qisar" | "tawal";

const GROUP_LABELS: Record<GroupFilter, string> = {
  all: "كل السور",
  "juz-amma": "جزء عمّ",
  qisar: "السور القصيرة",
  tawal: "السبع الطوال",
};

function inGroup(surahId: number, group: GroupFilter): boolean {
  switch (group) {
    case "all":
      return true;
    case "juz-amma":
      return surahId >= JUZ_AMMA_RANGE[0] && surahId <= JUZ_AMMA_RANGE[1];
    case "qisar":
      return surahId >= QISAR_RANGE[0] && surahId <= QISAR_RANGE[1];
    case "tawal":
      return surahId >= TAWAL_RANGE[0] && surahId <= TAWAL_RANGE[1];
  }
}

const JUZ_NAMES: Record<number, string> = {
  1: "الآدم", 2: "سيقول", 3: "تلك الرسل", 4: "لن تنالوا", 5: "والمحصانات",
  6: "لا تحبوا", 7: "وإذا سمعوا", 8: "ولو أننا", 9: "قال الأتقى", 10: "اعلموا",
  11: "يعتذرون", 12: "وما من دابة", 13: "وما أبرئ", 14: "الرب", 15: "سبحان",
  16: "قال ألم", 17: "اقترب للناس", 18: "قد أفلح", 19: "وقال الذين", 20: "من هي",
  21: "اتل ما أوحي", 22: "ومن يقنت", 23: "وما لي", 24: "فمن أظلم", 25: "إليه يرد",
  26: "حم", 27: "قال فما", 28: "قد سمعنا", 29: "براء", 30: "عمّ يتساءلون",
};

export default function HifdhPage() {
  const [mounted, setMounted] = useState(false);
  const [khatmah, setKhatmah] = useState<KhatmahState>({ completedJuz: [], startedAt: Date.now() });
  const [hifdh, setHifdh] = useState<HifdhState>({});
  const [group, setGroup] = useState<GroupFilter>("juz-amma");
  const [search, setSearch] = useState("");
  const [dialogSurah, setDialogSurah] = useState<number | null>(null);
  const [dialogCount, setDialogCount] = useState(0);
  const [paceDays, setPaceDays] = useState<number>(30);

  useEffect(() => {
    setMounted(true);
    setKhatmah(loadKhatmah());
    setHifdh(loadHifdh());
  }, []);

  const persistKhatmah = useCallback((next: KhatmahState) => {
    setKhatmah(next);
    try {
      localStorage.setItem(KHATMAH_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const persistHifdh = useCallback((next: HifdhState) => {
    setHifdh(next);
    try {
      localStorage.setItem(HIFDH_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  // ================= Khatmah logic =================
  const toggleJuz = (juz: number) => {
    const next = { ...khatmah };
    if (next.completedJuz.includes(juz)) {
      next.completedJuz = next.completedJuz.filter((j) => j !== juz);
    } else {
      next.completedJuz = [...next.completedJuz, juz].sort((a, b) => a - b);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(50);
    }
    persistKhatmah(next);
  };

  const khatmahProgress = khatmah.completedJuz.length / 30;

  // Pace calculator: paceDays = days for a full khatmah → days per juz = paceDays / 30
  const estimate = useMemo(() => {
    const remaining = 30 - khatmah.completedJuz.length;
    if (remaining === 0) return null;
    const daysPerJuz = paceDays / 30;
    const totalDays = Math.ceil(remaining * daysPerJuz);
    const finish = new Date();
    finish.setDate(finish.getDate() + totalDays);
    const pagesPerDay = Math.max(1, Math.round((TOTAL_PAGES * (1 - khatmahProgress)) / Math.max(1, totalDays)));
    return { remaining, totalDays, finishDate: finish, pagesPerDay };
  }, [khatmah.completedJuz.length, khatmahProgress, paceDays]);

  const resetKhatmah = () => {
    persistKhatmah({ completedJuz: [], startedAt: Date.now() });
    toast.success("بدأنا ختمة جديدة — بارك الله فيك، وفقك الله لختمها");
  };

  // ================= Hifdh logic =================
  const hifdhTotals = useMemo(() => {
    let totalMemorized = 0;
    let fullSurahs = 0;
    for (const s of SURAHS) {
      const count = hifdh[s.id] || 0;
      totalMemorized += count;
      if (count >= s.ayahCount) fullSurahs++;
    }
    return { totalMemorized, fullSurahs, pct: (totalMemorized / TOTAL_AYAHS) * 100 };
  }, [hifdh]);

  const filteredSurahs = useMemo(() => {
    const term = search.trim();
    return SURAHS.filter((s) => {
      if (term && !(s.name.includes(term) || s.nameLatin.toLowerCase().includes(term.toLowerCase()) || String(s.id) === term)) {
        return false;
      }
      return inGroup(s.id, group);
    });
  }, [search, group]);

  const openSurahDialog = (surahId: number) => {
    const s = getSurahById(surahId);
    if (!s) return;
    setDialogSurah(surahId);
    setDialogCount(hifdh[surahId] || 0);
  };

  const saveDialogCount = () => {
    if (dialogSurah == null) return;
    const s = getSurahById(dialogSurah);
    if (!s) return;
    const clamped = Math.max(0, Math.min(s.ayahCount, dialogCount));
    const next = { ...hifdh, [dialogSurah]: clamped };
    if (clamped === 0) delete next[dialogSurah];
    persistHifdh(next);
    setDialogSurah(null);
    if (clamped >= s.ayahCount) {
      toast.success(`ما شاء الله — أتممت حفظ سورة ${s.name}، بارك الله فيك`);
    }
  };

  const bumpDialogCount = (delta: number) => {
    if (dialogSurah == null) return;
    const s = getSurahById(dialogSurah);
    if (!s) return;
    setDialogCount((c) => Math.max(0, Math.min(s.ayahCount, c + delta)));
  };

  const hijri = mounted ? getHijriInfo() : null;
  const dialogSurahData = dialogSurah != null ? getSurahById(dialogSurah) : null;

  if (!mounted) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        جارٍ تحميل الحفظ والختمة...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-6 text-center">
        <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20">
            <BookMarked className="h-6 w-6 text-gold" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-arabic)" }}>
            الحفظ والختمة
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            تتبّع ختمتك للقرآن الكريم وحفظك للسور — بياناتك على جهازك فقط
          </p>
          <p className="quran-text mt-3 text-lg text-gold">
            وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ
          </p>
        </div>
      </div>

      {/* Ramadan hint */}
      {hijri?.month === 9 && (
        <Card className="p-4 rounded-2xl border-gold/40 bg-gold/5">
          <p className="flex items-center gap-2 text-sm text-accent font-semibold">
            <Sparkles className="h-4 w-4" />
            رمضان شهر القرآن — أجعل لك وردًا يوميًا وأتمّ ختمتك في الشهر المبارك
          </p>
        </Card>
      )}

      <Tabs defaultValue="khatmah" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="khatmah" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            الختمة
          </TabsTrigger>
          <TabsTrigger value="hifdh" className="gap-1.5">
            <GraduationCap className="h-4 w-4" />
            الحفظ
          </TabsTrigger>
        </TabsList>

        {/* ================= KHATMAH TAB ================= */}
        <TabsContent value="khatmah" className="space-y-4 mt-4">
          {/* Progress overview */}
          <Card className="p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-lg">
                  {khatmah.completedJuz.length}{" "}
                  <span className="text-sm text-muted-foreground font-normal">من 30 جزءًا</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {khatmahProgress === 1
                    ? "أتممت الختمة — تقبّل الله، وابدأ ختمة جديدة"
                    : `متبقٍ ${30 - khatmah.completedJuz.length} جزءًا`}
                </p>
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {Math.round(khatmahProgress * 100)}%
                </p>
              </div>
            </div>
            <Progress value={khatmahProgress * 100} className="h-2.5" />

            {/* Pace calculator */}
            <div className="mt-5 rounded-xl border border-border bg-muted/20 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold mb-2.5">
                <Target className="h-3.5 w-3.5 text-accent" />
                احسب وردك اليومي
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {[30, 60, 90, 120, 180, 365].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPaceDays(d)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      paceDays === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    {d === 30 ? "شهر" : d === 60 ? "شهران" : `${d} يومًا`}
                  </button>
                ))}
              </div>
              {estimate && khatmahProgress > 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  بوتيرة ختمة كل <span className="font-semibold text-foreground">{paceDays} يومًا</span>:
                  تحتاج حوالي <span className="font-semibold text-accent">{estimate.pagesPerDay} صفحة يوميًا</span>،
                  وتكمل الأجزاء المتبقية خلال{" "}
                  <span className="font-semibold text-accent">{estimate.totalDays} يومًا</span> بإذن الله.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {khatmahProgress === 0
                    ? "علّم أول جزء من الجدول بالأسفل لبدء حساب وتيرة الختمة."
                    : "أتممت كل الأجزاء — اختر ختمة جديدة وابدأ من جديد."}
                </p>
              )}
            </div>

            {/* Reset */}
            <div className="mt-4 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <RotateCcw className="h-3.5 w-3.5 ml-1" />
                    ختمة جديدة
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>بدء ختمة جديدة؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم تصفير تقدم الختمة الحالية ({khatmah.completedJuz.length} جزءًا مكتمل) والبدء من
                      الجزء الأول. لا يمكن التراجع.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={resetKhatmah}>نعم، ختمة جديدة</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>

          {/* 30 juz grid */}
          <Card className="p-5 rounded-2xl">
            <p className="text-sm font-semibold mb-3">الأجزاء الثلاثون — اضغط على الجزء عند إتمامه</p>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const done = khatmah.completedJuz.includes(juz);
                return (
                  <button
                    key={juz}
                    type="button"
                    onClick={() => toggleJuz(juz)}
                    title={`الجزء ${juz} — ${JUZ_NAMES[juz] || ""}`}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 transition-all active:scale-95",
                      done
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card border-border hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    {done && (
                      <span className="absolute top-1 left-1">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className={cn("text-sm font-bold tabular-nums", done && "text-primary-foreground")}>
                      {juz}
                    </span>
                    <span
                      className={cn(
                        "text-[8px] leading-tight mt-0.5 truncate w-full text-center",
                        done ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {JUZ_NAMES[juz]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              التسمية التقليدية للأجزاء مأخوذة من أوائل السور وفق الترقيم المصحفي المعتاد.
              للاستماع لأي جزء: افتح القرآن واختر سورًا من هذا الجزء.
            </p>
          </Card>

          {/* Quick listen links for juz */}
          <Card className="p-5 rounded-2xl">
            <p className="text-sm font-semibold mb-1">استمع لجزء معين</p>
            <p className="text-xs text-muted-foreground mb-3">
              روابط سريعة لأول سورة من أشهر الأجزاء — يمكنك متابعة التسميع منها
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 18, 29, 30].map((juz) => {
                const surahId = juz === 1 ? 1 : juz === 18 ? 23 : juz === 29 ? 67 : 78;
                const s = getSurahById(surahId);
                if (!s) return null;
                return (
                  <Link key={juz} href={`/quran/${s.id}`} className="group">
                    <Badge
                      variant="secondary"
                      className="cursor-pointer py-1.5 px-3 gap-1 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                    >
                      الجزء {juz} — سورة {s.name}
                      <ChevronLeft className="h-3 w-3" />
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* ================= HIFDH TAB ================= */}
        <TabsContent value="hifdh" className="space-y-4 mt-4">
          {/* Stats overview */}
          <Card className="p-5 rounded-2xl">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold tabular-nums text-primary">
                  {hifdhTotals.totalMemorized.toLocaleString("ar-EG")}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">آية محفوظة</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-accent">{hifdhTotals.pct.toFixed(1)}%</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">من القرآن (٦٢٣٦ آية)</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-primary">{hifdhTotals.fullSurahs}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">سورة مكتملة الحفظ</p>
              </div>
            </div>
            <Progress value={hifdhTotals.pct} className="h-2 mt-4" />
            {hifdhTotals.fullSurahs > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-accent">
                <Trophy className="h-3.5 w-3.5" />
                ما شاء الله — أنجزت {hifdhTotals.fullSurahs}{" "}
                {hifdhTotals.fullSurahs === 1 ? "سورة" : "سور"} كاملة. زيد فيها.
              </p>
            )}
          </Card>

          {/* Filters */}
          <Card className="p-4 rounded-2xl">
            <Input
              placeholder="ابحث عن سورة بالاسم أو الرقم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GROUP_LABELS) as GroupFilter[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    group === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {GROUP_LABELS[g]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              جزء عمّ مثالي لبدء الحفظ — سور قصيرة يسهل إتمامها ثم الانتقال لما بعدها.
            </p>
          </Card>

          {/* Surah grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredSurahs.map((s) => {
              const count = hifdh[s.id] || 0;
              const pct = (count / s.ayahCount) * 100;
              const done = count >= s.ayahCount;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openSurahDialog(s.id)}
                  className={cn(
                    "text-right rounded-xl border p-3 transition-all hover:shadow-md active:scale-[0.98]",
                    done
                      ? "border-primary/50 bg-primary/5"
                      : count > 0
                        ? "border-gold/40 bg-gold/5"
                        : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0",
                        done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.id}
                    </span>
                    <p className="font-semibold text-sm quran-text flex-1 truncate">سورة {s.name}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
                      {count}/{s.ayahCount}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", done ? "bg-primary" : "bg-gold")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {done && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-semibold">
                      <Check className="h-3 w-3" />
                      محفوظة كاملة
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          {filteredSurahs.length === 0 && (
            <Card className="p-6 text-center rounded-2xl">
              <p className="text-sm text-muted-foreground">لا توجد سور مطابقة لبحثك</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ================= SURAH MEMORIZATION DIALOG ================= */}
      <Dialog open={dialogSurah != null} onOpenChange={(open) => !open && setDialogSurah(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              حفظ سورة {dialogSurahData?.name}
            </DialogTitle>
            <DialogDescription>
              حدّد عدد الآيات التي حفظتها من هذه السورة — يُحفظ على جهازك تلقائيًا.
            </DialogDescription>
          </DialogHeader>

          {dialogSurahData && (
            <>
              <div className="flex items-center justify-center gap-3 py-2">
                <Button variant="outline" size="icon" onClick={() => bumpDialogCount(-1)} aria-label="إنقاص">
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-24">
                  <p className="text-3xl font-bold tabular-nums text-primary" dir="ltr">
                    {dialogCount} / {dialogSurahData.ayahCount}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">آية محفوظة</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => bumpDialogCount(1)} aria-label="زيادة">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                type="number"
                min={0}
                max={dialogSurahData.ayahCount}
                value={dialogCount}
                onChange={(e) =>
                  setDialogCount(
                    Math.max(0, Math.min(dialogSurahData.ayahCount, parseInt(e.target.value) || 0))
                  )
                }
                className="text-center"
              />
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                نصيحة: استخدم وضع التسميع في صفحة السورة لتكرار الآيات مع وقفة — أسرع طريقة للحفظ
                بإذن الله.
              </div>
              <div className="flex flex-wrap gap-2 justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/quran/${dialogSurahData.id}`} onClick={() => setDialogSurah(null)}>
                    افتح السورة والنص
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogSurah(null)}>
                    إلغاء
                  </Button>
                  <Button onClick={saveDialogCount} className="bg-primary hover:bg-primary/90">
                    <Check className="h-4 w-4 ml-1" />
                    حفظ التقدم
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
