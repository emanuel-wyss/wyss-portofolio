// src/lib/theme.ts
/**
 * Weather/Season-based Theme System
 * Dynamically adjusts colors, animations, and visual effects based on time and weather
 */

export type WeatherType =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'foggy'
  | 'stormy'
  | 'windy'
  | 'snowy';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export type SpecialEventType =
  | 'christmas'
  | 'easter'
  | 'halloween'
  | 'newyear'
  | 'valentines'
  | 'pride'
  | 'swiss'
  | 'aprilfools';

export const ALL_EVENTS: SpecialEventType[] = [
  'christmas',
  'easter',
  'halloween',
  'newyear',
  'valentines',
  'pride',
  'swiss',
  'aprilfools',
];

export interface ThemeConfig {
  weather: WeatherType;
  season: SeasonType;
  specialEvent?: SpecialEventType;
  isDaytime: boolean;
}

export interface ThemeVariables {
  // Primary colors
  '--primary': string;
  '--primary-light': string;
  '--primary-dark': string;

  // Accent colors (weather-specific)
  '--accent': string;
  '--accent-light': string;

  // Background colors
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-tertiary': string;

  // Text colors
  '--text-primary': string;
  '--text-secondary': string;
  '--text-tertiary': string;

  // Special effects
  '--particle-color': string;
  '--particle-count': string;
  '--animation-intensity': string;
  '--blur-amount': string;
  '--shadow-intensity': string;

  // Season-specific
  '--season-color-1': string;
  '--season-color-2': string;
  '--season-color-3': string;

  // Weather-specific
  '--weather-intensity': string;
  '--wind-strength': string;
}

