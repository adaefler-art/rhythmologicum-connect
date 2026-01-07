import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import { loadUserDesignTokens } from '@/lib/design-tokens-loader'

export const metadata: Metadata = {
  title: 'Rhythmologicum Connect',
  description: 'Stress- & Resilienz-Assessment Plattform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover', // Required for safe-area-inset support on iOS
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Load design tokens with organization overrides (if user is logged in)
  // Fallback to default tokens if there's any error during build/SSG
  let tokens
  try {
    tokens = await loadUserDesignTokens()
  } catch (error) {
    // During build time or if Supabase is unavailable, use default tokens
    console.warn('[RootLayout] Could not load user design tokens, using defaults:', error)
    tokens = undefined // Will use default tokens in provider
  }

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
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
      </head>
      <body className="antialiased">
        <DesignTokensProvider tokens={tokens}>
          <ThemeProvider>{children}</ThemeProvider>
        </DesignTokensProvider>
      </body>
    </html>
  )
}
