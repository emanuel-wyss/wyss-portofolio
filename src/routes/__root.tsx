import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { SiteFooter } from '../components/site/SiteFooter';
import { SiteMenu } from '../components/site/SiteMenu';
import { ThemeProvider } from '../components/site/ThemeProvider';
import { BootSequence } from '../components/site/BootSequence';
import { PageTransition } from '../components/site/PageTransition';
import stylesHref from '../styles.css?url';

// Runs before hydration to set data-mode/data-daytime so there is no flash of
// the wrong color scheme. Kept tiny and dependency-free.
const noFlashScript = `(function(){try{
  var m=localStorage.getItem('wyss-color-mode')||'auto';
  var dark = m==='dark' || (m!=='light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var h=document.documentElement;
  h.setAttribute('data-mode', dark?'dark':'light');
  var hr=new Date().getHours();
  h.setAttribute('data-daytime',(hr>=7&&hr<22)?'day':'night');
}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'wyss: home' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230a0a08"/><text x="50" y="70" font-size="65" font-family="monospace" font-weight="bold" fill="%23ffd700" text-anchor="middle">[W]</text></svg>' },
      { rel: 'stylesheet', href: stylesHref },
    ],
    scripts: [{ children: noFlashScript }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <BootSequence />
          <SiteMenu />
          <PageTransition>
            <main>{children}</main>
          </PageTransition>
          <SiteFooter />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
