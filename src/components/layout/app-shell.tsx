"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BookOpen,
  Shield,
  Sunrise,
  Moon,
  Heart,
  Search,
  Library,
  Settings,
  X,
  CircleDot,
  Compass,
  BookMarked,
  Baby,
  BellRing,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GlobalPlayerBar } from "@/components/audio/global-player-bar";
import { usePlayerStore, useAudioEngineState } from "@/stores/player";
import { useLibraryStore } from "@/stores/library";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  category: "main" | "adhkar" | "library";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home, category: "main" },
  { href: "/quran", label: "القرآن", icon: BookOpen, category: "main" },
  { href: "/hifdh", label: "الحفظ والختمة", icon: BookMarked, category: "main" },
  { href: "/kids", label: "سور للصغار", icon: Baby, category: "main" },
  { href: "/ruqyah", label: "الرقية", icon: Shield, category: "main" },
  { href: "/morning", label: "أذكار الصباح", icon: Sunrise, category: "adhkar" },
  { href: "/evening", label: "أذكار المساء", icon: Moon, category: "adhkar" },
  { href: "/after-prayer", label: "أذكار بعد الصلاة", icon: BellRing, category: "adhkar" },
  { href: "/adhkar-misc", label: "أذكار متنوعة", icon: ListChecks, category: "adhkar" },
  { href: "/names", label: "أسماء الله الحسنى", icon: Sparkles, category: "adhkar" },
  { href: "/salawat", label: "الصلاة على النبي", icon: Heart, category: "adhkar" },
  { href: "/tasbih", label: "السبحة", icon: CircleDot, category: "adhkar" },
  { href: "/prayer-times", label: "المواقيت والقبلة", icon: Compass, category: "main" },
  { href: "/ramadan", label: "وضع رمضان", icon: Moon, category: "main" },
  { href: "/library", label: "مكتبتي", icon: Library, category: "library" },
  { href: "/search", label: "البحث", icon: Search, category: "library" },
  { href: "/settings", label: "الإعدادات", icon: Settings, category: "library" },
];

// Mobile bottom nav — most important 5 items
const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home, category: "main" },
  { href: "/quran", label: "القرآن", icon: BookOpen, category: "main" },
  { href: "/ruqyah", label: "الرقية", icon: Shield, category: "main" },
  { href: "/library", label: "مكتبتي", icon: Library, category: "library" },
  { href: "/search", label: "البحث", icon: Search, category: "library" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const engine = useAudioEngineState();
  const initPlayer = usePlayerStore((s) => s.init);
  const initLibrary = useLibraryStore((s) => s.init);
  const currentTrack = engine.getCurrentTrack();
  const showPlayerBar = !!currentTrack;

  useEffect(() => {
    setMounted(true);
    initPlayer();
    initLibrary();
  }, [initPlayer, initLibrary]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Periodically save playback position
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const engine = getAudioEngine();
      engine.savePosition();
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border pt-safe">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="القائمة">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Logo />
                      <div>
                        <p className="font-bold text-lg leading-tight">الصادق</p>
                        <p className="text-xs text-muted-foreground">منصة الاستماع الإسلامي</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-2">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="border-t border-border p-4">
                    <p className="text-xs text-muted-foreground text-center">
                      إعداد وتطوير علي محمد الصادق © 2026
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <div className="hidden sm:block">
                <p className="font-bold text-base leading-tight">الصادق</p>
                <p className="text-[10px] text-muted-foreground">منصة الاستماع الإسلامي</p>
              </div>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.slice(0, 8).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search + Settings desktop */}
          <div className="flex items-center gap-1">
            <Link href="/search" className="hidden md:flex">
              <Button variant="ghost" size="icon" aria-label="بحث">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/settings" className="hidden md:flex">
              <Button variant="ghost" size="icon" aria-label="الإعدادات">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 mx-auto w-full max-w-6xl px-4 pb-32 md:pb-40",
          showPlayerBar ? "pb-44 md:pb-40" : "pb-24 md:pb-16"
        )}
      >
        {children}
      </main>

      {/* Global Player Bar */}
      {showPlayerBar && <GlobalPlayerBar />}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border pb-safe md:hidden">
        <div className="flex items-center justify-around h-16">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                aria-label={item.label}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Logo />
                <p className="font-bold">الصادق</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                منصة استماع إسلامية صوتية متكاملة — تجمع بين القرآن الكريم والرقية الشرعية
                والأذكار والصلاة على النبي ﷺ، بتجربة استخدام هادئة وفاخرة.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-3">روابط سريعة</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/quran" className="hover:text-foreground">القرآن الكريم</Link></li>
                <li><Link href="/ruqyah" className="hover:text-foreground">الرقية الشرعية</Link></li>
                <li><Link href="/morning" className="hover:text-foreground">أذكار الصباح</Link></li>
                <li><Link href="/evening" className="hover:text-foreground">أذكار المساء</Link></li>
                <li><Link href="/after-prayer" className="hover:text-foreground">أذكار بعد الصلاة</Link></li>
                <li><Link href="/names" className="hover:text-foreground">أسماء الله الحسنى</Link></li>
                <li><Link href="/salawat" className="hover:text-foreground">الصلاة على النبي ﷺ</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3">عن المنصة</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">حول المشروع</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">الأسئلة الشائعة</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">سياسة الخصوصية</Link></li>
                <li><Link href="/sources" className="hover:text-foreground">المصادر والتراخيص</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            <p>الصادق — منصة الاستماع الإسلامي © 2026</p>
            <p className="mt-1">إعداد وتطوير: علي محمد الصادق</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div
      className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-md"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-primary-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        {/* Open book icon — represents Quran */}
        <path
          d="M12 4v16M4 6c2 0 4 1 8 2 4-1 6-2 8-2v12c-2 0-4 1-8 2-4-1-6-2-8-2V6z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Need to import at bottom since it's used inside effect
import { getAudioEngine } from "@/lib/audio/engine";
