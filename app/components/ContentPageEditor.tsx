'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MarkdownRenderer from './MarkdownRenderer'
import SectionEditor from './SectionEditor'
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
 * - F3: Section management (add, delete, reorder)
 * - Save as Draft and Publish actions
 * - Slug validation
 */
export default function ContentPageEditor({ initialData, mode, pageId }: ContentPageEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funnels, setFunnels] = useState<Funnel[]>([])

  // Form state
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [bodyMarkdown, setBodyMarkdown] = useState(initialData?.body_markdown || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [priority, setPriority] = useState(initialData?.priority || 0)
  const [funnelId, setFunnelId] = useState<string>(initialData?.funnel_id || '')
  const [layout] = useState(initialData?.layout || 'default')
  const status: 'draft' | 'published' = (initialData?.status as 'draft' | 'published') || 'draft'

  // F3: Sections state
  const [sections, setSections] = useState<ContentPageSection[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [modifiedSections, setModifiedSections] = useState<Set<string>>(new Set())

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
    void loadFunnels()
  }, [])

  // F3: Load sections for existing pages
  useEffect(() => {
    const loadSections = async () => {
      if (mode === 'edit' && pageId) {
        setSectionsLoading(true)
        try {
          const response = await fetch(`/api/admin/content-pages/${pageId}/sections`)
          if (response.ok) {
            const data = await response.json()
            setSections(data.sections || [])
          }
        } catch (e) {
          console.error('Failed to load sections:', e)
        } finally {
          setSectionsLoading(false)
        }
      }
    }
    void loadSections()
  }, [mode, pageId])

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

      // F3: Save sections if in edit mode
      if (mode === 'edit' && pageId) {
        await handleSaveSectionsContent()
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

  // F3: Section management functions
  const handleAddSection = async () => {
    if (!pageId) {
      setError('Page muss zuerst gespeichert werden, bevor Sections hinzugefügt werden können')
      return
    }

    try {
      const response = await fetch(`/api/admin/content-pages/${pageId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Neue Section',
          body_markdown: '# Neue Section\n\nInhalt hier...',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSections([...sections, data.section])
      } else {
        setError('Fehler beim Hinzufügen der Section')
      }
    } catch (e) {
      console.error('Error adding section:', e)
      setError('Netzwerkfehler beim Hinzufügen der Section')
    }
  }

  const handleUpdateSection = (updatedSection: ContentPageSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
    // Mark section as modified
    setModifiedSections((prev) => new Set(prev).add(updatedSection.id))
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!pageId) return

    try {
      const response = await fetch(`/api/admin/content-pages/${pageId}/sections/${sectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSections(sections.filter((s) => s.id !== sectionId))
      } else {
        setError('Fehler beim Löschen der Section')
      }
    } catch (e) {
      console.error('Error deleting section:', e)
      setError('Netzwerkfehler beim Löschen der Section')
    }
  }

  const handleMoveSectionUp = async (sectionId: string) => {
    const index = sections.findIndex((s) => s.id === sectionId)
    if (index <= 0) return

    const section = sections[index]
    const prevSection = sections[index - 1]

    // Optimistically update UI
    const newSections = [...sections]
    newSections[index] = { ...section, order_index: prevSection.order_index }
    newSections[index - 1] = { ...prevSection, order_index: section.order_index }
    newSections.sort((a, b) => a.order_index - b.order_index)
    setSections(newSections)

    try {
      // Swap order_index values
      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/content-pages/${pageId}/sections/${section.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: prevSection.order_index }),
        }),
        fetch(`/api/admin/content-pages/${pageId}/sections/${prevSection.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: section.order_index }),
        }),
      ])

      if (!res1.ok || !res2.ok) {
        throw new Error('Failed to update order')
      }
    } catch (e) {
      console.error('Error moving section up:', e)
      setError('Fehler beim Verschieben der Section')
      // Rollback optimistic update
      setSections(sections)
    }
  }

  const handleMoveSectionDown = async (sectionId: string) => {
    const index = sections.findIndex((s) => s.id === sectionId)
    if (index < 0 || index >= sections.length - 1) return

    const section = sections[index]
    const nextSection = sections[index + 1]

    // Optimistically update UI
    const newSections = [...sections]
    newSections[index] = { ...section, order_index: nextSection.order_index }
    newSections[index + 1] = { ...nextSection, order_index: section.order_index }
    newSections.sort((a, b) => a.order_index - b.order_index)
    setSections(newSections)

    try {
      // Swap order_index values
      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/content-pages/${pageId}/sections/${section.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: nextSection.order_index }),
        }),
        fetch(`/api/admin/content-pages/${pageId}/sections/${nextSection.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: section.order_index }),
        }),
      ])

      if (!res1.ok || !res2.ok) {
        throw new Error('Failed to update order')
      }
    } catch (e) {
      console.error('Error moving section down:', e)
      setError('Fehler beim Verschieben der Section')
      // Rollback optimistic update
      setSections(sections)
    }
  }

  const handleSaveSectionsContent = async () => {
    if (!pageId || modifiedSections.size === 0) return

    try {
      // Save only modified sections
      await Promise.all(
        sections
          .filter((section) => modifiedSections.has(section.id))
          .map((section) =>
            fetch(`/api/admin/content-pages/${pageId}/sections/${section.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: section.title,
                body_markdown: section.body_markdown,
              }),
            }),
          ),
      )
      // Clear modified sections after successful save
      setModifiedSections(new Set())
    } catch (e) {
      console.error('Error saving sections:', e)
      throw new Error('Fehler beim Speichern der Sections')
    }
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
              className="h-10 px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition"
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

        {/* F3: Sections Management - Only show for edit mode */}
        {mode === 'edit' && pageId && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Sections ({sections.length})
              </h2>
              <button
                type="button"
                onClick={handleAddSection}
                disabled={saving}
                className="h-10 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Section hinzufügen
              </button>
            </div>

            {sectionsLoading ? (
              <p className="text-slate-600 text-sm">Sections werden geladen...</p>
            ) : sections.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Keine Sections vorhanden. Klicken Sie auf &quot;Section hinzufügen&quot; um eine
                neue Section zu erstellen.
              </p>
            ) : (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onUpdate={handleUpdateSection}
                    onDelete={handleDeleteSection}
                    onMoveUp={handleMoveSectionUp}
                    onMoveDown={handleMoveSectionDown}
                    canMoveUp={index > 0}
                    canMoveDown={index < sections.length - 1}
                  />
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
            className="px-6 py-3 min-h-11 rounded-lg border border-slate-300 text-slate-700 text-sm md:text-base font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-3 min-h-11 rounded-lg border border-sky-600 text-sky-600 text-sm md:text-base font-medium hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
          >
            {saving ? 'Speichere...' : 'Als Entwurf speichern'}
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-3 min-h-11 rounded-lg bg-sky-600 text-white text-sm md:text-base font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation"
          >
            {saving ? 'Speichere...' : 'Veröffentlichen'}
          </button>
        </div>
      </div>
    </div>
  )
}
