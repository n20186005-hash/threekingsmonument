export const siteConfig = {
  // attraction basics
  name: {
    th: 'อนุสาวรีย์สามกษัตริย์',
    en: 'Three Kings Monument',
    zh: '三王纪念碑',
  },
  slug: 'three-kings-monument',
  domain: 'https://three-kings-monument.com',

  // Google Maps — Hero / Gallery / Reviews and JSON-LD sameAs point here
  mapsUrl: 'https://maps.app.goo.gl/5BGjMqx9Y8KDnVYFA',
  // Footer uses a separate, dedicated Google Maps link
  mapsUrlFooter: 'https://maps.app.goo.gl/5BGjMqx9Y8KDnVYFA',

  // real coordinates for the live weather / sunset API (Three Kings Monument, Chiang Mai)
  coords: {
    lat: 18.7889,
    lng: 98.9925,
    label: {
      th: '๑๘.๗๙°N · ๙๘.๙๙°E',
      en: '18.79°N · 98.99°E',
      zh: '北纬 18.79° · 东经 98.99°',
    },
  },

  rating: '4.3',
  reviewCount: '8,964',
  category: {
    th: 'อนุสาวรีย์',
    en: 'Monument',
    zh: '纪念碑',
  },

  // contact
  address: {
    th: 'QXRP+3WX, ถนนพระปกเกล้า ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200 ประเทศไทย',
    en: 'QXRP+3WX, Prapokklao Road, Si Phum, Mueang Chiang Mai District, Chiang Mai 50200, Thailand',
    zh: 'QXRP+3WX，帕坡考劳路，诗鹏区，孟清迈县，清迈 50200，泰国',
  },
  phone: '+6653248604',
  phoneDisplay: '+66 53 248 604',
  plusCode: 'QXRP+3WX · Chiang Mai',

  hours: {
    th: 'เปิดให้เข้าชมตลอด ๒๔ ชั่วโมง',
    en: 'Open 24 hours',
    zh: '全天 24 小时开放',
  },

  // JSON-LD / OG
  sameAs: [
    'https://maps.app.goo.gl/5BGjMqx9Y8KDnVYFA',
  ],

  // authoritative reference sources (E-E-A-T)
  sources: [
    {
      name: {
        th: 'การท่องเที่ยวแห่งประเทศไทย (ททท.)',
        en: 'Tourism Authority of Thailand (TAT)',
        zh: '泰国国家旅游局（TAT）',
      },
      url: 'https://www.tourismthailand.org',
    },
    {
      name: {
        th: 'วิกิพีเดีย — อนุสาวรีย์สามกษัตริย์',
        en: 'Wikipedia — Three Kings Monument',
        zh: '维基百科 — 三王纪念碑',
      },
      url: 'https://en.wikipedia.org/wiki/Three_Kings_Monument',
    },
    {
      name: {
        th: 'Google Maps — ตำแหน่งที่ได้รับการยืนยัน',
        en: 'Google Maps — Verified location',
        zh: 'Google Maps — 已核实位置',
      },
      url: 'https://maps.app.goo.gl/5BGjMqx9Y8KDnVYFA',
    },
  ],
} as const;
