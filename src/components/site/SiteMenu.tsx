import { Link, useRouterState } from '@tanstack/react-router';

export function SiteMenu() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <header className="site-nav" style={{ viewTransitionName: 'site-header' }}>
      <div className="site-nav-terminal" aria-hidden="true">
        <span className="terminal-prompt">root@wyss</span>
        <span className="terminal-path">~/rocks</span>
        <span className="terminal-status"><i /> ONLINE / :80</span>
      </div>
      <div className="site-nav-inner">
        <Link to="/" className="site-logo glitch" aria-label="Home" data-text="WYSS">
          <span className="logo-mark">[</span>WYSS<span className="logo-mark">]</span>
        </Link>
        <nav aria-label="Main navigation" className="site-nav-links">
          <span className="nav-index">01—</span>
          <Link to="/about" className={pathname === '/about' ? 'active' : ''}>
            About
          </Link>
          <span className="nav-index">02—</span>
          <Link to="/work" className={pathname === '/work' ? 'active' : ''}>
            Work
          </Link>
        </nav>
      </div>
    </header>
  );
}
