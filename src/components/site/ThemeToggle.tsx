import { useTheme } from './ThemeProvider';
import type { ColorMode } from '../../lib/theme';

const ORDER: ColorMode[] = ['auto', 'light', 'dark'];
const LABELS: Record<ColorMode, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
};
const ICONS: Record<ColorMode, string> = {
  auto: '◐',
  light: '☀',
  dark: '☾',
};

export function ThemeToggle() {
  const { mode, setMode, state } = useTheme();

  const next = () => {
    const idx = ORDER.indexOf(mode);
    setMode(ORDER[(idx + 1) % ORDER.length]);
  };

  const resolvedHint = mode === 'auto' && state ? ` (${state.resolved})` : '';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={next}
      aria-label={`Color mode: ${LABELS[mode]}${resolvedHint}. Click to change.`}
      title={`Color mode: ${LABELS[mode]}${resolvedHint}`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {ICONS[mode]}
      </span>
      <span className="theme-toggle-label">{LABELS[mode]}</span>
    </button>
  );
}
