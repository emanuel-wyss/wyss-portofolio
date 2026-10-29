'use client';

import { usePathname } from 'next/navigation';

export function AdminNavLinks() {
  const pathname = usePathname() || '';
  const isDashboard = pathname === '/admin' || pathname === '/admin/';
  const isSiteConfig = pathname.startsWith('/admin/globals/site-config');

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.45rem 0.75rem',
    borderRadius: 4,
    textDecoration: 'none',
    fontWeight: active ? 600 : 500,
    fontSize: 13,
    color: active ? 'var(--theme-text)' : 'var(--theme-elevation-700)',
    background: active ? 'var(--theme-elevation-150)' : 'transparent',
    borderLeft: active ? '3px solid var(--theme-success-500, #ffd700)' : '3px solid transparent',
  });

  return (
    <div
      className="nav-group"
      style={{
        width: '100%',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--theme-elevation-150)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--theme-elevation-500)',
          padding: '0 0.75rem 0.35rem',
        }}
      >
        Workspace
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <a href="/admin" style={linkStyle(isDashboard)}>
          <span>⌘</span>
          <span>Dashboard &amp; Event Previews</span>
        </a>
        <a href="/admin/globals/site-config" style={linkStyle(isSiteConfig)}>
          <span>⚙</span>
          <span>Site Config</span>
        </a>
      </div>
    </div>
  );
}

export default AdminNavLinks;
