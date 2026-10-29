// server/github.ts
// Server-side GitHub aggregation. Keeps any token off the client, caches responses,
// and aggregates commit + language/tech-stack metrics across both public and private
// repositories WITHOUT ever exposing private repository names, URLs, or descriptions.

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
  /** bytes across sampled public + private repos */
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
  /** Public-only showcase repositories (private repos are strictly excluded). */
  topRepos: GitHubRepo[];
  /** Aggregated across both public and private repositories (anonymized). */
  languages: LanguageStat[];
  /** Deduplicated languages & topics across public + private repositories (anonymized). */
  techStack: string[];
  contributions: {
    total: number;
    publicCommits: number;
    privateContributions: number;
    weeks: ContributionDay[][];
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

async function ghGraphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
  if (!TOKEN) return null;
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

type GqlRepoNode = {
  name: string;
  nameWithOwner: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  pushedAt: string;
  primaryLanguage: { name: string } | null;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
  languages: { edges: Array<{ size: number; node: { name: string } }> };
};

async function fetchGraphqlData(login: string) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays { date contributionCount contributionLevel }
            }
          }
        }
      }
      viewer {
        login
        repositories(
          first: 100
          ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
          isFork: false
          orderBy: { field: PUSHED_AT, direction: DESC }
        ) {
          nodes {
            name
            nameWithOwner
            url
            description
            isPrivate
            isFork
            stargazerCount
            forkCount
            pushedAt
            primaryLanguage { name }
            repositoryTopics(first: 12) { nodes { topic { name } } }
            languages(first: 15, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }
          }
        }
        repositoriesContributedTo(
          first: 100
          includeUserRepositories: true
          contributionTypes: [COMMIT, PULL_REQUEST, REPOSITORY]
          orderBy: { field: PUSHED_AT, direction: DESC }
        ) {
          nodes {
            name
            nameWithOwner
            url
            description
            isPrivate
            isFork
            stargazerCount
            forkCount
            pushedAt
            primaryLanguage { name }
            repositoryTopics(first: 12) { nodes { topic { name } } }
            languages(first: 15, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }
          }
        }
      }
    }
  `;

  type Resp = {
    user: {
      contributionsCollection: {
        totalCommitContributions: number;
        restrictedContributionsCount: number;
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
    viewer: {
      login: string;
      repositories: { nodes: GqlRepoNode[] };
      repositoriesContributedTo: { nodes: GqlRepoNode[] };
    } | null;
  };

  return ghGraphql<Resp>(query, { login });
}

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
    techStack: [],
    contributions: null,
    generatedAt: now,
  };
  if (!USERNAME) return empty;

  const userRes = await fetch(`${GH_REST}/users/${USERNAME}`, { headers: restHeaders() });
  if (!userRes.ok) return { ...empty, configured: true, username: USERNAME };
  const user = (await userRes.json()) as any;

  const langTotals = new Map<string, number>();
  const topicSet = new Set<string>();
  const publicRepoMap = new Map<string, GitHubRepo>();

  let contributions: GitHubProfile['contributions'] = null;

  // 1) Try GraphQL first (unlocks contribution calendar + private repo language/topic aggregation)
  try {
    const gql = await fetchGraphqlData(USERNAME);
    if (gql?.user) {
      const col = gql.user.contributionsCollection;
      const cal = col.contributionCalendar;
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
      contributions = {
        total: cal.totalContributions,
        publicCommits: col.totalCommitContributions || 0,
        privateContributions: col.restrictedContributionsCount || 0,
        weeks,
      };
    }

    if (gql?.viewer && gql.viewer.login.toLowerCase() === USERNAME.toLowerCase()) {
      const seenRepos = new Set<string>();
      const allNodes = [
        ...(gql.viewer.repositories?.nodes || []),
        ...(gql.viewer.repositoriesContributedTo?.nodes || []),
      ];
      for (const r of allNodes) {
        if (!r || r.isFork || seenRepos.has(r.nameWithOwner)) continue;
        seenRepos.add(r.nameWithOwner);

        // Anonymously aggregate languages & topics from BOTH public and private repos
        for (const edge of r.languages?.edges || []) {
          if (edge?.node?.name && edge.size > 0) {
            langTotals.set(edge.node.name, (langTotals.get(edge.node.name) || 0) + edge.size);
            topicSet.add(edge.node.name);
          }
        }
        for (const t of r.repositoryTopics?.nodes || []) {
          if (t?.topic?.name) topicSet.add(t.topic.name);
        }

        // STRICT PRIVACY GATE: never include private repos in public topRepos list
        if (!r.isPrivate) {
          publicRepoMap.set(r.nameWithOwner, {
            name: r.name,
            fullName: r.nameWithOwner,
            url: r.url,
            description: r.description,
            language: r.primaryLanguage?.name || null,
            stars: r.stargazerCount || 0,
            forks: r.forkCount || 0,
            topics: (r.repositoryTopics?.nodes || []).map((t) => t.topic.name),
            updatedAt: r.pushedAt,
            isFork: false,
          });
        }
      }
    }
  } catch {
    /* fall through to REST supplement */
  }

  // 2) Also query REST repos so all public repos (and any private repos via /user/repos) are included
  const restEndpoint = TOKEN
    ? `${GH_REST}/user/repos?per_page=100&sort=pushed&visibility=all&affiliation=owner,collaborator,organization_member`
    : `${GH_REST}/users/${USERNAME}/repos?per_page=100&sort=pushed&type=owner`;
  const [authReposRes, pubReposRes] = await Promise.all([
    fetch(restEndpoint, { headers: restHeaders() }),
    TOKEN
      ? fetch(`${GH_REST}/users/${USERNAME}/repos?per_page=100&sort=pushed&type=owner`, {
          headers: restHeaders(),
        })
      : Promise.resolve(null),
  ]);

  const restRepos: any[] = [
    ...(authReposRes.ok ? await authReposRes.json() : []),
    ...(pubReposRes && pubReposRes.ok ? await pubReposRes.json() : []),
  ];

  const restSeen = new Set<string>();
  const needLangFetch: any[] = [];

  for (const r of restRepos) {
    if (!r || r.fork || restSeen.has(r.full_name)) continue;
    restSeen.add(r.full_name);

    for (const topic of r.topics || []) {
      if (topic) topicSet.add(topic);
    }
    if (r.language) topicSet.add(r.language);

    if (!r.private && !publicRepoMap.has(r.full_name)) {
      publicRepoMap.set(r.full_name, {
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        topics: r.topics || [],
        updatedAt: r.pushed_at,
        isFork: false,
      });
    }

    if (langTotals.size === 0 && needLangFetch.length < 20) {
      needLangFetch.push(r);
    }
  }

  if (needLangFetch.length > 0) {
    await Promise.all(
      needLangFetch.map(async (r) => {
        try {
          const lr = await fetch(r.languages_url, { headers: restHeaders() });
          if (!lr.ok) return;
          const langs = (await lr.json()) as Record<string, number>;
          for (const [name, bytes] of Object.entries(langs)) {
            langTotals.set(name, (langTotals.get(name) || 0) + bytes);
          }
        } catch {
          /* ignore */
        }
      }),
    );
  }

  const publicReposList = [...publicRepoMap.values()];
  const totalStars = publicReposList.reduce((s, r) => s + (r.stars || 0), 0);

  const topRepos: GitHubRepo[] = [...publicReposList]
    .sort((a, b) => (b.stars || 0) - (a.stars || 0) || +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 6);

  const totalBytes = [...langTotals.values()].reduce((s, v) => s + v, 0) || 1;
  const languages: LanguageStat[] = [...langTotals.entries()]
    .map(([name, value]) => ({ name, value, percent: Math.round((value / totalBytes) * 1000) / 10 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    configured: true,
    username: USERNAME,
    name: user.name ?? null,
    avatarUrl: user.avatar_url ?? null,
    bio: user.bio ?? null,
    url: user.html_url ?? null,
    followers: user.followers || 0,
    following: user.following || 0,
    publicRepos: user.public_repos || publicReposList.length,
    totalStars,
    topRepos,
    languages,
    techStack: [...topicSet].slice(0, 24),
    contributions,
    generatedAt: now,
  };
}

// In-memory TTL cache (15 min) so every page view doesn't hit GitHub.
let cache: { data: GitHubProfile; at: number } | null = null;
const TTL_MS = 15 * 60 * 1000;

export async function getGitHubProfileCached(): Promise<GitHubProfile> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const data = await getGitHubProfile();
  cache = { data, at: Date.now() };
  return data;
}