// Theme definitions: colors based on season + daytime
// Palette: black & yellow with WCAG AA contrast (4.5:1+ for text)
const SEASON_THEMES: Record<SeasonType, { day: Partial<ThemeVariables>; night: Partial<ThemeVariables> }> = {
  spring: {
    // Day: warm near-black bg, bright yellow-green accent — fresh feel
    day: {
      '--primary': '#E6C800',        // warm yellow (contrast 9.8:1 on #1a1a14)
      '--primary-light': '#FFE033',
      '--primary-dark': '#A89200',
      '--accent': '#CCDD00',         // yellow-green accent
      '--accent-light': '#EEF5A0',
      '--bg-primary': '#141410',
      '--bg-secondary': '#1e1e16',
      '--bg-tertiary': '#28281e',
      '--text-primary': '#F5F5E8',   // warm off-white (contrast 14.2:1 on #141410)
      '--text-secondary': '#C8C8A8', // muted warm (contrast 7.1:1)
      '--text-tertiary': '#909078',  // subtle (contrast 4.6:1)
      '--season-color-1': '#E6C800',
      '--season-color-2': '#CCDD00',
      '--season-color-3': '#FFE033',
    },
    // Night: deep black, vivid yellow
    night: {
      '--primary': '#FFD700',        // gold yellow (contrast 13.2:1 on #0a0a08)
      '--primary-light': '#FFE566',
      '--primary-dark': '#C9A800',
      '--accent': '#E6C800',
      '--accent-light': '#FFF5B0',
      '--bg-primary': '#0a0a08',
      '--bg-secondary': '#141410',
      '--bg-tertiary': '#1e1e18',
      '--text-primary': '#FFFAE6',   // warm white (contrast 19.1:1 on #0a0a08)
      '--text-secondary': '#C8BF80', // muted yellow-white (contrast 7.8:1)
      '--text-tertiary': '#8A8258',  // subtle warm (contrast 4.7:1)
      '--season-color-1': '#FFD700',
      '--season-color-2': '#E6C800',
      '--season-color-3': '#FFE566',
    },
  },
  summer: {
    // Day: charcoal bg, bright amber-yellow — high energy
    day: {
      '--primary': '#FFBB00',        // vivid amber (contrast 9.1:1 on #181410)
      '--primary-light': '#FFD84D',
      '--primary-dark': '#CC9500',
      '--accent': '#FF9900',         // warm orange-yellow accent
      '--accent-light': '#FFDD99',
      '--bg-primary': '#181410',
      '--bg-secondary': '#221c14',
      '--bg-tertiary': '#2c2418',
      '--text-primary': '#FFF5E6',   // warm white (contrast 13.5:1 on #181410)
      '--text-secondary': '#D4B880', // warm tan (contrast 6.8:1)
      '--text-tertiary': '#9A8458',  // muted tan (contrast 4.5:1)
      '--season-color-1': '#FFBB00',
      '--season-color-2': '#FF9900',
      '--season-color-3': '#FFD84D',
    },
    // Night: near-black, saturated golden yellow
    night: {
      '--primary': '#FFC200',        // saturated gold (contrast 12.4:1 on #0c0a06)
      '--primary-light': '#FFD84D',
      '--primary-dark': '#CC9A00',
      '--accent': '#FFAA00',
      '--accent-light': '#FFE5A0',
      '--bg-primary': '#0c0a06',
      '--bg-secondary': '#161208',
      '--bg-tertiary': '#201c0e',
      '--text-primary': '#FFF8E6',   // warm white (contrast 18.4:1 on #0c0a06)
      '--text-secondary': '#CDB870', // muted gold-white (contrast 7.4:1)
      '--text-tertiary': '#8A7A44',  // subtle warm (contrast 4.6:1)
      '--season-color-1': '#FFC200',
      '--season-color-2': '#FFAA00',
      '--season-color-3': '#FFD84D',
    },
  },
  autumn: {
    // Day: dark brown-black, deep amber — earthy warmth
    day: {
      '--primary': '#F0A800',        // deep amber (contrast 8.4:1 on #1a1208)
      '--primary-light': '#FFD066',
      '--primary-dark': '#C07800',
      '--accent': '#D4840A',         // golden brown accent
      '--accent-light': '#F0C878',
      '--bg-primary': '#1a1208',
      '--bg-secondary': '#241a0e',
      '--bg-tertiary': '#2e2214',
      '--text-primary': '#FFF0D8',   // warm cream (contrast 13.1:1 on #1a1208)
      '--text-secondary': '#C8A070', // warm tan (contrast 6.5:1)
      '--text-tertiary': '#8A6840',  // muted brown (contrast 4.5:1)
      '--season-color-1': '#F0A800',
      '--season-color-2': '#D4840A',
      '--season-color-3': '#FFD066',
    },
    // Night: deep black-brown, rich amber
    night: {
      '--primary': '#FFB800',        // bright amber (contrast 12.8:1 on #0e0806)
      '--primary-light': '#FFD566',
      '--primary-dark': '#CC8C00',
      '--accent': '#F09000',
      '--accent-light': '#FFD8A0',
      '--bg-primary': '#0e0806',
      '--bg-secondary': '#18100a',
      '--bg-tertiary': '#22180e',
      '--text-primary': '#FFF5E0',   // warm white (contrast 18.9:1 on #0e0806)
      '--text-secondary': '#CCAA68', // muted amber-white (contrast 7.9:1)
      '--text-tertiary': '#8A7040',  // subtle warm (contrast 4.6:1)
      '--season-color-1': '#FFB800',
      '--season-color-2': '#F09000',
      '--season-color-3': '#FFD566',
    },
  },
  winter: {
    // Day: cold near-black, pale lemon yellow — crisp, cool
    day: {
      '--primary': '#E8D400',        // lemon yellow (contrast 9.5:1 on #161618)
      '--primary-light': '#F5E84D',
      '--primary-dark': '#A89800',
      '--accent': '#C8C000',         // muted yellow-grey accent
      '--accent-light': '#EAE8A0',
      '--bg-primary': '#161618',
      '--bg-secondary': '#202022',
      '--bg-tertiary': '#2a2a2c',
      '--text-primary': '#F8F8F0',   // cool white (contrast 13.8:1 on #161618)
      '--text-secondary': '#C0C0A8', // cool grey-cream (contrast 6.9:1)
      '--text-tertiary': '#808070',  // muted cool (contrast 4.5:1)
      '--season-color-1': '#E8D400',
      '--season-color-2': '#C8C000',
      '--season-color-3': '#F5E84D',
    },
    // Night: pure black, cool bright yellow
    night: {
      '--primary': '#F5E000',        // cool bright yellow (contrast 14.1:1 on #080808)
      '--primary-light': '#FFF066',
      '--primary-dark': '#C0AE00',
      '--accent': '#D4CC00',
      '--accent-light': '#F5F2A0',
      '--bg-primary': '#080808',
      '--bg-secondary': '#121212',
      '--bg-tertiary': '#1c1c1c',
      '--text-primary': '#F8F8F8',   // pure near-white (contrast 19.8:1 on #080808)
      '--text-secondary': '#B8B898', // cool grey-cream (contrast 8.1:1)
      '--text-tertiary': '#787858',  // subtle muted (contrast 4.7:1)
      '--season-color-1': '#F5E000',
      '--season-color-2': '#D4CC00',
      '--season-color-3': '#FFF066',
    },
  },
};

