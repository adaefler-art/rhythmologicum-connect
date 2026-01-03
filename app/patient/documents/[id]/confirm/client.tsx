/**
 * Document Confirmation Client Component (V05-I04.3)
 * 
 * Interactive UI for reviewing and confirming extracted document data
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { saveDocumentConfirmation } from '@/lib/actions/confirmations'
import {
  type ExtractedData,
  type ConfidenceMetadata,
  type ConfirmationData,
  type FieldConfirmation,
  FIELD_STATUS,
  isLowConfidence,
} from '@/lib/types/extraction'

type Props = {
  documentId: string
  initialData: {
    id: string
    extracted_data: ExtractedData
    confidence: ConfidenceMetadata
    confirmed_data: ConfirmationData | null
    confirmed_at: string | null
  }
}

export default function ConfirmationClient({ documentId, initialData }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize confirmation state from existing confirmations or create new
  const [confirmations, setConfirmations] = useState<Record<string, FieldConfirmation>>(() => {
    if (initialData.confirmed_data?.field_confirmations) {
      return initialData.confirmed_data.field_confirmations
    }
    return {}
  })

  // Initialize confirmed values from existing or use extracted
  const [confirmedData, setConfirmedData] = useState<ExtractedData>(() => {
    if (initialData.confirmed_data) {
      return {
        lab_values: initialData.confirmed_data.lab_values,
        medications: initialData.confirmed_data.medications,
        vital_signs: initialData.confirmed_data.vital_signs,
        diagnoses: initialData.confirmed_data.diagnoses,
        notes: initialData.confirmed_data.notes,
      }
    }
    return initialData.extracted_data
  })

  const handleFieldAccept = useCallback(
    (fieldKey: string, value: any) => {
      setConfirmations(prev => ({
        ...prev,
        [fieldKey]: {
          status: FIELD_STATUS.ACCEPTED,
          original_value: value,
          confirmed_value: value,
          confirmed_at: new Date().toISOString(),
        },
      }))
    },
    [],
  )

  const handleFieldEdit = useCallback(
    (fieldKey: string, originalValue: any, newValue: any) => {
      setConfirmations(prev => ({
        ...prev,
        [fieldKey]: {
          status: FIELD_STATUS.EDITED,
          original_value: originalValue,
          confirmed_value: newValue,
          confirmed_at: new Date().toISOString(),
        },
      }))
    },
    [],
  )

  const handleFieldReject = useCallback((fieldKey: string, value: any) => {
    setConfirmations(prev => ({
      ...prev,
      [fieldKey]: {
        status: FIELD_STATUS.REJECTED,
        original_value: value,
        confirmed_at: new Date().toISOString(),
      },
    }))
  }, [])

  const handleAcceptAll = useCallback(() => {
    const newConfirmations: Record<string, FieldConfirmation> = {}

    // Accept all lab values
    initialData.extracted_data.lab_values?.forEach((labValue, idx) => {
      const key = `lab_values[${idx}]`
      newConfirmations[key] = {
        status: FIELD_STATUS.ACCEPTED,
        original_value: labValue,
        confirmed_value: labValue,
        confirmed_at: new Date().toISOString(),
      }
    })

    // Accept all medications
    initialData.extracted_data.medications?.forEach((med, idx) => {
      const key = `medications[${idx}]`
      newConfirmations[key] = {
        status: FIELD_STATUS.ACCEPTED,
        original_value: med,
        confirmed_value: med,
        confirmed_at: new Date().toISOString(),
      }
    })

    // Accept all vital signs
    if (initialData.extracted_data.vital_signs) {
      Object.entries(initialData.extracted_data.vital_signs).forEach(([vitalKey, value]) => {
        const key = `vital_signs.${vitalKey}`
        newConfirmations[key] = {
          status: FIELD_STATUS.ACCEPTED,
          original_value: value,
          confirmed_value: value,
          confirmed_at: new Date().toISOString(),
        }
      })
    }

    // Accept all diagnoses
    initialData.extracted_data.diagnoses?.forEach((diagnosis, idx) => {
      const key = `diagnoses[${idx}]`
      newConfirmations[key] = {
        status: FIELD_STATUS.ACCEPTED,
        original_value: diagnosis,
        confirmed_value: diagnosis,
        confirmed_at: new Date().toISOString(),
      }
    })

    // Accept notes
    if (initialData.extracted_data.notes) {
      newConfirmations['notes'] = {
        status: FIELD_STATUS.ACCEPTED,
        original_value: initialData.extracted_data.notes,
        confirmed_value: initialData.extracted_data.notes,
        confirmed_at: new Date().toISOString(),
      }
    }

    setConfirmations(newConfirmations)
  }, [initialData.extracted_data])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)

    try {
      const result = await saveDocumentConfirmation({
        document_id: documentId,
        confirmed_data: {
          ...confirmedData,
          field_confirmations: confirmations,
        },
      })

      if (!result.success) {
        setError(result.error?.message || 'Failed to save confirmation')
        setSaving(false)
        return
      }

      // Success - redirect to patient home or show success message
      router.push('/patient?confirmation=success')
    } catch (err) {
      setError('An unexpected error occurred')
      setSaving(false)
    }
  }, [documentId, confirmedData, confirmations, router])

  const getConfidenceScore = (fieldPath: string): number | undefined => {
    return initialData.confidence.field_confidence?.[fieldPath]
  }

  const hasConfirmations = Object.keys(confirmations).length > 0
  const allFieldsConfirmed =
    hasConfirmations &&
    (initialData.extracted_data.lab_values?.length || 0) +
      (initialData.extracted_data.medications?.length || 0) +
      (Object.keys(initialData.extracted_data.vital_signs || {}).length || 0) +
      (initialData.extracted_data.diagnoses?.length || 0) +
      (initialData.extracted_data.notes ? 1 : 0) ===
      Object.keys(confirmations).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Review Extracted Values</h1>
        <p className="text-gray-600 mt-2">
          Please review the information extracted from your document and confirm or correct it.
        </p>
        {initialData.confirmed_at && (
          <p className="text-sm text-green-600 mt-2">
            Last confirmed on {new Date(initialData.confirmed_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAcceptAll}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={saving}
        >
          Accept All
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={saving || !hasConfirmations}
        >
          {saving ? 'Saving...' : 'Save Confirmations'}
        </button>
      </div>

      {/* Lab Values Section */}
      {initialData.extracted_data.lab_values &&
        initialData.extracted_data.lab_values.length > 0 && (
          <LabValuesSection
            labValues={initialData.extracted_data.lab_values}
            confirmations={confirmations}
            getConfidenceScore={getConfidenceScore}
            onAccept={handleFieldAccept}
            onEdit={handleFieldEdit}
            onReject={handleFieldReject}
          />
        )}

      {/* Medications Section */}
      {initialData.extracted_data.medications &&
        initialData.extracted_data.medications.length > 0 && (
          <MedicationsSection
            medications={initialData.extracted_data.medications}
            confirmations={confirmations}
            getConfidenceScore={getConfidenceScore}
            onAccept={handleFieldAccept}
            onEdit={handleFieldEdit}
            onReject={handleFieldReject}
          />
        )}

      {/* Vital Signs Section */}
      {initialData.extracted_data.vital_signs &&
        Object.keys(initialData.extracted_data.vital_signs).length > 0 && (
          <VitalSignsSection
            vitalSigns={initialData.extracted_data.vital_signs}
            confirmations={confirmations}
            getConfidenceScore={getConfidenceScore}
            onAccept={handleFieldAccept}
            onEdit={handleFieldEdit}
            onReject={handleFieldReject}
          />
        )}

      {/* Diagnoses Section */}
      {initialData.extracted_data.diagnoses &&
        initialData.extracted_data.diagnoses.length > 0 && (
          <DiagnosesSection
            diagnoses={initialData.extracted_data.diagnoses}
            confirmations={confirmations}
            getConfidenceScore={getConfidenceScore}
            onAccept={handleFieldAccept}
            onEdit={handleFieldEdit}
            onReject={handleFieldReject}
          />
        )}

      {/* Notes Section */}
      {initialData.extracted_data.notes && (
        <NotesSection
          notes={initialData.extracted_data.notes}
          confirmations={confirmations}
          getConfidenceScore={getConfidenceScore}
          onAccept={handleFieldAccept}
          onEdit={handleFieldEdit}
          onReject={handleFieldReject}
        />
      )}

      {/* Progress indicator */}
      {hasConfirmations && (
        <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded">
          <p className="text-sm text-blue-700">
            {Object.keys(confirmations).length} field(s) confirmed
            {allFieldsConfirmed && ' - All fields confirmed!'}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Section Components
// ============================================================

type SectionProps = {
  confirmations: Record<string, FieldConfirmation>
  getConfidenceScore: (fieldPath: string) => number | undefined
  onAccept: (key: string, value: any) => void
  onEdit: (key: string, originalValue: any, newValue: any) => void
  onReject: (key: string, value: any) => void
}

function LabValuesSection({
  labValues,
  confirmations,
  getConfidenceScore,
  onAccept,
  onEdit,
  onReject,
}: SectionProps & { labValues: any[] }) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Lab Values</h2>
      <div className="space-y-3">
        {labValues.map((labValue, idx) => {
          const key = `lab_values[${idx}]`
          const confidence = getConfidenceScore(key)
          const isLow = confidence !== undefined && isLowConfidence(confidence)
          const confirmation = confirmations[key]

          return (
            <FieldCard
              key={key}
              fieldKey={key}
              label={labValue.test_name}
              value={`${labValue.value}${labValue.unit ? ' ' + labValue.unit : ''}`}
              isLowConfidence={isLow}
              confidence={confidence}
              confirmation={confirmation}
              onAccept={() => onAccept(key, labValue)}
              onEdit={newValue => onEdit(key, labValue, newValue)}
              onReject={() => onReject(key, labValue)}
            />
          )
        })}
      </div>
    </div>
  )
}

