"use client";

import { useState, useMemo } from "react";
import { ListChecks, ChevronRight, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdhkarPlayer } from "@/components/azkar/adhkar-player";
import { MISC_ADHKAR_GROUPS } from "@/data/misc-adhkar";
import type { AdhkarSet } from "@/types/content";

export default function MiscAdhkarPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeGroup = useMemo(
    () => MISC_ADHKAR_GROUPS.find((g) => g.id === activeId) ?? null,
    [activeId]
  );

  const activeSet = useMemo<AdhkarSet | null>(() => {
    if (!activeGroup) return null;
    return {
      id: activeGroup.id,
      title: activeGroup.title,
      category: "morning-azkar", // حقل تقني غير مستخدم في العرض
      description: activeGroup.description,
      source: activeGroup.source,
      items: activeGroup.items,
    };
  }, [activeGroup]);

  const totalItems = MISC_ADHKAR_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
        <div className="relative z-10">
          <Badge
            variant="secondary"
            className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2"
          >
            <ListChecks className="h-3 w-3 ml-1" />
            أذكار متنوعة
          </Badge>
          <h1 className="text-3xl font-bold mb-2">أذكار المواقف اليومية</h1>
          <p className="text-primary-foreground/80 text-sm max-w-2xl leading-relaxed">
            أذكار النوم والاستيقاظ، والمنزل والمسجد، والطعام واللباس، والسفر، والكرب
            والاستخارة، والأذان — مواقف يومك كله معلَّقة بذكر الله، من حصن المسلم.
          </p>
          <p className="text-primary-foreground/60 text-xs mt-2">
            {MISC_ADHKAR_GROUPS.length} مواقف — {totalItems} ذكرًا موثقًا
          </p>
        </div>
      </div>

      {/* Group selection */}
      {activeGroup === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MISC_ADHKAR_GROUPS.map((g, idx) => (
            <button key={g.id} onClick={() => setActiveId(g.id)} className="text-right group">
              <Card className="p-5 rounded-2xl h-full hover:border-primary/40 hover:shadow-lg transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-900 opacity-5 group-hover:opacity-15 transition-opacity" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="rounded-xl bg-emerald-700/10 h-11 w-11 flex items-center justify-center flex-shrink-0">
                    <span
                      className="text-lg font-bold text-emerald-800 tabular-nums"
                      style={{ fontFamily: "var(--font-arabic)" }}
                    >
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                      {g.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {g.items.length} ذكرًا • {g.source}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Active group player */}
      {activeGroup !== null && activeSet !== null && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">{activeGroup.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeGroup.description}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveId(null)}
              className="flex-shrink-0 rounded-xl"
            >
              <ArrowRight className="h-4 w-4 ml-1" />
              كل المواقف
            </Button>
          </div>
          <AdhkarPlayer adhkarSet={activeSet} themeColor="burgundy" />
        </>
      )}

      {/* Sources footer */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">المصادر المعتمدة لهذا القسم: </span>
          صحيح البخاري • صحيح مسلم • سنن أبي داود • سنن الترمذي • ابن ماجه (حسن) — وفق ترتيب
          حصن المسلم للشيخ سعيد بن علي القحطاني. لا يُعتمد في المنصة أي ذكر لا أصل له في هذه
          الكتب.
        </p>
      </Card>
    </div>
  );
}
