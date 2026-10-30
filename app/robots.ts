import type { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/site";

// Private areas and customers' request links must never be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/espace", "/admin", "/demande/", "/api/", "/auth/"],
    },
    sitemap: `${PRODUCTION_SITE_URL}/sitemap.xml`,
  };
}
