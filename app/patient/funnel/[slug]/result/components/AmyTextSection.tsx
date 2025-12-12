'use client'

import { Card } from '@/lib/ui'
import { typography } from '@/lib/design-tokens'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type AmyTextSectionProps = {
  text: string
  title?: string
  icon?: string
}

/**
 * AmyTextSection Component
 * 
 * Renders AI-generated assessment text (AMY) with proper typography.
 * Applies path-layout styling for optimal readability on mobile and desktop.
 */
export function AmyTextSection({
  text,
  title = 'Ihre persönliche Auswertung',
  icon = '🤖',
}: AmyTextSectionProps) {
  if (!text || text.trim() === '') return null

  return (
    <Card padding="lg" radius="xl" shadow="md" border className="bg-white">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3
            className="text-lg sm:text-xl font-bold text-slate-900"
            style={{ lineHeight: typography.lineHeight.tight }}
          >
            {title}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Erstellt von AMY, Ihrer digitalen Gesundheitsassistentin
        </p>
      </div>

      {/* AMY Text Content - Path Layout with Proper Typography */}
      <div
        className="amy-text-content prose prose-slate max-w-none"
        style={{
          fontSize: typography.fontSize.base,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Headings
            h1: ({ children }) => (
              <h1
                className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3"
                style={{ lineHeight: typography.lineHeight.tight }}
              >
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2
                className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 mt-6"
                style={{ lineHeight: typography.lineHeight.tight }}
              >
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3
                className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 mt-4"
                style={{ lineHeight: typography.lineHeight.tight }}
              >
                {children}
              </h3>
            ),
            // Paragraphs
            p: ({ children }) => (
              <p
                className="text-sm sm:text-base text-slate-700 mb-4"
                style={{ lineHeight: typography.lineHeight.relaxed }}
              >
                {children}
              </p>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-2 mb-4 text-sm sm:text-base text-slate-700">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-2 mb-4 text-sm sm:text-base text-slate-700">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ lineHeight: typography.lineHeight.relaxed }}>{children}</li>
            ),
            // Emphasis
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-900">{children}</strong>
            ),
            em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
            // Code
            code: ({ children }) => (
              <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono">
                {children}
              </code>
            ),
            // Blockquote
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-sky-500 pl-4 py-2 my-4 bg-sky-50 text-slate-700 italic">
                {children}
              </blockquote>
            ),
            // Links
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 hover:text-sky-900 underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </Card>
  )
}
