import type { MetadataRoute } from "next";

const ROUTES = [
  "",
  "/quran",
  "/hifdh",
  "/kids",
  "/ruqyah",
  "/morning",
  "/evening",
  "/after-prayer",
  "/adhkar-misc",
  "/names",
  "/salawat",
  "/tasbih",
  "/prayer-times",
  "/ramadan",
  "/library",
  "/search",
  "/settings",
  "/about",
  "/faq",
  "/privacy",
  "/sources",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://sadik.example.com";
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));
}
