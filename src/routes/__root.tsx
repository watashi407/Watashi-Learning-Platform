import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { RouteErrorFallback } from '../app/errors/route-error-fallback'
import { RouteNotFound } from '../app/errors/route-not-found'

const themeBootScript = `
  (function () {
    try {
      var key = 'watashi-theme-mode';
      var stored = window.localStorage.getItem(key);
      var mode = stored === 'dark' || stored === 'light'
        ? stored
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = mode;
      document.documentElement.style.colorScheme = mode;
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.style.colorScheme = 'light';
    }
  })();
`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Watashi Learn' },
      {
        name: 'description',
        content: 'Watashi Learn rebuilt on TanStack Start with a role-aware learner and educator experience.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning className="selection:bg-emerald-200/80 selection:text-slate-950">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return <Outlet />
}
