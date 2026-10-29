import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTheme } from './ThemeProvider';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const { state } = useTheme();

  const reducedMotion = state?.reducedMotion ?? false;
  const weather = state?.weather || 'sunny';
  const event = state?.event;

  useEffect(() => {
    if (children !== displayChildren) {
      if (reducedMotion) {
        setDisplayChildren(children);
        return;
      }

      // Check if View Transitions API is available
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        document.startViewTransition(() => {
          setDisplayChildren(children);
        });
      } else {
        setTransitioning(true);
        const timer = setTimeout(() => {
          setDisplayChildren(children);
          setTransitioning(false);
        }, 280);
        return () => clearTimeout(timer);
      }
    }
  }, [children, displayChildren, reducedMotion]);

  if (reducedMotion) {
    return <div className="page-transition-wrapper">{children}</div>;
  }

  let glitchClass = 'loading-glitch-cyber';
  if (event === 'halloween' || weather === 'stormy') {
    glitchClass = 'loading-glitch-spooky';
  } else if (weather === 'snowy' || event === 'christmas') {
    glitchClass = 'loading-glitch-frost';
  } else if (event === 'pride' || event === 'aprilfools') {
    glitchClass = 'loading-glitch-neon';
  }

  return (
    <div className={`page-transition-wrapper ${transitioning ? `is-loading-glitch ${glitchClass}` : ''}`}>
      {displayChildren}
    </div>
  );
}
