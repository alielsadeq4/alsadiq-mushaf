"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Moon,
  Sunrise,
  Sunset,
  CalendarDays,
  BookOpen,
  Sparkles,
  Clock,
  ChevronLeft,
  Landmark,
  PartyPopper,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getRamadanStatus, formatHijri, type RamadanStatus } from "@/lib/hijri";

// ============================================================================
// وضع رمضان — Ramadan mode
// كل النصوص الدينية هنا موثقة بمصادرها (الأحاديث: متفق عليه / أبو داود / الترمذي)
// الحساب الهجري محلي بالكامل عبر Intl (umalqura) — بلا أي API خارجي
// ============================================================================

interface DocumentedText {
  text: string;
  source: string;
}

const SIYAM_VIRTUE: DocumentedText[] = [
  {
    text: "«كل أعمال ابن آدم يُضاعف، الحسنة عشر أمثال إلى سبعمائة ضعف... والصوم لي وأنا أجزي به»",
    source: "متفق عليه — البخاري ومسلم",
  },
  {
    text: "«من صام رمضان إيمانًا واحتسابًا غُفر له ما تقدم من ذنبه»",
    source: "متفق عليه — البخاري ومسلم",
  },
  {
    text: "«من قام ليلة القدر إيمانًا واحتسابًا غُفر له ما تقدم من ذنبه»",
    source: "متفق عليه — البخاري ومسلم",
  },
];

const IFTAR_DUAS: DocumentedText[] = [
  {
    text: "«ذهب الظمأ، وابتلت العروق، وثبت الأجر إن شاء الله»",
    source: "رواه أبو داود",
  },
  {
    text: "«اللهم لك صمت وعلى رزقك أفطرت»",
    source: "رواه أبو داود",
  },
];

const LAYLATUL_QADR_DUA: DocumentedText = {
  text: "«اللهم إنك عفوٌّ تحب العفو فاعفُ عني»",
  source: "رواه الترمذي وابن ماجه — وقال الترمذي: حسن",
};

export default function RamadanPage() {
  const [status, setStatus] = useState<RamadanStatus | null>(null);

  useEffect(() => {
    setStatus(getRamadanStatus());
  }, []);

  const isRamadan = status?.isRamadan ?? false;
  const hijriText = status ? formatHijri(status.hijri) : "";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-8">
      {/* Header + countdown */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-6 text-center">
        <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20">
            <Moon className="h-6 w-6 text-gold" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-arabic)" }}>
            وضع رمضان
          </h1>
          {status && (
            <p className="mt-1 text-xs text-primary-foreground/60">{hijriText}</p>
          )}
          {status && !status.isRamadan && status.daysUntilRamadan > 0 && (
            <div className="mt-5 inline-flex flex-col items-center rounded-2xl border border-gold/40 bg-gold/10 px-8 py-4">
              <p className="text-xs text-primary-foreground/70">متبقٍ لبدء رمضان</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-gold" style={{ fontFamily: "var(--font-arabic)" }}>
                {status.daysUntilRamadan}
              </p>
              <p className="mt-1 text-xs text-primary-foreground/70">
                {status.daysUntilRamadan === 1 ? "يوم" : status.daysUntilRamadan === 2 ? "يومان" : "يومًا"}
              </p>
            </div>
          )}
          {isRamadan && (
            <div className="mt-5 inline-flex flex-col items-center rounded-2xl border border-gold/40 bg-gold/10 px-8 py-4">
              <p className="flex items-center gap-1.5 text-xs text-gold font-semibold">
                <PartyPopper className="h-3.5 w-3.5" />
                رمضان كريم — اليوم
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-gold" style={{ fontFamily: "var(--font-arabic)" }}>
                {status?.ramadanDay}
              </p>
              <p className="mt-1 text-xs text-primary-foreground/70">
                من رمضان {status?.hijri?.year} هـ
                {status?.ramadanDaysRemaining != null &&
                  status.ramadanDaysRemaining > 0 &&
                  ` • متبقٍ ${status.ramadanDaysRemaining} ${status.ramadanDaysRemaining === 1 ? "يوم" : status.ramadanDaysRemaining === 2 ? "يومان" : "أيام"}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ramadan khatmah plan */}
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="font-bold">ختمة رمضان</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ختمة كاملة في الشهر: جزء واحد يوميًا (حوالي ٢٠ صفحة أو ١٠–١٥ دقيقة استماع مضاعف).
          تتبّع أجزاءك يومًا بيوم من صفحة الحفظ والختمة.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link href="/hifdh">
              افتح تتبع الختمة
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/quran">
              استمع للقرآن
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* Iftar / Suhoor duas */}
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Sunset className="h-5 w-5 text-accent" />
          <h2 className="font-bold">عند الإفطار</h2>
        </div>
        <div className="space-y-3">
          {IFTAR_DUAS.map((d) => (
            <div key={d.text} className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="quran-text text-lg leading-relaxed text-foreground">{d.text}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{d.source}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 p-3">
          <Sunrise className="h-4 w-4 text-accent flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            لحظة الإفطار أوقاتٌ مستجابة للدعاء — فقد قدم الصائم دعاء عند فطره، فاجعلها لحظة حضور.
          </p>
        </div>
      </Card>

      {/* Virtues of fasting */}
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="h-5 w-5 text-primary" />
          <h2 className="font-bold">فضل الصيام والقيام</h2>
        </div>
        <div className="space-y-3">
          {SIYAM_VIRTUE.map((v) => (
            <div key={v.text} className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-sm leading-loose text-foreground">{v.text}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{v.source}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Laylatul Qadr */}
      <Card className="p-5 rounded-2xl border-gold/40 bg-gold/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-bold">ليلة القدر — العشر الأواخر</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          تحرّس ليلة القدر في العشر الأواخر من رمضان، وأكثر من هذا الدعاء الذي علّمه النبي ﷺ
          عائشة رضي الله عنها:
        </p>
        <div className="rounded-xl border border-gold/30 bg-card p-4 text-center">
          <p className="quran-text text-2xl leading-relaxed text-primary">
            {LAYLATUL_QADR_DUA.text}
          </p>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {LAYLATUL_QADR_DUA.source}
        </p>
      </Card>

      {/* Listen during Ramadan */}
      <Card className="p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-bold">ورد استماع سريع</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          اختصارات لسور تُعرف بقراءتها في رمضان — الكهف (الجمعة)، يس، والملك (قبل النوم):
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 18, label: "الكهف" },
            { id: 36, label: "يس" },
            { id: 67, label: "الملك" },
            { id: 55, label: "الرحمن" },
          ].map(({ id, label }) => (
            <Link key={id} href={`/quran/${id}`} className="group">
              <Badge
                variant="secondary"
                className="cursor-pointer py-1.5 px-3 gap-1 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
              >
                سورة {label}
                <ChevronLeft className="h-3 w-3" />
              </Badge>
            </Link>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          نصيحة: استخدم مؤقت النوم في المشغل للاستماع قبل النوم دون بقاء التلاوة طوال الليل.
        </p>
      </Card>

      {/* Footer */}
      <p className={cn("text-center text-[11px] text-muted-foreground")}>
        الحساب الهجري محلي عبر تقويم أم القرى (Intl) — وقد يختلف بيوم عن الرؤية الشرعية،
        فاعتمد الرؤية الموثقة في بلدك.
      </p>
    </div>
  );
}