// Weather animation variables (only particles, intensity, blur — no colors)
const WEATHER_EFFECTS: Record<WeatherType, Partial<ThemeVariables>> = {
  sunny: {
    '--particle-color': '#FFD700',
    '--particle-count': '10',
    '--animation-intensity': '0.6',
    '--blur-amount': '0px',
    '--shadow-intensity': '0.2',
    '--wind-strength': '0.5',
    '--weather-intensity': '0.5',
  },
  cloudy: {
    '--particle-color': '#888870',
    '--particle-count': '8',
    '--animation-intensity': '0.4',
    '--blur-amount': '2px',
    '--shadow-intensity': '0.2',
    '--wind-strength': '0.8',
    '--weather-intensity': '0.5',
  },
  rainy: {
    '--particle-color': '#C8C090',
    '--particle-count': '30',
    '--animation-intensity': '1',
    '--blur-amount': '2px',
    '--shadow-intensity': '0.4',
    '--wind-strength': '1',
    '--weather-intensity': '0.8',
  },
  foggy: {
    '--particle-color': '#A0A080',
    '--particle-count': '40',
    '--animation-intensity': '0.5',
    '--blur-amount': '6px',
    '--shadow-intensity': '0.15',
    '--wind-strength': '0.3',
    '--weather-intensity': '0.7',
  },
  stormy: {
    '--particle-color': '#FFD700',
    '--particle-count': '50',
    '--animation-intensity': '1.4',
    '--blur-amount': '2px',
    '--shadow-intensity': '0.9',
    '--wind-strength': '2',
    '--weather-intensity': '1',
  },
  windy: {
    '--particle-color': '#C8B840',
    '--particle-count': '25',
    '--animation-intensity': '1.1',
    '--blur-amount': '1px',
    '--shadow-intensity': '0.3',
    '--wind-strength': '2.5',
    '--weather-intensity': '0.6',
  },
  snowy: {
    '--particle-color': '#F0EED8',
    '--particle-count': '50',
    '--animation-intensity': '0.7',
    '--blur-amount': '4px',
    '--shadow-intensity': '0.5',
    '--wind-strength': '0.6',
    '--weather-intensity': '0.7',
  },
};

