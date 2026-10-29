import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTheme } from './ThemeProvider';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const { state } = useTheme();

  const weather = state?.weather || 'sunny';
  const event = state?.event;

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitioning(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [children, displayChildren]);

  // Determine transition scanline/glitch class based on current weather/event
  let transitionEffectClass = 'page-trans-cyber';
  if (event === 'halloween' || weather === 'stormy') {
    transitionEffectClass = 'page-trans-glitch';
  } else if (weather === 'snowy' || event === 'christmas') {
    transitionEffectClass = 'page-trans-snow';
  } else if (weather === 'rainy') {
    transitionEffectClass = 'page-trans-rain';
  } else if (event === 'pride' || event === 'aprilfools') {
    transitionEffectClass = 'page-trans-neon';
  }

  return (
    <div className={`page-transition-wrapper ${transitioning ? `is-transitioning ${transitionEffectClass}` : ''}`}>
      {displayChildren}
    </div>
  );
}
