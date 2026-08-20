import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { movies, series } from "@/db/schema";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const now = new Date();

  const [movieRows, seriesRows] = await Promise.all([
    db
      .select({ slug: movies.slug, updatedAt: movies.updatedAt })
      .from(movies)
      .where(eq(movies.published, true)),
    db
      .select({ slug: series.slug, updatedAt: series.updatedAt })
      .from(series)
      .where(eq(series.published, true)),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/home`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/series`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/series/explore`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/shorts`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${baseUrl}/requests`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/changelog`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/dmca`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const moviePages: MetadataRoute.Sitemap = movieRows.map((m) => ({
    url: `${baseUrl}/movies/${m.slug}`,
    lastModified: m.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const seriesPages: MetadataRoute.Sitemap = seriesRows.map((s) => ({
    url: `${baseUrl}/series/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...moviePages, ...seriesPages];
}