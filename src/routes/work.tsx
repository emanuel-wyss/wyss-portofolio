import { createFileRoute } from '@tanstack/react-router';
import { ContentFeed } from '../components/feed/ContentFeed';
import { getGitHubRepos, type GitHubRepo } from '../lib/api';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/work')({
  loader: async () => {
    const repos = await getGitHubRepos();
    return { repos };
  },
  head: () => ({
    meta: [{ title: 'wyss: work & archive' }],
  }),
  component: WorkPage,
});

function WorkPage() {
  const { repos: initialRepos } = Route.useLoaderData();
  const [repos, setRepos] = useState<GitHubRepo[]>(initialRepos);

  useEffect(() => {
    let mounted = true;
    getGitHubRepos().then((r) => {
      if (mounted && r.length) setRepos(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="work-page">
      <div className="container" data-label="// archive.sys">
        <header className="detail-header">
          <h1>Work &amp; Archive</h1>
          <p className="subtitle">Explore posts, code snippets, photo galleries, and open-source repositories.</p>
        </header>

        {repos.length ? (
          <div className="work-repos">
            <div className="work-repos-head">
              <h2>Open Source Repositories</h2>
              <a href="https://github.com/emanuel-wyss" target="_blank" rel="noopener noreferrer" className="github-link">
                GitHub Profile ↗
              </a>
            </div>
            <div className="gh-repo-grid">
              {repos.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gh-repo"
                >
                  <div className="gh-repo-head">
                    <span className="gh-repo-name">{repo.name}</span>
                    {repo.stars > 0 ? <span className="gh-repo-stars">★ {repo.stars}</span> : null}
                  </div>
                  <p className="gh-repo-desc">{repo.description || 'No description provided.'}</p>
                  <div className="gh-repo-meta">
                    {repo.language ? (
                      <span className="gh-repo-lang">
                        <i
                          className="gh-dot"
                          style={{
                            background:
                              repo.language === 'TypeScript'
                                ? '#3178c6'
                                : repo.language === 'JavaScript'
                                ? '#f1e05a'
                                : repo.language === 'HTML'
                                ? '#e34c26'
                                : repo.language === 'CSS'
                                ? '#563d7c'
                                : '#888',
                          }}
                        />
                        {repo.language}
                      </span>
                    ) : null}
                  </div>
                  {repo.topics?.length ? (
                    <div className="gh-repo-topics">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span key={topic} className="gh-topic">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="work-feed-section">
          <h2>Content Stream</h2>
          <ContentFeed mode="work" limit={12} initialType="all" />
        </div>
      </div>
    </section>
  );
}
