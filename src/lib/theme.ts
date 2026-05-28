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

export type SpecialEventType = 'christmas' | 'easter' | 'halloween' | 'newyear' | 'valentines';

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
const SEASON_THEMES: Record<SeasonType, { day: Partial<ThemeVariables>; night: Partial<ThemeVariables> }> = {
  spring: {
    day: {
      '--primary': '#4CAF50',
      '--primary-light': '#81C784',
      '--primary-dark': '#2E7D32',
      '--accent': '#FF9800',
      '--accent-light': '#FFB74D',
      '--bg-primary': '#f5f5ee',
      '--bg-secondary': '#eaeae2',
      '--bg-tertiary': '#ddddd5',
      '--text-primary': '#1a2e1a',
      '--text-secondary': '#3a4a3a',
      '--text-tertiary': '#5a6a5a',
      '--season-color-1': '#81C784',
      '--season-color-2': '#FFB74D',
      '--season-color-3': '#AED581',
    },
    night: {
      '--primary': '#66BB6A',
      '--primary-light': '#A5D6A7',
      '--primary-dark': '#388E3C',
      '--accent': '#FFB74D',
      '--accent-light': '#FFE0B2',
      '--bg-primary': '#0a1a0e',
      '--bg-secondary': '#142618',
      '--bg-tertiary': '#1e3222',
      '--text-primary': '#d5e8d0',
      '--text-secondary': '#a0bfa0',
      '--text-tertiary': '#7a9a7a',
      '--season-color-1': '#66BB6A',
      '--season-color-2': '#FFB74D',
      '--season-color-3': '#81C784',
    },
  },
  summer: {
    day: {
      '--primary': '#FF8F00',
      '--primary-light': '#FFB74D',
      '--primary-dark': '#E65100',
      '--accent': '#00ACC1',
      '--accent-light': '#4DD0E1',
      '--bg-primary': '#faf6ee',
      '--bg-secondary': '#f0ece4',
      '--bg-tertiary': '#e5e1d9',
      '--text-primary': '#2e1a00',
      '--text-secondary': '#5a4020',
      '--text-tertiary': '#7a6040',
      '--season-color-1': '#FF8F00',
      '--season-color-2': '#00ACC1',
      '--season-color-3': '#FDD835',
    },
    night: {
      '--primary': '#FFA726',
      '--primary-light': '#FFE0B2',
      '--primary-dark': '#F57C00',
      '--accent': '#26C6DA',
      '--accent-light': '#80DEEA',
      '--bg-primary': '#0e0a1a',
      '--bg-secondary': '#1a1430',
      '--bg-tertiary': '#241e3a',
      '--text-primary': '#ffe8cc',
      '--text-secondary': '#c0a888',
      '--text-tertiary': '#9a8068',
      '--season-color-1': '#FFA726',
      '--season-color-2': '#26C6DA',
      '--season-color-3': '#FFD54F',
    },
  },
  autumn: {
    day: {
      '--primary': '#E65100',
      '--primary-light': '#FF8A65',
      '--primary-dark': '#BF360C',
      '--accent': '#8D6E63',
      '--accent-light': '#BCAAA4',
      '--bg-primary': '#f5f0ea',
      '--bg-secondary': '#ebe5dd',
      '--bg-tertiary': '#ddd5ca',
      '--text-primary': '#2e1a08',
      '--text-secondary': '#5a3a1a',
      '--text-tertiary': '#7a5a3a',
      '--season-color-1': '#E65100',
      '--season-color-2': '#FFD54F',
      '--season-color-3': '#D32F2F',
    },
    night: {
      '--primary': '#FF7043',
      '--primary-light': '#FFAB91',
      '--primary-dark': '#D84315',
      '--accent': '#A1887F',
      '--accent-light': '#D7CCC8',
      '--bg-primary': '#12080a',
      '--bg-secondary': '#1e1214',
      '--bg-tertiary': '#2a1c1e',
      '--text-primary': '#e8d0c0',
      '--text-secondary': '#b09080',
      '--text-tertiary': '#8a6a5a',
      '--season-color-1': '#FF7043',
      '--season-color-2': '#FFD54F',
      '--season-color-3': '#EF5350',
    },
  },
  winter: {
    day: {
      '--primary': '#42A5F5',
      '--primary-light': '#90CAF9',
      '--primary-dark': '#1565C0',
      '--accent': '#78909C',
      '--accent-light': '#B0BEC5',
      '--bg-primary': '#f0f4f8',
      '--bg-secondary': '#e2e8ee',
      '--bg-tertiary': '#d4dce4',
      '--text-primary': '#0a1a2e',
      '--text-secondary': '#2a3a4e',
      '--text-tertiary': '#4a5a6e',
      '--season-color-1': '#42A5F5',
      '--season-color-2': '#B0BEC5',
      '--season-color-3': '#E3F2FD',
    },
    night: {
      '--primary': '#64B5F6',
      '--primary-light': '#BBDEFB',
      '--primary-dark': '#1E88E5',
      '--accent': '#90A4AE',
      '--accent-light': '#CFD8DC',
      '--bg-primary': '#050a14',
      '--bg-secondary': '#0e1828',
      '--bg-tertiary': '#18243a',
      '--text-primary': '#d0e4f8',
      '--text-secondary': '#90a8c0',
      '--text-tertiary': '#6a88a0',
      '--season-color-1': '#64B5F6',
      '--season-color-2': '#90A4AE',
      '--season-color-3': '#BBDEFB',
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
    '--particle-color': '#C0C0C0',
    '--particle-count': '8',
    '--animation-intensity': '0.4',
    '--blur-amount': '2px',
    '--shadow-intensity': '0.2',
    '--wind-strength': '0.8',
    '--weather-intensity': '0.5',
  },
  rainy: {
    '--particle-color': '#87CEEB',
    '--particle-count': '30',
    '--animation-intensity': '1',
    '--blur-amount': '2px',
    '--shadow-intensity': '0.4',
    '--wind-strength': '1',
    '--weather-intensity': '0.8',
  },
  foggy: {
    '--particle-color': '#D1D5DB',
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
    '--particle-color': '#87CEEB',
    '--particle-count': '25',
    '--animation-intensity': '1.1',
    '--blur-amount': '1px',
    '--shadow-intensity': '0.3',
    '--wind-strength': '2.5',
    '--weather-intensity': '0.6',
  },
  snowy: {
    '--particle-color': '#FFFFFF',
    '--particle-count': '50',
    '--animation-intensity': '0.7',
    '--blur-amount': '4px',
    '--shadow-intensity': '0.5',
    '--wind-strength': '0.6',
    '--weather-intensity': '0.7',
  },
};

// Special event themes
const SPECIAL_THEMES: Record<SpecialEventType, Partial<ThemeVariables>> = {
  christmas: {
    '--primary': '#DC143C',
    '--primary-light': '#FF69B4',
    '--accent': '#228B22',
    '--accent-light': '#90EE90',
    '--season-color-1': '#DC143C',
    '--season-color-2': '#228B22',
    '--season-color-3': '#FFD700',
    '--particle-color': '#FFFFFF',
    '--particle-count': '80',
    '--animation-intensity': '1.2',
  },

  easter: {
    '--primary': '#FFB6C1',
    '--primary-light': '#FFC0CB',
    '--accent': '#87CEEB',
    '--accent-light': '#E0FFFF',
    '--season-color-1': '#FFB6C1',
    '--season-color-2': '#98FF98',
    '--season-color-3': '#FFE4E1',
    '--particle-color': '#FFD700',
    '--particle-count': '40',
    '--animation-intensity': '0.9',
  },

  halloween: {
    '--primary': '#FF8C00',
    '--primary-light': '#FFB347',
    '--accent': '#8B008B',
    '--accent-light': '#9932CC',
    '--season-color-1': '#FF8C00',
    '--season-color-2': '#8B008B',
    '--season-color-3': '#000000',
    '--particle-color': '#FFD700',
    '--particle-count': '60',
    '--animation-intensity': '1.1',
  },

  newyear: {
    '--primary': '#FFD700',
    '--primary-light': '#FFF8DC',
    '--accent': '#00CED1',
    '--accent-light': '#E0FFFF',
    '--season-color-1': '#FFD700',
    '--season-color-2': '#00CED1',
    '--season-color-3': '#FF1493',
    '--particle-color': '#FFD700',
    '--particle-count': '100',
    '--animation-intensity': '1.3',
  },

  valentines: {
    '--primary': '#FF1493',
    '--primary-light': '#FF69B4',
    '--accent': '#DC143C',
    '--accent-light': '#FF6347',
    '--season-color-1': '#DC143C',
    '--season-color-2': '#FF1493',
    '--season-color-3': '#FFB6C1',
    '--particle-color': '#FF1493',
    '--particle-count': '50',
    '--animation-intensity': '1.1',
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

/**
 * Get current special event if any
 */
export function getCurrentSpecialEvent(): SpecialEventType | undefined {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Christmas (Dec 20-31)
  if (month === 12 && day >= 20) return 'christmas';

  // New Year (Jan 1-3)
  if (month === 1 && day <= 3) return 'newyear';

  // Easter (approximate, varies by year - around April)
  if (month === 4 && day >= 8 && day <= 22) return 'easter';

  // Halloween (Oct 20-31)
  if (month === 10 && day >= 20) return 'halloween';

  // Valentine's Day (Feb 10-20)
  if (month === 2 && day >= 10 && day <= 20) return 'valentines';

  return undefined;
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
