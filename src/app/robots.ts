import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/offline.html"],
    },
    sitemap: "https://sadik.example.com/sitemap.xml",
    host: "https://sadik.example.com",
  };
}
