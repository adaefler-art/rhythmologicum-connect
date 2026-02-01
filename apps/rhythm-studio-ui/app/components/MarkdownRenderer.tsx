'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownRendererProps = {
  content: string
  className?: string
}

/**
 * D1: Markdown Renderer Component
 * 
 * Renders markdown content with GitHub Flavored Markdown support.
 * Includes typography styling optimized for mobile readability.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div
      className={`prose max-w-none
        prose-headings:font-semibold prose-headings:text-foreground
        prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
        prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
        prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground prose-strong:font-semibold
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:my-1 prose-li:text-muted-foreground
        prose-blockquote:border-l-4 prose-blockquote:border-primary 
        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
        prose-code:text-sm prose-code:bg-muted/30 prose-code:px-1 prose-code:py-0.5 
        prose-code:rounded prose-code:text-foreground
        prose-pre:bg-muted/30 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-img:rounded-lg prose-img:shadow-md
        prose-table:w-full prose-table:border-collapse prose-table:my-6
        prose-thead:border-b-2 prose-thead:border-border
        prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold 
        prose-th:text-foreground prose-th:bg-muted/30
        prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-border
        prose-td:text-muted-foreground
        prose-tr:border-b prose-tr:border-border
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full w-max" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="whitespace-nowrap" {...props}>
              {children}
            </th>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
