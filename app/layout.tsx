import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Rhythmologicum Connect',
  description: 'Stress- & Resilienz-Assessment Plattform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover', // Required for safe-area-inset support on iOS
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
