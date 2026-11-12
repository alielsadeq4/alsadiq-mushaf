"use client";

import { useState, useEffect, useRef } from "react";
import { Settings as SettingsIcon, Sun, Moon, Monitor, Bell, BellRing, Clock, Target, Trash2, Info, Server, CheckCircle, AlertCircle, RefreshCw, Download, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useThemeContext } from "@/components/layout/theme-provider";
import { RECITERS } from "@/data/reciters";
import { usePlayerStore } from "@/stores/player";
import { getAudioEngine } from "@/lib/audio/engine";
import {
  getAudioSourceConfig,
  setAudioSourceConfig,
  verifyAudioUrl,
  type AudioSourceConfig,
} from "@/lib/providers/contentProvider";
import { settingsStorage, historyStorage, favoriteStorage, queueStorage, sessionStorage as sessionStore, notificationStorage } from "@/lib/storage";
import {
  getAllNotifications,
  updateNotification,
  disableAllNotifications,
  restartScheduler,
  fireTestNotification,
} from "@/services/notifications/scheduler";
import { useLibraryStore } from "@/stores/library";
import { downloadBackup, importBackup, reportImportResult } from "@/lib/backup";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RATES = [0.75, 1, 1.25, 1.5, 2];

export default function SettingsPage() {
  const { theme, setTheme } = useThemeContext();
  const reciterId = usePlayerStore((s) => s.reciterId);
  const setReciterId = usePlayerStore((s) => s.setReciterId);
  const clearHistory = useLibraryStore((s) => s.clearHistory);
  const initLibrary = useLibraryStore((s) => s.init);

  const [rate, setRate] = useState(1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "default">("default");
  const [audioConfig, setAudioConfig] = useState<AudioSourceConfig>(getAudioSourceConfig());
  const [verifying, setVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});
  const [notifList, setNotifList] = useState<any[]>([]);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const result = await importBackup(file);
      reportImportResult(result);
      initLibrary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر استيراد النسخة الاحتياطية");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    setRate(settingsStorage.getRate());
    setAudioConfig(getAudioSourceConfig());
    setNotifList(getAllNotifications());
    if (typeof Notification !== "undefined") {
      const p = Notification.permission;
      setNotifPermission(p);
      setNotificationsEnabled(p === "granted");
    }
    restartScheduler();
  }, []);

  const handleRateChange = (r: number) => {
    setRate(r);
    settingsStorage.setRate(r);
    getAudioEngine().setRate(r);
  };

  const handleClearHistory = () => {
    if (confirm("هل أنت متأكد من مسح سجل الاستماع؟")) {
      clearHistory();
      toast.success("تم مسح السجل");
    }
  };

  const handleClearAll = () => {
    if (confirm("سيتم مسح كل البيانات المحلية (المفضلة، الطابور، السجل، الإحصائيات). متابعة؟")) {
      historyStorage.clear();
      favoriteStorage.clear();
      queueStorage.clear();
      sessionStore.clear();
      initLibrary();
      toast.success("تم مسح جميع البيانات");
    }
  };

  const handleEnableNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("الإشعارات غير مدعومة على هذا الجهاز");
      return;
    }
    if (notifPermission === "granted") {
      setNotificationsEnabled(true);
      toast.success("تم تفعيل الإشعارات");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      setNotificationsEnabled(true);
      restartScheduler();
      toast.success("تم منح إذن الإشعارات — يمكنك الآن تحديد أوقات التذكير");
    } else {
      toast.error("تم رفض إذن الإشعارات");
    }
  };

  const handleVerifyAllReciters = async () => {
    setVerifying(true);
    setVerificationResults({});
    const results: Record<string, boolean> = {};
    const sampleAyahUrl = (reciterId: string) => {
      const r = RECITERS.find((x) => x.id === reciterId);
      if (!r) return "";
      return `${r.baseUrl}/001001.${r.format}`;
    };
    for (const reciter of RECITERS) {
      const ok = await verifyAudioUrl(sampleAyahUrl(reciter.id));
      results[reciter.id] = ok;
      setVerificationResults({ ...results });
    }
    setVerifying(false);
    const okCount = Object.values(results).filter(Boolean).length;
    toast.success(`${okCount} من ${RECITERS.length} قارئ يعمل`);
  };

  const handleUpdateAudioConfig = (patch: Partial<AudioSourceConfig>) => {
    const next = { ...audioConfig, ...patch };
    setAudioConfig(next);
    setAudioSourceConfig(patch);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div>
        <Badge variant="secondary" className="mb-2">
          <SettingsIcon className="h-3 w-3 ml-1" />
          الإعدادات
        </Badge>
        <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
        <p className="text-muted-foreground text-sm">خصّص تجربتك في منصة الصادق</p>
      </div>

      {/* Theme */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Sun className="h-4 w-4 text-primary" />
          المظهر
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "light", l: "فاتح", icon: Sun },
            { v: "dark", l: "ليلي", icon: Moon },
            { v: "system", l: "تلقائي", icon: Monitor },
          ].map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.v;
            return (
              <button
                key={opt.v}
                onClick={() => setTheme(opt.v as any)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                <span className={cn("text-xs font-medium", active && "text-primary")}>{opt.l}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Quran reciter */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-primary" />
          القارئ الافتراضي
        </h3>
        <Select value={reciterId} onValueChange={setReciterId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECITERS.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <div className="flex flex-col items-start">
                  <span>{r.arabicName}</span>
                  <span className="text-xs text-muted-foreground">{r.style}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Playback rate */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <SettingsIcon className="h-4 w-4 text-primary" />
          سرعة التشغيل الافتراضية
        </h3>
        <div className="flex flex-wrap gap-2">
          {RATES.map((r) => (
            <Button
              key={r}
              variant={rate === r ? "default" : "outline"}
              size="sm"
              onClick={() => handleRateChange(r)}
              className={cn("min-w-16", rate === r && "bg-primary")}
            >
              {r}x
            </Button>
          ))}
        </div>
      </Card>

      {/* Audio Sources — مصادر الصوت */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Server className="h-4 w-4 text-primary" />
            مصادر الصوت
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyAllReciters}
            disabled={verifying}
          >
            {verifying ? (
              <RefreshCw className="h-3.5 w-3.5 ml-1 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5 ml-1" />
            )}
            فحص المصادر
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          المنصة تستخدم مصدرًا مجانيًا واحدًا موثوقًا (QuranicAudio.com عبر mirrors.quranicaudio.com)
          لكل القرّاء، مع إمكانية Fallback تلقائي عند فشل التشغيل. جميع المصادر مفتوحة وبدون مفتاح API.
        </p>

        {/* Primary reciter selection */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              القارئ الأساسي
            </label>
            <Select
              value={audioConfig.quranReciterId}
              onValueChange={(v) => {
                handleUpdateAudioConfig({ quranReciterId: v });
                setReciterId(v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECITERS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <span>{r.arabicName}</span>
                      {verificationResults[r.id] !== undefined && (
                        verificationResults[r.id] ? (
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fallback toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">القارئ الاحتياطي (Fallback)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                عند فشل التشغيل من القارئ الأساسي، يُحاول المحرك القارئ الاحتياطي تلقائيًا
              </p>
            </div>
            <Switch
              checked={audioConfig.enableFallback}
              onCheckedChange={(v) => handleUpdateAudioConfig({ enableFallback: v })}
            />
          </div>

          {audioConfig.enableFallback && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                القارئ الاحتياطي
              </label>
              <Select
                value={audioConfig.fallbackReciterId}
                onValueChange={(v) => handleUpdateAudioConfig({ fallbackReciterId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECITERS.filter((r) => r.id !== audioConfig.quranReciterId).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <span>{r.arabicName}</span>
                        {verificationResults[r.id] !== undefined && (
                          verificationResults[r.id] ? (
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-destructive" />
                          )
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Verification results */}
        {Object.keys(verificationResults).length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              نتائج الفحص:
            </p>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {RECITERS.map((r) => {
                const status = verificationResults[r.id];
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/40"
                  >
                    {status === undefined ? (
                      <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : status ? (
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span className="truncate">{r.arabicName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source info */}
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="source-info" className="border-0">
            <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline">
              تفاصيل المصادر والتراخيص
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2">
              <div>
                <strong className="text-foreground">المصدر الأساسي:</strong>{" "}
                <a
                  href="https://mirrors.quranicaudio.com/everyayah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mirrors.quranicaudio.com/everyayah
                </a>
              </div>
              <div>
                <strong className="text-foreground">نمط الـ URL:</strong>{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]" dir="ltr">
                  {`{reciter_slug}/{SSS}{AAA}.mp3`}
                </code>
              </div>
              <div>
                <strong className="text-foreground">الرخصة:</strong>{" "}
                مجاني للاستخدام غير التجاري مع الإسناد — QuranicAudio.com
              </div>
              <div>
                <strong className="text-foreground">CORS:</strong>{" "}
                مفعّل (Access-Control-Allow-Origin: *)
              </div>
              <div className="pt-2 border-t border-border">
                المنصة لا تعتمد على أي مفتاح API. المصدر عام ومجاني تمامًا،
                ولا يتطلب تسجيل دخول أو مصادقة.
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Notifications */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-primary" />
          الإشعارات والتذكيرات
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">تفعيل الإشعارات</p>
              <p className="text-xs text-muted-foreground">
                لا نطلب الإذن إلا عند تفعيلك — الخصوصية أولًا
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(v) => {
                if (v) handleEnableNotifications();
                else {
                  setNotificationsEnabled(false);
                  disableAllNotifications();
                  setNotifList(getAllNotifications());
                  toast.info("تم إيقاف كل التذكيرات");
                }
              }}
            />
          </div>

          {notifPermission === "granted" && notificationsEnabled && (
            <div className="space-y-2 pt-2 border-t border-border">
              {notifList.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Switch
                      checked={notif.enabled}
                      onCheckedChange={(v) => {
                        const next = updateNotification(notif.id, { enabled: v });
                        setNotifList([...next]);
                        toast.success(v ? `تم تفعيل تذكير ${notif.label}` : `تم إيقاف تذكير ${notif.label}`);
                      }}
                      aria-label={`تفعيل ${notif.label}`}
                    />
                    <span className="text-sm font-medium truncate">{notif.label}</span>
                  </div>
                  <input
                    type="time"
                    value={notif.time}
                    onChange={(e) => {
                      const next = updateNotification(notif.id, { time: e.target.value });
                      setNotifList([...next]);
                    }}
                    disabled={!notif.enabled}
                    className="text-xs bg-background border border-input rounded px-2 py-1.5 disabled:opacity-50"
                    aria-label={`وقت ${notif.label}`}
                  />
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                تعمل التذكيرات أثناء فتح التطبيق (أو كتطبيق مثبّت PWA).
                عند وصول الوقت، انقر الإشعار للانتقال للقسم مباشرة.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const ok = await fireTestNotification();
                  if (ok) toast.success("أرسلنا إشعارًا تجريبيًا — انظر أعلى الشاشة");
                  else toast.error("تعذر إرسال الإشعار التجريبي");
                }}
                className="w-full"
              >
                <BellRing className="h-4 w-4 ml-1" />
                أرسل إشعارًا تجريبيًا
              </Button>
            </div>
          )}

          {notifPermission === "denied" && (
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              تم رفض إذن الإشعارات من إعدادات المتصفح. يجب السماح بها من إعدادات الموقع.
            </p>
          )}
        </div>
      </Card>

      {/* Data management */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Trash2 className="h-4 w-4 text-primary" />
          إدارة البيانات
        </h3>
        {/* Backup / restore */}
        <div className="mb-4 rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold mb-1">نسخة احتياطية للمكتبة</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
            صدّر مفضلتك وسجلك وإعداداتك كملف JSON واستورده على أي جهاز آخر.
            التنزيلات الصوتية تبقى على الجهاز الأصلي.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (downloadBackup()) toast.success("تم تنزيل النسخة الاحتياطية");
                else toast.error("تعذر تنزيل النسخة الاحتياطية");
              }}
              className="flex-1"
            >
              <Download className="h-4 w-4 ml-1" />
              تصدير
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => backupInputRef.current?.click()}
              disabled={importing}
              className="flex-1"
            >
              <Upload className="h-4 w-4 ml-1" />
              {importing ? "جارٍ الاستيراد..." : "استيراد"}
            </Button>
          </div>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportBackup}
          />
        </div>
        <div className="space-y-2">
          <Button variant="outline" onClick={handleClearHistory} className="w-full justify-start">
            <Trash2 className="h-4 w-4 ml-2" />
            مسح سجل الاستماع
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            مسح جميع البيانات المحلية
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          جميع البيانات محفوظة محليًا على جهازك فقط. لا نجمع أي معلومات شخصية.
        </p>
      </Card>

      {/* About */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2 text-sm">عن المنصة</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          منصة الصادق — منصة استماع إسلامية صوتية متكاملة، من إعداد وتطوير علي محمد الصادق.
          المصادر الدينية موثقة من القرآن الكريم والسنة الصحيحة.
        </p>
        <p className="text-[10px] text-muted-foreground">
          الإصدار 1.0.0 — © 2026
        </p>
      </Card>
    </div>
  );
}
