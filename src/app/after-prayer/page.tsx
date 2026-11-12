"use client";

import { useState, useMemo } from "react";
import { BellRing, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AdhkarPlayer } from "@/components/azkar/adhkar-player";
import { PRAYER_ADHKAR_GROUPS } from "@/data/prayer-adhkar";
import type { AdhkarSet } from "@/types/content";

export default function AfterPrayerPage() {
  const [activeId, setActiveId] = useState(PRAYER_ADHKAR_GROUPS[0].id);

  // نبني AdhkarSet متوافقًا مع AdhkarPlayer من المجموعة النشطة
  const activeSet = useMemo<AdhkarSet>(() => {
    const group =
      PRAYER_ADHKAR_GROUPS.find((g) => g.id === activeId) ?? PRAYER_ADHKAR_GROUPS[0];
    return {
      id: group.id,
      title: group.title,
      category: "morning-azkar", // حقل تقني غير مستخدم في العرض
      description: group.description,
      source: group.source,
      items: group.items,
    };
  }, [activeId]);

  const totalItems = PRAYER_ADHKAR_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
        <div className="relative z-10">
          <Badge
            variant="secondary"
            className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2"
          >
            <BellRing className="h-3 w-3 ml-1" />
            أذكار ما بعد الصلاة
          </Badge>
          <h1 className="text-3xl font-bold mb-2">أذكار بعد كل صلاة</h1>
          <p className="text-primary-foreground/80 text-sm max-w-2xl leading-relaxed">
            أذكار ثابتة تقال بعد التسليم قبل الانصراف — تسبيحٌ بأجْب، وتمامُ المئة،
            والصلاة على النبي ﷺ — كلها موثقة من صحيح مسلم وسنن أبي داود والترمذي
            والنسائي.
          </p>
          <p className="text-primary-foreground/60 text-xs mt-2">
            {totalItems} بندًا موثقًا في {PRAYER_ADHKAR_GROUPS.length} مجموعات
          </p>
        </div>
      </div>

      {/* Timing note */}
      <Card className="p-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold mb-1">متى تقال هذه الأذكار؟</p>
            <p className="text-muted-foreground text-xs md:text-sm">
              بعد السلام من الصلاة المكتوبة وقبل الانصراف من مكانه — دُبُر الصلاة كما ورد
              في الأحاديث، سواء كنت مصليًا فرادي أو جماعة.
            </p>
          </div>
        </div>
      </Card>

      {/* Group tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PRAYER_ADHKAR_GROUPS.map((g) => {
          const active = g.id === activeId;
          return (
            <button
              key={g.id}
              onClick={() => setActiveId(g.id)}
              className={cn(
                "flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all border",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {g.title}
              <span className="mx-1 text-[10px] opacity-70">({g.items.length})</span>
            </button>
          );
        })}
      </div>

      {/* Active group description */}
      <p className="text-sm text-muted-foreground leading-relaxed px-1">
        {activeSet.description}
      </p>

      {/* Sequential player */}
      <AdhkarPlayer adhkarSet={activeSet} themeColor="burgundy" />

      {/* Sources footer */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">المصادر المعتمدة لهذا القسم: </span>
          صحيح مسلم • صحيح البخاري • سنن أبي داود • سنن الترمذي (حسن صحيح) • النسائي في عمل
          اليوم والليلة (صحيح) — وفق ترتيب حصن المسلم للشيخ سعيد بن علي القحطاني. لا يُعتمد
          في المنصة أي ذكر لا أصل له في هذه الكتب.
        </p>
      </Card>
    </div>
  );
}
