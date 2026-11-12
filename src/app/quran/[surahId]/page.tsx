"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Play,
  ArrowRight,
  ArrowLeft,
  Download,
  Heart,
  Plus,
  Loader2,
  CheckCircle,
  FileText,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSurahById } from "@/data/surahs";
import { RECITERS } from "@/data/reciters";
import { buildAyahTrack } from "@/lib/providers/contentProvider";
import {
  playSurah,
  playAyahRange,
  playAyahMemorization,
  playAyahRangeMemorization,
  stopMemorization,
} from "@/lib/audio/playback";
import { downloadSurah } from "@/lib/audio/downloads";
import { downloadsStorage } from "@/lib/storage";
import { useAudioEngineState } from "@/stores/player";
import { usePlayerStore } from "@/stores/player";
import { useLibraryStore } from "@/stores/library";
import { QuranTextView } from "@/components/quran/quran-text-view";
import { shareSurah } from "@/lib/share";
import { GraduationCap, Repeat, Square } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SurahDetailPage() {
  return (
    <Suspense fallback={<SurahDetailSkeleton />}>
      <SurahDetailContent />
    </Suspense>
  );
}

function SurahDetailSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="h-44 rounded-2xl bg-muted animate-pulse" />
      <div className="h-28 rounded-2xl bg-muted/70 animate-pulse" />
      <div className="h-64 rounded-2xl bg-muted/50 animate-pulse" />
    </div>
  );
}

