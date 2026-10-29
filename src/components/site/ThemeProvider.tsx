import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  applyImmersiveTheme,
  getStoredMode,
  setStoredMode,
  type ColorMode,
  type ImmersiveState,
} from '../../lib/theme';

interface ThemeContextValue {
  mode: ColorMode;
  setMode: (m: ColorMode) => void;
  state: ImmersiveState | null;
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

  // Hydrate stored mode on mount (client only).
  useEffect(() => {
    setModeState(getStoredMode());
  }, []);

  // Apply theme whenever mode changes, and react to system preference changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apply = () => setState(applyImmersiveTheme(mode));
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

  const setMode = (m: ColorMode) => {
    setStoredMode(m);
    setModeState(m);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, state }}>
      {children}
      {/* Immersive FX layers — purely decorative, hidden from a11y tree. */}
      <div className="fx-layer fx-grid" aria-hidden="true" />
      <div className="fx-layer fx-scanlines" aria-hidden="true" />
      <div className="fx-layer fx-event" aria-hidden="true" />
    </ThemeContext.Provider>
  );
}
