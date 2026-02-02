/**
 * AnamnesisSection Component
 * 
 * E75.4: Displays patient anamnesis (medical history) entries for clinicians.
 * 
 * Features:
 * - List anamnesis entries with latest versions
 * - Add new entries (notes/diagnosis/medication)
 * - Edit existing entries (creates new version)
 * - Archive entries
 * - Access only via assignment (enforced by RLS)
 * 
 * Data source: /api/studio/patients/[patientId]/anamnesis
 * Access control: Requires clinician role + patient assignment
 */

import { useState, useEffect } from 'react'
import { Card, Badge, Button, Modal, FormField, Input, Textarea, Select } from '@/lib/ui'
import { FileText, Plus, Edit, Archive, Clock } from 'lucide-react'
import { ENTRY_TYPES } from '@/lib/api/anamnesis/validation'
import type { EntryType } from '@/lib/api/anamnesis/validation'

export interface AnamnesisEntry {
  id: string
  title: string
  content: Record<string, unknown>
  entry_type: string | null
  tags: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  version_count: number
}

export interface AnamnesisSectionProps {
  /** Patient ID for fetching/creating entries */
  patientId: string
  /** Loading state */
  loading?: boolean
  /** Error evidence code (PHI-safe) */
  errorEvidenceCode?: string
}

/**
 * Displays patient anamnesis entries with add/edit/archive capabilities
 */
