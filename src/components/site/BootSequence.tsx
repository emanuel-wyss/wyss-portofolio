import { useEffect, useState } from 'react';

const LINES = ['loading identity', 'mounting projects', 'syncing GitHub', 'weather: Bern', 'system ready'];

export function BootSequence() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || sessionStorage.getItem('wyss-boot-seen')) return;
    sessionStorage.setItem('wyss-boot-seen', '1');
    setVisible(true);
    const timer = window.setInterval(() => setIndex((value) => value + 1), 180);
    const done = window.setTimeout(() => setVisible(false), 1200);
    return () => { window.clearInterval(timer); window.clearTimeout(done); };
  }, []);

  if (!visible) return null;
  return (
    <div className="boot-sequence" role="status" aria-live="polite">
      <div className="boot-window">
        <p className="boot-title">WYSS//BOOT</p>
        {LINES.slice(0, Math.min(index + 1, LINES.length)).map((line) => (
          <p key={line}><span>[ OK ]</span> {line}</p>
        ))}
        <button type="button" onClick={() => setVisible(false)}>skip_intro</button>
      </div>
    </div>
  );
}
