import type {
  GitHubProfile,
  LanguageStat,
  ContributionDay,
  GitHubRepo,
} from '../../lib/api';

// Deterministic color per language (so the same language is always the same hue).
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  Dockerfile: '#384d54',
  Nix: '#7e7eff',
};

function colorFor(name: string): string {
  if (LANG_COLORS[name]) return LANG_COLORS[name];
  // Stable fallback hue from the name.
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

export function LanguageBar({ languages }: { languages: LanguageStat[] }) {
  if (!languages.length) return null;
  return (
    <div className="gh-langs">
      <div className="gh-langbar" role="img" aria-label="Language breakdown">
        {languages.map((l) => (
          <span
            key={l.name}
            className="gh-langbar-seg"
            style={{ width: `${l.percent}%`, background: colorFor(l.name) }}
            title={`${l.name} ${l.percent}%`}
          />
        ))}
      </div>
      <ul className="gh-langlegend">
        {languages.map((l) => (
          <li key={l.name}>
            <span className="gh-dot" style={{ background: colorFor(l.name) }} />
            <span className="gh-langname">{l.name}</span>
            <span className="gh-langpct">{l.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContributionHeatmap({
  weeks,
  total,
}: {
  weeks: ContributionDay[][];
  total: number;
}) {
  if (!weeks.length) return null;
  const cell = 11;
  const gap = 3;
  const width = weeks.length * (cell + gap);
  const height = 7 * (cell + gap);
  const levelColor = (level: number) => {
    // Accent-tinted intensity buckets.
    switch (level) {
      case 0:
        return 'var(--border-color, rgba(255,215,0,0.12))';
      case 1:
        return 'rgba(255, 215, 0, 0.25)';
      case 2:
        return 'rgba(255, 215, 0, 0.45)';
      case 3:
        return 'rgba(255, 215, 0, 0.7)';
      default:
        return 'var(--accent, #ffd700)';
    }
  };
  return (
    <div className="gh-heatmap">
      <div className="gh-heatmap-head">
        <h3>Contributions</h3>
        <span className="gh-heatmap-total">{total.toLocaleString()} in the last year</span>
      </div>
      <div className="gh-heatmap-scroll">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${total} contributions in the last year`}
        >
          {weeks.map((week, wi) =>
            week.map((day, di) => (
              <rect
                key={`${wi}-${di}`}
                x={wi * (cell + gap)}
                y={di * (cell + gap)}
                width={cell}
                height={cell}
                rx={2}
                fill={levelColor(day.level)}
              >
                <title>{`${day.date}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}</title>
              </rect>
            )),
          )}
        </svg>
      </div>
      <div className="gh-heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="gh-heatmap-swatch" style={{ background: levelColor(l) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export function TechRadar({ languages }: { languages: LanguageStat[] }) {
  const items = languages.slice(0, 8);
  if (items.length < 3) return null;
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const rings = [0.25, 0.5, 0.75, 1];
  const maxPct = Math.max(...items.map((l) => l.percent), 1);

  const pointFor = (i: number, radius: number) => {
    const angle = (Math.PI * 2 * i) / items.length - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  };

  const polygon = items
    .map((l, i) => {
      const r = (l.percent / maxPct) * maxR;
      const p = pointFor(i, r);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <div className="gh-radar">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Technology radar based on GitHub language usage"
      >
        {/* concentric rings */}
        {rings.map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={maxR * r}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={1}
          />
        ))}
        {/* spokes + labels */}
        {items.map((l, i) => {
          const outer = pointFor(i, maxR);
          const label = pointFor(i, maxR + 18);
          return (
            <g key={l.name}>
              <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--border-color)" strokeWidth={1} />
              <text
                x={label.x}
                y={label.y}
                fill="var(--text-secondary)"
                fontSize={10}
                textAnchor={Math.abs(label.x - cx) < 6 ? 'middle' : label.x > cx ? 'start' : 'end'}
                dominantBaseline="middle"
              >
                {l.name}
              </text>
            </g>
          );
        })}
        {/* data polygon */}
        <polygon
          points={polygon}
          fill="var(--accent)"
          fillOpacity={0.18}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {items.map((l, i) => {
          const r = (l.percent / maxPct) * maxR;
          const p = pointFor(i, r);
          return <circle key={l.name} cx={p.x} cy={p.y} r={3} fill="var(--accent)" />;
        })}
      </svg>
    </div>
  );
}

export function StatCards({ profile }: { profile: GitHubProfile }) {
  const stats = [
    { label: 'Repositories', value: profile.publicRepos },
    { label: 'Stars', value: profile.totalStars },
    { label: 'Followers', value: profile.followers },
    { label: 'Following', value: profile.following },
  ];
  return (
    <div className="gh-stats">
      {stats.map((s) => (
        <div className="gh-stat" key={s.label}>
          <span className="gh-stat-value">{s.value.toLocaleString()}</span>
          <span className="gh-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function RepoCard({ repo }: { repo: GitHubRepo }) {
  return (
    <a className="gh-repo" href={repo.url} target="_blank" rel="noopener noreferrer">
      <div className="gh-repo-head">
        <span className="gh-repo-name">{repo.name}</span>
        <span className="gh-repo-stars" aria-label={`${repo.stars} stars`}>
          ★ {repo.stars}
        </span>
      </div>
      {repo.description ? <p className="gh-repo-desc">{repo.description}</p> : null}
      <div className="gh-repo-meta">
        {repo.language ? (
          <span className="gh-repo-lang">
            <span className="gh-dot" style={{ background: colorFor(repo.language) }} />
            {repo.language}
          </span>
        ) : null}
        {repo.forks > 0 ? <span className="gh-repo-forks">⑂ {repo.forks}</span> : null}
      </div>
      {repo.topics?.length ? (
        <div className="gh-repo-topics">
          {repo.topics.slice(0, 4).map((t) => (
            <span className="gh-topic" key={t}>
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </a>
  );
}
