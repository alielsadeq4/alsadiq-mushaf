"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  ChevronLeft,
  GraduationCap,
  Baby,
  ShieldCheck,
  Star,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSurahById } from "@/data/surahs";
import { RECITERS } from "@/data/reciters";
import { playSurah } from "@/lib/audio/playback";
import { usePlayerStore } from "@/stores/player";

// ============================================================================
// سور للأطفال — curated short surahs for young hearts
// Only authentic, well-documented narrations are cited (see `virtue.source`).
// Neutral descriptions are used when no sound narration exists.
// ============================================================================

interface KidSurah {
  id: number;
  level: "start" | "easy" | "next";
  note: string;
  virtue?: {
    text: string;
    source: string;
  };
}

// مواضع موثقة فقط:
// - الفاتحة: "أعظم سورة في القرآن" — رواه البخاري (باب فضل الفاتحة)
// - الإخلاص: "تعدل ثلث القرآن" — متفق عليه (البخاري ومسلم)
// - المعوذتان (الفلق والناس): "كان ﷺ يعوّذ الحسن والحسين بهما" — رواه أبو داود والترمذي
const KID_SURAHS: KidSurah[] = [
  {
    id: 1,
    level: "start",
    note: "أول سورة نتعلمها — نقرؤها في كل صلاة",
    virtue: {
      text: "أعظم سورة في القرآن",
      source: "رواه البخاري",
    },
  },
  {
    id: 112,
    level: "start",
    note: "ثلاث آيات قصيرة نحفظها بسهولة — نتحدث عن الله بالكلمة الجميلة",
    virtue: {
      text: "تعدل ثلث القرآن",
      source: "متفق عليه — البخاري ومسلم",
    },
  },
  {
    id: 113,
    level: "start",
    note: "نعوذ بالله من كل خوف — سورة قصيرة ننام بعدها مطمئنين",
    virtue: {
      text: "كان النبي ﷺ يعوّذ الحسن والحسين بالمعوذتين",
      source: "رواه أبو داود والترمذي",
    },
  },
  {
    id: 114,
    level: "start",
    note: "أخير سور القرآن — نطلب الحماية من الشر",
    virtue: {
      text: "من المعوذتين التي كان النبي ﷺ يعوّذ بها أبناءه",
      source: "رواه أبو داود والترمذي",
    },
  },
  { id: 108, level: "easy", note: "أقصر سورة في القرآن — ثلاث آيات فقط" },
  { id: 103, level: "easy", note: "الوقت ذهب — سرعة العمر عبرها" },
  { id: 105, level: "easy", note: "قصة الفيل — كيف حمى الله بيت مكة" },
  { id: 106, level: "easy", note: "قصة قريش — رحلة الشتاء والصيف" },
  { id: 107, level: "easy", note: "عن الأخلاق الطيبة والصلاة" },
  { id: 109, level: "easy", note: "نحترم الآخرين ونقول كلماتنا بهدوء" },
  { id: 110, level: "easy", note: "سورة الفتح والنصر — آخر ما قرأه النبي ﷺ في عمره المبارك" },
  { id: 97, level: "easy", note: "ليلة القدر — خير من ألف شهر" },
  { id: 99, level: "easy", note: "عن يوم القيامة بلغة بسيطة" },
  { id: 100, level: "next", note: "العاديات — قسمة قصيرة للإصغاء" },
  { id: 102, level: "next", note: "التكاثر — ليهتم بالأهم والأبقى" },
  { id: 104, level: "next", note: "الهمزة — عذاب القول السيئ والسخرية" },
  { id: 111, level: "next", note: "المسد — قصة أبي لهب باختصار" },
  { id: 96, level: "next", note: "العلق — أول ما نزل من القرآن: اقرأ وتعلم" },
];

const LEVEL_LABELS: Record<KidSurah["level"], { label: string; className: string }> = {
  start: { label: "ابدأ من هنا", className: "bg-primary text-primary-foreground" },
  easy: { label: "قصيرة وسهلة", className: "bg-gold/20 text-accent" },
  next: { label: "الخطوة التالية", className: "bg-muted text-muted-foreground" },
};