function SurahDetailContent() {
  const params = useParams<{ surahId: string }>();
  const searchParams = useSearchParams();
  const surahId = parseInt(params.surahId, 10);
  const surah = getSurahById(surahId);

  // Deep link: /quran/2?ayah=255
  const deepLinkAyah = useMemo(() => {
    const raw = searchParams?.get("ayah");
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return 0;
    return Math.min(n, surah?.ayahCount || 1);
  }, [searchParams, surah?.ayahCount]);

  const reciterId = usePlayerStore((s) => s.reciterId);
  const setReciterId = usePlayerStore((s) => s.setReciterId);
  const addToQueue = useLibraryStore((s) => s.addToQueue);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const isFavorite = useLibraryStore((s) => s.isFavorite);

  // Track currently playing ayah for text sync
  const engine = useAudioEngineState();
  const currentEngineTrack = engine.getCurrentTrack();
  const currentPlayingAyah =
    currentEngineTrack?.surahId === surahId && currentEngineTrack?.ayahStart
      ? currentEngineTrack.ayahStart
      : 0;

  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(Math.min(7, surah?.ayahCount || 1));
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Memorization (Hifdh) mode state
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoFromAyah, setMemoFromAyah] = useState(1);
  const [memoToAyah, setMemoToAyah] = useState(1);
  const [memoRepeats, setMemoRepeats] = useState(5);
  const [memoPauseSec, setMemoPauseSec] = useState(0);
  const memo = engine.getMemorization();

  // Check if surah is downloaded
  useEffect(() => {
    const checkDownloaded = async () => {
      const all = await downloadsStorage.getAll();
      const surahAyahCount = surah?.ayahCount || 0;
      const matchingTracks = all.filter((d) => d.surahId === surahId);
      setDownloaded(matchingTracks.length >= surahAyahCount && surahAyahCount > 0);
    };
    checkDownloaded();
  }, [surahId, surah?.ayahCount, downloading]);

  const handleDownload = async () => {
    if (!surah) return;
    setDownloading(true);
    try {
      await downloadSurah(surahId, reciterId, surah.name);
      setDownloaded(true);
    } finally {
      setDownloading(false);
    }
  };

  if (!surah) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">السورة غير موجودة</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/quran">العودة للقرآن</Link>
        </Button>
      </div>
    );
  }

  // Build the full surah track (for display purposes)
  const surahTrack = useMemo(() => {
    return {
      id: `surah-${surahId}-${reciterId}`,
      title: `سورة ${surah.name}`,
      category: "quran" as const,
      contentType: "surah" as const,
      reciterOrSpeaker: RECITERS.find((r) => r.id === reciterId)?.arabicName || "",
      audioUrl: "",
      surahId,
      ayahStart: 1,
      ayahEnd: surah.ayahCount,
      downloadAllowed: true,
      verified: true,
    };
  }, [surahId, reciterId, surah]);

  const fav = isFavorite(surahTrack.id);

  const handlePlayRange = () => {
    if (fromAyah > toAyah) {
      playAyahRange(surahId, toAyah, fromAyah, reciterId);
    } else {
      playAyahRange(surahId, fromAyah, toAyah, reciterId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <Link
            href="/quran"
            className="inline-flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-sm mb-3"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للقرآن
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative h-14 w-14 flex-shrink-0">
              <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full text-primary-foreground/30">
                <path d="M24 2 L46 14 L46 34 L24 46 L2 34 L2 14 Z" fill="currentColor" stroke="none" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">{surah.id}</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold quran-text">{surah.name}</h1>
              <p className="text-primary-foreground/80 text-sm">
                {surah.nameLatin} — {surah.nameTranslation}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              {surah.ayahCount} آية
            </Badge>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              {surah.revelationType === "meccan" ? "مكية" : "مدنية"}
            </Badge>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              الجزء {surah.juzList.join("، ")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Play full surah */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">تشغيل السورة كاملة</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={reciterId} onValueChange={setReciterId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECITERS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.arabicName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => playSurah(surahId, reciterId)}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 ml-2" />
            تشغيل السورة كاملة
          </Button>
          <Button
            variant="outline"
            onClick={() => addToQueue(surahTrack)}
          >
            <Plus className="h-4 w-4 ml-1" />
            طابور
          </Button>
          <Button
            variant="outline"
            onClick={() => toggleFavorite(surahTrack)}
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-current text-primary" : ""}`} />
          </Button>
          <Button
            variant="outline"
            onClick={() => void shareSurah(surahId)}
            title="مشاركة رابط السورة"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant={downloaded ? "outline" : "default"}
            onClick={handleDownload}
            disabled={downloading}
            className={downloaded ? "border-emerald-500 text-emerald-600" : ""}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 ml-1 animate-spin" />
            ) : downloaded ? (
              <CheckCircle className="h-4 w-4 ml-1" />
            ) : (
              <Download className="h-4 w-4 ml-1" />
            )}
            {downloading ? "جاري التنزيل..." : downloaded ? "تم التنزيل" : "تنزيل للعمل offline"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          سيتم بناء قائمة انتظار من {surah.ayahCount} آية وتشغيلها بالترتيب تلقائيًا.
        </p>
      </Card>

      {/* Play ayah range */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">تشغيل مدى محدد من الآيات</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
          <div>
            <Label htmlFor="from-ayah" className="text-xs">من آية</Label>
            <Input
              id="from-ayah"
              type="number"
              min={1}
              max={surah.ayahCount}
              value={fromAyah}
              onChange={(e) => setFromAyah(Math.max(1, Math.min(surah.ayahCount, parseInt(e.target.value) || 1)))}
            />
          </div>
          <div>
            <Label htmlFor="to-ayah" className="text-xs">إلى آية</Label>
            <Input
              id="to-ayah"
              type="number"
              min={1}
              max={surah.ayahCount}
              value={toAyah}
              onChange={(e) => setToAyah(Math.max(1, Math.min(surah.ayahCount, parseInt(e.target.value) || 1)))}
            />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <Button
              onClick={handlePlayRange}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4 ml-2" />
              تشغيل المدى ({Math.abs(toAyah - fromAyah) + 1} آية)
            </Button>
          </div>
        </div>
      </Card>

      {/* Memorization (Hifdh) mode */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gold/15 p-2.5 flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">وضع التسميع والحفظ</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              كرّر آية أو مدى آيات عددًا محددًا مع فاصل صمت بين التكرارات — يعينك على
              الحفظ والتدبر. سيتقدم الصوت تلقائيًا للآية التالية بعد اكتمال العدد.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => {
                // Reset to sensible defaults for this surah
                setMemoFromAyah(1);
                setMemoToAyah(Math.min(1, surah.ayahCount));
                setMemoRepeats(5);
                setMemoPauseSec(0);
                setMemoOpen(true);
              }}>
                <GraduationCap className="h-4 w-4 ml-1" />
                ابدأ وضع التسميع
              </Button>
              {memo.enabled && (
                <>
                  <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
                    <Repeat className="h-3 w-3" />
                    مفعّل — {memo.currentCount + 1} / {memo.targetCount}
                    {memo.pauseMs > 0 && ` • وقفة ${Math.round(memo.pauseMs / 1000)}ث`}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopMemorization()}
                    className="text-destructive hover:text-destructive"
                  >
                    <Square className="h-3.5 w-3.5 ml-1" />
                    إيقاف الوضع
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Memorization dialog */}
      <Dialog open={memoOpen} onOpenChange={setMemoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              إعدادات وضع التسميع
            </DialogTitle>
            <DialogDescription>
              اختر مدى الآيات وعدد التكرارات والوقفة بينها. سيبدأ التشغيل فور تأكيدك.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label htmlFor="memo-from" className="text-xs">من آية</Label>
              <Input
                id="memo-from"
                type="number"
                min={1}
                max={surah.ayahCount}
                value={memoFromAyah}
                onChange={(e) =>
                  setMemoFromAyah(Math.max(1, Math.min(surah.ayahCount, parseInt(e.target.value) || 1)))
                }
              />
            </div>
            <div>
              <Label htmlFor="memo-to" className="text-xs">إلى آية</Label>
              <Input
                id="memo-to"
                type="number"
                min={1}
                max={surah.ayahCount}
                value={memoToAyah}
                onChange={(e) =>
                  setMemoToAyah(Math.max(1, Math.min(surah.ayahCount, parseInt(e.target.value) || 1)))
                }
              />
            </div>
            <div>
              <Label htmlFor="memo-repeats" className="text-xs">عدد التكرارات لكل آية</Label>
              <Input
                id="memo-repeats"
                type="number"
                min={1}
                max={100}
                value={memoRepeats}
                onChange={(e) =>
                  setMemoRepeats(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))
                }
              />
            </div>
            <div>
              <Label htmlFor="memo-pause" className="text-xs">الوقفة بين التكرارات (ثانية)</Label>
              <Input
                id="memo-pause"
                type="number"
                min={0}
                max={60}
                value={memoPauseSec}
                onChange={(e) =>
                  setMemoPauseSec(Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))
                }
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">ملاحظات:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>القارئ الحالي: {RECITERS.find((r) => r.id === reciterId)?.arabicName || "—"}</li>
              <li>إذا كان "من = إلى" سيتم تكرار آية واحدة فقط.</li>
              <li>وقفة 0 = إعادة فورية دون صمت. جرب 2-3 ثوانٍ للحفظ.</li>
              <li>يمكنك إيقاف الوضع من هنا أو من شارة التسميع في المشغل.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setMemoOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                const from = Math.min(memoFromAyah, memoToAyah);
                const to = Math.max(memoFromAyah, memoToAyah);
                if (from === to) {
                  void playAyahMemorization(surahId, from, reciterId, memoRepeats, memoPauseSec);
                } else {
                  void playAyahRangeMemorization(surahId, from, to, reciterId, memoRepeats, memoPauseSec);
                }
                setMemoOpen(false);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <GraduationCap className="h-4 w-4 ml-1" />
              ابدأ التسميع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ayahs list */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">الآيات ({surah.ayahCount})</h3>
        <p className="text-xs text-muted-foreground mb-3">
          اضغط على أي آية لتشغيلها من هذه الآية إلى نهاية السورة
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((ayahNum) => {
            const track = buildAyahTrack(surahId, ayahNum, reciterId);
            if (!track) return null;
            return (
              <button
                key={ayahNum}
                onClick={() => playAyahRange(surahId, ayahNum, surah.ayahCount, reciterId)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-right group"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold flex-shrink-0">
                  {ayahNum}
                </span>
                <span className="text-xs text-muted-foreground truncate flex-1">
                  آية {ayahNum}
                </span>
                <Play className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </Card>

      {/* Quran text with audio sync */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">
            نص السورة {currentPlayingAyah > 0 && `(الآية ${currentPlayingAyah} قيد التلاوة)`}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          نص المصحف عثماني متزامن مع الصوت — تُميَّز الآية الجاري تلاوتها تلقائيًا وتُتبع أثناء التشغيل
        </p>
        <QuranTextView
          surahId={surahId}
          currentAyah={currentPlayingAyah}
          initialAyah={deepLinkAyah}
          autoScroll
          onPlayAyah={(ayah) => playAyahRange(surahId, ayah, surah.ayahCount, reciterId)}
        />
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        {surahId > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/quran/${surahId - 1}`}>
              <ArrowRight className="h-4 w-4 ml-1" />
              السورة السابقة
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {surahId < 114 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/quran/${surahId + 1}`}>
              السورة التالية
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Link>
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
