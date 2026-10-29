import { createFileRoute } from '@tanstack/react-router';
import { getSiteConfig, getGitHubProfile } from '../lib/api';
import {
  StatCards,
  LanguageBar,
  ContributionHeatmap,
  TechRadar,
} from '../components/github/GitHubCharts';

const SOCIAL_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  twitter: 'Twitter',
  discord: 'Discord',
  email: 'Email',
  website: 'Website',
};

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

  const knownLower = new Set(skills.flatMap((g) => g.items.map((i) => i.toLowerCase())));
  const repoDetected = [
    ...(github?.languages?.map((l) => l.name) || []),
    ...(github?.techStack || []),
  ].filter((item) => {
    const k = item.toLowerCase();
    if (knownLower.has(k)) return false;
    knownLower.add(k);
    return true;
  });

  const allSkillGroups = repoDetected.length
    ? [...skills, { category: 'Languages & Topics (Repos)', items: repoDetected.slice(0, 8) }]
    : skills;

  return (
    <section className="about-page">
      <div className="container" data-label="// profile.sys">
        <div className="about-header">
          <h1>{siteConfig?.siteName || 'Wyss'}</h1>
          <p className="location">Switzerland</p>
          <p className="bio">
            {siteConfig?.description || siteConfig?.tagline || 'Full-stack developer building beautiful, functional web experiences.'}
          </p>
        </div>

        <div className="scroll-scene scroll-scene--about skills-section" data-scene="about">
          <h2>Skills and Tech Stack</h2>
          <div className="skills-grid">
            {allSkillGroups.map((group) => (
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
          <div className="scroll-scene scroll-scene--work github-section" data-scene="work">
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
            {github.languages.length >= 3 ? (
              <div className="github-block">
                <h3>Tech radar</h3>
                <TechRadar languages={github.languages} />
              </div>
            ) : null}
            {github.contributions ? (
              <ContributionHeatmap
                weeks={github.contributions.weeks}
                total={github.contributions.total}
                privateContributions={github.contributions.privateContributions}
              />
            ) : null}
          </div>
        ) : null}

        <div className="scroll-scene scroll-scene--contact contact-section" data-scene="contact">
          <h2>Contact</h2>
          <nav className="social-grid" aria-label="Social links">
            {(siteConfig?.social_links?.length
              ? siteConfig.social_links
              : DEFAULT_SOCIALS
            ).map((link) => (
              <a
                key={`${link.platform}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-card"
              >
                {SOCIAL_LABELS[link.platform] || link.platform}
              </a>
            ))}
          </nav>
        </div>

        {siteConfig?.friends_links?.length ? (
          <div className="friends-section">
            <h2>Good friends &amp; orgs</h2>
            <div className="scroll-scene scroll-scene--friends friends-grid" data-scene="friends">
              {siteConfig.friends_links.map((link) => (
                <a
                  key={`${link.name}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`friend-card friend-${link.category || 'friend'}`}
                >
                  <span className="friend-name">{link.name}</span>
                  {link.description ? (
                    <span className="friend-desc">{link.description}</span>
                  ) : null}
                  {link.category === 'org' ? (
                    <span className="friend-badge">org</span>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const DEFAULT_SOCIALS = [
  { platform: 'github', url: 'https://github.com/emanuel-wyss' },
  { platform: 'linkedin', url: 'https://www.linkedin.com/in/emanuel-wyss/' },
  { platform: 'instagram', url: 'https://www.instagram.com/maenu_wyss' },
];
