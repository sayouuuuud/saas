import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saas-gold-seven-80.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/features`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/demo/account`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/demo/admin`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/demo/account/subscription`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/demo/account/usage`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/demo/account/team`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/demo/account/support`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/demo/account/security`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/acceptable-use`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/data-retention`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/integration-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/session-expired`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
