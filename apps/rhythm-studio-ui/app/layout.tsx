import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'

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
  return (
    <html lang="de" suppressHydrationWarning className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force dark mode for Studio app
              (function() {
                try {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  // Prevent light mode drift by removing stored theme
                  localStorage.removeItem('theme');
                } catch (e) {}
              })();
            `,
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
