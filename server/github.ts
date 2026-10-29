// server/github.ts
// Server-side GitHub aggregation. Keeps any token off the client and lets us
// cache responses (GitHub anonymous REST is limited to 60 req/hr).
//
// Config via env:
//   GITHUB_USERNAME  — the profile to showcase (required for data)
//   GITHUB_TOKEN     — optional PAT; raises rate limits and unlocks the
//                      contribution calendar (GraphQL). Everything degrades
//                      gracefully without it.

const GH_REST = 'https://api.github.com';
const GH_GQL = 'https://api.github.com/graphql';

const USERNAME = process.env.GITHUB_USERNAME?.trim() || '';
const TOKEN = process.env.GITHUB_TOKEN?.trim() || '';

export interface GitHubRepo {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  updatedAt: string;
  isFork: boolean;
}

export interface LanguageStat {
  name: string;
  /** bytes across the sampled repos */
  value: number;
  /** 0..100 */
  percent: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  /** 0..4 intensity bucket */
  level: number;
}

export interface GitHubProfile {
  configured: boolean;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  url: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  totalStars: number;
  topRepos: GitHubRepo[];
  languages: LanguageStat[];
  contributions: {
    total: number;
    weeks: ContributionDay[][]; // weeks -> 7 days
  } | null;
  generatedAt: string;
}

function restHeaders(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'wyss.rocks',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function ghGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!TOKEN) return null; // GraphQL requires auth
  const res = await fetch(GH_GQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'wyss.rocks',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors || !json.data) return null;
  return json.data;
}

async function fetchContributions(login: string): Promise<GitHubProfile['contributions']> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays { date contributionCount contributionLevel }
            }
          }
        }
      }
    }`;
  type Resp = {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{
              date: string;
              contributionCount: number;
              contributionLevel: string;
            }>;
          }>;
        };
      };
    } | null;
  };
  const data = await ghGraphql<Resp>(query, { login });
  if (!data?.user) return null;
  const cal = data.user.contributionsCollection.contributionCalendar;
  const levelMap: Record<string, number> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };
  const weeks = cal.weeks.map((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: levelMap[d.contributionLevel] ?? 0,
    })),
  );
  return { total: cal.totalContributions, weeks };
}

/** Aggregate everything for the showcase. Returns configured:false if no username. */
export async function getGitHubProfile(): Promise<GitHubProfile> {
  const now = new Date().toISOString();
  const empty: GitHubProfile = {
    configured: false,
    username: '',
    name: null,
    avatarUrl: null,
    bio: null,
    url: null,
    followers: 0,
    following: 0,
    publicRepos: 0,
    totalStars: 0,
    topRepos: [],
    languages: [],
    contributions: null,
    generatedAt: now,
  };
  if (!USERNAME) return empty;

  // 1) Profile
  const userRes = await fetch(`${GH_REST}/users/${USERNAME}`, { headers: restHeaders() });
  if (!userRes.ok) return { ...empty, configured: true, username: USERNAME };
  const user = (await userRes.json()) as any;

  // 2) Repos (sorted by recent activity, take a sample for language stats)
  const reposRes = await fetch(
    `${GH_REST}/users/${USERNAME}/repos?per_page=100&sort=pushed&type=owner`,
    { headers: restHeaders() },
  );
  const repos: any[] = reposRes.ok ? await reposRes.json() : [];

  const nonForks = repos.filter((r) => !r.fork);
  const totalStars = nonForks.reduce((s, r) => s + (r.stargazers_count || 0), 0);

  const topRepos: GitHubRepo[] = [...nonForks]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0) || +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      topics: r.topics || [],
      updatedAt: r.pushed_at,
      isFork: !!r.fork,
    }));

  // 3) Language breakdown — aggregate /languages for the most relevant repos.
  const langSample = [...nonForks]
    .sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .slice(0, 20);
  const langTotals = new Map<string, number>();
  await Promise.all(
    langSample.map(async (r) => {
      try {
        const lr = await fetch(r.languages_url, { headers: restHeaders() });
        if (!lr.ok) return;
        const langs = (await lr.json()) as Record<string, number>;
        for (const [name, bytes] of Object.entries(langs)) {
          langTotals.set(name, (langTotals.get(name) || 0) + bytes);
        }
      } catch {
        /* ignore individual repo language failures */
      }
    }),
  );
  const totalBytes = [...langTotals.values()].reduce((s, v) => s + v, 0) || 1;
  const languages: LanguageStat[] = [...langTotals.entries()]
    .map(([name, value]) => ({ name, value, percent: Math.round((value / totalBytes) * 1000) / 10 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // 4) Contributions (GraphQL, token only)
  let contributions: GitHubProfile['contributions'] = null;
  try {
    contributions = await fetchContributions(USERNAME);
  } catch {
    contributions = null;
  }

  return {
    configured: true,
    username: USERNAME,
    name: user.name ?? null,
    avatarUrl: user.avatar_url ?? null,
    bio: user.bio ?? null,
    url: user.html_url ?? null,
    followers: user.followers || 0,
    following: user.following || 0,
    publicRepos: user.public_repos || 0,
    totalStars,
    topRepos,
    languages,
    contributions,
    generatedAt: now,
  };
}

// Simple in-memory cache so we don't hammer GitHub's rate limit.
let cache: { data: GitHubProfile; at: number } | null = null;
const TTL_MS = 30 * 60 * 1000; // 30 min

export async function getGitHubProfileCached(): Promise<GitHubProfile> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const data = await getGitHubProfile();
  // Only cache successful/configured responses.
  if (data.configured) cache = { data, at: Date.now() };
  return data;
}
