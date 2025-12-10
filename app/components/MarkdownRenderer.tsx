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
        prose-headings:font-semibold prose-headings:text-slate-900
        prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
        prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
        prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-slate-900 prose-strong:font-semibold
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:my-1 prose-li:text-slate-700
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 
        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
        prose-code:text-sm prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 
        prose-code:rounded prose-code:text-slate-800
        prose-pre:bg-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-img:rounded-lg prose-img:shadow-md
        ${className}
      `}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
