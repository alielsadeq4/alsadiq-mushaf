"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Play, Download, BookOpen, Filter, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SURAHS, JUZ_LIST, getSurahsByJuz } from "@/data/surahs";
import { RECITERS } from "@/data/reciters";
import { buildSurahTrack } from "@/lib/providers/contentProvider";
import { getAudioEngine } from "@/lib/audio/engine";
import { playSurah } from "@/lib/audio/playback";
import { usePlayerStore } from "@/stores/player";
import { useLibraryStore } from "@/stores/library";

export default function QuranPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "meccan" | "medinan">("all");
  const [browseMode, setBrowseMode] = useState<"surah" | "juz">("surah");
  const [selectedJuz, setSelectedJuz] = useState(1);
  const reciterId = usePlayerStore((s) => s.reciterId);
  const setReciterId = usePlayerStore((s) => s.setReciterId);
  const addToQueue = useLibraryStore((s) => s.addToQueue);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const isFavorite = useLibraryStore((s) => s.isFavorite);

  const filteredSurahs = useMemo(() => {
    return SURAHS.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.includes(query) ||
        s.nameLatin.toLowerCase().includes(query.toLowerCase()) ||
        s.nameTranslation.toLowerCase().includes(query.toLowerCase()) ||
        String(s.id) === query;
      const matchesFilter = filter === "all" || s.revelationType === filter;
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  const handlePlay = (surahId: number) => {
    playSurah(surahId, reciterId);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2">
            <BookOpen className="h-3 w-3 ml-1" />
            القرآن الكريم
          </Badge>
          <h1 className="text-3xl font-bold mb-2 quran-text">القرآن الكريم</h1>
          <p className="text-primary-foreground/80 text-sm">
            114 سورة بأصوات نخبة من القراء — تشغيل كامل لكل سورة مع إمكانية التحكم في السرعة والتكرار
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ابحث عن سورة بالاسم أو الرقم..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10"
            aria-label="البحث في السور"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Browse mode switch */}
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            {[
              { v: "surah", l: "حسب السورة" },
              { v: "juz", l: "حسب الجزء" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setBrowseMode(opt.v as typeof browseMode)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all ${
                  browseMode === opt.v ? "bg-background text-foreground shadow-sm" : ""
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
          {browseMode === "surah" && (
            <>
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                {[
                  { v: "all", l: "الكل" },
                  { v: "meccan", l: "مكية" },
                  { v: "medinan", l: "مدنية" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setFilter(opt.v as typeof filter)}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all ${
                      filter === opt.v ? "bg-background text-foreground shadow-sm" : ""
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="mr-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">القارئ:</span>
            <Select value={reciterId} onValueChange={setReciterId}>
              <SelectTrigger className="w-48">
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
          </div>
        </div>
      </div>

      {browseMode === "surah" && (
        <p className="text-sm text-muted-foreground">
          عرض {filteredSurahs.length} من {SURAHS.length} سورة
        </p>
      )}

      {/* Juz browsing */}
      {browseMode === "juz" && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
            {JUZ_LIST.map((juz) => (
              <button
                key={juz.number}
                onClick={() => setSelectedJuz(juz.number)}
                className={cn(
                  "flex flex-col items-center justify-center py-3 rounded-lg border-2 transition-all",
                  selectedJuz === juz.number
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-lg font-bold">{juz.number}</span>
                <span className="text-[9px] text-muted-foreground">جزء</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {JUZ_LIST[selectedJuz - 1]?.name} — السور الواقعة في هذا الجزء:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {getSurahsByJuz(selectedJuz).map((surah) => (
              <Card key={surah.id} className="p-3 hover:shadow-md hover:border-primary/40 transition-all">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-bold flex-shrink-0">
                    {surah.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold quran-text truncate">{surah.name}</h3>
                    <p className="text-xs text-muted-foreground">{surah.ayahCount} آية</p>
                  </div>
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
                    onClick={() => handlePlay(surah.id)}
                    aria-label={`تشغيل سورة ${surah.name}`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {browseMode === "surah" ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSurahs.map((surah) => {
          const track = buildSurahTrack(surah.id, reciterId);
          if (!track) return null;
          const fav = isFavorite(track.id);
          return (
            <Card
              key={surah.id}
              className="p-3 hover:shadow-md hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full text-muted-foreground/30">
                    <path
                      d="M24 2 L46 14 L46 34 L24 46 L2 34 L2 14 Z"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{surah.id}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/quran/${surah.id}`} className="block">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold quran-text text-lg truncate hover:text-primary transition-colors">{surah.name}</h3>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {surah.revelationType === "meccan" ? "مكية" : "مدنية"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {surah.nameLatin} — {surah.ayahCount} آية
                    </p>
                  </Link>
                </div>

                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
                  onClick={() => handlePlay(surah.id)}
                  aria-label={`تشغيل سورة ${surah.name}`}
                >
                  <Play className="h-4 w-4 fill-current" />
                </Button>
              </div>

              <div className="mt-2 flex items-center gap-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addToQueue(track)}
                >
                  + طابور
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleFavorite(track)}
                >
                  {fav ? "★ مفضلة" : "☆ مفضلة"}
                </Button>
                <Link href={`/quran/${surah.id}`} className="mr-auto">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    تفاصيل ←
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
      ) : null}

      {browseMode === "surah" && filteredSurahs.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد نتائج مطابقة</p>
        </div>
      )}
    </div>
  );
}