const LEVEL_ORDER: KidSurah["level"][] = ["start", "easy", "next"];

export default function KidsPage() {
  const reciterId = usePlayerStore((s) => s.reciterId);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const handlePlay = (surahId: number) => {
    const s = getSurahById(surahId);
    if (!s) return;
    setPlayingId(surahId);
    void playSurah(surahId, reciterId);
    toast.success(`تشغيل سورة ${s.name} — ${RECITERS.find((r) => r.id === reciterId)?.arabicName || ""}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-6 text-center">
        <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20">
            <Baby className="h-6 w-6 text-gold" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-arabic)" }}>
            سور للصغار
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            سور قصيرة محبوبة مرتبة بمستويات — استمع وكرر واحفظ بإذن الله
          </p>
          <p className="quran-text mt-3 text-lg text-gold">
            وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
          </p>
          <p className="mt-1 text-[11px] text-primary-foreground/50">
            سورة المزمل — الآية ٤
          </p>
        </div>
      </div>

      {/* Parent guidance */}
      <Card className="p-4 rounded-2xl border-gold/40 bg-gold/5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">للأم والآب</p>
            <ul className="mt-1 text-xs text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>اجعل الجلسة قصيرة (٥–١٠ دقائق) وممتعة بلا إلزام.</li>
              <li>استخدم وضع التسميع داخل كل سورة لتكرار الآية عدة مرات مع وقفة.</li>
              <li>الاستماع اليومي للقارئ نفسه يساعد الطفل على التثبيت.</li>
              <li>كل المحتوى هنا سور قرآنية أصلية — وفوائد مذكورة بمصادر موثقة فقط.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Surah cards by level */}
      {LEVEL_ORDER.map((level) => {
        const items = KID_SURAHS.filter((k) => k.level === level);
        if (items.length === 0) return null;
        const meta = LEVEL_LABELS[level];
        return (
          <section key={level}>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={cn("rounded-full px-3 py-1 text-xs", meta.className)}>
                {meta.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{items.length} سور</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((kid) => {
                const s = getSurahById(kid.id);
                if (!s) return null;
                const isPlaying = playingId === kid.id;
                return (
                  <Card
                    key={kid.id}
                    className={cn(
                      "p-4 rounded-2xl transition-all hover:shadow-lg hover:border-primary/40",
                      isPlaying && "ring-2 ring-gold/60 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Play button */}
                      <button
                        type="button"
                        onClick={() => handlePlay(kid.id)}
                        aria-label={`تشغيل سورة ${s.name}`}
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-burgundy to-gold shadow-md active:scale-95 transition-transform"
                      >
                        <Play className="h-5 w-5 text-primary-foreground fill-current" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold quran-text text-lg">{s.name}</h3>
                          <span className="text-[10px] text-muted-foreground">
                            {s.ayahCount} آية
                          </span>
                          {isPlaying && (
                            <Badge variant="secondary" className="text-[9px] py-0.5">
                              قيد التلاوة
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {kid.note}
                        </p>
                        {kid.virtue && (
                          <p className="mt-2 flex items-start gap-1 rounded-lg bg-muted/40 px-2 py-1.5 text-[11px] text-accent leading-relaxed">
                            <Star className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span>
                              {kid.virtue.text}
                              <span className="text-muted-foreground"> — {kid.virtue.source}</span>
                            </span>
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center gap-2">
                          <Button asChild size="sm" variant="outline" className="h-8 gap-1">
                            <Link href={`/quran/${s.id}`}>
                              <GraduationCap className="h-3.5 w-3.5 text-accent" />
                              وضع التسميع
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground">
                            <Link href={`/quran/${s.id}`}>
                              النص الكامل
                              <ChevronLeft className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Footer note */}
      <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
        <Info className="h-3.5 w-3.5" />
        الفوائد المذكورة موثقة بأصح روايات معروفة — وما لم يثبت لم تُذكر له فضيلة مفتراة.
      </p>
    </div>
  );
}
