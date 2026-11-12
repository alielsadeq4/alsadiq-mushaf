"use client";

import { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, BookOpen, Shield, Sunrise, Moon, Heart, Play, BellRing, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchContent } from "@/lib/providers/contentProvider";
import { buildSurahTrack, buildRuqyahTrack } from "@/lib/providers/contentProvider";
import { getAudioEngine } from "@/lib/audio/engine";
import { usePlayerStore } from "@/stores/player";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const reciterId = usePlayerStore((s) => s.reciterId);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => searchContent(debouncedQuery), [debouncedQuery]);

  const handlePlay = (type: string, id: string) => {
    const engine = getAudioEngine();
    if (type === "surah") {
      const track = buildSurahTrack(Number(id), reciterId);
      if (track) engine.playTrack(track);
    } else if (type === "ruqyah") {
      const track = buildRuqyahTrack(id);
      if (track) engine.playTrack(track);
    }
  };

  const getHref = (type: string, id: string): string => {
    switch (type) {
      case "surah": return "/quran";
      case "reciter": return "/quran";
      case "ruqyah": return "/ruqyah";
      case "adhkar-morning": return "/morning";
      case "adhkar-evening": return "/evening";
      case "adhkar-group":
        return [
          "after-every-prayer", "after-fajr", "after-maghrib-isha", "after-witr",
        ].includes(id) ? "/after-prayer" : "/adhkar-misc";
      case "name-of-allah": return "/names";
      case "salawat": return "/salawat";
      case "dhikr-item":
        return id.startsWith("ap-") ? "/after-prayer"
          : id.startsWith("sw-") || id.startsWith("hm-") || id.startsWith("fc-") ||
            id.startsWith("tr-") || id.startsWith("ds-") || id.startsWith("ad-")
            ? "/adhkar-misc" : "/morning";
      default: return "/";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "surah": return BookOpen;
      case "reciter": return BookOpen;
      case "ruqyah": return Shield;
      case "adhkar-morning": return Sunrise;
      case "adhkar-evening": return Moon;
      case "adhkar-group": return BellRing;
      case "name-of-allah": return Sparkles;
      case "salawat": return Heart;
      case "dhikr-item": return Sunrise;
      default: return SearchIcon;
    }
  };

  const getPlayable = (type: string): boolean => {
    return type === "surah" || type === "ruqyah";
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">البحث</h1>
        <p className="text-muted-foreground text-sm">
          ابحث في السور، القراء، الرقى، الأذكار، والصلاة على النبي ﷺ
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="ابحث..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-10 h-12 text-base"
          autoFocus
          aria-label="بحث"
        />
      </div>

      {debouncedQuery && results.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد نتائج لـ "{debouncedQuery}"</p>
        </div>
      )}

      {!debouncedQuery && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3 text-sm">اقتراحات البحث</h3>
          <div className="flex flex-wrap gap-2">
            {["الفاتحة", "يس", "الملك", "الرقية", "العين", "أذكار", "العفاسي", "الحصري"].map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-sm transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{results.length} نتيجة</p>
          <div className="space-y-2">
            {results.map((r, idx) => {
              const Icon = getIcon(r.type);
              const playable = getPlayable(r.type);
              return (
                <Card key={`${r.type}-${r.id}-${idx}`} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <Link href={getHref(r.type, r.id)} className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate hover:text-primary transition-colors">{r.title}</p>
                      {r.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      )}
                    </Link>
                    {r.category && (
                      <Badge variant="outline" className="text-[10px] hidden sm:flex">
                        {categoryLabel(r.category)}
                      </Badge>
                    )}
                    {playable && (
                      <button
                        onClick={() => handlePlay(r.type, r.id)}
                        className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center flex-shrink-0"
                        aria-label="تشغيل"
                      >
                        <Play className="h-4 w-4 text-primary-foreground fill-current" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function categoryLabel(c: string): string {
  switch (c) {
    case "quran": return "قرآن";
    case "ruqyah": return "رقية";
    case "morning-azkar": return "صباح";
    case "evening-azkar": return "مساء";
    case "salawat": return "صلاة";
    default: return c;
  }
}