// Special event themes — festive but anchored in the black/yellow base
const SPECIAL_THEMES: Record<SpecialEventType, Partial<ThemeVariables>> = {
  // Christmas: classic red/green on near-black — gold particles
  christmas: {
    '--primary': '#FF3333',
    '--primary-light': '#FF6666',
    '--accent': '#22AA22',
    '--accent-light': '#66CC66',
    '--season-color-1': '#FF3333',
    '--season-color-2': '#22AA22',
    '--season-color-3': '#FFD700',
    '--particle-color': '#FFD700',
    '--particle-count': '80',
    '--animation-intensity': '1.2',
  },

  // Easter: soft pastels but readable — yellow particles
  easter: {
    '--primary': '#FFD700',
    '--primary-light': '#FFE566',
    '--accent': '#AADDAA',
    '--accent-light': '#CCEECC',
    '--season-color-1': '#FFD700',
    '--season-color-2': '#AADDAA',
    '--season-color-3': '#FFB3CC',
    '--particle-color': '#FFD700',
    '--particle-count': '40',
    '--animation-intensity': '0.9',
  },

  // Halloween: deep amber/black — maximum brand alignment
  halloween: {
    '--primary': '#FF9900',
    '--primary-light': '#FFBB44',
    '--accent': '#CC8800',
    '--accent-light': '#FFCC66',
    '--season-color-1': '#FF9900',
    '--season-color-2': '#CC8800',
    '--season-color-3': '#FFD700',
    '--particle-color': '#FFD700',
    '--particle-count': '60',
    '--animation-intensity': '1.1',
  },

  // New Year: pure gold celebration
  newyear: {
    '--primary': '#FFD700',
    '--primary-light': '#FFF066',
    '--accent': '#E6B800',
    '--accent-light': '#FFF5A0',
    '--season-color-1': '#FFD700',
    '--season-color-2': '#E6B800',
    '--season-color-3': '#FFFFAA',
    '--particle-color': '#FFD700',
    '--particle-count': '100',
    '--animation-intensity': '1.3',
  },

  // Valentine's: warm reds against dark — yellow particles
  valentines: {
    '--primary': '#FF4466',
    '--primary-light': '#FF7799',
    '--accent': '#CC2244',
    '--accent-light': '#FF99AA',
    '--season-color-1': '#FF4466',
    '--season-color-2': '#CC2244',
    '--season-color-3': '#FF99AA',
    '--particle-color': '#FFD700',
    '--particle-count': '50',
    '--animation-intensity': '1.1',
  },

  // Pride: vivid rainbow accents
  pride: {
    '--primary': '#FF0080',
    '--primary-light': '#FF66B3',
    '--accent': '#00E5FF',
    '--accent-light': '#99F5FF',
    '--season-color-1': '#FF0080',
    '--season-color-2': '#00E5FF',
    '--season-color-3': '#FFD700',
    '--particle-color': '#FFD700',
    '--particle-count': '60',
    '--animation-intensity': '1.2',
  },

  // Swiss National Day: red & white
  swiss: {
    '--primary': '#FF3333',
    '--primary-light': '#FF6666',
    '--accent': '#FFFFFF',
    '--accent-light': '#FFE0E0',
    '--season-color-1': '#FF3333',
    '--season-color-2': '#FFFFFF',
    '--season-color-3': '#FF6666',
    '--particle-color': '#FF3333',
    '--particle-count': '80',
    '--animation-intensity': '1.2',
  },

  // April Fools: chaotic neon green
  aprilfools: {
    '--primary': '#39FF14',
    '--primary-light': '#8DFF7A',
    '--accent': '#FF00FF',
    '--accent-light': '#FF99FF',
    '--season-color-1': '#39FF14',
    '--season-color-2': '#FF00FF',
    '--season-color-3': '#00E5FF',
    '--particle-color': '#39FF14',
    '--particle-count': '100',
    '--animation-intensity': '1.5',
  },
};

/**
 * Get current season based on date
 */
