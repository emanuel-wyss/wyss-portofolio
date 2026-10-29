import { createFileRoute } from '@tanstack/react-router';
import { ContentFeed } from '../components/feed/ContentFeed';
import { getGitHubProfile } from '../lib/api';
import { RepoCard } from '../components/github/GitHubCharts';

export const Route = createFileRoute('/work')({
  loader: async () => {
    const github = await getGitHubProfile();
    return { github };
  },
  component: WorkPage,
});

function WorkPage() {
  const { github } = Route.useLoaderData();

  return (
    <section className="work-page" data-label="// workbench.exe">
      <div className="container">
        <h1>Work</h1>
        <p className="subtitle">Projects, posts, snippets, and galleries</p>

        {github?.configured && github.topRepos.length ? (
          <div className="work-repos">
            <div className="work-repos-head">
              <h2>Open source &amp; projects</h2>
              {github.url ? (
                <a href={github.url} target="_blank" rel="noopener noreferrer" className="github-link">
                  View all on GitHub
                </a>
              ) : null}
            </div>
            <div className="gh-repo-grid">
              {github.topRepos.map((repo) => (
                <RepoCard key={repo.fullName} repo={repo} />
              ))}
            </div>
          </div>
        ) : null}

        <ContentFeed mode="work" limit={12} initialType="all" />
      </div>
    </section>
  );
}
