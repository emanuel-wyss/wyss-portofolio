import { useEffect, useMemo, useState } from 'react';
import { getCurrentSeason, getCurrentSpecialEvent, isDaytime, type WeatherType } from '../../lib/theme';
import { getSiteConfig, type SiteConfig } from '../../lib/api';

const WEATHER_LABELS: Record<WeatherType, string> = {
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

  const themeInfo = useMemo(() => {
    const weatherClass = Array.from(document.documentElement.classList).find((cls) => cls.startsWith('weather-'));
    const weatherKey = weatherClass?.replace('weather-', '') as WeatherType | undefined;
    const weather = weatherKey && WEATHER_LABELS[weatherKey] ? WEATHER_LABELS[weatherKey] : 'Sunny';
    const season = getCurrentSeason();
    const special = getCurrentSpecialEvent();

    return {
      weather,
      daytime: isDaytime() ? 'Day' : 'Night',
      season: special ? SPECIAL_LABELS[special] : SEASON_LABELS[season],
    };
  }, []);

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
            <li>weather: {themeInfo.weather}</li>
            <li>daytime: {themeInfo.daytime}</li>
            <li>season: {themeInfo.season}</li>
          </ul>
        </div>
      </div>
      <div className="site-footer-bottom">
        <p className="muted">{config.tagline}</p>
      </div>
    </footer>
  );
}