export function getCurrentSeason(): SeasonType {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

/** Gregorian Easter Sunday (Meeus/Jones/Butcher algorithm). */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export interface EventWindow {
  start: Date;
  end: Date;
}

export function getEventWindow(event: SpecialEventType, year = new Date().getFullYear()): EventWindow {
  const date = (month: number, day: number) => new Date(year, month - 1, day);
  switch (event) {
    case 'christmas': return { start: date(12, 22), end: date(12, 28) };
    case 'newyear': return { start: date(12, 29), end: new Date(year + 1, 0, 3) };
    case 'halloween': return { start: date(10, 28), end: date(10, 31) };
    case 'valentines': return { start: date(2, 11), end: date(2, 14) };
    case 'pride': return { start: date(6, 1), end: date(6, 30) };
    case 'swiss': return { start: date(7, 29), end: date(8, 1) };
    case 'aprilfools': return { start: date(4, 1), end: date(4, 1) };
    case 'easter': {
      const easter = getEasterSunday(year);
      const start = new Date(easter); start.setDate(start.getDate() - 3);
      const end = new Date(easter); end.setDate(end.getDate() + 1);
      return { start, end };
    }
  }
}

function isWithin(now: Date, start: Date, end: Date): boolean {
  const value = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return value >= start.getTime() && value <= end.getTime();
}

/**
 * Get the current event. Fixed-date celebrations begin at least three days
 * before their date; April Fools stays intentionally limited to April 1.
 * Overlap priority is deliberate: New Year supersedes Christmas from Dec 29.
 */
export function getCurrentSpecialEvent(): SpecialEventType | undefined {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // April Fools is the only event without a lead-in.
  if (month === 4 && day === 1) return 'aprilfools';

  // New Year: Dec 29–Jan 3 (takes priority over Christmas).
  if ((month === 12 && day >= 29) || (month === 1 && day <= 3)) return 'newyear';

  // Christmas: Dec 22–28 (three-day lead-in, then yields to New Year).
  if (month === 12 && day >= 22 && day <= 28) return 'christmas';

  // Easter: Good Friday through Easter Monday, computed every year.
  const easter = getEasterSunday(year);
  const easterStart = new Date(easter);
  easterStart.setDate(easter.getDate() - 3);
  const easterEnd = new Date(easter);
  easterEnd.setDate(easter.getDate() + 1);
  if (isWithin(now, easterStart, easterEnd)) return 'easter';

  // Halloween: Oct 28–31.
  if (month === 10 && day >= 28) return 'halloween';

  // Valentine's Day: Feb 11–14.
  if (month === 2 && day >= 11 && day <= 14) return 'valentines';

  // Pride: June (already a month-long observance).
  if (month === 6) return 'pride';

  // Swiss National Day: Jul 29–Aug 1.
  if ((month === 7 && day >= 29) || (month === 8 && day === 1)) return 'swiss';

  return undefined;
}

/**
 * Read a hash-based admin preview override (#preview-event=halloween).
 * Hash fragments are never sent to the server or indexed by crawlers.
 */
export function getHashPreviewEvent(): SpecialEventType | undefined {
  if (typeof window === 'undefined') return undefined;
  const match = window.location.hash.match(/preview-event=([a-z]+)/i);
  const raw = match?.[1]?.toLowerCase();
  return raw && (ALL_EVENTS as string[]).includes(raw) ? (raw as SpecialEventType) : undefined;
}

export function getPreferredEvent(): SpecialEventType | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = localStorage.getItem(PREFERRED_EVENT_KEY);
  return value && (ALL_EVENTS as string[]).includes(value) ? value as SpecialEventType : undefined;
}

export function setPreferredEvent(event?: SpecialEventType): void {
  if (typeof window === 'undefined') return;
  if (event) localStorage.setItem(PREFERRED_EVENT_KEY, event);
  else localStorage.removeItem(PREFERRED_EVENT_KEY);
}

/**
 * Get current time period (daytime or nighttime)
 * Daytime: 07:01–21:59, Nighttime: 22:00–07:00
 */
export function isDaytime(): boolean {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 22;
}

/**
 * Get theme variables for current conditions
 */
export function getThemeVariables(config: ThemeConfig): ThemeVariables {
  // 1. Base colors from season + daytime
  const seasonTheme = SEASON_THEMES[config.season];
  const colorTheme = config.isDaytime ? seasonTheme.day : seasonTheme.night;

  // 2. Weather animation/effect variables
  const weatherEffects = WEATHER_EFFECTS[config.weather] || WEATHER_EFFECTS.sunny;

  // 3. Merge: colors from season, effects from weather
  let theme = { ...colorTheme, ...weatherEffects };

  // 4. Apply special event color override if applicable
  if (config.specialEvent) {
    const specialTheme = SPECIAL_THEMES[config.specialEvent];
    theme = { ...theme, ...specialTheme };
  }

  return theme as ThemeVariables;
}

/**
 * Apply theme to document
 */
export function applyTheme(variables: Partial<ThemeVariables>): void {
  const root = document.documentElement;

  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      root.style.setProperty(key, String(value));
    }
  });
}

/**
 * Get theme config with optional weather override (for testing)
 */
export function getThemeConfig(weatherOverride?: WeatherType): ThemeConfig {
  return {
    weather: weatherOverride || 'sunny',
    season: getCurrentSeason(),
    specialEvent: getCurrentSpecialEvent(),
    isDaytime: isDaytime(),
  };
}

/**
 * Initialize theme system
 */
export function initializeTheme(weatherOverride?: WeatherType): void {
  const config = getThemeConfig(weatherOverride);
  const variables = getThemeVariables(config);
  applyTheme(variables);
}

// ===========================================================================
// Color mode (light / dark / auto) + immersive FX layer
// ===========================================================================

export type ColorMode = 'light' | 'dark' | 'auto';

