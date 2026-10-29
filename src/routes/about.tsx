import { createFileRoute } from '@tanstack/react-router';
import { getSiteConfig, getGitHubProfile } from '../lib/api';
import {
  StatCards,
  LanguageBar,
  ContributionHeatmap,
} from '../components/github/GitHubCharts';

const skills = [
  { category: 'Frontend', items: ['TypeScript', 'React', 'Astro', 'Next.js', 'Tailwind CSS'] },
  { category: 'Backend', items: ['Node.js', 'Bun', 'Hono', 'Payload CMS', 'PostgreSQL'] },
  { category: 'DevOps', items: ['Docker', 'Railway', 'GitHub Actions', 'Nixpacks'] },
  { category: 'Tools', items: ['Git', 'VS Code', 'Figma', 'Linux'] },
];

export const Route = createFileRoute('/about')({
  loader: async () => {
    const [siteConfig, github] = await Promise.all([
      getSiteConfig(),
      getGitHubProfile(),
    ]);
    return { siteConfig, github };
  },
  component: AboutPage,
});

function AboutPage() {
  const { siteConfig, github } = Route.useLoaderData();

  return (
    <section className="about-page">
      <div className="container">
        <div className="about-header">
          <h1>{siteConfig?.siteName || 'Wyss'}</h1>
          <p className="location">Switzerland</p>
          <p className="bio">
            {siteConfig?.description || siteConfig?.tagline || 'Full-stack developer building beautiful, functional web experiences.'}
          </p>
        </div>

        <div className="skills-section">
          <h2>Skills and Tech Stack</h2>
          <div className="skills-grid">
            {skills.map((group) => (
              <div className="skill-group" key={group.category}>
                <h3>{group.category}</h3>
                <ul>
                  {group.items.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {github?.configured ? (
          <div className="github-section">
            <div className="github-header">
              <h2>GitHub</h2>
              {github.url ? (
                <a href={github.url} target="_blank" rel="noopener noreferrer" className="github-link">
                  @{github.username}
                </a>
              ) : null}
            </div>
            <StatCards profile={github} />
            {github.languages.length ? (
              <div className="github-block">
                <h3>Most used languages</h3>
                <LanguageBar languages={github.languages} />
              </div>
            ) : null}
            {github.contributions ? (
              <ContributionHeatmap
                weeks={github.contributions.weeks}
                total={github.contributions.total}
              />
            ) : null}
          </div>
        ) : null}

        {siteConfig?.social_links?.length ? (
          <div className="social-section">
            <h2>Connect</h2>
            <nav className="social-grid" aria-label="Social links">
              {siteConfig.social_links.map((link) => (
                <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer" className="social-card">
                  {link.platform}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </div>
    </section>
  );
}
