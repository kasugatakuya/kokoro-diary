import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_PAGES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "/" : path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
