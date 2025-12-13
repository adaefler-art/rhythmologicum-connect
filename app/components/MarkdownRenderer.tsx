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
      className={`prose prose-slate max-w-none
        prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
        prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
        prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
        prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
        prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:my-1 prose-li:text-slate-700 dark:prose-li:text-slate-300
        prose-blockquote:border-l-4 prose-blockquote:border-primary-500 
        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
        prose-code:text-sm prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 
        prose-code:rounded prose-code:text-slate-800 dark:prose-code:text-slate-200
        prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-img:rounded-lg prose-img:shadow-md
        prose-table:w-full prose-table:border-collapse prose-table:my-6
        prose-thead:border-b-2 prose-thead:border-slate-300 dark:prose-thead:border-slate-600
        prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold 
        prose-th:text-slate-900 dark:prose-th:text-slate-100 prose-th:bg-slate-50 dark:prose-th:bg-slate-800
        prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-slate-200 dark:prose-td:border-slate-700
        prose-td:text-slate-700 dark:prose-td:text-slate-300
        prose-tr:border-b prose-tr:border-slate-200 dark:prose-tr:border-slate-700
        ${className}
      `}
    >
      <div className="overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
