// Notification scheduler — client-side reminders
// Checks every 30s whether a reminder time has been reached today.
// Fires via the Service Worker (registration.showNotification) when available
// — this keeps notifications working while the tab is hidden and enables
// click-to-navigate through the SW's notificationclick handler.
// Requires explicit user permission (never asked automatically).

import type { NotificationSetting } from "@/types/content";
import { notificationStorage } from "@/lib/storage";

const DEFAULTS: NotificationSetting[] = [
  { id: "notif-morning", type: "morning-azkar", enabled: false, time: "06:30", label: "أذكار الصباح" },
  { id: "notif-evening", type: "evening-azkar", enabled: false, time: "17:30", label: "أذكار المساء" },
  { id: "notif-after-prayer", type: "after-prayer", enabled: false, time: "05:40", label: "أذكار بعد الصلاة" },
  { id: "notif-salawat", type: "salawat", enabled: false, time: "08:00", label: "الصلاة على النبي ﷺ" },
  { id: "notif-quran", type: "quran", enabled: false, time: "21:00", label: "تذكير القرآن" },
  { id: "notif-ruqyah", type: "ruqyah", enabled: false, time: "20:00", label: "تذكير الرقية" },
];

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
const firedToday = new Set<string>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const NOTIF_ROUTES: Record<string, string> = {
  "quran": "/quran",
  "morning-azkar": "/morning",
  "evening-azkar": "/evening",
  "after-prayer": "/after-prayer",
  "salawat": "/salawat",
  "ruqyah": "/ruqyah",
};

const NOTIF_BODIES: Record<string, string> = {
  "quran": "حان وقت تلاوة القرآن الكريم — استمع الآن",
  "morning-azkar": "أذكار الصباح تنتظرك — ابدأ يومك بذكر الله",
  "evening-azkar": "أذكار المساء — أختم يومك بذكر الله",
  "after-prayer": "أذكار ما بعد الصلاة — تسبيحٌ بأجْب وتمام المئة بعد التسليم",
  "salawat": "دقيقة واحدة من الصلاة على النبي ﷺ — صلى الله عليه وعلى آله وسلم",
  "ruqyah": "وقت الرقية الشرعية — تحصّن بإذن الله",
};

export function getAllNotifications(): NotificationSetting[] {
  const stored = notificationStorage.getAll();
  if (stored.length === 0) {
    notificationStorage.set(DEFAULTS);
    return DEFAULTS;
  }
  // دمج التذكيرات الجديدة مع إعدادات المستخدم القديمة دون فقدان أي تفضيل
  const missing = DEFAULTS.filter((d) => !stored.some((s) => s.id === d.id));
  if (missing.length > 0) {
    const merged = [...stored, ...missing];
    notificationStorage.set(merged);
    return merged;
  }
  return stored;
}

export function updateNotification(id: string, patch: Partial<NotificationSetting>) {
  const all = getAllNotifications().map((n) =>
    n.id === id ? { ...n, ...patch } : n
  );
  notificationStorage.set(all);
  restartScheduler();
  return all;
}

export function disableAllNotifications(): NotificationSetting[] {
  const all = getAllNotifications().map((n) => ({ ...n, enabled: false }));
  notificationStorage.set(all);
  restartScheduler();
  return all;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Show a notification via the Service Worker when possible, else via the page. */
async function showNotification(payload: {
  title: string;
  body: string;
  tag: string;
  url: string;
}): Promise<void> {
  const options: NotificationOptions & { data?: { url: string } } = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    lang: "ar",
    dir: "rtl",
    tag: payload.tag,
    data: { url: payload.url },
  };

  // Preferred: Service Worker registration — works when tab is hidden
  if (typeof navigator !== "undefined" && navigator.serviceWorker) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(payload.title, options);
        return;
      }
    } catch (err) {
      console.error("[notifications] SW show failed, falling back", err);
    }
  }

  // Fallback: page-level Notification
  if (typeof Notification === "undefined") return;
  const n = new Notification(payload.title, options);
  n.onclick = () => {
    window.focus();
    window.location.href = payload.url;
    n.close();
  };
}

function checkReminders() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const key = todayKey();

  for (const notif of getAllNotifications()) {
    if (!notif.enabled) continue;
    const fireId = `${notif.id}:${key}`;
    if (firedToday.has(fireId)) continue;

    const target = timeToMinutes(notif.time);
    if (nowMinutes === target || (nowMinutes > target && nowMinutes - target <= 1)) {
      firedToday.add(fireId);
      void showNotification({
        title: notif.label,
        body: NOTIF_BODIES[notif.type] || "تذكير من منصة الصادق",
        tag: fireId,
        url: NOTIF_ROUTES[notif.type] || "/",
      });
    }
  }
}

export function restartScheduler() {
  if (schedulerTimer) clearInterval(schedulerTimer);
  if (typeof window === "undefined") return;
  schedulerTimer = setInterval(() => {
    checkReminders();
  }, 30_000);
  checkReminders();
}

/** Fire an immediate test notification (used by the settings page). */
export async function fireTestNotification(): Promise<boolean> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return false;
  }
  try {
    await showNotification({
      title: "تذكير تجريبي — الصادق",
      body: "هكذا ستوصلك التذكيرات يوميًا، بارك الله فيك",
      tag: "sadik-test-notification",
      url: "/settings",
    });
    return true;
  } catch (err) {
    console.error("[notifications] test failed", err);
    return false;
  }
}