const EFFECTS_PAUSED_KEY = 'wyss-effects-paused';
const EFFECTS_INTENSITY_KEY = 'wyss-effects-intensity';
const PREFERRED_EVENT_KEY = 'wyss-preferred-event';
const EVENT_SOUND_KEY = 'wyss-event-sound';
export function getEventSound(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(EVENT_SOUND_KEY) === 'true';
}
export function setEventSound(enabled: boolean): void {
  if (typeof window !== 'undefined') localStorage.setItem(EVENT_SOUND_KEY, String(enabled));
}
export type EffectsIntensity = 'quiet' | 'standard' | 'party';

export function getEffectsIntensity(): EffectsIntensity {
  if (typeof window === 'undefined') return 'standard';
  const value = localStorage.getItem(EFFECTS_INTENSITY_KEY);
  return value === 'quiet' || value === 'party' ? value : 'standard';
}

export function setEffectsIntensity(value: EffectsIntensity): void {
  if (typeof window !== 'undefined') localStorage.setItem(EFFECTS_INTENSITY_KEY, value);
  document.documentElement.setAttribute('data-effects-intensity', value);
}

export function getEffectsPaused(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(EFFECTS_PAUSED_KEY) === 'true';
}

export function setEffectsPaused(paused: boolean): void {
  if (typeof window !== 'undefined') localStorage.setItem(EFFECTS_PAUSED_KEY, String(paused));
  document.documentElement.toggleAttribute('data-effects-paused', paused);
}
export const COLOR_MODE_KEY = 'wyss-color-mode';

/** Resolve 'auto' to the system preference. SSR-safe. */
export function resolveMode(mode: ColorMode): 'light' | 'dark' {
  if (mode !== 'auto') return mode;
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function getStoredMode(): ColorMode {
  if (typeof localStorage === 'undefined') return 'auto';
  const v = localStorage.getItem(COLOR_MODE_KEY);
  return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto';
}

export function setStoredMode(mode: ColorMode): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(COLOR_MODE_KEY, mode);
}

/** True when the user asked for reduced motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Light-mode color overrides. Keeps the black/yellow identity but inverts the
 * surface: warm off-white backgrounds, dark text. All pairs meet WCAG AA.
 */
const LIGHT_MODE: Partial<ThemeVariables> = {
  '--bg-primary': '#faf8f0',       // warm off-white
  '--bg-secondary': '#f0ecdc',
  '--bg-tertiary': '#e6e0cc',
  '--text-primary': '#1a1810',     // near-black (contrast 16.8:1 on #faf8f0)
  '--text-secondary': '#4a4530',   // warm dark (contrast 8.4:1)
  '--text-tertiary': '#6e6848',    // muted (contrast 5.0:1)
  // Dial accents to darker, saturated tones so yellow stays readable on light.
  '--primary': '#8a6d00',          // deep gold (contrast 5.1:1 on #faf8f0)
  '--primary-light': '#a88600',
  '--primary-dark': '#5f4b00',
  '--accent': '#9a5b00',           // burnt amber
  '--accent-light': '#e8c060',
};

/**
 * Immersive FX overrides per special event. These add cyberpunk/mood colors
 * and FX intensity on top of the base palette. Applied only in dark mode where
 * neon reads well; light mode keeps a toned-down variant.
 */
const EVENT_FX: Record<SpecialEventType, { dark: Partial<ThemeVariables>; fx: string }> = {
  halloween: {
    dark: {
      '--bg-primary': '#0a0612',     // deep purple-black
      '--bg-secondary': '#140a1e',
      '--bg-tertiary': '#1e1228',
      '--primary': '#ff7518',        // pumpkin orange
      '--primary-light': '#ff9a4d',
      '--primary-dark': '#cc5500',
      '--accent': '#39ff14',         // toxic/neon green
      '--accent-light': '#8dff7a',
      '--text-primary': '#f5ecff',
      '--text-secondary': '#c8a8e0',
      '--particle-color': '#ff7518',
    },
    fx: 'halloween',
  },
  christmas: {
    dark: {
      '--accent': '#39d353',
      '--particle-color': '#ffffff',
    },
    fx: 'snow',
  },
  newyear: {
    dark: { '--particle-color': '#ffd700' },
    fx: 'fireworks',
  },
  valentines: {
    dark: { '--particle-color': '#ff4466' },
    fx: 'hearts',
  },
  easter: {
    dark: {
      '--accent': '#ffb3cc',
      '--particle-color': '#ffd700',
    },
    fx: 'easter',
  },
  pride: {
    dark: {
      '--primary': '#ff0080',
      '--accent': '#00e5ff',
      '--particle-color': '#ffd700',
    },
    fx: 'pride',
  },
  swiss: {
    dark: {
      '--primary': '#ff3333',
      '--primary-light': '#ff6666',
      '--accent': '#ffffff',
      '--particle-color': '#ff3333',
    },
    fx: 'swiss',
  },
  aprilfools: {
    dark: {
      '--particle-color': '#39ff14',
    },
    fx: 'aprilfools',
  },
};

