// server/weather.ts
// Real weather via Open-Meteo (free, no API key). Cached server-side.
// Maps WMO weather codes to the site's WeatherType vocabulary so the theme
// engine can render matching particle/effect layers.

export type WeatherType =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'foggy'
  | 'stormy'
  | 'windy'
  | 'snowy';

export interface WeatherNow {
  configured: boolean;
  weather: WeatherType;
  temperatureC: number | null;
  windKph: number | null;
  isDay: boolean;
  description: string;
  location: string;
  generatedAt: string;
}

// Default: Bern, Switzerland. Override via env.
const LAT = parseFloat(process.env.WEATHER_LAT || '46.948');
const LON = parseFloat(process.env.WEATHER_LON || '7.4474');
const LOCATION = process.env.WEATHER_LOCATION || 'Switzerland';

// WMO weather interpretation codes -> our vocabulary.
// https://open-meteo.com/en/docs
function mapCode(code: number, windKph: number): { type: WeatherType; desc: string } {
  if (windKph >= 35) {
    // strong wind dominates the mood unless there's a storm
    if (![95, 96, 99].includes(code)) return { type: 'windy', desc: 'Windy' };
  }
  switch (true) {
    case code === 0:
      return { type: 'sunny', desc: 'Clear sky' };
    case code === 1 || code === 2:
      return { type: 'cloudy', desc: 'Partly cloudy' };
    case code === 3:
      return { type: 'cloudy', desc: 'Overcast' };
    case code === 45 || code === 48:
      return { type: 'foggy', desc: 'Fog' };
    case code >= 51 && code <= 67:
      return { type: 'rainy', desc: 'Rain' };
    case code >= 71 && code <= 77:
      return { type: 'snowy', desc: 'Snow' };
    case code >= 80 && code <= 82:
      return { type: 'rainy', desc: 'Rain showers' };
    case code === 85 || code === 86:
      return { type: 'snowy', desc: 'Snow showers' };
    case code >= 95:
      return { type: 'stormy', desc: 'Thunderstorm' };
    default:
      return { type: 'cloudy', desc: 'Cloudy' };
  }
}

async function fetchWeather(): Promise<WeatherNow> {
  const now = new Date().toISOString();
  const empty: WeatherNow = {
    configured: true,
    weather: 'sunny',
    temperatureC: null,
    windKph: null,
    isDay: true,
    description: 'Clear',
    location: LOCATION,
    generatedAt: now,
  };
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,is_day&wind_speed_unit=kmh`;
    const res = await fetch(url);
    if (!res.ok) return empty;
    const data = (await res.json()) as any;
    const cur = data.current || {};
    const windKph = cur.wind_speed_10m ?? 0;
    const { type, desc } = mapCode(cur.weather_code ?? 0, windKph);
    return {
      configured: true,
      weather: type,
      temperatureC: cur.temperature_2m ?? null,
      windKph,
      isDay: cur.is_day === 1,
      description: desc,
      location: LOCATION,
      generatedAt: now,
    };
  } catch {
    return empty;
  }
}

// Cache: weather changes slowly; 30 min is plenty and respects Open-Meteo.
let cache: { data: WeatherNow; at: number } | null = null;
const TTL_MS = 30 * 60 * 1000;

export async function getWeatherCached(): Promise<WeatherNow> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const data = await fetchWeather();
  cache = { data, at: Date.now() };
  return data;
}
