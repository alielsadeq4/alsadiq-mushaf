"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        setRegistration(reg);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });

        setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 60 * 1000);
      } catch (err) {
        console.error("[PWA] registration failed", err);
      }
    };

    register();

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    // Install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Don't show install button if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstallDismissed(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;
    registration.waiting.postMessage("SKIP_WAITING");
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {updateAvailable && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in-up">
          <Card className="p-4 shadow-2xl border-primary/30">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">يوجد تحديث جديد</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تتوفر نسخة جديدة من المنصة. حدّث الآن للحصول على أحدث الميزات.
                </p>
              </div>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={handleUpdate}
              size="sm"
              className="w-full mt-3 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث الآن
            </Button>
          </Card>
        </div>
      )}

      {/* Install prompt — shown once when available and not installed */}
      {installPrompt && !installDismissed && !updateAvailable && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 animate-fade-in-up">
          <Card className="p-4 shadow-2xl border-primary/30">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">ثبّت التطبيق</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  أضف الصادق إلى شاشتك الرئيسية لاستخدام أسرع وتجربة بلا متصفح.
                </p>
              </div>
              <button
                onClick={() => setInstallDismissed(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full mt-3 bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 ml-2" />
              تثبيت الآن
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
