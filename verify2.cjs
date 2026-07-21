const fs = require('fs');
const cases = {
  en: ['Pact of Three Kings', 'Seven Auspicious', 'statue positions', 'Cultural Calendar', 'Audio Guide', 'Citations', 'Cultural Triangle', 'coming soon'],
  th: ['พันธมิตร', 'มงคล', 'ประติมากรรม', 'ปฏิทิน', 'เสียง', 'อ้างอิง', 'พิพิธภัณฑ์', 'เร็วๆ นี้'],
  zh: ['三王之盟', '七大吉兆', '雕像站位', '文化历法', '语音导览', '参考文献', '文化三角区', '制作中'],
};
const out = [];
for (const [L, strs] of Object.entries(cases)) {
  const t = fs.readFileSync(`dist/${L}/index.html`, 'utf8');
  const miss = strs.filter(s => !t.includes(s));
  out.push(`[${L}] missing: ${miss.length ? miss.join(' | ') : 'NONE OK'}`);
}
const zh = fs.readFileSync('dist/zh/index.html', 'utf8');
const refs12 = (zh.match(/three-kings-monument-12\.jpg/g) || []).length;
const refs13 = (zh.match(/three-kings-monument-13\.jpg/g) || []).length;
out.push(`gallery ref #12: ${refs12} (want 0), #13: ${refs13} (want >0)`);
fs.writeFileSync('verify2_result.txt', out.join('\n'));