function MedicationsSection({
  medications,
  confirmations,
  getConfidenceScore,
  onAccept,
  onEdit,
  onReject,
}: SectionProps & { medications: any[] }) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Medications</h2>
      <div className="space-y-3">
        {medications.map((med, idx) => {
          const key = `medications[${idx}]`
          const confidence = getConfidenceScore(key)
          const isLow = confidence !== undefined && isLowConfidence(confidence)
          const confirmation = confirmations[key]
          const displayValue = `${med.name}${med.dosage ? ' - ' + med.dosage : ''}${med.frequency ? ' (' + med.frequency + ')' : ''}`

          return (
            <FieldCard
              key={key}
              fieldKey={key}
              label="Medication"
              value={displayValue}
              isLowConfidence={isLow}
              confidence={confidence}
              confirmation={confirmation}
              onAccept={() => onAccept(key, med)}
              onEdit={newValue => onEdit(key, med, newValue)}
              onReject={() => onReject(key, med)}
            />
          )
        })}
      </div>
    </div>
  )
}

function VitalSignsSection({
  vitalSigns,
  confirmations,
  getConfidenceScore,
  onAccept,
  onEdit,
  onReject,
}: SectionProps & { vitalSigns: Record<string, string | number> }) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Vital Signs</h2>
      <div className="space-y-3">
        {Object.entries(vitalSigns).map(([vitalKey, value]) => {
          const key = `vital_signs.${vitalKey}`
          const confidence = getConfidenceScore(key)
          const isLow = confidence !== undefined && isLowConfidence(confidence)
          const confirmation = confirmations[key]

          return (
            <FieldCard
              key={key}
              fieldKey={key}
              label={vitalKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              value={String(value)}
              isLowConfidence={isLow}
              confidence={confidence}
              confirmation={confirmation}
              onAccept={() => onAccept(key, value)}
              onEdit={newValue => onEdit(key, value, newValue)}
              onReject={() => onReject(key, value)}
            />
          )
        })}
      </div>
    </div>
  )
}

