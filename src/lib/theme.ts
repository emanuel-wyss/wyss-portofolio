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

// Theme definitions
const THEMES: Record<
  WeatherType,
  Record<SeasonType, Partial<ThemeVariables>>
> = {
  sunny: {
    spring: {
      '--primary': '#FFD60A',
      '--primary-light': '#FFF8DC',
      '--accent': '#87CEEB',
      '--accent-light': '#E0F6FF',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#FFF8DC',
      '--text-secondary': '#B8C5D6',
      '--season-color-1': '#FFB347',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#98FF98',
      '--particle-color': '#FFD60A',
      '--particle-count': '15',
      '--animation-intensity': '0.8',
      '--blur-amount': '0px',
      '--shadow-intensity': '0.3',
    },
    summer: {
      '--primary': '#FFA500',
      '--primary-light': '#FFE4B5',
      '--accent': '#00CED1',
      '--accent-light': '#E0FFFF',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#FFFACD',
      '--text-secondary': '#B8D8E8',
      '--season-color-1': '#FF6347',
      '--season-color-2': '#00CED1',
      '--season-color-3': '#32CD32',
      '--particle-color': '#FFD700',
      '--particle-count': '20',
      '--animation-intensity': '1',
      '--blur-amount': '2px',
      '--shadow-intensity': '0.5',
    },
    autumn: {
      '--primary': '#FF8C00',
      '--primary-light': '#FFB347',
      '--accent': '#DC143C',
      '--accent-light': '#FFB6C1',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#F5DEB3',
      '--text-secondary': '#D2B48C',
      '--season-color-1': '#FF4500',
      '--season-color-2': '#FFD700',
      '--season-color-3': '#DC143C',
      '--particle-color': '#FF8C00',
      '--particle-count': '18',
      '--animation-intensity': '0.9',
      '--blur-amount': '1px',
      '--shadow-intensity': '0.4',
    },
    winter: {
      '--primary': '#87CEEB',
      '--primary-light': '#ADD8E6',
      '--accent': '#00BFFF',
      '--accent-light': '#E0FFFF',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#F0F8FF',
      '--text-secondary': '#B0C4DE',
      '--season-color-1': '#00BFFF',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#B0E0E6',
      '--particle-color': '#FFD700',
      '--particle-count': '25',
      '--animation-intensity': '0.7',
      '--blur-amount': '3px',
      '--shadow-intensity': '0.6',
    },
  },

  cloudy: {
    spring: {
      '--primary': '#708090',
      '--primary-light': '#A9A9A9',
      '--accent': '#87CEEB',
      '--accent-light': '#B0E0E6',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E8E8E8',
      '--text-secondary': '#B8B8B8',
      '--season-color-1': '#98D8C8',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#90EE90',
      '--particle-color': '#D3D3D3',
      '--particle-count': '12',
      '--animation-intensity': '0.6',
      '--blur-amount': '4px',
      '--shadow-intensity': '0.4',
    },
    summer: {
      '--primary': '#778899',
      '--primary-light': '#B0C4DE',
      '--accent': '#4682B4',
      '--accent-light': '#87CEEB',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E0E0E0',
      '--text-secondary': '#C0C0C0',
      '--season-color-1': '#FFD700',
      '--season-color-2': '#4682B4',
      '--season-color-3': '#87CEEB',
      '--particle-color': '#C0C0C0',
      '--particle-count': '10',
      '--animation-intensity': '0.5',
      '--blur-amount': '5px',
      '--shadow-intensity': '0.3',
    },
    autumn: {
      '--primary': '#696969',
      '--primary-light': '#808080',
      '--accent': '#CD853F',
      '--accent-light': '#DEB887',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#D3D3D3',
      '--text-secondary': '#A9A9A9',
      '--season-color-1': '#FF8C00',
      '--season-color-2': '#CD853F',
      '--season-color-3': '#DAA520',
      '--particle-color': '#A9A9A9',
      '--particle-count': '10',
      '--animation-intensity': '0.55',
      '--blur-amount': '4px',
      '--shadow-intensity': '0.35',
    },
    winter: {
      '--primary': '#4F4F4F',
      '--primary-light': '#696969',
      '--accent': '#B0C4DE',
      '--accent-light': '#E0E0E0',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E8E8E8',
      '--text-secondary': '#B0B0B0',
      '--season-color-1': '#B0C4DE',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#DCDCDC',
      '--particle-color': '#DCDCDC',
      '--particle-count': '15',
      '--animation-intensity': '0.5',
      '--blur-amount': '6px',
      '--shadow-intensity': '0.4',
    },
  },

  rainy: {
    spring: {
      '--primary': '#4682B4',
      '--primary-light': '#87CEEB',
      '--accent': '#32CD32',
      '--accent-light': '#90EE90',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#D0E8F2',
      '--text-secondary': '#A0B8C8',
      '--season-color-1': '#32CD32',
      '--season-color-2': '#4682B4',
      '--season-color-3': '#87CEEB',
      '--particle-color': '#87CEEB',
      '--particle-count': '30',
      '--animation-intensity': '1',
      '--blur-amount': '3px',
      '--shadow-intensity': '0.5',
    },
    summer: {
      '--primary': '#1E90FF',
      '--primary-light': '#6495ED',
      '--accent': '#00CED1',
      '--accent-light': '#E0FFFF',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#B0E0E6',
      '--text-secondary': '#87CEEB',
      '--season-color-1': '#00CED1',
      '--season-color-2': '#1E90FF',
      '--season-color-3': '#87CEEB',
      '--particle-color': '#87CEEB',
      '--particle-count': '35',
      '--animation-intensity': '1.1',
      '--blur-amount': '4px',
      '--shadow-intensity': '0.6',
    },
    autumn: {
      '--primary': '#4169E1',
      '--primary-light': '#6495ED',
      '--accent': '#FF8C00',
      '--accent-light': '#FFB347',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#B0C4DE',
      '--text-secondary': '#8B7355',
      '--season-color-1': '#FF8C00',
      '--season-color-2': '#4169E1',
      '--season-color-3': '#FFD700',
      '--particle-color': '#4169E1',
      '--particle-count': '28',
      '--animation-intensity': '0.95',
      '--blur-amount': '3px',
      '--shadow-intensity': '0.55',
    },
    winter: {
      '--primary': '#4169E1',
      '--primary-light': '#B0C4DE',
      '--accent': '#00BFFF',
      '--accent-light': '#E0FFFF',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#D0E8F2',
      '--text-secondary': '#9CB4C8',
      '--season-color-1': '#00BFFF',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#B0E0E6',
      '--particle-color': '#87CEEB',
      '--particle-count': '32',
      '--animation-intensity': '1',
      '--blur-amount': '5px',
      '--shadow-intensity': '0.6',
    },
  },

  foggy: {
    spring: {
      '--primary': '#9CA3AF',
      '--primary-light': '#D1D5DB',
      '--accent': '#86EFAC',
      '--accent-light': '#DBEAFE',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E5E7EB',
      '--text-secondary': '#9CA3AF',
      '--season-color-1': '#86EFAC',
      '--season-color-2': '#DBEAFE',
      '--season-color-3': '#A3E635',
      '--particle-color': '#D1D5DB',
      '--particle-count': '40',
      '--animation-intensity': '0.7',
      '--blur-amount': '8px',
      '--shadow-intensity': '0.2',
    },
    summer: {
      '--primary': '#B0B0B0',
      '--primary-light': '#D3D3D3',
      '--accent': '#87CEEB',
      '--accent-light': '#E0FFFF',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E8E8E8',
      '--text-secondary': '#B8B8B8',
      '--season-color-1': '#FFD700',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#FAFAD2',
      '--particle-color': '#E8E8E8',
      '--particle-count': '45',
      '--animation-intensity': '0.6',
      '--blur-amount': '10px',
      '--shadow-intensity': '0.15',
    },
    autumn: {
      '--primary': '#8B7355',
      '--primary-light': '#A9927D',
      '--accent': '#CD853F',
      '--accent-light': '#DEB887',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#D2B48C',
      '--text-secondary': '#A9927D',
      '--season-color-1': '#FF8C00',
      '--season-color-2': '#CD853F',
      '--season-color-3': '#DEB887',
      '--particle-color': '#BDB76B',
      '--particle-count': '38',
      '--animation-intensity': '0.65',
      '--blur-amount': '9px',
      '--shadow-intensity': '0.2',
    },
    winter: {
      '--primary': '#A0A0A0',
      '--primary-light': '#C0C0C0',
      '--accent': '#87CEEB',
      '--accent-light': '#B0E0E6',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E0E0E0',
      '--text-secondary': '#A8A8A8',
      '--season-color-1': '#B0C4DE',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#DCDCDC',
      '--particle-color': '#E8E8E8',
      '--particle-count': '50',
      '--animation-intensity': '0.6',
      '--blur-amount': '12px',
      '--shadow-intensity': '0.15',
    },
  },

  stormy: {
    spring: {
      '--primary': '#2C3E50',
      '--primary-light': '#34495E',
      '--accent': '#E74C3C',
      '--accent-light': '#EC7063',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#ECF0F1',
      '--text-secondary': '#BDC3C7',
      '--season-color-1': '#E74C3C',
      '--season-color-2': '#3498DB',
      '--season-color-3': '#2ECC71',
      '--particle-color': '#FFD700',
      '--particle-count': '50',
      '--animation-intensity': '1.3',
      '--blur-amount': '2px',
      '--shadow-intensity': '0.8',
    },
    summer: {
      '--primary': '#34495E',
      '--primary-light': '#2C3E50',
      '--accent': '#F39C12',
      '--accent-light': '#F8B88B',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#ECF0F1',
      '--text-secondary': '#95A5A6',
      '--season-color-1': '#F39C12',
      '--season-color-2': '#E74C3C',
      '--season-color-3': '#3498DB',
      '--particle-color': '#FFD700',
      '--particle-count': '55',
      '--animation-intensity': '1.4',
      '--blur-amount': '3px',
      '--shadow-intensity': '0.9',
    },
    autumn: {
      '--primary': '#1A1A1A',
      '--primary-light': '#2D2D2D',
      '--accent': '#FF6347',
      '--accent-light': '#FF7F50',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#D3D3D3',
      '--text-secondary': '#A9A9A9',
      '--season-color-1': '#FF6347',
      '--season-color-2': '#FFD700',
      '--season-color-3': '#DC143C',
      '--particle-color': '#FFD700',
      '--particle-count': '48',
      '--animation-intensity': '1.25',
      '--blur-amount': '2px',
      '--shadow-intensity': '0.85',
    },
    winter: {
      '--primary': '#1C1C3C',
      '--primary-light': '#2D2D5F',
      '--accent': '#00BFFF',
      '--accent-light': '#87CEEB',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E0E0E0',
      '--text-secondary': '#A0A0C0',
      '--season-color-1': '#00BFFF',
      '--season-color-2': '#FFD700',
      '--season-color-3': '#87CEEB',
      '--particle-color': '#FFD700',
      '--particle-count': '60',
      '--animation-intensity': '1.35',
      '--blur-amount': '4px',
      '--shadow-intensity': '0.95',
    },
  },

  windy: {
    spring: {
      '--primary': '#2E7D32',
      '--primary-light': '#4CAF50',
      '--accent': '#87CEEB',
      '--accent-light': '#E1F5FE',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E0F2F1',
      '--text-secondary': '#80CBC4',
      '--season-color-1': '#4CAF50',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#81C784',
      '--particle-color': '#87CEEB',
      '--particle-count': '35',
      '--animation-intensity': '1.2',
      '--blur-amount': '3px',
      '--wind-strength': '2',
      '--shadow-intensity': '0.5',
    },
    summer: {
      '--primary': '#00897B',
      '--primary-light': '#009688',
      '--accent': '#FFD700',
      '--accent-light': '#FFF59D',
      '--bg-primary': '0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#E0F2F1',
      '--text-secondary': '#80CBC4',
      '--season-color-1': '#FFD700',
      '--season-color-2': '#00CED1',
      '--season-color-3': '#4DB8FF',
      '--particle-color': '#FFD700',
      '--particle-count': '40',
      '--animation-intensity': '1.3',
      '--blur-amount': '2px',
      '--wind-strength': '2.5',
      '--shadow-intensity': '0.6',
    },
    autumn: {
      '--primary': '#8B4513',
      '--primary-light': '#A0522D',
      '--accent': '#FF8C00',
      '--accent-light': '#FFB347',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#FFE4B5',
      '--text-secondary': '#D2B48C',
      '--season-color-1': '#FF8C00',
      '--season-color-2': '#FFD700',
      '--season-color-3': '#DC143C',
      '--particle-color': '#FF8C00',
      '--particle-count': '38',
      '--animation-intensity': '1.25',
      '--blur-amount': '2px',
      '--wind-strength': '2.2',
      '--shadow-intensity': '0.55',
    },
    winter: {
      '--primary': '#37474F',
      '--primary-light': '#455A64',
      '--accent': '#B0E0E6',
      '--accent-light': '#E0F7FA',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#ECEFF1',
      '--text-secondary': '#90A4AE',
      '--season-color-1': '#87CEEB',
      '--season-color-2': '#B0E0E6',
      '--season-color-3': '#DCDCDC',
      '--particle-color': '#B0E0E6',
      '--particle-count': '42',
      '--animation-intensity': '1.2',
      '--blur-amount': '3px',
      '--wind-strength': '2.3',
      '--shadow-intensity': '0.5',
    },
  },

  snowy: {
    spring: {
      '--primary': '#ADD8E6',
      '--primary-light': '#E0FFFF',
      '--accent': '#87CEEB',
      '--accent-light': '#F0F8FF',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#F0F8FF',
      '--text-secondary': '#B0C4DE',
      '--season-color-1': '#87CEEB',
      '--season-color-2': '#98FF98',
      '--season-color-3': '#F0FFFF',
      '--particle-color': '#FFFFFF',
      '--particle-count': '50',
      '--animation-intensity': '0.8',
      '--blur-amount': '5px',
      '--shadow-intensity': '0.7',
    },
    summer: {
      '--primary': '#F0F8FF',
      '--primary-light': '#E0FFFF',
      '--accent': '#87CEEB',
      '--accent-light': '#ADD8E6',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#F5FBFF',
      '--text-secondary': '#A0C4DE',
      '--season-color-1': '#87CEEB',
      '--season-color-2': '#00CED1',
      '--season-color-3': '#FFFFFF',
      '--particle-color': '#FFFFFF',
      '--particle-count': '45',
      '--animation-intensity': '0.7',
      '--blur-amount': '6px',
      '--shadow-intensity': '0.65',
    },
    autumn: {
      '--primary': '#B0C4DE',
      '--primary-light': '#DEB887',
      '--accent': '#FFB347',
      '--accent-light': '#FFDAB9',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#F5DEB3',
      '--text-secondary': '#D2B48C',
      '--season-color-1': '#FFB347',
      '--season-color-2': '#FFD700',
      '--season-color-3': '#FFFFFF',
      '--particle-color': '#FFFFFF',
      '--particle-count': '48',
      '--animation-intensity': '0.75',
      '--blur-amount': '5px',
      '--shadow-intensity': '0.7',
    },
    winter: {
      '--primary': '#E0FFFF',
      '--primary-light': '#F0F8FF',
      '--accent': '#00BFFF',
      '--accent-light': '#87CEEB',
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#1a1f3a',
      '--text-primary': '#F8FFFF',
      '--text-secondary': '#B0D4E6',
      '--season-color-1': '#00BFFF',
      '--season-color-2': '#87CEEB',
      '--season-color-3': '#FFFFFF',
      '--particle-color': '#FFFFFF',
      '--particle-count': '60',
      '--animation-intensity': '0.9',
      '--blur-amount': '8px',
      '--shadow-intensity': '0.8',
    },
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
 */
export function isDaytime(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

/**
 * Get theme variables for current conditions
 */
export function getThemeVariables(config: ThemeConfig): ThemeVariables {
  const baseTheme = THEMES[config.weather]?.[config.season];

  if (!baseTheme) {
    // Fallback to sunny summer
    return THEMES.sunny.summer as ThemeVariables;
  }

  let theme = { ...baseTheme };

  // Apply special event override if applicable
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
