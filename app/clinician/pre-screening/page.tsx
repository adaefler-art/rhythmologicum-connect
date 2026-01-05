'use client'

/**
 * Pre-screening Call Script UI - V05-I08.2
 * 
 * Script-guided initial patient contact for:
 * - Suitability assessment
 * - Red flags identification
 * - Tier recommendation
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  FormField,
  Textarea,
  Select,
  LoadingSpinner,
  Badge,
} from '@/lib/ui'
import {
  COMMON_RED_FLAGS,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
  type RedFlag,
  type ProgramTier,
  type PreScreeningCallInput,
} from '@/lib/contracts/preScreening'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, AlertTriangle, FileText, User } from 'lucide-react'

type PatientProfile = {
  id: string
  full_name: string | null
  user_id: string
}

export default function PreScreeningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [isSuitable, setIsSuitable] = useState<boolean | null>(null)
  const [suitabilityNotes, setSuitabilityNotes] = useState('')
  const [redFlags, setRedFlags] = useState<RedFlag[]>(
    COMMON_RED_FLAGS.map((flag) => ({ ...flag, checked: false }))
  )
  const [redFlagsNotes, setRedFlagsNotes] = useState('')
  const [recommendedTier, setRecommendedTier] = useState<ProgramTier | ''>('')
  const [tierNotes, setTierNotes] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')

  // Load patients on mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('patient_profiles')
          .select('id, full_name, user_id')
          .order('full_name', { ascending: true })
          .limit(100)

        if (error) throw error
        setPatients(data || [])
      } catch (e) {
        console.error('Failed to load patients:', e)
      } finally {
        setLoadingPatients(false)
      }
    }

    loadPatients()
  }, [])

  const handleRedFlagToggle = useCallback((flagId: string) => {
    setRedFlags((prev) =>
      prev.map((flag) =>
        flag.id === flagId ? { ...flag, checked: !flag.checked } : flag
      )
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatientId) {
      setError('Bitte wählen Sie einen Patienten aus')
      return
    }

    if (isSuitable === null) {
      setError('Bitte bewerten Sie die Eignung des Patienten')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const callData: PreScreeningCallInput = {
        patient_id: selectedPatientId,
        is_suitable: isSuitable,
        suitability_notes: suitabilityNotes || undefined,
        red_flags: redFlags.filter((flag) => flag.checked),
        red_flags_notes: redFlagsNotes || undefined,
        recommended_tier: recommendedTier || undefined,
        tier_notes: tierNotes || undefined,
        general_notes: generalNotes || undefined,
      }

      const response = await fetch('/api/pre-screening-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Fehler beim Speichern')
      }

      setSuccess(true)
      
      // Reset form
      setTimeout(() => {
        setSelectedPatientId('')
        setIsSuitable(null)
        setSuitabilityNotes('')
        setRedFlags(COMMON_RED_FLAGS.map((flag) => ({ ...flag, checked: false })))
        setRedFlagsNotes('')
        setRecommendedTier('')
        setTierNotes('')
        setGeneralNotes('')
        setSuccess(false)
      }, 2000)
    } catch (e) {
      console.error('Failed to save pre-screening call:', e)
      setError(e instanceof Error ? e.message : 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const checkedRedFlags = redFlags.filter((flag) => flag.checked)

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Pre-Screening Call Script
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Strukturierter Erstkontakt zur Eignung, Red Flags und Tier-Empfehlung
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <Card padding="lg" shadow="md" radius="lg" className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-900 dark:text-green-100 font-medium">
              Pre-Screening erfolgreich gespeichert
            </span>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card padding="lg" shadow="md" radius="lg" className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-900 dark:text-red-100">{error}</span>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Patient Selection */}
        <Card padding="lg" shadow="md" radius="lg" className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Patient:in
            </h2>
          </div>

          <FormField label="Patient:in auswählen" required>
            {loadingPatients ? (
              <div className="py-4">
                <LoadingSpinner size="sm" text="Patienten werden geladen..." />
              </div>
            ) : (
              <Select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
              >
                <option value="">-- Bitte wählen --</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name || patient.user_id}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </Card>

        {/* Suitability Assessment */}
        <Card padding="lg" shadow="md" radius="lg" className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Eignung
            </h2>
          </div>

          <div className="space-y-4">
            <FormField label="Ist der/die Patient:in für das Programm geeignet?" required>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="suitability"
                    checked={isSuitable === true}
                    onChange={() => setIsSuitable(true)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Ja, geeignet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="suitability"
                    checked={isSuitable === false}
                    onChange={() => setIsSuitable(false)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Nein, nicht geeignet</span>
                </label>
              </div>
            </FormField>

            <FormField label="Notizen zur Eignung">
              <Textarea
                value={suitabilityNotes}
                onChange={(e) => setSuitabilityNotes(e.target.value)}
                placeholder="Zusätzliche Informationen zur Eignung..."
                rows={3}
              />
            </FormField>
          </div>
        </Card>

        {/* Red Flags */}
        <Card padding="lg" shadow="md" radius="lg" className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Red Flags
            </h2>
            {checkedRedFlags.length > 0 && (
              <Badge variant="danger" size="sm">
                {checkedRedFlags.length} markiert
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              {redFlags.map((flag) => (
                <label
                  key={flag.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={flag.checked}
                    onChange={() => handleRedFlagToggle(flag.id)}
                    className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-500 rounded"
                  />
                  <span className="text-slate-700 dark:text-slate-300 flex-1">
                    {flag.label}
                  </span>
                </label>
              ))}
            </div>

            <FormField label="Zusätzliche Notizen zu Red Flags">
              <Textarea
                value={redFlagsNotes}
                onChange={(e) => setRedFlagsNotes(e.target.value)}
                placeholder="Details zu identifizierten Red Flags..."
                rows={3}
              />
            </FormField>
          </div>
        </Card>

        {/* Tier Recommendation */}
        <Card padding="lg" shadow="md" radius="lg" className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Tier-Empfehlung
            </h2>
          </div>

          <div className="space-y-4">
            <FormField label="Empfohlenes Programm-Tier">
              <Select
                value={recommendedTier}
                onChange={(e) => setRecommendedTier(e.target.value as ProgramTier | '')}
              >
                <option value="">-- Keine Empfehlung --</option>
                {Object.entries(TIER_LABELS).map(([tier, label]) => (
                  <option key={tier} value={tier}>
                    {label}
                  </option>
                ))}
              </Select>
              {recommendedTier && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {TIER_DESCRIPTIONS[recommendedTier as ProgramTier]}
                </p>
              )}
            </FormField>

            <FormField label="Notizen zur Tier-Empfehlung">
              <Textarea
                value={tierNotes}
                onChange={(e) => setTierNotes(e.target.value)}
                placeholder="Begründung für die Tier-Empfehlung..."
                rows={3}
              />
            </FormField>
          </div>
        </Card>

        {/* General Notes */}
        <Card padding="lg" shadow="md" radius="lg" className="mb-6">
          <FormField label="Allgemeine Notizen">
            <Textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Weitere wichtige Informationen aus dem Gespräch..."
              rows={4}
            />
          </FormField>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Speichern...
              </span>
            ) : (
              'Pre-Screening speichern'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
