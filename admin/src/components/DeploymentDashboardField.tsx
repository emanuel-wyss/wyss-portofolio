'use client';

import { useEffect, useState } from 'react';

const WEB_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wyss.rocks';
const GITHUB_URL = 'https://github.com/emanuel-wyss/wyss-portofolio';
const CODEBERG_URL = 'https://codeberg.org/maenu/wyss-portofolio';

type Status = { service?: string; status?: string; environment?: string; commit?: string | null; timestamp?: string };

export function DeploymentDashboardField() {
  const [status, setStatus] = useState<Status | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${WEB_URL}/api/system-status`)
      .then(async (response) => { setOnline(response.ok); setStatus(response.ok ? await response.json() : null); })
      .catch(() => setOnline(false));
  }, []);

  return (
    <div className="deployment-dashboard" style={{ marginBlock: '1.5rem', padding: '1rem', border: '1px solid var(--theme-elevation-150)', borderRadius: 6 }}>
      <h3 style={{ margin: '0 0 .35rem' }}>Deployment dashboard</h3>
      <p style={{ margin: '0 0 1rem', color: 'var(--theme-elevation-600)' }}>Public, read-only service telemetry.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.6rem' }}>
        <StatusCard label="web" value={online === null ? 'checking…' : online ? 'online' : 'offline'} ok={online === true} />
        <StatusCard label="environment" value={status?.environment || '—'} />
        <StatusCard label="commit" value={status?.commit ? status.commit.slice(0, 8) : 'not exposed'} />
      </div>
      <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <a href={`${WEB_URL}/health`} target="_blank" rel="noreferrer">Web health ↗</a>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub mirror ↗</a>
        <a href={CODEBERG_URL} target="_blank" rel="noreferrer">Codeberg source ↗</a>
      </div>
    </div>
  );
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return <div style={{ padding: '.65rem', background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-150)' }}><small style={{ display: 'block', opacity: .65 }}>{label}</small><strong style={{ color: ok ? '#39a852' : undefined }}>{value}</strong></div>;
}

export default DeploymentDashboardField;
