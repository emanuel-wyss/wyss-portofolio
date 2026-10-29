import { useEffect, useState } from 'react';
import { getSiteConfig, type SiteConfig } from '../../lib/api';
import type { ColorMode, EffectsIntensity } from '../../lib/theme';
import { useTheme } from './ThemeProvider';

const WEATHER_LABELS: Record<string, string> = {
  sunny: 'sunny',
  cloudy: 'cloudy',
  rainy: 'rainy',
  foggy: 'foggy',
  stormy: 'stormy',
  windy: 'windy',
  snowy: 'snowy',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  winter: 'winter',
};

const SPECIAL_LABELS: Record<string, string> = {
  christmas: 'christmas',
  easter: 'easter',
  halloween: 'halloween',
  newyear: 'newyear',
  valentines: 'valentines',
  pride: 'pride',
  swiss: 'swiss',
  aprilfools: 'aprilfools',
};

const MODE_ORDER: ColorMode[] = ['auto', 'dark', 'light'];
const INTENSITY_ORDER: EffectsIntensity[] = ['quiet', 'standard', 'party'];

type FooterConfig = Pick<SiteConfig, 'tagline' | 'social_links' | 'cv_url' | 'event_settings'>;

const DEFAULT_CONFIG: FooterConfig = {
  tagline: 'Building beautiful, functional web experiences',
  social_links: [
    { platform: 'github', url: 'https://github.com/emanuel-wyss' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/in/emanuel-wyss/' },
    { platform: 'instagram', url: 'https://www.instagram.com/maenu_wyss' },
  ],
};

export function SiteFooter() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let mounted = true;
    getSiteConfig().then((siteConfig) => {
      if (!mounted || !siteConfig) return;
      setConfig({
        tagline: siteConfig.tagline || DEFAULT_CONFIG.tagline,
        social_links: siteConfig.social_links || DEFAULT_CONFIG.social_links,
        cv_url: siteConfig.cv_url,
        event_settings: siteConfig.event_settings,
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  const {
    mode,
    setMode,
    state,
    effectsPaused,
    toggleEffectsPaused,
    effectsIntensity,
    setIntensity,
    weatherNow,
    soundEnabled,
    setSoundEnabled,
  } = useTheme();

  const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'local';
  const sourceLinks = [
    { label: 'Codeberg', url: 'https://codeberg.org/maenu/wyss-portofolio' },
    { label: 'GitHub mirror', url: 'https://github.com/emanuel-wyss/wyss-portofolio' },
  ];

  const themeInfo = {
    mode: state ? state.resolved : 'dark',
    daytime: state ? (state.isDaytime ? 'day' : 'night') : '—',
    weather: state?.weather ? WEATHER_LABELS[state.weather] : '—',
    season:
      state && state.event
        ? SPECIAL_LABELS[state.event] || state.event
        : state
          ? SEASON_LABELS[state.season]
          : '—',
  };

  const cycleMode = () => {
    const next = MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length];
    setMode(next);
  };

  const cycleIntensity = () => {
    const next = INTENSITY_ORDER[(INTENSITY_ORDER.indexOf(effectsIntensity) + 1) % INTENSITY_ORDER.length];
    setIntensity(next);
  };

  const wxLocation =
    !weatherNow?.location || weatherNow.location === 'Switzerland'
      ? 'Bern, Schweiz'
      : weatherNow.location;
  const wxSummary = `${themeInfo.weather}${weatherNow?.temperatureC != null ? ` ${weatherNow.temperatureC}°C` : ''} @ ${wxLocation}`;

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="footer-identity">
          <p className="muted">© {new Date().getFullYear()} Wyss. All rights reserved.</p>
          <p className="footer-telemetry">
            <span>SYS</span> ONLINE · <span>API</span> OK · <span>WX</span> {wxLocation}
          </p>
          <nav className="footer-source" aria-label="Source repositories">
            {sourceLinks.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
                {link.label} ↗
              </a>
            ))}
          </nav>
        </div>

        <nav aria-label="Social links" className="site-socials">
          {(config.social_links || []).map((link) => (
            <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.platform}
            </a>
          ))}
        </nav>

        {config.cv_url ? (
          <a href={config.cv_url} className="site-cv-link" download>
            Download CV
          </a>
        ) : null}
      </div>

      {/* Full-width concise terminal status + inline controls bar */}
      <div className="site-theme-bar" role="region" aria-label="Current theme and effect controls">
        <div className="site-theme-readout">
          <span className="theme-bar-tag">CURRENT THEME</span>
          <span>
            mode:<b>{themeInfo.mode}</b>
          </span>
          <span className="sep">·</span>
          <span>
            wx:<b>{wxSummary}</b>
          </span>
          <span className="sep">·</span>
          <span>
            time:<b>{themeInfo.daytime}</b>
          </span>
          <span className="sep">·</span>
          <span>
            season:<b>{themeInfo.season}</b>
          </span>
          <span className="sep">·</span>
          <span>
            tz:<b>{timezone}</b>
          </span>
          {state?.event && config.event_settings?.announcement ? (
            <>
              <span className="sep">·</span>
              <span className="event-announcement">{config.event_settings.announcement}</span>
            </>
          ) : null}
        </div>

        <div className="site-theme-actions">
          <button
            type="button"
            className="term-chip"
            onClick={cycleMode}
            title="Click to cycle color mode (auto / dark / light)"
          >
            mode:{mode}
          </button>
          <button
            type="button"
            className="term-chip"
            onClick={toggleEffectsPaused}
            aria-pressed={effectsPaused}
            title="Toggle visual effects"
          >
            fx:{effectsPaused ? 'paused' : 'on'}
          </button>
          <button
            type="button"
            className="term-chip"
            onClick={cycleIntensity}
            title="Click to cycle particle intensity (quiet / standard / party)"
          >
            int:{effectsIntensity}
          </button>
          <button
            type="button"
            className="term-chip"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-pressed={soundEnabled}
            title="Toggle opt-in interaction sounds"
          >
            sfx:{soundEnabled ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p className="footer-privacy">
          <span>PRIVACY //</span> ZERO TRACKING · ZERO COOKIES · ZERO THIRD-PARTY FONTS · 100% SELF-HOSTED ·{' '}
          <a href="/privacy">DETAILS →</a>
        </p>
      </div>
    </footer>
  );
}