export function AnamnesisSection({ patientId, loading, errorEvidenceCode }: AnamnesisSectionProps) {
  const [entries, setEntries] = useState<AnamnesisEntry[]>([])
  const [isLoading, setIsLoading] = useState(loading ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AnamnesisEntry | null>(null)

  // Form state for add/edit
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formEntryType, setFormEntryType] = useState<EntryType | ''>('')
  const [formTags, setFormTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Fetch entries on mount
  useEffect(() => {
    fetchEntries()
  }, [patientId])

  const fetchEntries = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/studio/patients/${patientId}/anamnesis`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Patient nicht gefunden oder nicht zugewiesen')
        } else if (response.status === 403) {
          setError('Keine Berechtigung für diesen Patienten')
        } else {
          setError('Fehler beim Laden der Anamnese-Einträge')
        }
        return
      }

      const data = await response.json()
      if (data.success && data.data?.entries) {
        setEntries(data.data.entries)
      }
    } catch (err) {
      console.error('[AnamnesisSection] Fetch error:', err)
      setError('Fehler beim Laden der Anamnese-Einträge')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEntry = async () => {
    if (!formTitle.trim()) {
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/studio/patients/${patientId}/anamnesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          content: { text: formContent },
          entry_type: formEntryType || null,
          tags: formTags ? formTags.split(',').map((t) => t.trim()) : [],
        }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Eintrags')
      }

      // Reset form and close dialog
      resetForm()
      setIsAddDialogOpen(false)
      
      // Refresh entries
      await fetchEntries()
    } catch (err) {
      console.error('[AnamnesisSection] Add error:', err)
      alert('Fehler beim Erstellen des Eintrags')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditEntry = async () => {
    if (!selectedEntry || !formTitle.trim()) {
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/studio/anamnesis/${selectedEntry.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          content: { text: formContent },
          entry_type: formEntryType || null,
          tags: formTags ? formTags.split(',').map((t) => t.trim()) : [],
          change_reason: 'Clinician update',
        }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Eintrags')
      }

      // Reset form and close dialog
      resetForm()
      setIsEditDialogOpen(false)
      setSelectedEntry(null)
      
      // Refresh entries
      await fetchEntries()
    } catch (err) {
      console.error('[AnamnesisSection] Edit error:', err)
      alert('Fehler beim Aktualisieren des Eintrags')
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchiveEntry = async (entryId: string) => {
    if (!confirm('Möchten Sie diesen Eintrag wirklich archivieren?')) {
      return
    }

    try {
      const response = await fetch(`/api/studio/anamnesis/${entryId}/archive`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Fehler beim Archivieren')
      }

      // Refresh entries
      await fetchEntries()
    } catch (err) {
      console.error('[AnamnesisSection] Archive error:', err)
      alert('Fehler beim Archivieren des Eintrags')
    }
  }

  const openEditDialog = (entry: AnamnesisEntry) => {
    setSelectedEntry(entry)
    setFormTitle(entry.title)
    setFormContent(
      typeof entry.content === 'object' && entry.content !== null && 'text' in entry.content
        ? String(entry.content.text)
        : ''
    )
    setFormEntryType((entry.entry_type as EntryType) || '')
    setFormTags(entry.tags.join(', '))
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormContent('')
    setFormEntryType('')
    setFormTags('')
  }

  const formatDate = (isoString: string): string => {
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString))
    } catch {
      return 'Datum unbekannt'
    }
  }

  const getEntryTypeLabel = (type: string | null): string => {
    if (!type) return 'Sonstiges'
    
    const labels: Record<string, string> = {
      medical_history: 'Krankengeschichte',
      symptoms: 'Symptome',
      medications: 'Medikation',
      allergies: 'Allergien',
      family_history: 'Familienanamnese',
      lifestyle: 'Lebensstil',
      other: 'Sonstiges',
    }
    
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Anamnese
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Anamnese-Einträge werden geladen…
        </p>
      </Card>
    )
  }

  if (errorEvidenceCode || error) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Anamnese
          </h2>
        </div>
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-amber-300 dark:text-amber-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            {error || 'Datenquelle aktuell nicht verfügbar'}
          </p>
          {errorEvidenceCode && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              EVIDENCE: {errorEvidenceCode}
            </p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card padding="lg" shadow="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
              Anamnese
            </h2>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Eintrag hinzufügen
          </Button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Noch keine Anamnese-Einträge vorhanden
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Fügen Sie einen neuen Eintrag hinzu, um zu beginnen
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries
              .filter((entry) => !entry.is_archived)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                        {entry.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center">
                        {entry.entry_type && (
                          <Badge variant="secondary" size="sm">
                            {getEntryTypeLabel(entry.entry_type)}
                          </Badge>
                        )}
                        {entry.version_count > 1 && (
                          <Badge variant="secondary" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            v{entry.version_count}
                          </Badge>
                        )}
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditDialog(entry)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchiveEntry(entry.id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Archivieren"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {typeof entry.content === 'object' &&
                    entry.content !== null &&
                    'text' in entry.content &&
                    entry.content.text && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {String(entry.content.text)}
                      </p>
                    )}

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aktualisiert: {formatDate(entry.updated_at)}
                  </p>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Add Entry Dialog */}
      <Modal
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          resetForm()
        }}
        title="Neuer Anamnese-Eintrag"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleAddEntry}
              disabled={!formTitle.trim() || isSaving}
            >
              {isSaving ? 'Wird gespeichert…' : 'Speichern'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Titel" required>
            <Input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="z.B. Chronische Rückenschmerzen"
              required
            />
          </FormField>

          <FormField label="Typ">
            <Select
              value={formEntryType}
              onChange={(e) => setFormEntryType(e.target.value as EntryType | '')}
            >
              <option value="">Bitte wählen</option>
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getEntryTypeLabel(type)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Inhalt">
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Detaillierte Informationen zum Anamnese-Eintrag..."
              rows={6}
            />
          </FormField>

          <FormField label="Tags (kommagetrennt)">
            <Input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="z.B. chronisch, behandelt"
            />
          </FormField>
        </div>
      </Modal>

      {/* Edit Entry Dialog */}
      <Modal
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedEntry(null)
          resetForm()
        }}
        title="Anamnese-Eintrag bearbeiten"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedEntry(null)
                resetForm()
              }}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleEditEntry}
              disabled={!formTitle.trim() || isSaving}
            >
              {isSaving ? 'Wird gespeichert…' : 'Änderungen speichern'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Titel" required>
            <Input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="z.B. Chronische Rückenschmerzen"
              required
            />
          </FormField>

          <FormField label="Typ">
            <Select
              value={formEntryType}
              onChange={(e) => setFormEntryType(e.target.value as EntryType | '')}
            >
              <option value="">Bitte wählen</option>
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getEntryTypeLabel(type)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Inhalt">
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Detaillierte Informationen zum Anamnese-Eintrag..."
              rows={6}
            />
          </FormField>

          <FormField label="Tags (kommagetrennt)">
            <Input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="z.B. chronisch, behandelt"
            />
          </FormField>

          {selectedEntry && selectedEntry.version_count > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <Clock className="w-3 h-3 inline mr-1" />
                Beim Speichern wird eine neue Version (v{selectedEntry.version_count + 1}) erstellt
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
