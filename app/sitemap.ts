import type { MetadataRoute } from "next";
import { LEGAL_PAGES } from "@/components/legal/LegalLinks";
import { PRODUCTION_SITE_URL } from "@/lib/site";

// Public pages only. No lastModified: reading the current time is not allowed while prerendering.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: PRODUCTION_SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${PRODUCTION_SITE_URL}/inscription`, changeFrequency: "monthly", priority: 0.8 },
    ...LEGAL_PAGES.map((page) => ({
      url: `${PRODUCTION_SITE_URL}${page.href}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
