"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Compass,
  Crosshair,
  Moon,
  Sunrise,
  Sun,
  Sunset,
  Star,
  CloudSun,
  MapPin,
  WifiOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Prayer times (Aladhan API — free, no key) + Qibla direction (offline math)
// Calculation method: Egyptian General Authority of Survey (method=5)

const KAABA = { lat: 21.4225, lng: 39.8262 };
const LOCATION_KEY = "sadik:location";
const CACHE_PREFIX = "sadik:prayer-cache:";

interface City {
  name: string;
  lat: number;
  lng: number;
}

const CITIES: City[] = [
  { name: "القاهرة", lat: 30.0444, lng: 31.2357 },
  { name: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
  { name: "الجيزة", lat: 30.0131, lng: 31.2089 },
  { name: "المنصورة", lat: 31.0409, lng: 31.3785 },
  { name: "طنطا", lat: 30.7865, lng: 30.9982 },
  { name: "الزقازيق", lat: 30.5877, lng: 31.502 },
  { name: "دمياط", lat: 31.4165, lng: 31.8133 },
  { name: "بورسعيد", lat: 31.2653, lng: 32.3019 },
  { name: "السويس", lat: 29.9668, lng: 32.5498 },
  { name: "الفيوم", lat: 29.3084, lng: 30.8428 },
  { name: "المنيا", lat: 28.1099, lng: 30.7503 },
  { name: "أسيوط", lat: 27.181, lng: 31.1837 },
  { name: "سوهاج", lat: 26.5591, lng: 31.6957 },
  { name: "الأقصر", lat: 25.6872, lng: 32.6396 },
  { name: "أسوان", lat: 24.0889, lng: 32.8998 },
  { name: "شرم الشيخ", lat: 27.9158, lng: 34.33 },
  { name: "العريش", lat: 31.1249, lng: 33.7984 },
  { name: "مرسى مطروح", lat: 31.3543, lng: 27.2373 },
  { name: "مكة المكرمة", lat: 21.4225, lng: 39.8262 },
  { name: "المدينة المنورة", lat: 24.5247, lng: 39.5692 },
  { name: "الرياض", lat: 24.7136, lng: 46.6753 },
  { name: "جدة", lat: 21.4858, lng: 39.1925 },
  { name: "دبي", lat: 25.2048, lng: 55.2708 },
  { name: "الدوحة", lat: 25.2854, lng: 51.531 },
  { name: "مدينة الكويت", lat: 29.3759, lng: 47.9774 },
  { name: "عمّان", lat: 31.9454, lng: 35.9284 },
  { name: "بيروت", lat: 33.8938, lng: 35.5018 },
  { name: "بغداد", lat: 33.3152, lng: 44.3661 },
  { name: "الخرطوم", lat: 15.5007, lng: 32.5599 },
  { name: "صنعاء", lat: 15.3694, lng: 44.191 },
  { name: "طرابلس", lat: 32.8872, lng: 13.1913 },
  { name: "تونس", lat: 36.8065, lng: 10.1815 },
  { name: "الجزائر", lat: 36.7538, lng: 3.0588 },
  { name: "الدار البيضاء", lat: 33.5731, lng: -7.5898 },
  { name: "إستانبول", lat: 41.0082, lng: 28.9784 },
];

interface Timings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface CachedData {
  timings: Timings;
  hijri: string;
  hijriDay: string;
  hijriMonth: string;
  fetchedAt: number;
  dateKey: string;
  cityName: string;
}

const PRAYER_LIST: Array<{
  key: keyof Timings;
  label: string;
  icon: typeof Sun;
}> = [
  { key: "Fajr", label: "الفجر", icon: CloudSun },
  { key: "Sunrise", label: "الشروق", icon: Sunrise },
  { key: "Dhuhr", label: "الظهر", icon: Sun },
  { key: "Asr", label: "العصر", icon: Sun },
  { key: "Maghrib", label: "المغرب", icon: Sunset },
  { key: "Isha", label: "العشاء", icon: Moon },
];

const NEXT_ORDER: Array<keyof Timings> = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function todayKey(d = new Date()): string {
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function cleanTime(t: string): string {
  return (t || "").trim().split(" ")[0];
}

function to24h(t: string): { h: number; m: number } {
  const [h, m] = cleanTime(t).split(":").map((x) => parseInt(x, 10));
  return { h: h || 0, m: m || 0 };
}

/** Qibla bearing from a location to the Kaaba (great-circle initial bearing). */
function qiblaBearing(lat: number, lng: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const toDeg = (x: number) => (x * 180) / Math.PI;
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA.lat);
  const dLambda = toRad(KAABA.lng - lng);
  const y = Math.sin(dLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function cardinalAr(bearing: number): string {
  const dirs = ["الشمال", "الشمال الشرقي", "الشرق", "الجنوب الشرقي", "الجنوب", "الجنوب الغربي", "الغرب", "الشمال الغربي"];
  return dirs[Math.round(bearing / 45) % 8];
}

function loadLocation(): { lat: number; lng: number; name: string } {
  if (typeof window === "undefined") return { ...CITIES[0], name: CITIES[0].name };
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { lat: CITIES[0].lat, lng: CITIES[0].lng, name: CITIES[0].name };
}

export default function PrayerTimesPage() {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [data, setData] = useState<CachedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [geoLoading, setGeoLoading] = useState(false);

  // Init location from storage
  useEffect(() => {
    setLocation(loadLocation());
  }, []);

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchTimings = useCallback(async (loc: { lat: number; lng: number; name: string }) => {
    setLoading(true);
    setOffline(false);
    const dateKey = todayKey();
    const cacheKey = `${CACHE_PREFIX}${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
    try {
      const resp = await fetch(
        `https://api.aladhan.com/v1/timings/${dateKey}?latitude=${loc.lat}&longitude=${loc.lng}&method=5`
      );
      if (!resp.ok) throw new Error("api");
      const json = await resp.json();
      const t = json?.data?.timings;
      if (!t?.Fajr) throw new Error("empty");
      const h = json?.data?.date?.hijri;
      const next: CachedData = {
        timings: {
          Fajr: cleanTime(t.Fajr),
          Sunrise: cleanTime(t.Sunrise),
          Dhuhr: cleanTime(t.Dhuhr),
          Asr: cleanTime(t.Asr),
          Maghrib: cleanTime(t.Maghrib),
          Isha: cleanTime(t.Isha),
        },
        hijri: h?.date || "",
        hijriDay: h?.day || "",
        hijriMonth: h?.month?.ar || "",
        fetchedAt: Date.now(),
        dateKey,
        cityName: loc.name,
      };
      setData(next);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    } catch {
      // Offline fallback: today's cache, or any cached date for this location
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached: CachedData = JSON.parse(raw);
          if (cached.dateKey === dateKey) {
            setData(cached);
            setOffline(true);
          }
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) void fetchTimings(location);
  }, [location, fetchTimings]);

  const selectCity = (name: string) => {
    const city = CITIES.find((c) => c.name === name);
    if (!city) return;
    const loc = { lat: city.lat, lng: city.lng, name: city.name };
    setLocation(loc);
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
  };

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
          name: "موقعي الحالي",
        };
        setLocation(loc);
        try {
          localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
        } catch {
          // ignore
        }
        setGeoLoading(false);
        toast.success("تم تحديد موقعك — جارٍ جلب المواقيت");
      },
      () => {
        setGeoLoading(false);
        toast.error("تعذر تحديد الموقع — اختر مدينتك يدويًا");
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  };

  // Next prayer + countdown
  const nextInfo = useMemo(() => {
    if (!data) return null;
    const nowD = now;
    for (const key of NEXT_ORDER) {
      const { h, m } = to24h(data.timings[key]);
      const t = new Date(nowD);
      t.setHours(h, m, 0, 0);
      if (t.getTime() > nowD.getTime()) {
        const diff = Math.floor((t.getTime() - nowD.getTime()) / 1000);
        const hh = Math.floor(diff / 3600);
        const mm = Math.floor((diff % 3600) / 60);
        const ss = diff % 60;
        return {
          key,
          label: PRAYER_LIST.find((p) => p.key === key)?.label || key,
          at: cleanTime(data.timings[key]),
          countdown: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
        };
      }
    }
    // All passed — next Fajr ≈ today's Fajr + 24h
    const { h, m } = to24h(data.timings.Fajr);
    const t = new Date(nowD);
    t.setHours(h, m, 0, 0);
    t.setDate(t.getDate() + 1);
    const diff = Math.floor((t.getTime() - nowD.getTime()) / 1000);
    const hh = Math.floor(diff / 3600);
    const mm = Math.floor((diff % 3600) / 60);
    const ss = diff % 60;
    return {
      key: "Fajr" as keyof Timings,
      label: "الفجر",
      at: cleanTime(data.timings.Fajr),
      countdown: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
    };
  }, [data, now]);

  const bearing = location ? qiblaBearing(location.lat, location.lng) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">مواقيت الصلاة والقبلة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          طريقة الحساب: الهيئة المصرية العامة للمساحة — البيانات من Aladhan.com المجاني
        </p>
      </div>

      {/* Location controls */}
      <Card className="p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1">
            <Select
              value={CITIES.some((c) => c.name === location?.name) ? location?.name : undefined}
              onValueChange={selectCity}
            >
              <SelectTrigger className="w-full">
                <MapPin className="h-4 w-4 ml-2 text-primary" />
                <SelectValue placeholder={location?.name || "اختر مدينتك"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CITIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={useMyLocation}
            disabled={geoLoading}
            className="flex-shrink-0"
          >
            <Crosshair className="h-4 w-4 ml-1" />
            {geoLoading ? "جارٍ التحديد..." : "موقعي الحالي"}
          </Button>
        </div>
        {offline && data && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
            <WifiOff className="h-3.5 w-3.5" />
            لا يوجد اتصال — تُعرض آخر مواقيت محفوظة لليوم نفسه
          </p>
        )}
      </Card>

      {loading && !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-5 rounded-2xl animate-pulse">
              <div className="h-4 w-16 rounded bg-muted mb-3" />
              <div className="h-7 w-20 rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : !data ? (
        <Card className="p-8 text-center rounded-2xl">
          <p className="text-sm text-muted-foreground">
            تعذر جلب المواقيت — تأكد من اتصالك بالإنترنت وحاول مرة أخرى
          </p>
        </Card>
      ) : (
        <>
          {/* Hijri date */}
          {data.hijri && (
            <p className="text-center text-sm text-muted-foreground">
              التاريخ الهجري:{" "}
              <span className="font-semibold text-foreground">{data.hijri}</span>{" "}
              <span className="text-accent">{data.hijriMonth}</span> هـ
            </p>
          )}

          {/* Next prayer banner */}
          {nextInfo && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy via-burgundy to-[#4A0A12] text-primary-foreground p-5 text-center">
              <div className="absolute inset-0 pattern-arabesque opacity-20" aria-hidden="true" />
              <div className="relative z-10">
                <p className="text-xs text-primary-foreground/70">الصلاة القادمة</p>
                <p className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-arabic)" }}>
                  {nextInfo.label} — {nextInfo.at}
                </p>
                <p className="mt-2 text-sm text-gold tabular-nums" dir="ltr">
                  {nextInfo.countdown}
                </p>
              </div>
            </div>
          )}

          {/* Timings grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRAYER_LIST.map((p) => {
              const Icon = p.icon;
              const isNext = nextInfo?.key === p.key;
              return (
                <Card
                  key={p.key}
                  className={cn(
                    "p-4 rounded-2xl text-center transition-all",
                    isNext && "ring-2 ring-gold bg-primary/5"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mx-auto mb-2", isNext ? "text-accent" : "text-muted-foreground")} />
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums" dir="ltr">
                    {data.timings[p.key]}
                  </p>
                  {isNext && (
                    <p className="mt-1 text-[10px] text-accent font-semibold">الصلاة القادمة</p>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Qibla */}
          <Card className="p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-primary" />
              <h2 className="font-bold">اتجاه القبلة</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative h-36 w-36 flex-shrink-0" dir="ltr">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3" />
                  {/* Cardinal labels */}
                  <text x="50" y="12" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">ش</text>
                  <text x="92" y="53" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">ق</text>
                  <text x="50" y="95" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">ج</text>
                  <text x="8" y="53" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">غ</text>
                  {/* Tick marks */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <line
                      key={deg}
                      x1="50"
                      y1="4"
                      x2="50"
                      y2="8"
                      stroke="var(--muted-foreground)"
                      strokeWidth={deg % 90 === 0 ? 1.5 : 0.7}
                      transform={`rotate(${deg} 50 50)`}
                    />
                  ))}
                  {/* Qibla arrow */}
                  <g transform={`rotate(${bearing} 50 50)`}>
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="16"
                      stroke="var(--gold)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <polygon points="50,10 46,19 54,19" fill="var(--gold)" />
                    <circle cx="50" cy="50" r="4" fill="var(--primary)" />
                  </g>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  من {location?.name || "موقعك"} إلى الكعبة المشرفة
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-primary" dir="ltr">
                  {bearing.toFixed(1)}°
                </p>
                <p className="mt-1 text-sm font-semibold">{cardinalAr(bearing)}</p>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  وجّه السهم من الشمال: السهم يشير إلى اتجاه القبلة على خريطة البوصلة
                  (الزاوية المحسوبة من الشمال باتجاه عقارب الساعة).
                </p>
              </div>
            </div>
          </Card>

          <p className="text-center text-[11px] text-muted-foreground px-4">
            المواقيت تُجلب مرة يوميًا وتُخزَّن محليًا — تعمل الصفحة بدون إنترنت بعد أول تحميل.
          </p>
        </>
      )}
    </div>
  );
}
