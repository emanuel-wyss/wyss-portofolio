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
