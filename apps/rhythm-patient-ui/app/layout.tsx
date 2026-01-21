import type { Metadata, Viewport } from 'next'
import './globals.css'
import { DesignTokensProvider } from '@/lib/contexts/DesignTokensContext'
import { LightOnlyThemeProvider } from './LightOnlyThemeProvider'

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
    <html lang="de" suppressHydrationWarning className="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Mobile v2 is light-only for stability/testability
                  // Clear any persisted theme values
                  localStorage.removeItem('theme');
                  localStorage.removeItem('theme-accent');
                  
                  // Force light mode
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <DesignTokensProvider>
          <LightOnlyThemeProvider>{children}</LightOnlyThemeProvider>
        </DesignTokensProvider>
      </body>
    </html>
  )
}
