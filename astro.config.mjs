import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

const siteDomain =
  (typeof process !== 'undefined' && process.env?.CURRENT_SITE_DOMAIN) || 'threekingsmonument.com';

// https://astro.build/config
export default defineConfig({
  site: `https://${siteDomain}`,
  // Server output so the weather block can be fetched and cached on the server
  // (Cloudflare Worker) instead of in the visitor's browser.
  // Pages that do not need runtime data opt back into prerendering.
  output: 'server',
  adapter: cloudflare(),
  i18n: {
    defaultLocale: 'th',
    locales: ['th', 'en', 'zh'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
