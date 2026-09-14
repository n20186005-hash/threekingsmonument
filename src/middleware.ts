import { defineMiddleware } from 'astro:middleware';
import { defaultLang, languagesList, type Lang } from './i18n/ui';

const HOME_PAGES = new Set(languagesList.map((lang) => `/${lang}/`));

/** Anything with a file extension is an asset, never a page URL. */
const ASSET_PATH = /\.[a-z0-9]+$/i;

/**
 * Best locale for an Accept-Language header. Falls back to the site default
 * (th) — Thailand is by far the largest single source of impressions, so that
 * is the safest landing page for an unmatched visitor.
 */
function negotiate(header: string | null): Lang {
  if (!header) return defaultLang;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag.startsWith('th')) return 'th';
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  return defaultLang;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, hostname } = context.url;

  // One canonical form per page: non-www host, trailing slash on page URLs.
  // Search Console had indexed the www and no-slash variants separately, which
  // splits the signals for the same content.
  const isWww = hostname.startsWith('www.');
  const needsSlash = !ASSET_PATH.test(pathname) && !pathname.endsWith('/');

  if (isWww || needsSlash) {
    const target = new URL(context.url);
    if (isWww) target.hostname = hostname.replace(/^www\./, '');
    if (needsSlash) target.pathname = `${pathname}/`;
    return context.redirect(target.toString(), 301);
  }

  // Root hands the visitor to their own language.
  if (pathname === '/') {
    return context.redirect(`/${negotiate(context.request.headers.get('accept-language'))}/`, 302);
  }

  const response = await next();

  try {
    // HTML pages are revalidated by the browser, while the edge may serve a
    // short-lived copy of the rendered page.
    if (HOME_PAGES.has(pathname)) {
      response.headers.set(
        'Cache-Control',
        'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
      );
    }
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  } catch {
    // Headers are immutable on some responses — ignore.
  }

  return response;
});
