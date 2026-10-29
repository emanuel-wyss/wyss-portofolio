import { useEffect, useState } from 'react';
import { getSiteConfig, type SiteConfig } from '../../lib/api';
import { getEventWindow } from '../../lib/theme';
import { useTheme } from './ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

const WEATHER_LABELS: Record<string, string> = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rainy: 'Rainy',
  foggy: 'Foggy',
  stormy: 'Stormy',
  windy: 'Windy',
  snowy: 'Snowy',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

const SPECIAL_LABELS: Record<string, string> = {
  christmas: 'Christmas',
  easter: 'Easter',
  halloween: 'Halloween',
  newyear: 'New Year',
  valentines: "Valentine's",
};

type FooterConfig = Pick<SiteConfig, 'tagline' | 'social_links' | 'cv_url'>;

const DEFAULT_CONFIG: FooterConfig = {
  tagline: 'Building beautiful, functional web experiences',
  social_links: [
    { platform: 'github', url: 'https://github.com' },
    { platform: 'linkedin', url: 'https://linkedin.com' },
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
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  const { state, effectsPaused, toggleEffectsPaused, weatherNow } = useTheme();

  const eventCountdown = state?.event
    ? Math.max(0, getEventWindow(state.event).end.getTime() - Date.now())
    : 0;
  const eventDaysLeft = eventCountdown ? Math.ceil(eventCountdown / 86400000) : 0;

  const themeInfo = {
    mode: state ? state.resolved : 'dark',
    daytime: state ? (state.isDaytime ? 'Day' : 'Night') : '—',
    weather: state?.weather ? WEATHER_LABELS[state.weather] : '—',
    season:
      state && state.event
        ? SPECIAL_LABELS[state.event] || state.event
        : state
          ? SEASON_LABELS[state.season]
          : '—',
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div>
          <p className="muted">© {new Date().getFullYear()} Wyss. All rights reserved.</p>
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

        <div>
          <p className="muted">CURRENT THEME</p>
          <ul className="site-theme-meta">
            <li>mode: {themeInfo.mode}</li>
            <li>weather: {themeInfo.weather}{weatherNow?.temperatureC != null ? ` · ${weatherNow.temperatureC}°C` : ''}</li>
            {weatherNow?.location ? <li>location: {weatherNow.location}</li> : null}
            <li>daytime: {themeInfo.daytime}</li>
            <li>season: {themeInfo.season}</li>
            {state?.event ? <li aria-live="polite">event: {eventDaysLeft} day{eventDaysLeft === 1 ? '' : 's'} left</li> : null}
          </ul>
          <ThemeToggle />
          <button type="button" className="effects-toggle" onClick={toggleEffectsPaused} aria-pressed={effectsPaused}>
            {effectsPaused ? 'Resume effects' : 'Pause effects'}
          </button>
        </div>
      </div>
      <div className="site-footer-bottom">
        <p className="muted">{config.tagline}</p>
      </div>
    </footer>
  );
}
