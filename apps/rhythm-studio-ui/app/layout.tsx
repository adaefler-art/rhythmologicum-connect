import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import { env } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Rhythmologicum Connect',
  description: 'Stress- & Resilienz-Assessment Plattform',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const buildSha = env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.COMMIT_SHA || 'unknown'
  const buildTime = env.STUDIO_BUILD_TIME || env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()
  const buildComment = `studio-build: sha=${buildSha} time=${buildTime}`

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta name="x-studio-build-sha" content={buildSha} />
        <meta name="x-studio-build-time" content={buildTime} />
        <meta name="x-studio-app-root" content="apps/rhythm-studio-ui" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = stored || (prefersDark ? 'dark' : 'light');
                  
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="text/plain"
          dangerouslySetInnerHTML={{
            __html: `<!-- ${buildComment} -->`,
          }}
        />
      </head>
      <body className="antialiased">
        <DesignTokensProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </DesignTokensProvider>
      </body>
    </html>
  )
}
