import { useEffect, useState } from 'react';
import { getSiteConfig, type SiteConfig } from '../../lib/api';
import { ALL_EVENTS, getEventWindow, type SpecialEventType } from '../../lib/theme';
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
  const [achievementCount, setAchievementCount] = useState(0);

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

  const { state, effectsPaused, toggleEffectsPaused, effectsIntensity, setIntensity, weatherNow, preferredEvent, setPreferredEventChoice } = useTheme();

  useEffect(() => {
    const update = () => {
      try {
        const data = JSON.parse(localStorage.getItem('wyss-event-achievements') || '{}');
        setAchievementCount(Object.values(data as Record<string, string[]>).flat().length);
      } catch { /* ignore */ }
    };
    update();
    window.addEventListener('wyss-achievement', update);
    return () => window.removeEventListener('wyss-achievement', update);
  }, []);

  const eventCountdown = state?.event
    ? Math.max(0, getEventWindow(state.event).end.getTime() - Date.now())
    : 0;
  const eventDaysLeft = eventCountdown ? Math.ceil(eventCountdown / 86400000) : 0;
  const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'local';

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
            <li>timezone: {timezone}</li>
          </ul>
          {state?.event && config.event_settings?.announcement ? <p className="event-announcement">{config.event_settings.announcement}</p> : null}
          <ThemeToggle />
          {achievementCount > 0 ? <p className="muted event-achievements">discoveries: {achievementCount}</p> : null}
          <label className="effects-intensity">
            preferred event:{' '}
            <select value={preferredEvent || ''} onChange={(event) => setPreferredEventChoice((event.target.value || undefined) as SpecialEventType | undefined)}>
              <option value="">automatic</option>
              {ALL_EVENTS.map((event) => <option key={event} value={event}>{event}</option>)}
            </select>
          </label>
          <label className="effects-intensity">
            intensity:{' '}
            <select value={effectsIntensity} onChange={(event) => setIntensity(event.target.value as typeof effectsIntensity)}>
              <option value="quiet">quiet</option>
              <option value="standard">standard</option>
              <option value="party">party</option>
            </select>
          </label>
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
