const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('src/i18n/zh.json', 'utf8'));
const th = JSON.parse(fs.readFileSync('src/i18n/th.json', 'utf8'));

const paths = [
  'hero.foundingTag',
  'sundayStatus.activeLabel', 'sundayStatus.activeText', 'sundayStatus.idleLabel', 'sundayStatus.idleText',
  'history.pact.title', 'history.pact.text',
  'history.sevenOmens.title', 'history.sevenOmens.source', 'history.sevenOmens.items',
  'history.statuePositions.title', 'history.statuePositions.items', 'history.statuePositions.note',
  'guide.audioGuide.label', 'guide.audioGuide.desc', 'guide.audioGuide.comingSoon',
  'guide.culturalEvents.title', 'guide.culturalEvents.items',
  'food.museums', 'food.comboTicket',
  'footer.citationsTitle', 'footer.citationsNote', 'footer.citations',
];

function get(o, p) { return p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
const out = [];
for (const [name, obj] of [['en', en], ['zh', zh], ['th', th]]) {
  const misses = [];
  for (const p of paths) {
    const v = get(obj, p);
    if (v === undefined || v === null) misses.push(p);
    else if (Array.isArray(v) && v.length === 0) misses.push(p + ' (empty)');
  }
  out.push(`=== ${name} === ` + (misses.length ? 'MISSING: ' + misses.join(', ') : 'ALL KEYS OK'));
}
function arrLen(o, p) { const v = get(o, p); return Array.isArray(v) ? v.length : 'n/a'; }
for (const p of ['history.sevenOmens.items', 'history.statuePositions.items', 'guide.culturalEvents.items', 'food.museums', 'footer.citations', 'gallery.alts']) {
  out.push(`${p}: en=${arrLen(en,p)} zh=${arrLen(zh,p)} th=${arrLen(th,p)}`);
}
fs.writeFileSync('check_result.txt', out.join('\n'));
