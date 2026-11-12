"use client";

import { useState } from "react";
import { Play, Shield, ChevronDown, ChevronLeft, AlertCircle, Clock, Plus, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RUQYAH_COLLECTIONS } from "@/data/ruqyah";
import { buildRuqyahTrack, buildRuqyahQueueTracks, surahTracksToQueueItems } from "@/lib/providers/contentProvider";
import { getAudioEngine } from "@/lib/audio/engine";
import { useLibraryStore } from "@/stores/library";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RUQYAH_TYPE_LABEL: Record<string, string> = {
  shamilah: "شاملة",
  tahseen: "تحصين يومي",
  "ayn-hasad": "عين وحسد",
  sihr: "سحر",
  "khawf-waswas": "خوف ووسواس",
  organized: "منظمة",
};

export default function RuqyahPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const addToQueue = useLibraryStore((s) => s.addToQueue);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const isFavorite = useLibraryStore((s) => s.isFavorite);

  const handlePlay = (id: string) => {
    const track = buildRuqyahTrack(id);
    if (!track) return;
    const tracks = buildRuqyahQueueTracks(id);
    if (tracks.length > 0) {
      const queueItems = surahTracksToQueueItems(tracks);
      getAudioEngine().setQueue(queueItems, 0);
    }
    getAudioEngine().playTrack(track);
    toast.success(`تشغيل الرقية: ${track.title}`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2">
            <Shield className="h-3 w-3 ml-1" />
            الرقية الشرعية
          </Badge>
          <h1 className="text-3xl font-bold mb-2">الرقية الشرعية</h1>
          <p className="text-primary-foreground/80 text-sm max-w-2xl">
            رقى موثقة من القرآن الكريم والأدعية الثابتة عن النبي ﷺ. الرقية سبب والشفاء من الله وحده.
          </p>
        </div>
      </div>

      {/* Important disclaimer */}
      <Card className="p-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-500 mb-1">
              تنبيه مهم
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              الرقية الشرعية أسباب، والشفاء بيد الله وحده. لا نَعِد بأي شفاء مضمون.
              لا تُغني عن العلاج الطبي عند الحاجة. راجع طبيبًا مختصًا للحالات المرضية.
            </p>
          </div>
        </div>
      </Card>

      {/* Ruqyah collections */}
      <div className="space-y-4">
        {RUQYAH_COLLECTIONS.map((ruqyah) => {
          const isOpen = openId === ruqyah.id;
          const track = buildRuqyahTrack(ruqyah.id);
          const fav = track ? isFavorite(track.id) : false;
          return (
            <Card key={ruqyah.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-lg">{ruqyah.title}</h2>
                      <Badge variant="secondary" className="text-[10px]">
                        {RUQYAH_TYPE_LABEL[ruqyah.ruqyahType]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {ruqyah.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {ruqyah.durationEstimate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~ {Math.ceil(ruqyah.durationEstimate / 60)} دقيقة
                        </span>
                      )}
                      <span>{ruqyah.sections.length} مقطع</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button
                    onClick={() => handlePlay(ruqyah.id)}
                    className="bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    <Play className="h-4 w-4 ml-1" />
                    تشغيل الرقية
                  </Button>
                  {track && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToQueue(track)}
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        طابور
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(track)}
                      >
                        <Heart className={cn("h-4 w-4", fav && "fill-current text-primary")} />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-auto"
                    onClick={() => setOpenId(isOpen ? null : ruqyah.id)}
                  >
                    {isOpen ? "إخفاء النصوص" : "عرض النصوص"}
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 mr-1 rotate-180" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border">
                  <div className="p-4 space-y-4 bg-muted/30">
                    {ruqyah.sections.map((section, idx) => (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {idx + 1}
                          </span>
                          <h3 className="font-semibold text-sm">{section.title}</h3>
                          {section.repeat && (
                            <Badge variant="outline" className="text-[10px]">
                              × {section.repeat}
                            </Badge>
                          )}
                        </div>
                        <p className="quran-text text-base leading-loose pr-8">
                          {section.text}
                        </p>
                        <p className="text-[10px] text-muted-foreground pr-8">
                          📖 {section.source}
                          {section.reference && ` — ${section.reference}`}
                        </p>
                        {idx < ruqyah.sections.length - 1 && <Separator className="mt-2" />}
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground italic">
                      المصدر: {ruqyah.source}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
