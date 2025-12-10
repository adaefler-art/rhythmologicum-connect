'use client'

import { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

export type Section = {
  id: string
  title: string
  body_markdown: string
  order_index: number
}

type SectionEditorProps = {
  section: Section
  onUpdate: (section: Section) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
}

/**
 * F3: Section Editor Component
 *
 * Individual section editor with:
 * - Title and markdown content
 * - Live preview toggle
 * - Up/Down reordering buttons
 * - Delete button
 */
export default function SectionEditor({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SectionEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  const handleTitleChange = (title: string) => {
    onUpdate({ ...section, title })
  }

  const handleMarkdownChange = (body_markdown: string) => {
    onUpdate({ ...section, body_markdown })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
      {/* Header with controls */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1">
          <label htmlFor={`section-title-${section.id}`} className="sr-only">
            Section Titel
          </label>
          <input
            id={`section-title-${section.id}`}
            type="text"
            value={section.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Section-Titel..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onMoveUp(section.id)}
            disabled={!canMoveUp}
            className="p-2 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700"
            title="Nach oben"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onMoveDown(section.id)}
            disabled={!canMoveDown}
            className="p-2 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700"
            title="Nach unten"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 border border-slate-300 rounded-md hover:bg-slate-50 transition text-slate-700"
            title={showPreview ? 'Editor anzeigen' : 'Vorschau anzeigen'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Section wirklich löschen?')) {
                onDelete(section.id)
              }
            }}
            className="p-2 border border-red-300 rounded-md hover:bg-red-50 transition text-red-600"
            title="Löschen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Editor/Preview */}
      {showPreview ? (
        <div className="border border-slate-300 rounded-md p-4 bg-slate-50 overflow-auto min-h-[200px]">
          {section.body_markdown ? (
            <MarkdownRenderer content={section.body_markdown} />
          ) : (
            <p className="text-slate-400 text-sm">Kein Inhalt</p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor={`section-markdown-${section.id}`} className="sr-only">
            Section Inhalt (Markdown)
          </label>
          <textarea
            id={`section-markdown-${section.id}`}
            value={section.body_markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            rows={10}
            placeholder="Markdown-Inhalt für diese Section..."
          />
        </div>
      )}
    </div>
  )
}
