"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Shield,
  Sunrise,
  Moon,
  MoonStar,
  Heart,
  Play,
  ChevronLeft,
  Clock,
  Search,
  WifiOff,
  UserX,
  ScanEye,
  AudioLines,
  ListMusic,
  Hand,
  Sparkles,
  Library,
  BookMarked,
  Baby,
  CircleDot,
  Compass,
  BellRing,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLibraryStore } from "@/stores/library";
import { usePlayerStore } from "@/stores/player";
import { getAudioEngine } from "@/lib/audio/engine";
import { buildSurahTrack } from "@/lib/providers/contentProvider";
import { playSurah } from "@/lib/audio/playback";
import { SURAHS } from "@/data/surahs";
import { getRamadanStatus, type RamadanStatus } from "@/lib/hijri";

const SECTION_ITEMS = [
  {
    href: "/quran",
    title: "القرآن الكريم",
    desc: "114 سورة كاملة آيةً آية، بأصوات نخبة من القراء المتقنين",
    icon: BookOpen,
    tint: "from-burgundy to-gold",
  },
  {
    href: "/ruqyah",
    title: "الرقية الشرعية",
    desc: "رقى موثقة من الكتاب والسنة — آيات الحفظ والشفا",
    icon: Shield,
    tint: "from-emerald-700 to-emerald-900",
  },
  {
    href: "/morning",
    title: "أذكار الصباح",
    desc: "حصن المسلم — ورد يومك بترتيب وأذكار موثقة",
    icon: Sunrise,
    tint: "from-amber-500 to-orange-700",
  },
  {
    href: "/evening",
    title: "أذكار المساء",
    desc: "حصن المسلم — ورد آخر يومك قبل النوم",
    icon: Moon,
    tint: "from-indigo-700 to-purple-900",
  },
  {
    href: "/salawat",
    title: "الصلاة على النبي ﷺ",
    desc: "عشر صيغ موثقة بعدّاد سهل وإحصاء لما سبق",
    icon: Heart,
    tint: "from-rose-600 to-rose-900",
  },
  {
    href: "/after-prayer",
    title: "أذكار بعد كل صلاة",
    desc: "أذكار التسليم المشتركة وزيادات الفجر والمغرب — موثقة من مسلم وغيره",
    icon: BellRing,
    tint: "from-teal-700 to-teal-900",
  },
  {
    href: "/names",
    title: "أسماء الله الحسنى",
    desc: "تسعة وتسعون اسمًا بمعانٍ مختصرة وسبحة لكل اسم محفوظة على جهازك",
    icon: Sparkles,
    tint: "from-gold to-burgundy",
  },
  {
    href: "/adhkar-misc",
    title: "أذكار متنوعة",
    desc: "النوم والاستيقاظ والمنزل والطعام والسفر والكرب والاستخارة — من حصن المسلم",
    icon: ListChecks,
    tint: "from-emerald-700 to-emerald-900",
  },
];

const FEATURES = [
  {
    icon: AudioLines,
    title: "تلاوات خالصة وموثوقة",
    desc: "التسجيلات من QuranicAudio المجانية، والنص عثماني من قطر — بدون أي إعلانات أو مقاطع مزعجة.",
  },
  {
    icon: WifiOff,
    title: "يعمل بدون إنترنت",
    desc: "نزّل أي سورة أو رقية واستمع إليها لاحقًا دون اتصال — كل النصوص مخزنة داخل التطبيق.",
  },
  {
    icon: UserX,
    title: "بلا حساب ولا تتبع",
    desc: "لا تسجيل ولا بريد ولا كوكيز تتبع. بياناتك (مكتبتك وسجلك) تبقى على جهازك فقط.",
  },
  {
    icon: ScanEye,
    title: "النص يتبع التلاوة",
    desc: "اقرأ مع التلاوة — تُميَّز الآية الجارية وتُتابع الشاشة تلقائيًا، مع تفسير ميسر لكل آية.",
  },
];

const STEPS = [
  {
    icon: ListMusic,
    title: "اختر ما تريد",
    desc: "سورة، رقية، ورد أذكار، أو صلاة على النبي ﷺ — كل الأقسام على الشاشة الرئيسية.",
  },
  {
    icon: AudioLines,
    title: "اختر القارئ",
    desc: "عشرة قراء متاحون بجودة عالية، وبديل تلقائي إن تعذر أحد المصادر.",
  },
  {
    icon: Hand,
    title: "استمع واقرأ معنا",
    desc: "اضغط تشغيل وسيتبع النص الصوت آيةً آية، وأضف ما تحب إلى مكتبتك للعودة إليه.",
  },
];

