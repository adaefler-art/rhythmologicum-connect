'use client'

/**
 * V05-I06.4 — Visual Block Editor
 * 
 * Manifest-based section/block builder for funnel content
 * Enables non-code iteration of mobile content with strict validation
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, LoadingSpinner, ErrorState, Input, Textarea } from '@/lib/ui'
import {
  SECTION_TYPE,
  type ContentSection,
  type ContentPage,
  type FunnelContentManifest,
} from '@/lib/contracts/funnelManifest'

export const dynamic = 'force-dynamic'

type FunnelVersion = {
  id: string
  funnelId: string
  version: string
  manifest: FunnelContentManifest
}

type FunnelDetailsResponse = {
  funnel?: { default_version_id?: string }
  versions?: Array<{ id: string }>
  default_version?: { id: string }
}

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  error?: { message?: string; details?: unknown }
}

export default function ManifestEditorPage() {
  const params = useParams()
  const router = useRouter()
  const funnelId = params.identifier as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funnelVersion, setFunnelVersion] = useState<FunnelVersion | null>(null)
  const [manifest, setManifest] = useState<FunnelContentManifest | null>(null)
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null)
  const [editingBlock, setEditingBlock] = useState<ContentSection | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Load funnel and its default version
  const loadFunnelVersion = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // First, get funnel to find default version
      const funnelRes = await fetch(`/api/admin/funnels/${funnelId}`)
      if (!funnelRes.ok) {
        throw new Error('Failed to load funnel')
      }

      const funnelData: ApiEnvelope<FunnelDetailsResponse> = await funnelRes.json()

      // Deterministic version selection:
      // Prefer latest version returned by the API (ordered desc), otherwise fall back to default.
      // IMPORTANT: Do not transform UUIDs.
      const latestVersionId =
        funnelData.data?.versions?.[0]?.id || funnelData.data?.default_version?.id

      if (!latestVersionId) {
        throw new Error('No funnel version found for funnel')
      }

      // Load manifest
      const manifestRes = await fetch(`/api/admin/funnel-versions/${latestVersionId}/manifest`)
      if (!manifestRes.ok) {
        throw new Error('Failed to load manifest')
      }

      const manifestData: ApiEnvelope<FunnelVersion> = await manifestRes.json()
      if (!manifestData.data) {
        throw new Error('No manifest data returned')
      }

      setFunnelVersion(manifestData.data)
      setManifest(manifestData.data.manifest)
    } catch (err) {
      console.error('Error loading funnel version:', err)
      setError(err instanceof Error ? err.message : 'Failed to load funnel')
    } finally {
      setLoading(false)
    }
  }, [funnelId])

  useEffect(() => {
    loadFunnelVersion()
  }, [loadFunnelVersion])

  // Save manifest
  const saveManifest = async () => {
    if (!funnelVersion || !manifest) return

    // Clear previous validation errors
    setValidationErrors([])

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/funnel-versions/${funnelVersion.id}/manifest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest }),
      })

      if (!response.ok) {
        const errorData: ApiEnvelope<unknown> = await response.json()
        if (errorData.error?.details) {
          // Show Zod validation errors
          const details = errorData.error.details as { path: (string | number)[]; message: string }[]
          setValidationErrors(details.map(d => `${d.path.join('.')}: ${d.message}`))
        }
        throw new Error(errorData.error?.message || 'Failed to save manifest')
      }

      const data: ApiEnvelope<FunnelVersion> = await response.json()
      if (data.data) {
        setFunnelVersion(data.data)
        setManifest(data.data.manifest)
      }

      alert('Manifest erfolgreich gespeichert')
    } catch (err) {
      console.error('Error saving manifest:', err)
      alert(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  // Add new block to current page
  const addBlock = (type: string) => {
    if (!manifest) return

    const currentPage = manifest.pages[selectedPageIndex]
    if (!currentPage) return

    const newSection: ContentSection = {
      key: `section-${Date.now()}`,
      type: type as ContentSection['type'],
      content: {},
      orderIndex: currentPage.sections.length,
    }

    const updatedPages = [...manifest.pages]
    updatedPages[selectedPageIndex] = {
      ...currentPage,
      sections: [...currentPage.sections, newSection],
    }

    setManifest({
      ...manifest,
      pages: updatedPages,
    })
  }

  // Remove block
  const removeBlock = (sectionIndex: number) => {
    if (!manifest || !confirm('Block wirklich löschen?')) return

    const currentPage = manifest.pages[selectedPageIndex]
    if (!currentPage) return

    const updatedSections = currentPage.sections.filter((_, i) => i !== sectionIndex)
    // Reindex
    updatedSections.forEach((s, i) => {
      s.orderIndex = i
    })

    const updatedPages = [...manifest.pages]
    updatedPages[selectedPageIndex] = {
      ...currentPage,
      sections: updatedSections,
    }

    setManifest({
      ...manifest,
      pages: updatedPages,
    })

    if (selectedSectionIndex === sectionIndex) {
      setSelectedSectionIndex(null)
      setEditingBlock(null)
    }
  }

  // Move block up/down
  const moveBlock = (sectionIndex: number, direction: 'up' | 'down') => {
    if (!manifest) return

    const currentPage = manifest.pages[selectedPageIndex]
    if (!currentPage) return

    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1
    if (newIndex < 0 || newIndex >= currentPage.sections.length) return

    const updatedSections = [...currentPage.sections]
    const [moved] = updatedSections.splice(sectionIndex, 1)
    updatedSections.splice(newIndex, 0, moved)

    // Reindex for determinism
    updatedSections.forEach((s, i) => {
      s.orderIndex = i
    })

    const updatedPages = [...manifest.pages]
    updatedPages[selectedPageIndex] = {
      ...currentPage,
      sections: updatedSections,
    }

    setManifest({
      ...manifest,
      pages: updatedPages,
    })
  }

  // Update block content
  const updateBlockContent = (sectionIndex: number, content: Record<string, unknown>) => {
    if (!manifest) return

    const currentPage = manifest.pages[selectedPageIndex]
    if (!currentPage) return

    const updatedSections = [...currentPage.sections]
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      content,
    }

    const updatedPages = [...manifest.pages]
    updatedPages[selectedPageIndex] = {
      ...currentPage,
      sections: updatedSections,
    }

    setManifest({
      ...manifest,
      pages: updatedPages,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Lade Manifest…" centered />
      </div>
    )
  }

  if (error || !manifest || !funnelVersion) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState title="Fehler beim Laden" message={error || 'Manifest nicht gefunden'} centered />
        <div className="mt-4 text-center">
          <Link
            href={`/clinician/funnels/${funnelId}`}
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            ← Zurück zum Funnel
          </Link>
        </div>
      </div>
    )
  }

  const currentPage = manifest.pages[selectedPageIndex]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href={`/clinician/funnels/${funnelId}`}
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            ← Zurück zum Funnel
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Content Block Editor
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manifest Version: {funnelVersion.version} • {manifest.pages.length} Seite(n)
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => router.back()}>
              Abbrechen
            </Button>
            <Button variant="primary" size="md" onClick={saveManifest} disabled={saving}>
              {saving ? 'Speichert…' : 'Speichern'}
            </Button>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card padding="md" className="mb-6 bg-red-50 border-red-200">
          <h3 className="text-sm font-semibold text-red-900 mb-2">Validierungsfehler:</h3>
          <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Page List */}
        <div className="lg:col-span-1">
          <Card padding="md">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Seiten</h2>
            <div className="space-y-2">
              {manifest.pages.map((page, index) => (
                <button
                  key={page.slug}
                  onClick={() => {
                    setSelectedPageIndex(index)
                    setSelectedSectionIndex(null)
                    setEditingBlock(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedPageIndex === index
                      ? 'bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-50'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-medium truncate">{page.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {page.slug} • {page.sections.length} Block(s)
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Middle Panel: Section/Block List */}
        <div className="lg:col-span-1">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Blocks: {currentPage?.title}
              </h2>
              <div className="relative group">
                <Button variant="primary" size="sm">
                  + Block
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {Object.entries(SECTION_TYPE).map(([key, value]) => (
                    <button
                      key={value}
                      onClick={() => addBlock(value)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {currentPage?.sections.map((section, index) => (
                <div
                  key={section.key}
                  className={`border rounded-lg transition-colors ${
                    selectedSectionIndex === index
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedSectionIndex(index)
                      setEditingBlock(section)
                    }}
                    className="w-full text-left px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {section.type}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {section.key}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            moveBlock(index, 'up')
                          }}
                          disabled={index === 0}
                          className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Nach oben"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            moveBlock(index, 'down')
                          }}
                          disabled={index === currentPage.sections.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Nach unten"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeBlock(index)
                          }}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Löschen"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {currentPage?.sections.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                Keine Blocks vorhanden. Fügen Sie einen Block hinzu.
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel: Block Editor */}
        <div className="lg:col-span-1">
          <Card padding="md">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Block bearbeiten
            </h2>

            {editingBlock && selectedSectionIndex !== null ? (
              <BlockEditor
                section={editingBlock}
                onChange={(content) => updateBlockContent(selectedSectionIndex, content)}
              />
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                Wählen Sie einen Block zum Bearbeiten aus
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// Block Editor Component
type BlockEditorProps = {
  section: ContentSection
  onChange: (content: Record<string, unknown>) => void
}

function BlockEditor({ section, onChange }: BlockEditorProps) {
  const content = section.content || {}

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({
      ...content,
      [field]: value,
    })
  }

  // Render fields based on block type
  switch (section.type) {
    case SECTION_TYPE.HERO:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Titel
            </label>
            <Input
              type="text"
              value={(content.title as string) || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Untertitel
            </label>
            <Input
              type="text"
              value={(content.subtitle as string) || ''}
              onChange={(e) => handleFieldChange('subtitle', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ausrichtung
            </label>
            <select
              value={(content.alignment as string) || 'center'}
              onChange={(e) => handleFieldChange('alignment', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="left">Links</option>
              <option value="center">Zentriert</option>
              <option value="right">Rechts</option>
            </select>
          </div>
        </div>
      )

    case SECTION_TYPE.TEXT:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Titel (optional)
            </label>
            <Input
              type="text"
              value={(content.title as string) || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Text
            </label>
            <Textarea
              value={(content.text as string) || ''}
              onChange={(e) => handleFieldChange('text', e.target.value)}
              rows={5}
              textareaSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ausrichtung
            </label>
            <select
              value={(content.alignment as string) || 'left'}
              onChange={(e) => handleFieldChange('alignment', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="left">Links</option>
              <option value="center">Zentriert</option>
              <option value="right">Rechts</option>
            </select>
          </div>
        </div>
      )

    case SECTION_TYPE.IMAGE:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bild-URL
            </label>
            <Input
              type="text"
              value={(content.url as string) || ''}
              onChange={(e) => handleFieldChange('url', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Alt-Text
            </label>
            <Input
              type="text"
              value={(content.alt as string) || ''}
              onChange={(e) => handleFieldChange('alt', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bildunterschrift (optional)
            </label>
            <Input
              type="text"
              value={(content.caption as string) || ''}
              onChange={(e) => handleFieldChange('caption', e.target.value)}
              inputSize="md"
            />
          </div>
        </div>
      )

    case SECTION_TYPE.VIDEO:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Video-URL
            </label>
            <Input
              type="text"
              value={(content.url as string) || ''}
              onChange={(e) => handleFieldChange('url', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Untertitel (optional)
            </label>
            <Input
              type="text"
              value={(content.caption as string) || ''}
              onChange={(e) => handleFieldChange('caption', e.target.value)}
              inputSize="md"
            />
          </div>
        </div>
      )

    case SECTION_TYPE.MARKDOWN:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Markdown-Inhalt
            </label>
            <Textarea
              value={(content.markdown as string) || ''}
              onChange={(e) => handleFieldChange('markdown', e.target.value)}
              rows={10}
              textareaSize="md"
              className="font-mono text-sm"
            />
          </div>
        </div>
      )

    case SECTION_TYPE.CTA:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Button-Text
            </label>
            <Input
              type="text"
              value={(content.text as string) || ''}
              onChange={(e) => handleFieldChange('text', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Link (href)
            </label>
            <Input
              type="text"
              value={(content.href as string) || ''}
              onChange={(e) => handleFieldChange('href', e.target.value)}
              inputSize="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Variante
            </label>
            <select
              value={(content.variant as string) || 'primary'}
              onChange={(e) => handleFieldChange('variant', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ausrichtung
            </label>
            <select
              value={(content.alignment as string) || 'center'}
              onChange={(e) => handleFieldChange('alignment', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="left">Links</option>
              <option value="center">Zentriert</option>
              <option value="right">Rechts</option>
            </select>
          </div>
        </div>
      )

    case SECTION_TYPE.DIVIDER:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Stil
            </label>
            <select
              value={(content.style as string) || 'solid'}
              onChange={(e) => handleFieldChange('style', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="solid">Durchgezogen</option>
              <option value="dashed">Gestrichelt</option>
              <option value="dotted">Gepunktet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Abstand
            </label>
            <select
              value={(content.spacing as string) || 'md'}
              onChange={(e) => handleFieldChange('spacing', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="sm">Klein</option>
              <option value="md">Mittel</option>
              <option value="lg">Groß</option>
            </select>
          </div>
        </div>
      )

    default:
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-semibold">Unbekannter Block-Typ</p>
          <p className="text-xs text-red-600 mt-1">
            Typ &quot;{section.type}&quot; wird nicht unterstützt. Dieser Block kann nicht
            bearbeitet werden.
          </p>
        </div>
      )
  }
}