function DiagnosesSection({
  diagnoses,
  confirmations,
  getConfidenceScore,
  onAccept,
  onEdit,
  onReject,
}: SectionProps & { diagnoses: string[] }) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Diagnoses</h2>
      <div className="space-y-3">
        {diagnoses.map((diagnosis, idx) => {
          const key = `diagnoses[${idx}]`
          const confidence = getConfidenceScore(key)
          const isLow = confidence !== undefined && isLowConfidence(confidence)
          const confirmation = confirmations[key]

          return (
            <FieldCard
              key={key}
              fieldKey={key}
              label="Diagnosis"
              value={diagnosis}
              isLowConfidence={isLow}
              confidence={confidence}
              confirmation={confirmation}
              onAccept={() => onAccept(key, diagnosis)}
              onEdit={newValue => onEdit(key, diagnosis, newValue)}
              onReject={() => onReject(key, diagnosis)}
            />
          )
        })}
      </div>
    </div>
  )
}

function NotesSection({
  notes,
  confirmations,
  getConfidenceScore,
  onAccept,
  onEdit,
  onReject,
}: SectionProps & { notes: string }) {
  const key = 'notes'
  const confidence = getConfidenceScore(key)
  const isLow = confidence !== undefined && isLowConfidence(confidence)
  const confirmation = confirmations[key]

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Notes</h2>
      <FieldCard
        fieldKey={key}
        label="Additional Notes"
        value={notes}
        isLowConfidence={isLow}
        confidence={confidence}
        confirmation={confirmation}
        onAccept={() => onAccept(key, notes)}
        onEdit={newValue => onEdit(key, notes, newValue)}
        onReject={() => onReject(key, notes)}
        multiline
      />
    </div>
  )
}