export default function HomePage() {
  const continueListening = useLibraryStore((s) => s.continueListening);
  const reciterId = usePlayerStore((s) => s.reciterId);

  // Ramadan mode banner — computed locally (Intl umalqura), once on mount
  const [ramadanStatus, setRamadanStatus] = useState<RamadanStatus | null>(null);
  useEffect(() => {
    setRamadanStatus(getRamadanStatus());
  }, []);

  const handleResume = () => {
    if (!continueListening) return;
    const engine = getAudioEngine();
    engine.playTrack({
      id: continueListening.trackId,
      title: continueListening.title,
      category: continueListening.category,
      contentType: "audio-clip",
      reciterOrSpeaker: continueListening.reciterOrSpeaker,
      audioUrl: continueListening.audioUrl,
      surahId: continueListening.surahId,
      ayahStart: continueListening.ayahStart,
      ayahEnd: continueListening.ayahEnd,
      downloadAllowed: false,
      verified: true,
    });
    // Seek to saved position after a brief delay
    setTimeout(() => {
      if (continueListening.currentTime > 5) {
        engine.seek(continueListening.currentTime);
      }
    }, 500);
  };

  return (
    <div className="animate-fade-in-up">
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground">
        <div className="absolute inset-0 pattern-arabesque opacity-25" aria-hidden="true" />
        {/* Soft gold glow */}
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 px-5 py-10 md:px-12 md:py-16 text-center">
          {/* Logo mark */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/90 to-gold/70 shadow-lg shadow-black/20">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 text-burgundy"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M12 4v16M4 6c2 0 4 1 8 2 4-1 6-2 8-2v12c-2 0-4 1-8 2-4-1-6-2-8-2V6z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "var(--font-arabic)" }}>
            الصادق
          </h1>
          <p className="mt-3 text-xs md:text-sm text-primary-foreground/70 font-medium">
            منصة الاستماع الإسلامي — من إعداد علي محمد الصادق
          </p>

          {/* Ayah in Amiri */}
          <p className="quran-text mt-6 text-2xl md:text-4xl leading-relaxed text-gold">
            وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ
          </p>
          <p className="mt-1 text-[11px] md:text-xs text-primary-foreground/50">
            سورة القمر — الآية ١٧
          </p>

          {/* Tagline */}
          <p className="mx-auto mt-6 max-w-xl text-sm md:text-lg text-primary-foreground/85 leading-relaxed">
            استمع إلى القرآن والرقية والأذكار — مصادر موثوقة، بلا حساب، بلا إعلانات
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => playSurah(1)}
              className="w-full sm:w-auto h-12 bg-gold text-burgundy hover:bg-gold/90 font-bold text-base shadow-lg shadow-black/20"
            >
              <Play className="h-5 w-5 ml-2 fill-current" />
              ابدأ الاستماع الآن
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 bg-transparent border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="#sections">
                استكشف الأقسام
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Link>
            </Button>
          </div>

          {/* Trust chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] md:text-xs text-primary-foreground/60">
            <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1">
              بلا إعلانات
            </span>
            <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1">
              بلا تتبع
            </span>
            <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1">
              بلا حساب
            </span>
            <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1">
              يعمل بدون إنترنت
            </span>
          </div>
        </div>
      </section>

      {/* ===================== STATS BAR ===================== */}
      <section className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { value: String(SURAHS.length), label: "سورة كاملة" },
          { value: "10", label: "قراء متقون" },
          { value: "99", label: "اسمًا لله الحسنى" },
          { value: "8", label: "أقسام أذكار ورقى" },
        ].map((s) => (
          <Card key={s.label} className="p-4 md:p-5 text-center rounded-2xl">
            <p className="text-2xl md:text-3xl font-bold text-primary tabular-nums" style={{ fontFamily: "var(--font-arabic)" }}>
              {s.value}
            </p>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </section>

      {/* ===================== RAMADAN BANNER (seasonal) ===================== */}
      {ramadanStatus && ramadanStatus.daysUntilRamadan > 0 && ramadanStatus.daysUntilRamadan <= 30 && (
        <Link href="/ramadan" className="block mt-4 group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-4">
            <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-3">
              <MoonStar className="h-6 w-6 text-gold flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  رمضان على الأبواب — متبقٍ {ramadanStatus.daysUntilRamadan}{" "}
                  {ramadanStatus.daysUntilRamadan === 1 ? "يوم" : "أيام"}
                </p>
                <p className="text-xs text-primary-foreground/70 mt-0.5">
                  استعد بختمة يومية وأذكار الإفطار — اضغط للمزيد
                </p>
              </div>
              <ChevronLeft className="h-5 w-5 text-gold group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </div>
        </Link>
      )}
      {ramadanStatus?.isRamadan && (
        <Link href="/ramadan" className="block mt-4 group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-4 border border-gold/40">
            <div className="absolute inset-0 pattern-arabesque opacity-25" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-3">
              <MoonStar className="h-6 w-6 text-gold flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  رمضان كريم — اليوم {ramadanStatus.ramadanDay} من الشهر المبارك
                </p>
                <p className="text-xs text-primary-foreground/70 mt-0.5">
                  شهر القرآن: ختمة يومية وأذكار الإفطار وفضل الصيام
                </p>
              </div>
              <ChevronLeft className="h-5 w-5 text-gold group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </div>
        </Link>
      )}

      {/* ===================== CONTINUE LISTENING ===================== */}
      {continueListening && (
        <section className="mt-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            متابعة الاستماع
          </h2>
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl" onClick={handleResume}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-burgundy to-gold flex items-center justify-center flex-shrink-0">
                <Play className="h-6 w-6 text-primary-foreground fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{continueListening.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {continueListening.reciterOrSpeaker}
                </p>
                {continueListening.currentTime > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gold"
                        style={{
                          width: `${
                            ((continueListening.currentTime || 0) /
                              (continueListening.duration || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
        </section>
      )}

      {/* ===================== FEATURES ===================== */}
      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-bold text-center">لماذا الصادق؟</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          تجربة استماع هادئة تحترم وقتك وخصوصيتك
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base">{f.title}</h3>
                <p className="mt-1.5 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===================== SECTIONS ===================== */}
      <section id="sections" className="mt-10 scroll-mt-20">
        <h2 className="text-xl md:text-2xl font-bold text-center">الأقسام</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          ثمانية أقسام، كل محتواها موثق بمصدره
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {SECTION_ITEMS.map((cat, idx) => {
            const Icon = cat.icon;
            const large = idx === 0;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className={large ? "md:col-span-3 lg:col-span-2 group" : "md:col-span-1 group"}
              >
                <Card className="relative overflow-hidden h-full p-5 rounded-2xl border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300 min-h-32">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.tint} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`rounded-2xl bg-gradient-to-br ${cat.tint} p-3 shadow-lg flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{cat.desc}</p>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===================== QUICK SURAH ACCESS ===================== */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">وصول سريع للسور</h2>
          <Link href="/quran" className="text-sm text-primary hover:underline">
            عرض كل السور
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 36, 55, 67, 18, 112, 113, 114].map((surahId) => {
            const track = buildSurahTrack(surahId, reciterId);
            if (!track) return null;
            return (
              <Card
                key={surahId}
                className="p-3 rounded-2xl hover:shadow-md hover:border-primary/40 cursor-pointer transition-all"
                onClick={() => playSurah(surahId)}
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-burgundy to-gold flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">
                      {surahId}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate quran-text">
                      {track.title.replace("سورة ", "")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">اضغط للتشغيل</p>
                  </div>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-bold text-center">كيف تعمل؟</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          ثلاث خطوات ولا شيء أكثر
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="rounded-2xl p-5 relative overflow-hidden">
                <span className="absolute top-3 left-4 text-4xl font-bold text-muted/70 select-none tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-bold text-sm md:text-base">{step.title}</h3>
                <p className="mt-1.5 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===================== SHORTCUTS ===================== */}
      <section className="mt-10 grid grid-cols-3 md:grid-cols-4 gap-3">
        {[
          { href: "/hifdh", icon: BookMarked, label: "الحفظ والختمة", sub: "تتبّع ختمتك وحفظك" },
          { href: "/kids", icon: Baby, label: "سور للصغار", sub: "قصيرة بمستويات" },
          { href: "/library", icon: Library, label: "مكتبتي", sub: "المفضلة والتنزيلات" },
          { href: "/library?tab=history", icon: Clock, label: "سجل الاستماع", sub: "آخر ما سمعت" },
          { href: "/tasbih", icon: CircleDot, label: "السبحة", sub: "عدّاد الأذكار" },
          { href: "/prayer-times", icon: Compass, label: "المواقيت", sub: "الصلوات والقبلة" },
          { href: "/after-prayer", icon: BellRing, label: "أذكار بعد الصلاة", sub: "تسليم كل صلاة" },
          { href: "/names", icon: Sparkles, label: "أسماء الله", sub: "٩٩ اسمًا بسبحة" },
          { href: "/adhkar-misc", icon: ListChecks, label: "أذكار متنوعة", sub: "مواقف يومك" },
          { href: "/ramadan", icon: MoonStar, label: "وضع رمضان", sub: "ختمة وعداد هجري" },
          { href: "/search", icon: Search, label: "البحث", sub: "ابحث في المنصة" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="p-4 rounded-2xl hover:shadow-md hover:border-primary/40 transition-all text-center h-full">
                <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs md:text-sm font-semibold">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="mt-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground text-center">
          <div className="absolute inset-0 pattern-arabesque opacity-25" aria-hidden="true" />
          <div className="relative z-10 px-6 py-10">
            <Sparkles className="h-6 w-6 text-gold mx-auto mb-3" aria-hidden="true" />
            <h2 className="text-xl md:text-2xl font-bold">
              جاهز تبدأ؟ الفاتحة على بُعد ضغطة واحدة
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-primary-foreground/75">
              لا تسجيل، لا إعلانات — فقط استماع هادئ في أي وقت
            </p>
            <Button
              size="lg"
              onClick={() => playSurah(1)}
              className="mt-6 h-12 bg-gold text-burgundy hover:bg-gold/90 font-bold text-base shadow-lg shadow-black/20"
            >
              <Play className="h-5 w-5 ml-2 fill-current" />
              ابدأ الاستماع الآن
            </Button>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          الصادق — منصة استماع إسلامية مجانية من إعداد علي محمد الصادق © 2026
        </p>
      </section>
    </div>
  );
}