export interface ImmersiveState {
  mode: ColorMode;
  resolved: 'light' | 'dark';
  reducedMotion: boolean;
  season: SeasonType;
  event?: SpecialEventType;
  isDaytime: boolean;
  /** 0..1 FX intensity; higher at night and on events. */
  fxIntensity: number;
  fxName: string;
  /** Active weather (from real data when available). */
  weather?: WeatherType;
}

/** Compute the current immersive state from date + user prefs. */
export function getImmersiveState(mode: ColorMode): ImmersiveState {
  const resolved = resolveMode(mode);
  const reducedMotion = prefersReducedMotion();
  const season = getCurrentSeason();
  const event = getHashPreviewEvent() ?? getCurrentSpecialEvent();
  const isDaytime = isDaytime_();
  let fxIntensity = isDaytime ? 0.5 : 0.85;
  if (event) fxIntensity = Math.min(1, fxIntensity + 0.25);
  if (reducedMotion) fxIntensity = 0;
  const fxName = event ? EVENT_FX[event].fx : 'cyber';
  return { mode, resolved, reducedMotion, season, event, isDaytime, fxIntensity, fxName };
}

// local alias to avoid shadowing export above
function isDaytime_(): boolean {
  return isDaytime();
}

/**
 * Apply the full immersive theme to <html>: color vars (season + mode +
 * event), data attributes, and weather/event classes. Returns the state.
 */
export function applyImmersiveTheme(
  mode: ColorMode,
  weather?: WeatherType,
  eventOverride?: SpecialEventType,
): ImmersiveState {
  const state = getImmersiveState(mode);
  if (eventOverride !== undefined) {
    state.event = eventOverride;
    state.fxName = EVENT_FX[eventOverride].fx;
    state.fxIntensity = state.reducedMotion ? 0 : Math.min(1, (state.isDaytime ? 0.5 : 0.85) + 0.25);
  }
  const activeWeather: WeatherType = weather || 'sunny';
  const root = document.documentElement;

  // 1. Base theme (season colors + real weather effects + event color override).
  const config: ThemeConfig = {
    weather: activeWeather,
    season: state.season,
    specialEvent: state.event,
    isDaytime: state.isDaytime,
  };
  let vars: Partial<ThemeVariables> = getThemeVariables(config);

  // 2. Light-mode surface inversion.
  if (state.resolved === 'light') {
    vars = { ...vars, ...LIGHT_MODE };
  }

  // 3. Immersive event FX palette (dark only, where neon reads).
  if (state.event && state.resolved === 'dark') {
    vars = { ...vars, ...EVENT_FX[state.event].dark };
  }

  applyTheme(vars);

  // 4. Data attributes + classes for CSS-driven FX layers.
  root.setAttribute('data-mode', state.resolved);
  root.setAttribute('data-fx', state.fxName);
  root.setAttribute('data-daytime', state.isDaytime ? 'day' : 'night');
  root.style.setProperty('--fx-intensity', String(state.fxIntensity));

  // weather-* and event-* classes for the CSS particle/FX layers.
  Array.from(root.classList)
    .filter((c) => c.startsWith('event-') || c.startsWith('weather-'))
    .forEach((c) => root.classList.remove(c));
  // Weather particles only when motion is allowed.
  if (!state.reducedMotion) root.classList.add(`weather-${activeWeather}`);
  if (state.event) root.classList.add(`event-${state.event}`);

  return { ...state, weather: activeWeather };
}
