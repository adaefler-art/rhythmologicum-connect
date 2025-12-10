'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MarkdownRenderer from './MarkdownRenderer'
import type { ContentPageSection } from '@/lib/types/content'

type Funnel = {
  id: string
  title: string
  slug: string
}

export type ContentPageEditorData = {
  id?: string
  title: string
  slug: string
  excerpt: string
  body_markdown: string
  status: 'draft' | 'published'
  category: string
  priority: number
  funnel_id: string | null
  layout: string | null
  sections?: ContentPageSection[]
}

type ContentPageEditorProps = {
  initialData?: Partial<ContentPageEditorData>
  mode: 'create' | 'edit'
  pageId?: string
}

/**
 * F2/F3: Content Page Editor Component
 *
 * Provides a full-featured editor for creating/editing content pages with:
 * - All required fields (title, slug, funnel, category, status, priority)
 * - Markdown editor with live preview
 * - Save as Draft and Publish actions
 * - Slug validation
 * - Section management (F3): add, edit, delete, reorder sections
 */
export default function ContentPageEditor({ initialData, mode, pageId }: ContentPageEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funnels, setFunnels] = useState<Funnel[]>([])

  // Form state
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [bodyMarkdown, setBodyMarkdown] = useState(initialData?.body_markdown || '')
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft')
  const [category, setCategory] = useState(initialData?.category || '')
  const [priority, setPriority] = useState(initialData?.priority || 0)
  const [funnelId, setFunnelId] = useState<string>(initialData?.funnel_id || '')
  const [layout, setLayout] = useState(initialData?.layout || 'default')

  // F3: Sections state
  const [sections, setSections] = useState<ContentPageSection[]>(initialData?.sections || [])
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)

  // UI state
  const [slugError, setSlugError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // Load funnels for dropdown
  useEffect(() => {
    const loadFunnels = async () => {
      try {
        const response = await fetch('/api/admin/funnels')
        if (response.ok) {
          const data = await response.json()
          setFunnels(data.funnels || [])
        }
      } catch (e) {
        console.error('Failed to load funnels:', e)
      }
    }
    loadFunnels()
  }, [])

  // Auto-generate slug from title
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    // Auto-generate slug only for new pages when slug is empty
    if (mode === 'create' && !slug) {
      setSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    const newSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(newSlug)

    // Validate slug format
    if (newSlug && !/^[a-z0-9-]+$/.test(newSlug)) {
      setSlugError('Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten')
    } else {
      setSlugError(null)
    }
  }

  // F3: Section management functions
  const handleAddSection = async () => {
    if (!pageId) {
      setError('Seite muss zuerst gespeichert werden, bevor Sections hinzugefügt werden können')
      return
    }

    try {
      const response = await fetch(`/api/admin/content-pages/${pageId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Neue Section',
          body_markdown: 'Section-Inhalt hier...',
        }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Section')
      }

      const { section } = await response.json()
      setSections([...sections, section])
    } catch (e) {
      console.error('Error adding section:', e)
      setError('Fehler beim Hinzufügen der Section')
    }
  }

  const handleUpdateSection = async (sectionId: string, title: string, body_markdown: string) => {
    if (!pageId) return

    try {
      const response = await fetch(`/api/admin/content-pages/${pageId}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body_markdown }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Section')
      }

      const { section } = await response.json()
      setSections(sections.map((s) => (s.id === sectionId ? section : s)))
      setEditingSectionId(null)
    } catch (e) {
      console.error('Error updating section:', e)
      setError('Fehler beim Aktualisieren der Section')
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!pageId) return
    if (!confirm('Möchten Sie diese Section wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/content-pages/${pageId}/sections/${sectionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Section')
      }

      setSections(sections.filter((s) => s.id !== sectionId))
    } catch (e) {
      console.error('Error deleting section:', e)
      setError('Fehler beim Löschen der Section')
    }
  }

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!pageId) return

    try {
      const response = await fetch(`/api/admin/content-pages/${pageId}/sections/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, direction }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Verschieben der Section')
      }

      const { sections: updatedSections } = await response.json()
      setSections(updatedSections)
    } catch (e) {
      console.error('Error moving section:', e)
      setError(e instanceof Error ? e.message : 'Fehler beim Verschieben der Section')
    }
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Titel ist erforderlich')
      return false
    }
    if (!slug.trim()) {
      setError('Slug ist erforderlich')
      return false
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten')
      return false
    }
    if (!bodyMarkdown.trim()) {
      setError('Inhalt (Markdown) ist erforderlich')
      return false
    }
    return true
  }

  const handleSave = async (publishNow: boolean = false) => {
    setError(null)
    setSlugError(null)

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const payload = {
        title,
        slug,
        excerpt: excerpt.trim() || null,
        body_markdown: bodyMarkdown,
        status: publishNow ? 'published' : status,
        category: category.trim() || null,
        priority,
        funnel_id: funnelId || null,
        layout: layout || null,
      }

      const url =
        mode === 'edit' && pageId
          ? `/api/admin/content-pages/${pageId}`
          : '/api/admin/content-pages'

      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setSlugError(data.error || 'Slug wird bereits verwendet')
        } else {
          setError(data.error || 'Fehler beim Speichern')
        }
        return
      }

      // Success - redirect to content dashboard
      router.push('/admin/content')
    } catch (e) {
      console.error('Save error:', e)
      setError('Netzwerkfehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/content')
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {mode === 'create' ? 'Neue Content-Page erstellen' : 'Content-Page bearbeiten'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600">Markdown-Editor mit Live-Vorschau</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Metadata Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Metadaten</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Titel *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Seitentitel eingeben..."
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-2">
                Slug *
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono ${
                  slugError ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="seiten-url"
                required
              />
              {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
              <p className="mt-1 text-xs text-slate-500">
                Nur Kleinbuchstaben, Zahlen und Bindestriche
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                Kategorie
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="z.B. Info, Tutorial, FAQ"
              />
            </div>

            {/* Funnel */}
            <div>
              <label htmlFor="funnel" className="block text-sm font-medium text-slate-700 mb-2">
                Funnel
              </label>
              <select
                id="funnel"
                value={funnelId}
                onChange={(e) => setFunnelId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Kein Funnel</option>
                {funnels.map((funnel) => (
                  <option key={funnel.id} value={funnel.id}>
                    {funnel.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-2">
                Priorität
              </label>
              <input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                min="0"
              />
              <p className="mt-1 text-xs text-slate-500">Höhere Werte = höhere Priorität</p>
            </div>

            {/* Excerpt */}
            <div className="md:col-span-2">
              <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 mb-2">
                Auszug / Kurzbeschreibung
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                rows={2}
                placeholder="Kurze Beschreibung für Übersichten..."
              />
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Inhalt (Markdown)</h2>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition"
            >
              {showPreview ? 'Nur Editor' : 'Vorschau anzeigen'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Markdown Editor */}
            <div>
              <label htmlFor="markdown" className="block text-sm font-medium text-slate-700 mb-2">
                Markdown *
              </label>
              <textarea
                id="markdown"
                value={bodyMarkdown}
                onChange={(e) => setBodyMarkdown(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                rows={20}
                placeholder="# Überschrift&#10;&#10;Ihr Markdown-Inhalt..."
                required
              />
            </div>

            {/* Preview */}
            {showPreview && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Live-Vorschau
                </label>
                <div
                  className="border border-slate-300 rounded-md p-4 bg-slate-50 overflow-auto"
                  style={{ height: '500px' }}
                >
                  {bodyMarkdown ? (
                    <MarkdownRenderer content={bodyMarkdown} />
                  ) : (
                    <p className="text-slate-400 text-sm">Vorschau erscheint hier...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* F3: Sections Management */}
        {mode === 'edit' && pageId && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Sections ({sections.length})
              </h2>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 transition"
              >
                + Section hinzufügen
              </button>
            </div>

            {sections.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Keine Sections vorhanden. Klicken Sie auf &quot;Section hinzufügen&quot;, um eine
                neue Section zu erstellen.
              </p>
            ) : (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-900">
                        Section {index + 1}: {section.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => handleMoveSection(section.id, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Nach oben"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => handleMoveSection(section.id, 'down')}
                          disabled={index === sections.length - 1}
                          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Nach unten"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSectionId(
                              editingSectionId === section.id ? null : section.id,
                            )
                          }
                          className="p-1.5 text-sky-600 hover:text-sky-700 transition"
                          title="Bearbeiten"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 transition"
                          title="Löschen"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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

                    {editingSectionId === section.id && (
                      <SectionEditor
                        section={section}
                        onSave={(title, bodyMarkdown) =>
                          handleUpdateSection(section.id, title, bodyMarkdown)
                        }
                        onCancel={() => setEditingSectionId(null)}
                      />
                    )}

                    {editingSectionId !== section.id && (
                      <div className="text-sm text-slate-600 line-clamp-2">
                        {section.body_markdown}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end bg-white rounded-xl border border-slate-200 p-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-3 min-h-[44px] rounded-lg border border-slate-300 text-slate-700 text-sm md:text-base font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-3 min-h-[44px] rounded-lg border border-sky-600 text-sky-600 text-sm md:text-base font-medium hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
          >
            {saving ? 'Speichere...' : 'Als Entwurf speichern'}
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-3 min-h-[44px] rounded-lg bg-sky-600 text-white text-sm md:text-base font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
          >
            {saving ? 'Speichere...' : 'Veröffentlichen'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * F3: Section Editor Component
 * Inline editor for content page sections
 */
function SectionEditor({
  section,
  onSave,
  onCancel,
}: {
  section: ContentPageSection
  onSave: (title: string, bodyMarkdown: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(section.title)
  const [bodyMarkdown, setBodyMarkdown] = useState(section.body_markdown)
  const [showPreview, setShowPreview] = useState(false)

  const handleSave = () => {
    if (!title.trim() || !bodyMarkdown.trim()) {
      alert('Titel und Inhalt sind erforderlich')
      return
    }
    onSave(title, bodyMarkdown)
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Section-Titel"
        />
      </div>

      {/* Markdown Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">Inhalt (Markdown)</label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-sky-600 hover:text-sky-700"
          >
            {showPreview ? 'Editor anzeigen' : 'Vorschau anzeigen'}
          </button>
        </div>

        {!showPreview ? (
          <textarea
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            rows={10}
            placeholder="Section-Inhalt in Markdown..."
          />
        ) : (
          <div className="border border-slate-300 rounded-md p-4 bg-white min-h-[200px]">
            <MarkdownRenderer content={bodyMarkdown} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700 transition"
        >
          Speichern
        </button>
      </div>
    </div>
  )
}
