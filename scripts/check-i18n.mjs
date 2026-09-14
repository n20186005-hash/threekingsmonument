import { readFileSync } from 'node:fs';

const LANGS = ['th', 'en', 'zh'];

const paths = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, val]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    return val && typeof val === 'object' && !Array.isArray(val) ? paths(val, next) : [next];
  });

const loaded = Object.fromEntries(
  LANGS.map((lang) => [
    lang,
    JSON.parse(readFileSync(new URL(`../src/i18n/sections/${lang}.json`, import.meta.url), 'utf8')),
  ])
);

// script contamination guard: thai files must not carry cyrillic / arabic / CJK
const FORBIDDEN = {
  th: /[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]/u,
  en: /[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u0E00-\u0E7F]/u,
  zh: /[\u0400-\u04FF\u0600-\u06FF\u0E00-\u0E7F]/u,
};

const reference = paths(loaded.en).sort();
let failures = 0;

for (const lang of LANGS) {
  const list = paths(loaded[lang]).sort();
  const missing = reference.filter((k) => !list.includes(k));
  const extra = list.filter((k) => !reference.includes(k));
  if (missing.length || extra.length) {
    failures += 1;
    console.log(`[${lang}] key mismatch → missing: ${missing.join(', ') || '-'} | extra: ${extra.join(', ') || '-'}`);
  } else {
    console.log(`[${lang}] keys ok (${list.length})`);
  }

  const hits = new Set();
  const walk = (value) => {
    if (typeof value === 'string') {
      const hit = value.match(FORBIDDEN[lang]);
      if (hit) hits.add(hit[0]);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  walk(loaded[lang]);
  if (hits.size) {
    failures += 1;
    console.log(`[${lang}] unexpected script characters: ${[...hits].join(' ')}`);
  } else {
    console.log(`[${lang}] script ok`);
  }
}

process.exit(failures ? 1 : 0);
