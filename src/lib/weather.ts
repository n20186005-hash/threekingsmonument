import { siteConfig } from '../config';

/* ---------------------------------------------------------------------------
 * Weather data layer + visitor guidance engine.
 *
 * Runs on the server only. The snapshot is fetched while rendering, cached
 * (edge Cache API when available, plus an isolate-level memory cache) and only
 * the finished numbers reach the HTML. The advice engine turns those numbers
 * into what a visitor should actually wear, plan and pack.
 * ------------------------------------------------------------------------- */

export type WeatherGroup =
  | 'clear'
  | 'mainlyClear'
  | 'partlyCloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'showers'
  | 'storm'
  | 'snow';

export interface WeatherNow {
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  gust: number;
  precipitation: number;
  visibility: number;
  uv: number;
  group: WeatherGroup;
  isDay: boolean;
}

export interface WeatherHour {
  group: WeatherGroup;
  temperature: number;
  precipitation: number;
  rainChance: number;
  wind: number;
  gust: number;
  uv: number;
  visibility: number;
}

export interface WeatherDay {
  date: string;
  group: WeatherGroup;
  max: number;
  min: number;
  feelsMax: number;
  feelsMin: number;
  rain: number;
  rainChance: number;
  rainHours: number;
  uv: number;
  windMax: number;
  gustMax: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherSnapshot {
  now: WeatherNow;
  /** Next 24 hours, starting at the current hour. */
  hours: WeatherHour[];
  days: WeatherDay[];
  /** Local timestamp used to render the "updated" line. */
  updatedAt: string;
  timezone: string;
}

const CACHE_TTL_SECONDS = 1800; // 30 minutes
const CACHE_KEY = 'https://threekingsmonument.com/__internal/weather.json';
const REQUEST_TIMEOUT_MS = 4000;

let memoryCache: { storedAt: number; value: WeatherSnapshot } | null = null;

const endpoint = () => {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(siteConfig.coords.lat));
  url.searchParams.set('longitude', String(siteConfig.coords.lng));
  url.searchParams.set('timezone', 'Asia/Bangkok');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_gusts_10m',
    ].join(',')
  );
  url.searchParams.set(
    'hourly',
    [
      'temperature_2m',
      'apparent_temperature',
      'precipitation',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
      'wind_gusts_10m',
      'uv_index',
      'visibility',
    ].join(',')
  );
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'precipitation_sum',
      'precipitation_hours',
      'precipitation_probability_max',
      'uv_index_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'sunrise',
      'sunset',
    ].join(',')
  );
  return url.toString();
};

const groupOf = (code: number): WeatherGroup => {
  if (code === 0) return 'clear';
  if (code === 1) return 'mainlyClear';
  if (code === 2) return 'partlyCloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 95) return 'storm';
  return 'partlyCloudy';
};

const round = (value: unknown, digits = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Number(numeric.toFixed(digits));
};

const at = (series: unknown, index: number) => (Array.isArray(series) ? series[index] : undefined);

const cacheStore = (): Cache | undefined => {
  try {
    const storage = (globalThis as { caches?: CacheStorage }).caches;
    return storage?.default;
  } catch {
    return undefined;
  }
};

async function readCache(): Promise<WeatherSnapshot | null> {
  if (memoryCache && Date.now() - memoryCache.storedAt < CACHE_TTL_SECONDS * 1000) {
    return memoryCache.value;
  }
  const store = cacheStore();
  if (!store) return null;
  try {
    const hit = await store.match(CACHE_KEY);
    if (!hit) return null;
    const value = (await hit.json()) as WeatherSnapshot;
    memoryCache = { storedAt: Date.now(), value };
    return value;
  } catch {
    return null;
  }
}

