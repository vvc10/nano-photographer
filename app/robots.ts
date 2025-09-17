import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const host = process.env.NEXT_PUBLIC_SITE_URL || "https://nanographer.example.com"
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${host}/sitemap.xml`,
  }
}
