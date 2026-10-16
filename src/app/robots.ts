import type { MetadataRoute } from "next";
import { PRIVATE_PAGES, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE_PAGES] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