async function writeCache(value: WeatherSnapshot): Promise<void> {
  memoryCache = { storedAt: Date.now(), value };
  const store = cacheStore();
  if (!store) return;
  try {
    await store.put(
      CACHE_KEY,
      new Response(JSON.stringify(value), {
        headers: {
          'content-type': 'application/json',
          'cache-control': `max-age=${CACHE_TTL_SECONDS}`,
        },
      })
    );
  } catch {
    /* caching is best-effort */
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const normalise = (payload: any): WeatherSnapshot => {
  const current = payload?.current ?? {};
  const hourly = payload?.hourly ?? {};
  const daily = payload?.daily ?? {};

  const updatedAt = String(current.time ?? new Date().toISOString());

  // Slice the hourly series down to the 24 hours that start with "now".
  const hourCount = Array.isArray(hourly.time) ? hourly.time.length : 0;
  let start = hourCount
    ? hourly.time.findIndex((stamp: string) => String(stamp).slice(0, 13) >= updatedAt.slice(0, 13))
    : -1;
  if (start < 0) start = 0;

  const hours: WeatherHour[] = [];
  for (let index = start; index < Math.min(hourCount, start + 24); index += 1) {
    hours.push({
      group: groupOf(round(at(hourly.weather_code, index))),
      temperature: round(at(hourly.temperature_2m, index)),
      precipitation: round(at(hourly.precipitation, index), 1),
      rainChance: round(at(hourly.precipitation_probability, index)),
      wind: round(at(hourly.wind_speed_10m, index)),
      gust: round(at(hourly.wind_gusts_10m, index)),
      uv: round(at(hourly.uv_index, index), 1),
      visibility: round(at(hourly.visibility, index)),
    });
  }

  const days: WeatherDay[] = Array.isArray(daily.time)
    ? daily.time.map((date: string, index: number) => ({
        date,
        group: groupOf(round(at(daily.weather_code, index))),
        max: round(at(daily.temperature_2m_max, index)),
        min: round(at(daily.temperature_2m_min, index)),
        feelsMax: round(at(daily.apparent_temperature_max, index)),
        feelsMin: round(at(daily.apparent_temperature_min, index)),
        rain: round(at(daily.precipitation_sum, index), 1),
        rainChance: round(at(daily.precipitation_probability_max, index)),
        rainHours: round(at(daily.precipitation_hours, index)),
        uv: round(at(daily.uv_index_max, index)),
        windMax: round(at(daily.wind_speed_10m_max, index)),
        gustMax: round(at(daily.wind_gusts_10m_max, index)),
        sunrise: String(at(daily.sunrise, index) ?? ''),
        sunset: String(at(daily.sunset, index) ?? ''),
      }))
    : [];

  const currentHour = hours[0];

  return {
    now: {
      temperature: round(current.temperature_2m),
      feelsLike: round(current.apparent_temperature),
      humidity: round(current.relative_humidity_2m),
      wind: round(current.wind_speed_10m),
      gust: round(current.wind_gusts_10m),
      precipitation: round(current.precipitation, 1),
      visibility: currentHour?.visibility ?? 10000,
      uv: currentHour?.uv ?? days[0]?.uv ?? 0,
      group: groupOf(round(current.weather_code)),
      isDay: round(current.is_day, 0) === 1,
    },
    hours,
    days,
    updatedAt,
    timezone: String(payload?.timezone ?? 'Asia/Bangkok'),
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getWeather(): Promise<WeatherSnapshot | null> {
  const cached = await readCache();
  if (cached) return cached;

  try {
    const response = await fetch(endpoint(), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const snapshot = normalise(await response.json());
    if (!snapshot.days.length) return null;

    await writeCache(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------------
 * Presentation helpers
 * ------------------------------------------------------------------------- */

/** Weekday index (0 = Sunday) for a plain YYYY-MM-DD calendar date. */
export const weekdayIndex = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();

/** "18:42" out of an ISO-ish local timestamp. */
export const clock = (timestamp: string): string =>
  timestamp.length >= 16 ? timestamp.slice(11, 16) : timestamp;

/** "14/09" out of a plain YYYY-MM-DD date. */
export const shortDate = (date: string): string =>
  date.length >= 10 ? `${date.slice(8, 10)}/${date.slice(5, 7)}` : date;

/* ---------------------------------------------------------------------------
 * Guidance engine
 *
 * Grouped into three buckets plus a risk bucket. Every bucket only returns the
 * entries whose conditions actually fire, in priority order, capped so the
 * visitor never gets a wall of text.
 * ------------------------------------------------------------------------- */

export type RiskKey = 'storm' | 'heavyRain' | 'strongWind' | 'heat' | 'cold' | 'lowVisibility' | 'uv';
export type WearKey =
  | 'hot'
  | 'hotHumid'
  | 'rainy'
  | 'bigSwing'
  | 'cold'
  | 'cool'
  | 'windy'
  | 'mild';
export type PlanKey =
  | 'storm'
  | 'rainHeavy'
  | 'rainLight'
  | 'fog'
  | 'clearHot'
  | 'clear'
  | 'cloudy'
  | 'windy'
  | 'mild';
export type GearKey =
  | 'umbrella'
  | 'raincoat'
  | 'sunscreen'
  | 'sunglasses'
  | 'hat'
  | 'water'
  | 'jacket'
  | 'thickCoat'
  | 'extraLayer'
  | 'mask'
  | 'towel'
  | 'shoes'
  | 'drybag';

export interface WeatherAdvice {
  risk: RiskKey[];
  wear: WearKey[];
  plan: PlanKey[];
  gear: GearKey[];
  /** Highest rain probability within the next 12 hours, in percent. */
  rainChanceNext: number;
  /** Whether to explain what a rain probability really means. */
  showProbabilityNote: boolean;
}

const max = (values: number[]) => (values.length ? Math.max(...values) : 0);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export const adviceFor = (snapshot: WeatherSnapshot): WeatherAdvice => {
  const { now } = snapshot;
  const today = snapshot.days[0];
  const next = snapshot.hours.length ? snapshot.hours : [];

  const window12 = next.slice(0, 12);
  const rainChanceNext = max(window12.map((hour) => hour.rainChance));
  const rainSum12 = sum(window12.map((hour) => hour.precipitation));
  const gustMax12 = max(window12.map((hour) => hour.gust));
  const windMax12 = max(window12.map((hour) => hour.wind));
  const visible = window12.map((hour) => hour.visibility).filter((value) => value > 0);
  const visibilityMin = visible.length ? Math.min(...visible) : 0;
  const stormAhead = now.group === 'storm' || window12.some((hour) => hour.group === 'storm');
  const wetNow = now.precipitation >= 0.2;
  const rainy = wetNow || rainChanceNext >= 55 || rainSum12 >= 2;
  const heavyRain = rainSum12 >= 18 || (rainSum12 >= 8 && rainChanceNext >= 80);
  const sweltering = now.feelsLike >= 40 || (today?.max ?? 0) >= 38;
  const hot = (today?.max ?? 0) >= 35 || now.feelsLike >= 34;
  const cold = (today?.min ?? 99) <= 12 || now.feelsLike <= 15;
  const swing = today ? today.max - today.min : 0;
  const uv = Math.max(now.uv, today?.uv ?? 0);
  const sky = today?.group ?? now.group;
  const clearSky = sky === 'clear' || sky === 'mainlyClear';
  // A wide day/night gap only matters when the night is actually cool —
  // in the tropics 33/24 is not "bring a coat" weather.
  const layerNeeded = swing >= 9 && (today?.min ?? 99) <= 22;

  /* --- risk: only what genuinely needs caution --------------------------- */
  const risk: RiskKey[] = [];
  if (stormAhead) risk.push('storm');
  if (heavyRain && !risk.includes('storm')) risk.push('heavyRain');
  if (gustMax12 >= 62) risk.push('strongWind');
  if (sweltering) risk.push('heat');
  if (cold) risk.push('cold');
  if (visibilityMin > 0 && visibilityMin < 1000) risk.push('lowVisibility');
  if (uv >= 11) risk.push('uv');

  /* --- what to wear ------------------------------------------------------ */
  const wear: WearKey[] = [];
  if (now.feelsLike >= 30 && now.humidity >= 70) wear.push('hotHumid');
  else if (hot) wear.push('hot');
  else if (cold) wear.push('cold');
  else if (now.feelsLike <= 24) wear.push('cool');

  if (rainy) wear.push('rainy');
  if (layerNeeded) wear.push('bigSwing');
  if (windMax12 >= 30) wear.push('windy');
  if (!wear.length) wear.push('mild');

  /* --- how to plan the visit -------------------------------------------- */
  const plan: PlanKey[] = [];
  if (stormAhead) plan.push('storm');
  else if (heavyRain) plan.push('rainHeavy');
  else if (rainy) plan.push('rainLight');

  if (visibilityMin > 0 && visibilityMin < 2000) plan.push('fog');

  if (!stormAhead && !heavyRain) {
    if (clearSky) plan.push(hot ? 'clearHot' : 'clear');
    else if (sky === 'overcast' || sky === 'partlyCloudy') plan.push('cloudy');
  }

  if (windMax12 >= 40) plan.push('windy');
  if (!plan.length) plan.push('mild');

  /* --- what to pack, ordered by how much it matters right now ----------- */
  const gear: GearKey[] = [];
  if (heavyRain || stormAhead) gear.push('raincoat', 'drybag');
  if (rainy) gear.push('umbrella');
  if (visibilityMin > 0 && visibilityMin < 2000) gear.push('mask');
  if (cold) gear.push('thickCoat');
  else if (now.feelsLike <= 22) gear.push('jacket');
  if (hot) gear.push('water');
  if (uv >= 5 || clearSky) gear.push('sunscreen');
  if (uv >= 6) gear.push('sunglasses', 'hat');
  if (layerNeeded) gear.push('extraLayer');
  if (now.feelsLike >= 31 && now.humidity >= 70) gear.push('towel');
  if (!gear.length) gear.push('shoes');

  const unique = <T>(values: T[]): T[] => [...new Set(values)];

  return {
    risk: unique(risk).slice(0, 3),
    wear: unique(wear).slice(0, 3),
    plan: unique(plan).slice(0, 3),
    gear: unique(gear).slice(0, 5),
    rainChanceNext,
    // Only worth explaining in the ambiguous middle band.
    showProbabilityNote: !wetNow && rainChanceNext >= 25 && rainChanceNext < 65,
  };
};
