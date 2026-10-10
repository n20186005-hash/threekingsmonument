import type { APIRoute } from 'astro';
import { siteConfig } from '../config';

const base = siteConfig.domain;
const langs = ['th', 'en', 'zh'] as const;

// Home pages: every language + x-default (→ English).
const home: { loc: string; alts: { hreflang: string; href: string }[] }[] = langs.map((l) => ({
  loc: `${base}/${l}/`,
  alts: [
    ...langs.map((a) => ({ hreflang: a, href: `${base}/${a}/` })),
    { hreflang: 'x-default', href: `${base}/en/` },
  ],
}));

// English-only deep-dive pages (translations pending).
const subpages = ['history', 'visiting-guide', 'nearby-attractions'].map((slug) => ({
  loc: `${base}/en/${slug}/`,
  alts: [
    { hreflang: 'en', href: `${base}/en/${slug}/` },
    { hreflang: 'x-default', href: `${base}/en/${slug}/` },
  ],
}));

const urls = [...home, ...subpages];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
${u.alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`).join('\n')}
  </url>`
  )
  .join('\n')}
</urlset>`;

export const GET: APIRoute = () =>
  new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
