import { Link, useRouterState } from '@tanstack/react-router';

export function SiteMenu() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link to="/" className="site-logo" aria-label="Home">
          WYSS
        </Link>
        <nav aria-label="Main navigation" className="site-nav-links">
          <Link to="/about" className={pathname === '/about' ? 'active' : ''}>
            About
          </Link>
          <Link to="/work" className={pathname === '/work' ? 'active' : ''}>
            Work
          </Link>
        </nav>
      </div>
    </header>
  );
}
