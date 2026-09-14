// Cloudflare Workers has no `process` global, so read it defensively.
const buildEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env
    ? (process.env as Record<string, string | undefined>)
    : {};

export const siteConfig = {
  // attraction basics
  name: {
    th: 'อนุสาวรีย์สามกษัตริย์',
    en: 'Three Kings Monument',
    zh: '三王纪念碑',
  },
  slug: 'three-kings-monument',
  domain: buildEnv.CURRENT_SITE_DOMAIN
    ? `https://${buildEnv.CURRENT_SITE_DOMAIN}`
    : 'https://threekingsmonument.com',

  /* ────────────────────────────────────────────────────────────────────────
   * 单景点 SEO 实体绑定配置变量表 (Single-attraction SEO entity binding)
   * 更换景点时只需替换下面 entity 区块即可复用全部模版。
   *
   *   {{DOMAIN_NAME}}            → siteConfig.domain
   *   {{ATTRACTION_FULL_NAME}}   → siteConfig.entity.fullName
   *   {{ATTRACTION_SHORT_NAME}}  → siteConfig.entity.shortName
   *   {{CITY_NAME}}              → siteConfig.entity.city
   *   {{STATE_PROVINCE}}         → siteConfig.entity.province
   *   {{COUNTRY_NAME}}           → siteConfig.entity.country
   *   {{COUNTRY_CODE_2LETTER}}   → siteConfig.entity.countryCode
   *   {{POSTAL_CODE}}            → siteConfig.entity.postalCode
   *   {{LATITUDE}}               → siteConfig.coords.lat
   *   {{LONGITUDE}}              → siteConfig.coords.lng
   *   {{MAPS_SHARE_URL}}         → siteConfig.mapsUrl
   *   {{MAPS_EMBED_SRC}}         → siteConfig.mapsEmbedSrc
   *   {{NEARBY_LANDMARK_1}}      → siteConfig.entity.nearby[0]
   *   {{NEARBY_LANDMARK_2}}      → siteConfig.entity.nearby[1]
   *   {{GOVT_TOURISM_URL}}       → siteConfig.govtTourismUrl
   * ──────────────────────────────────────────────────────────────────────── */
  entity: {
    // {{ATTRACTION_FULL_NAME}} — 景点官方全称
    fullName: {
      th: 'พระบรมราชานุสาวรีย์สามกษัตริย์',
      en: 'Three Kings Monument',
      zh: '三王纪念碑',
    },
    // {{ATTRACTION_SHORT_NAME}} — 常用俗称 / 域名对应含义
    shortName: {
      th: 'อนุสาวรีย์สามกษัตริย์',
      en: 'Three Kings Monument',
      zh: '三王纪念碑',
    },
    // {{CITY_NAME}} — 所在城市
    city: {
      th: 'เชียงใหม่',
      en: 'Chiang Mai',
      zh: '清迈',
    },
    // {{STATE_PROVINCE}} — 所在省/府/州
    province: {
      th: 'จังหวัดเชียงใหม่',
      en: 'Chiang Mai Province',
      zh: '清迈府',
    },
    // {{COUNTRY_NAME}} — 所在国家
    country: {
      th: 'ประเทศไทย',
      en: 'Thailand',
      zh: '泰国',
    },
    // {{COUNTRY_CODE_2LETTER}} — 两位国家代码
    countryCode: 'TH',
    // {{POSTAL_CODE}} — 邮政编码
    postalCode: '50200',
    // {{NEARBY_LANDMARK_1}} / {{NEARBY_LANDMARK_2}} — 周边核心地标
    nearby: {
      th: ['วัดเจดีย์หลวง', 'วัดพระสิงห์'],
      en: ['Wat Chedi Luang', 'Wat Phra Singh'],
      zh: ['契迪龙寺', '帕辛寺'],
    },
    // 搜索词形变体 — 用于 JSON-LD alternateName，对齐 GSC 中的错拼与繁体写法
    altNames: {
      th: [
        'ลานอนุสาวรีย์สามกษัตริย์',
        'อนุสาวรีย์ 3 กษัตริย์',
        'อนุสาวรีย์3กษัตริย์',
        'รูปปั้นสามกษัตริย์',
        'ลานสามกษัตริย์',
      ],
      en: [
        '3 Kings Monument',
        'Three King Monument',
        'Three Kings Monument Chiang Mai',
        'King Mengrai Monument',
      ],
      zh: ['三王紀念碑', '建都三王紀念像', '清迈三王纪念碑'],
    },
  },

  // {{MAPS_SHARE_URL}} — Google Maps 分享短链接（Hero / Gallery / Reviews / JSON-LD sameAs）
  mapsUrl: 'https://maps.app.goo.gl/5BGjMqx9Y8KDnVYFA',
  // Footer uses a separate, dedicated Google Maps link
  mapsUrlFooter: 'https://maps.app.goo.gl/5BGjMqx9Y8KDnVYFA',
  // {{MAPS_EMBED_SRC}} — Google Maps 嵌入代码中的 src 链接
  // 取自官方 Maps 分享代码（place ID 0x30da3a99aea090bf:0xd27733ba3bc943d2），
  // 其中的 !2d / !3d 必须与下方 coords 一致，否则嵌入图与 geo 信号会互相矛盾。
  mapsEmbedSrc:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6551.04260408013!2d98.9873528!3d18.7902317!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30da3a99aea090bf%3A0xd27733ba3bc943d2!2sThree%20Kings%20Monument!5e1!3m2!1sen!2s!4v1789369797623!5m2!1sen!2s',
  // {{GOVT_TOURISM_URL}} — 当地政府 / 官方旅游局链接
  govtTourismUrl: 'https://www.tourismthailand.org',

  // Real coordinates — verified against the official Google Maps listing
  // (18.7902317 N, 98.9873528 E). Used by the live weather API, the JSON-LD
  // `geo` block and the geo.position / ICBM meta tags, so all three agree.
  coords: {
    lat: 18.7902,
    lng: 98.9874,
    label: {
      th: '๑๘.๗๙๐๒°N · ๙๘.๙๘๗๔°E',
      en: '18.7902°N · 98.9874°E',
      zh: '北纬 18.7902° · 东经 98.9874°',
    },
  },

  // Google Maps snapshot — re-synced manually from the official Google Maps listing
  rating: '4.3',
  reviewCount: '9,034',
  // 同步月份（用于评分与评价数的来源说明）
  reviewSync: '2026-09',

  category: {
    th: 'อนุสาวรีย์',
    en: 'Monument',
    zh: '纪念碑',
  },

  // contact
  address: {
    th: 'QXRP+3WX, ถนนพระปกเกล้า เมืองเก่า ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200 ประเทศไทย',
    en: 'QXRP+3WX, Prapokklao Road, Old City, Tambon Si Phum, Mueang Chiang Mai District, Chiang Mai 50200, Thailand',
    zh: 'QXRP+3WX，帕坡考劳路，诗鹏区古城，孟清迈县，清迈 50200，泰国',
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
    'https://www.tourismthailand.org',
  ],

  // authoritative reference sources (E-E-A-T)
  sources: [
    {
      name: {
        th: 'การท่องเที่ยวแห่งประเทศไทย (ททท.)',
        en: 'Tourism Authority of Thailand (TAT)',
        zh: '泰国国家旅游局（TAT）',
      },
      note: {
        th: 'หน่วยงานท่องเที่ยวอย่างเป็นทางการของประเทศไทย',
        en: 'Official national tourism authority of Thailand',
        zh: '泰国官方国家旅游机构',
      },
      url: 'https://www.tourismthailand.org',
    },
    {
      name: {
        th: 'วิกิพีเดีย — อนุสาวรีย์สามกษัตริย์',
        en: 'Wikipedia — Three Kings Monument',
        zh: '维基百科 — 三王纪念碑',
      },
      note: {
        th: 'บทความสารานุกรมเปิด',
        en: 'Open encyclopaedia article',
        zh: '公开百科条目',
      },
      url: 'https://en.wikipedia.org/wiki/Three_Kings_Monument',
    },
    {
      name: {
        th: 'Google Maps — ตำแหน่งที่ได้รับการยืนยันและรีวิวผู้ใช้',
        en: 'Google Maps — Verified location & user reviews',
        zh: 'Google Maps — 已核实位置与用户评价',
      },
      note: {
        th: 'ตำแหน่งและรีวิว · ซิงก์กันยายน 2026',
        en: 'Location & visitor reviews · synced September 2026',
        zh: '位置与用户评价 · 同步时间 2026 年 9 月',
      },
      url: 'https://maps.app.goo.gl/5BGjMqx9Y8KDnVYFA',
    },
  ],
} as const;
