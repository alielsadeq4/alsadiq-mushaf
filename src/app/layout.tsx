import type { Metadata, Viewport } from "next";
import { Cairo, Amiri, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PlayerProvider } from "@/components/audio/player-provider";
import { PWARegister } from "@/components/layout/pwa-register";

const cairo = Cairo({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const amiri = Amiri({
  variable: "--font-quran",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F2EA" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0E12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sadik.example.com"),
  title: {
    default: "الصادق — منصة الاستماع الإسلامي",
    template: "%s — الصادق",
  },
  description:
    "منصة استماع إسلامية صوتية فاخرة — القرآن الكريم كاملًا بأصوات نخبة من القراء، الرقية الشرعية، أذكار الصباح والمساء، والصلاة على النبي ﷺ. من إعداد علي محمد الصادق.",
  keywords: [
    "القرآن الكريم",
    "الرقية الشرعية",
    "أذكار الصباح",
    "أذكار المساء",
    "الصلاة على النبي",
    "استماع القرآن",
    "تلاوات",
    "الصادق",
    "علي محمد الصادق",
    "منصة إسلامية",
  ],
  authors: [{ name: "علي محمد الصادق" }],
  creator: "علي محمد الصادق",
  manifest: "/manifest.json",
  applicationName: "الصادق",
  appleWebApp: {
    capable: true,
    title: "الصادق",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "الصادق — منصة الاستماع الإسلامي",
    description:
      "منصة استماع إسلامية صوتية فاخرة — القرآن الكريم، الرقية الشرعية، الأذكار، والصلاة على النبي ﷺ.",
    type: "website",
    locale: "ar_AR",
    siteName: "الصادق",
    images: [{ url: "/icons/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "الصادق — منصة الاستماع الإسلامي",
    description: "القرآن الكريم كاملًا، الرقية الشرعية، الأذكار، والصلاة على النبي ﷺ.",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${amiri.variable} ${notoKufi.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider>
          <PlayerProvider>
            <AppShell>{children}</AppShell>
            <PWARegister />
            <SonnerToaster position="top-center" richColors />
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
