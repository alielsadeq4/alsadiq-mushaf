"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  Library,
  Heart,
  Clock,
  Download,
  ListMusic,
  History,
  TrendingUp,
  Play,
  Trash2,
  Target,
  X,
  HardDrive,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useLibraryStore } from "@/stores/library";
import { usePlayerStore } from "@/stores/player";
import { getAudioEngine } from "@/lib/audio/engine";
import { sessionStorage } from "@/lib/storage";
import { downloadsStorage } from "@/lib/storage";
import {
  downloadTrack,
  deleteDownload,
  getDownloadedUrl,
  formatSize,
  subscribeToDownloads,
  type DownloadProgress,
} from "@/lib/audio/downloads";
import { buildSurahTrack } from "@/lib/providers/contentProvider";
import { playSurah } from "@/lib/audio/playback";
import { cn } from "@/lib/utils";
import type { AudioTrack, Category, DownloadedTrack } from "@/types/content";

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted-foreground">جارٍ التحميل...</div>}>
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const params = useSearchParams();
  const initialTab = params.get("tab") || "favorites";

  const favorites = useLibraryStore((s) => s.favorites);
  const queue = useLibraryStore((s) => s.queue);
  const history = useLibraryStore((s) => s.history);
  const continueListening = useLibraryStore((s) => s.continueListening);
  const removeFromFavorites = useLibraryStore((s) => s.removeFromFavorites);
  const removeFromQueue = useLibraryStore((s) => s.removeFromQueue);
  const moveQueueItem = useLibraryStore((s) => s.moveQueueItem);
  const playQueue = useLibraryStore((s) => s.playQueue);
  const removeFromHistory = useLibraryStore((s) => s.removeFromHistory);
  const clearHistory = useLibraryStore((s) => s.clearHistory);

  const [sessions, setSessions] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<DownloadedTrack[]>([]);
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0 });
  const [progress, setProgress] = useState<Record<string, DownloadProgress>>({});

  useEffect(() => {
    setSessions(sessionStorage.getAll());
    refreshDownloads();
  }, []);

  useEffect(() => {
    const unsub = subscribeToDownloads((p) => {
      setProgress((prev) => ({ ...prev, [p.trackId]: p }));
      if (p.status === "completed") {
        setTimeout(() => {
          setProgress((prev) => {
            const next = { ...prev };
            delete next[p.trackId];
            return next;
          });
        }, 2000);
        refreshDownloads();
      }
    });
    return unsub;
  }, []);

  const refreshDownloads = async () => {
    const all = await downloadsStorage.getAll();
    setDownloads(all);
    const info = await downloadsStorage.estimateStorage();
    setStorageInfo(info);
  };

  const handlePlayFavorite = async (fav: typeof favorites[0]) => {
    const track: AudioTrack = {
      id: fav.trackId,
      title: fav.title,
      category: fav.category,
      contentType: "audio-clip",
      reciterOrSpeaker: fav.reciterOrSpeaker,
      audioUrl: fav.audioUrl,
      surahId: fav.surahId,
      ayahStart: fav.ayahStart,
      ayahEnd: fav.ayahEnd,
      downloadAllowed: false,
      verified: true,
    };

    // If this is a surah track, use the queue builder
    if (fav.surahId && fav.category === "quran" && fav.ayahEnd && fav.ayahEnd > 1) {
      // Check if downloaded
      const downloaded = downloads.find((d) => d.trackId === fav.trackId);
      if (downloaded) {
        const url = await getDownloadedUrl(downloaded.blobKey);
        if (url) {
          // Use downloaded blob
          getAudioEngine().playTrack({ ...track, audioUrl: url });
          return;
        }
      }
      // Otherwise play from CDN via queue
      playSurah(fav.surahId, usePlayerStore.getState().reciterId);
    } else {
      getAudioEngine().playTrack(track);
    }
  };

  const handleDeleteDownload = async (download: DownloadedTrack) => {
    if (confirm(`حذف "${download.title}" من التنزيلات؟`)) {
      await deleteDownload(download.id, download.blobKey);
      refreshDownloads();
    }
  };

  const todaySeconds = sessions.find((s) => s.date === new Date().toISOString().slice(0, 10))?.totalSeconds || 0;
  const weekSeconds = sessions
    .filter((s) => {
      const d = new Date(s.date);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .reduce((sum, s) => sum + s.totalSeconds, 0);
  const monthSeconds = sessions
    .filter((s) => {
      const d = new Date(s.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, s) => sum + s.totalSeconds, 0);

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 mb-2">
            <Library className="h-3 w-3 ml-1" />
            مكتبتي
          </Badge>
          <h1 className="text-3xl font-bold mb-2">مكتبتي</h1>
          <p className="text-primary-foreground/80 text-sm">
            مفضلاتك، تنزيلاتك، قائمة الانتظار، وسجل استماعك
          </p>
        </div>
      </div>

      {/* Continue listening */}
      {continueListening && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            متابعة الاستماع
          </h3>
          <button
            className="w-full text-right flex items-center gap-3 hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => {
              const track: AudioTrack = {
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
              };
              getAudioEngine().playTrack(track);
              setTimeout(() => {
                if (continueListening.currentTime > 5) {
                  getAudioEngine().seek(continueListening.currentTime);
                }
              }, 500);
            }}
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Play className="h-5 w-5 text-primary-foreground fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{continueListening.title}</p>
              <p className="text-xs text-muted-foreground truncate">{continueListening.reciterOrSpeaker}</p>
            </div>
          </button>
        </Card>
      )}

      {/* Stats summary */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          إحصائيات الاستماع
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">اليوم</p>
            <p className="text-lg font-bold tabular-nums">{formatMin(todaySeconds)}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">الأسبوع</p>
            <p className="text-lg font-bold tabular-nums">{formatMin(weekSeconds)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">الشهر</p>
            <p className="text-lg font-bold tabular-nums">{formatMin(monthSeconds)}</p>
          </div>
        </div>
      </Card>

      {/* Listening goal */}
      <GoalCard todaySeconds={todaySeconds} />

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="favorites" className="text-xs sm:text-sm">
            <Heart className="h-4 w-4 sm:ml-1" />
            <span className="hidden sm:inline">المفضلة</span>
          </TabsTrigger>
          <TabsTrigger value="queue" className="text-xs sm:text-sm">
            <ListMusic className="h-4 w-4 sm:ml-1" />
            <span className="hidden sm:inline">الطابور</span>
          </TabsTrigger>
          <TabsTrigger value="downloads" className="text-xs sm:text-sm">
            <Download className="h-4 w-4 sm:ml-1" />
            <span className="hidden sm:inline">التنزيلات</span>
            {downloads.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] h-4 min-w-4 px-1">
                {downloads.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <History className="h-4 w-4 sm:ml-1" />
            <span className="hidden sm:inline">السجل</span>
          </TabsTrigger>
        </TabsList>

        {/* Favorites tab */}
        <TabsContent value="favorites" className="space-y-2">
          {favorites.length === 0 ? (
            <EmptyState icon={Heart} title="لا توجد مفضلات" desc="أضف عناصر للمفضلة من زر القلب" />
          ) : (
            favorites.map((fav) => {
              const isDownloaded = downloads.some((d) => d.trackId === fav.trackId);
              return (
                <Card key={fav.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <button
                      className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0"
                      onClick={() => handlePlayFavorite(fav)}
                      aria-label="تشغيل"
                    >
                      <Play className="h-5 w-5 text-primary-foreground fill-current" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{fav.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{fav.reciterOrSpeaker}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {categoryLabel(fav.category)}
                    </Badge>
                    {isDownloaded && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFromFavorites(fav.id)}
                      aria-label="إزالة"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Queue tab */}
        <TabsContent value="queue" className="space-y-2">
          {queue.length === 0 ? (
            <EmptyState icon={ListMusic} title="قائمة الانتظار فارغة" desc="أضف عناصر للطابور من زر +" />
          ) : (
            <>
              <Button
                variant="default"
                onClick={() => playQueue(0)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Play className="h-4 w-4 ml-2" />
                تشغيل القائمة
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                اسحب العناصر لإعادة الترتيب
              </p>
              <QueueDragList
                items={queue}
                onReorder={(newQueue) => {
                  // Update store in order
                  newQueue.forEach((item, newIdx) => {
                    const currentIdx = queue.findIndex(
                      (q) => q.trackId === item.trackId && q.addedAt === item.addedAt
                    );
                    if (currentIdx !== -1 && currentIdx !== newIdx) {
                      moveQueueItem(currentIdx, newIdx);
                    }
                  });
                }}
                onRemove={removeFromQueue}
              />
            </>
          )}
        </TabsContent>

        {/* Downloads tab */}
        <TabsContent value="downloads" className="space-y-3">
          {/* Storage info */}
          {storageInfo.quota > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">التخزين المستخدم</p>
              </div>
              <Progress
                value={(storageInfo.usage / storageInfo.quota) * 100}
                className="h-2 mb-1"
              />
              <p className="text-xs text-muted-foreground">
                {formatSize(storageInfo.usage)} من {formatSize(storageInfo.quota)} متاح
              </p>
            </Card>
          )}

          {/* Active downloads */}
          {Object.values(progress).length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                قيد التنزيل
              </h3>
              <div className="space-y-2">
                {Object.values(progress).map((p) => (
                  <div key={p.trackId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate">{p.trackId}</span>
                      <span className="text-muted-foreground">{Math.round(p.percent)}%</span>
                    </div>
                    <Progress value={p.percent} className="h-1" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Downloaded items */}
          {downloads.length === 0 ? (
            <EmptyState
              icon={Download}
              title="لا توجد تنزيلات"
              desc="نزّل المحتوى المسموح به للاستماع بدون إنترنت"
            />
          ) : (
            downloads.map((dl) => (
              <Card key={dl.id} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Download className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{dl.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {dl.reciterOrSpeaker} · {formatSize(dl.size)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {categoryLabel(dl.category)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteDownload(dl)}
                    aria-label="حذف التنزيل"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="space-y-2">
          {history.length === 0 ? (
            <EmptyState icon={History} title="لا يوجد سجل" desc="سيظهر هنا ما تستمع إليه" />
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={clearHistory}
                className="w-full text-destructive"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                مسح السجل
              </Button>
              {history.map((item) => (
                <Card key={item.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.reciterOrSpeaker} — {formatDate(item.listenedAt)} — {Math.round(item.duration)}ث
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFromHistory(item.id)}
                      aria-label="إزالة"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground font-medium">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{desc}</p>
    </div>
  );
}

function formatMin(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  return `${h}س ${m % 60}د`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "اليوم";
  const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 2) return "أمس";
  if (diff < 7) return "هذا الأسبوع";
  return d.toLocaleDateString("ar");
}

function categoryLabel(c: Category): string {
  switch (c) {
    case "quran": return "قرآن";
    case "ruqyah": return "رقية";
    case "morning-azkar": return "صباح";
    case "evening-azkar": return "مساء";
    case "salawat": return "صلاة";
    default: return c;
  }
}

// ===== Listening goal =====

function GoalCard({ todaySeconds }: { todaySeconds: number }) {
  const [goal, setGoal] = useState<{ type: string; target: number } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sadik:goal");
    if (stored) {
      try {
        setGoal(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const saveGoal = (type: string, target: number) => {
    const g = { type, target, createdAt: Date.now() };
    localStorage.setItem("sadik:goal", JSON.stringify(g));
    setGoal(g);
    setEditing(false);
  };

  const todayMinutes = Math.floor(todaySeconds / 60);
  const targetMinutes = goal?.target || 0;
  const percent = targetMinutes > 0 ? Math.min(100, (todayMinutes / targetMinutes) * 100) : 0;
  const achieved = targetMinutes > 0 && todayMinutes >= targetMinutes;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          هدف الاستماع اليومي
        </h3>
        {goal && !editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            تعديل
          </Button>
        )}
      </div>

      {!goal && !editing && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            حدد هدفًا يوميًا للتنظيم الشخصي — بدون نقاط أو مزاحمة، فقط تنظيم هادئ.
          </p>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30].map((m) => (
              <Button key={m} variant="outline" size="sm" onClick={() => saveGoal("minutes", m)}>
                {m} دقيقة يوميًا
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const v = prompt("أدخل هدف الدقائق اليومية:");
                const n = parseInt(v || "", 10);
                if (Number.isFinite(n) && n > 0) saveGoal("minutes", n);
              }}
            >
              مخصص
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30, 45, 60].map((m) => (
            <Button
              key={m}
              variant={goal?.target === m ? "default" : "outline"}
              size="sm"
              onClick={() => saveGoal("minutes", m)}
            >
              {m} دقيقة
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem("sadik:goal");
              setGoal(null);
              setEditing(false);
            }}
            className="text-destructive"
          >
            إزالة الهدف
          </Button>
        </div>
      )}

      {goal && !editing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {achieved ? "🎉" : ""}
              {todayMinutes} من {targetMinutes} دقيقة
            </span>
            <span className="text-xs text-muted-foreground">
              {achieved ? "أتممت هدفك اليوم" : `باقي ${Math.max(0, targetMinutes - todayMinutes)} دقيقة`}
            </span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
      )}
    </Card>
  );
}

function QueueDragList({
  items,
  onReorder,
  onRemove,
}: {
  items: any[];
  onReorder: (newItems: any[]) => void;
  onRemove: (index: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(
      (it) => `${it.trackId}-${it.addedAt}` === active.id
    );
    const newIdx = items.findIndex(
      (it) => `${it.trackId}-${it.addedAt}` === over.id
    );
    if (oldIdx === -1 || newIdx === -1) return;
    onReorder(arrayMove(items, oldIdx, newIdx));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((it) => `${it.trackId}-${it.addedAt}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item, idx) => (
            <SortableQueueItem
              key={`${item.trackId}-${item.addedAt}`}
              item={item}
              index={idx}
              onRemove={() => onRemove(idx)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableQueueItem({
  item,
  index,
  onRemove,
}: {
  item: any;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${item.trackId}-${item.addedAt}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 transition-shadow",
        isDragging && "shadow-xl ring-2 ring-primary/50 z-10"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          className="flex items-center justify-center h-8 w-8 rounded hover:bg-muted cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          {...attributes}
          {...listeners}
          aria-label="اسحب لإعادة الترتيب"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate">{item.reciterOrSpeaker}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onRemove}
          aria-label="إزالة"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