// ============================================================
// Field Card Component
// ============================================================

type FieldCardProps = {
  fieldKey: string
  label: string
  value: string
  isLowConfidence: boolean
  confidence?: number
  confirmation?: FieldConfirmation
  onAccept: () => void
  onEdit: (newValue: any) => void
  onReject: () => void
  multiline?: boolean
}

function FieldCard({
  fieldKey,
  label,
  value,
  isLowConfidence,
  confidence,
  confirmation,
  onAccept,
  onEdit,
  onReject,
  multiline = false,
}: FieldCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleSaveEdit = () => {
    onEdit(editValue)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const status = confirmation?.status
  const bgColor = isLowConfidence
    ? 'bg-yellow-50 border-yellow-300'
    : status === 'accepted'
      ? 'bg-green-50 border-green-300'
      : status === 'edited'
        ? 'bg-blue-50 border-blue-300'
        : status === 'rejected'
          ? 'bg-red-50 border-red-300'
          : 'bg-white border-gray-300'

  return (
    <div className={`border rounded p-3 ${bgColor}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-700">{label}</span>
            {confidence !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  isLowConfidence ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                }`}
              >
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>

          {!isEditing && (
            <div className="mt-1 text-gray-900">
              {multiline ? (
                <pre className="whitespace-pre-wrap font-sans text-sm">{value}</pre>
              ) : (
                <span className="text-sm">{value}</span>
              )}
            </div>
          )}

          {isEditing && (
            <div className="mt-2">
              {multiline ? (
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  rows={4}
                />
              ) : (
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status && !isEditing && (
            <div className="mt-1 text-xs text-gray-600">
              Status: {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          )}
        </div>
      </div>

      {!isEditing && !status && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onAccept}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Not Applicable
          </button>
        </div>
      )}
    </div>
  )
}
