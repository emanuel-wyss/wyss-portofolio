import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { SiteFooter } from '../components/site/SiteFooter';
import { SiteMenu } from '../components/site/SiteMenu';
import { ThemeProvider } from '../components/site/ThemeProvider';
import { BootSequence } from '../components/site/BootSequence';
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
      { title: 'Wyss.rocks' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap',
      },
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
          <main>{children}</main>
          <SiteFooter />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
