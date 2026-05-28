import { createFileRoute } from '@tanstack/react-router';
import { getSiteConfig } from '../lib/api';

const skills = [
  { category: 'Frontend', items: ['TypeScript', 'React', 'Astro', 'Next.js', 'Tailwind CSS'] },
  { category: 'Backend', items: ['Node.js', 'Bun', 'Hono', 'Payload CMS', 'PostgreSQL'] },
  { category: 'DevOps', items: ['Docker', 'Railway', 'GitHub Actions', 'Nixpacks'] },
  { category: 'Tools', items: ['Git', 'VS Code', 'Figma', 'Linux'] },
];

export const Route = createFileRoute('/about')({
  loader: async () => {
    const siteConfig = await getSiteConfig();
    return { siteConfig };
  },
  component: AboutPage,
});

function AboutPage() {
  const { siteConfig } = Route.useLoaderData();

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
