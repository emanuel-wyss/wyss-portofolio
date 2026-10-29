import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  applyImmersiveTheme,
  getStoredMode,
  setStoredMode,
  type ColorMode,
  type ImmersiveState,
  type WeatherType,
  getEffectsPaused,
  setEffectsPaused,
  getEffectsIntensity,
  setEffectsIntensity,
  type EffectsIntensity,
  getPreferredEvent,
  setPreferredEvent,
  type SpecialEventType,
  ALL_EVENTS,
  getEventSound,
  setEventSound,
} from '../../lib/theme';
import { getSiteConfig, getWeather } from '../../lib/api';
import { EventCanvas } from './EventCanvas';

interface ThemeContextValue {
  mode: ColorMode;
  setMode: (m: ColorMode) => void;
  state: ImmersiveState | null;
  effectsPaused: boolean;
  toggleEffectsPaused: () => void;
  effectsIntensity: EffectsIntensity;
  setIntensity: (value: EffectsIntensity) => void;
  preferredEvent?: SpecialEventType;
  setPreferredEventChoice: (event?: SpecialEventType) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  weatherNow: Awaited<ReturnType<typeof getWeather>>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>('auto');
  const [state, setState] = useState<ImmersiveState | null>(null);
  const [effectsPaused, setEffectsPausedState] = useState(false);
  const [effectsIntensity, setEffectsIntensityState] = useState<EffectsIntensity>('standard');
  const [preferredEvent, setPreferredEventState] = useState<SpecialEventType | undefined>();
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const weatherRef = useRef<WeatherType | undefined>(undefined);
  const [weatherNow, setWeatherNow] = useState<Awaited<ReturnType<typeof getWeather>>>(null);
  const [eventSettings, setEventSettings] = useState<Awaited<ReturnType<typeof getSiteConfig>>>(null);

  // Hydrate stored preferences on mount (client only).
  useEffect(() => {
    setModeState(getStoredMode());
    const paused = getEffectsPaused();
    setEffectsPausedState(paused);
    setEffectsPaused(paused);
    const intensity = getEffectsIntensity();
    setEffectsIntensityState(intensity);
    setEffectsIntensity(intensity);
    setPreferredEventState(getPreferredEvent());
    setSoundEnabledState(getEventSound());
  }, []);

  useEffect(() => {
    getSiteConfig().then(setEventSettings);
  }, []);

  // Admin preview controls the embedded homepage without URL overrides or persistence.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const adminOrigin = import.meta.env.PUBLIC_ADMIN_URL || 'https://admin.wyss.rocks';
      if (event.origin !== window.location.origin && event.origin !== adminOrigin) return;
      if (event.data?.type !== 'wyss-event-preview') return;
      const selected = event.data.event as SpecialEventType | undefined;
      if (selected && !ALL_EVENTS.includes(selected)) return;
      setState(applyImmersiveTheme(mode, weatherRef.current, selected));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mode]);

  // Fetch real weather once on mount, then refresh hourly.
  useEffect(() => {
    let mounted = true;
    const load = () =>
      getWeather().then((w) => {
        if (!mounted || !w) return;
        weatherRef.current = w.weather;
        setWeatherNow(w);
        setState(applyImmersiveTheme(mode, weatherRef.current));
      });
    load();
    const wi = window.setInterval(load, 60 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(wi);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Apply theme whenever mode changes, and react to system preference changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apply = () => setState(applyImmersiveTheme(mode, weatherRef.current));
    apply();

    // Re-apply when the OS color scheme or reduced-motion preference changes.
    const schemeMq = window.matchMedia('(prefers-color-scheme: light)');
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => apply();
    schemeMq.addEventListener('change', onChange);
    motionMq.addEventListener('change', onChange);

    // Re-evaluate time-of-day / event drift every 10 minutes.
    const interval = window.setInterval(apply, 10 * 60 * 1000);

    return () => {
      schemeMq.removeEventListener('change', onChange);
      motionMq.removeEventListener('change', onChange);
      window.clearInterval(interval);
    };
  }, [mode]);

  useEffect(() => {
    const settings = eventSettings?.event_settings;
    if (!settings?.enabled) return;
    const root = document.documentElement;
    if (settings.primaryColor) root.style.setProperty('--primary', settings.primaryColor);
    if (settings.accentColor) root.style.setProperty('--accent', settings.accentColor);
  }, [eventSettings]);

  const setMode = (m: ColorMode) => {
    setStoredMode(m);
    setModeState(m);
  };

  const setIntensity = (value: EffectsIntensity) => {
    setEffectsIntensityState(value);
    setEffectsIntensity(value);
  };

  const setSoundEnabled = (enabled: boolean) => {
    setEventSound(enabled);
    setSoundEnabledState(enabled);
  };

  const setPreferredEventChoice = (event?: SpecialEventType) => {
    setPreferredEvent(event);
    setPreferredEventState(event);
    setState(applyImmersiveTheme(mode, weatherRef.current));
  };

  const toggleEffectsPaused = () => {
    const next = !effectsPaused;
    setEffectsPausedState(next);
    setEffectsPaused(next);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, state, effectsPaused, toggleEffectsPaused, effectsIntensity, setIntensity, preferredEvent, setPreferredEventChoice, soundEnabled, setSoundEnabled, weatherNow }}>
      {children}
      {/* Immersive FX layers — purely decorative, hidden from a11y tree. */}
      <div className="fx-layer fx-grid" aria-hidden="true" />
      <div className="fx-layer fx-glitch" aria-hidden="true" />
      <div className="fx-layer fx-scanlines" aria-hidden="true" />
      <div className="fx-layer fx-event" aria-hidden="true" />
      <EventCanvas event={state?.event} reducedMotion={state?.reducedMotion ?? true} intensity={eventSettings?.event_settings?.intensity || effectsIntensity} soundEnabled={soundEnabled} />
    </ThemeContext.Provider>
  );
}
