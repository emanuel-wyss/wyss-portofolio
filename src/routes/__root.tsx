import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router';
import { SiteFooter } from '../components/site/SiteFooter';
import { SiteMenu } from '../components/site/SiteMenu';
import { ThemeProvider } from '../components/site/ThemeProvider';
import { BootSequence } from '../components/site/BootSequence';
import '../styles.css';

// Client-rendered SPA: index.html owns <html>/<head>/<body>; the app mounts into #app.
// Do NOT render <html>/<body> here — nesting them inside #app breaks React's event system.
export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: 'wyss: home' }],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <ThemeProvider>
      <HeadContent />
      <BootSequence />
      <SiteMenu />
      <main className="page-transition-wrapper">
        <Outlet />
      </main>
      <SiteFooter />
    </ThemeProvider>
  );
}
