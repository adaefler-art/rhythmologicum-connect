/**
 * QA Review Panel Component - V05-I07.3
 * 
 * Displays Layer 1 (validation) and Layer 2 (safety) findings with approve/reject actions.
 * 
 * Features:
 * - Shows contraindications/plausibility from medical_validation_results
 * - Shows safety_score from safety_check_results
 * - Approve/Reject buttons with reason selection
 * - Audit trail integration
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, Badge, Button } from '@/lib/ui'
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, FileCheck } from 'lucide-react'
import {
  DECISION_REASON,
  REVIEW_STATUS,
  getStatusLabel,
  getQueueReasonLabel,
  type ReviewStatus,
  type DecisionReason,
  type QueueReason,
} from '@/lib/contracts/reviewRecord'

export interface ValidationData {
  id: string
  overallStatus: 'pass' | 'flag' | 'fail'
  overallPassed: boolean
  flagsRaisedCount: number
  criticalFlagsCount: number
  warningFlagsCount: number
  infoFlagsCount: number
  rulesEvaluatedCount: number
  validationData: Record<string, unknown>
  validatedAt: string
}

export interface SafetyData {
  id: string
  overallAction: 'PASS' | 'FLAG' | 'BLOCK' | 'UNKNOWN'
  safetyScore: number
  overallSeverity: string
  findingsCount: number
  criticalFindingsCount: number
  highFindingsCount: number
  mediumFindingsCount: number
  lowFindingsCount: number
  checkData: Record<string, unknown>
  evaluatedAt: string
}

export interface ReviewData {
  id: string
  jobId: string
  status: ReviewStatus
  queueReasons: QueueReason[]
  isSampled: boolean
  reviewIteration: number
  createdAt: string
  updatedAt: string
}

export interface DecisionData {
  reviewerRole?: string
  reasonCode?: DecisionReason
  notes?: string
  decidedAt?: string
}

export interface QAReviewPanelProps {
  reviewId: string
  onDecisionMade?: () => void
}

/**
 * Get badge variant for validation status
 */
function getValidationBadge(status: string): {
  variant: 'success' | 'warning' | 'danger'
  label: string
} {
  switch (status) {
    case 'pass':
      return { variant: 'success', label: 'Bestanden' }
    case 'flag':
      return { variant: 'warning', label: 'Markiert' }
    case 'fail':
      return { variant: 'danger', label: 'Fehlgeschlagen' }
    default:
      return { variant: 'warning', label: 'Unbekannt' }
  }
}

/**
 * Get badge variant for safety action
 */
function getSafetyActionBadge(action: string): {
  variant: 'success' | 'warning' | 'danger' | 'secondary'
  label: string
} {
  switch (action) {
    case 'PASS':
      return { variant: 'success', label: 'Sicher' }
    case 'FLAG':
      return { variant: 'warning', label: 'Prüfung' }
    case 'BLOCK':
      return { variant: 'danger', label: 'Blockiert' }
    case 'UNKNOWN':
      return { variant: 'secondary', label: 'Unbekannt' }
    default:
      return { variant: 'secondary', label: action }
  }
}

/**
 * Get badge variant for safety score
 */
function getSafetyScoreBadge(score: number): {
  variant: 'success' | 'warning' | 'danger'
  label: string
} {
  if (score >= 80) {
    return { variant: 'success', label: 'Gut' }
  } else if (score >= 60) {
    return { variant: 'warning', label: 'Mittel' }
  } else {
    return { variant: 'danger', label: 'Niedrig' }
  }
}

export function QAReviewPanel({ reviewId, onDecisionMade }: QAReviewPanelProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState<ReviewData | null>(null)
  const [validation, setValidation] = useState<ValidationData | null>(null)
  const [safety, setSafety] = useState<SafetyData | null>(null)
  const [decision, setDecision] = useState<DecisionData | null>(null)
  
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedReason, setSelectedReason] = useState<DecisionReason | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load review details
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/review/${reviewId}/details`)
        const result = await response.json()

        if (!result.success) {
          setError(result.error?.message || 'Fehler beim Laden der Review-Daten')
          return
        }

        setReview(result.data.review)
        setValidation(result.data.validation)
        setSafety(result.data.safety)
        setDecision(result.data.decision)
      } catch (err) {
        console.error('Error loading review details:', err)
        setError('Fehler beim Laden der Review-Daten')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [reviewId])

  // Handle approve
  async function handleApprove() {
    if (!selectedReason) {
      alert('Bitte wählen Sie einen Grund aus')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/review/${reviewId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: REVIEW_STATUS.APPROVED,
          reasonCode: selectedReason,
          notes: notes || undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error?.message || 'Fehler beim Genehmigen')
        return
      }

      // Reload data
      setShowApproveDialog(false)
      setSelectedReason(null)
      setNotes('')
      
      if (onDecisionMade) {
        onDecisionMade()
      }

      // Refresh data
      window.location.reload()
    } catch (err) {
      console.error('Error approving review:', err)
      alert('Fehler beim Genehmigen')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle reject
  async function handleReject() {
    if (!selectedReason) {
      alert('Bitte wählen Sie einen Grund aus')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/review/${reviewId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: REVIEW_STATUS.REJECTED,
          reasonCode: selectedReason,
          notes: notes || undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        alert(result.error?.message || 'Fehler beim Ablehnen')
        return
      }

      // Reload data
      setShowRejectDialog(false)
      setSelectedReason(null)
      setNotes('')
      
      if (onDecisionMade) {
        onDecisionMade()
      }

      // Refresh data
      window.location.reload()
    } catch (err) {
      console.error('Error rejecting review:', err)
      alert('Fehler beim Ablehnen')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            QA Review Panel
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Daten werden geladen…</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            QA Review Panel
          </h2>
        </div>
        <div className="text-center py-6">
          <AlertTriangle className="w-8 h-8 text-amber-500 dark:text-amber-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{error}</p>
        </div>
      </Card>
    )
  }

  if (!review) {
    return null
  }

  const isPending = review.status === REVIEW_STATUS.PENDING

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            QA Review Panel
          </h2>
        </div>
        <Badge
          variant={
            review.status === REVIEW_STATUS.APPROVED
              ? 'success'
              : review.status === REVIEW_STATUS.REJECTED
              ? 'danger'
              : 'secondary'
          }
        >
          {getStatusLabel(review.status)}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Review Metadata */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Review Information
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Queue Reasons:</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {review.queueReasons.map((reason) => (
                  <Badge key={reason} variant="secondary" size="sm">
                    {getQueueReasonLabel(reason)}
                  </Badge>
                ))}
              </div>
            </div>
            {review.isSampled && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Sampled:</span>
                <Badge variant="info" size="sm">
                  Quality Sample
                </Badge>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Iteration:</span>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {review.reviewIteration}
              </span>
            </div>
          </div>
        </div>

        {/* Layer 1: Validation Results (Contraindications/Plausibility) */}
        {validation && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Layer 1: Medical Validation
                </span>
              </div>
              <Badge variant={getValidationBadge(validation.overallStatus).variant}>
                {getValidationBadge(validation.overallStatus).label}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Rules Evaluated:</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {validation.rulesEvaluatedCount}
                </span>
              </div>

              {/* Flags Breakdown */}
              {validation.flagsRaisedCount > 0 && (
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Flags Raised:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {validation.criticalFlagsCount > 0 && (
                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <div className="text-xs text-red-600 dark:text-red-400">Kritisch</div>
                        <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                          {validation.criticalFlagsCount}
                        </div>
                      </div>
                    )}
                    {validation.warningFlagsCount > 0 && (
                      <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                        <div className="text-xs text-amber-600 dark:text-amber-400">Warnung</div>
                        <div className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                          {validation.warningFlagsCount}
                        </div>
                      </div>
                    )}
                    {validation.infoFlagsCount > 0 && (
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-blue-600 dark:text-blue-400">Info</div>
                        <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                          {validation.infoFlagsCount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Layer 2: Safety Check Results */}
        {safety && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Layer 2: Safety Check
                </span>
              </div>
              <Badge variant={getSafetyActionBadge(safety.overallAction).variant}>
                {getSafetyActionBadge(safety.overallAction).label}
              </Badge>
            </div>

            <div className="space-y-3">
              {/* Safety Score */}
              <div className="p-3 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Safety Score
                  </span>
                  <Badge variant={getSafetyScoreBadge(safety.safetyScore).variant}>
                    {getSafetyScoreBadge(safety.safetyScore).label}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {safety.safetyScore}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/ 100</span>
                </div>
              </div>

              {/* Findings Breakdown */}
              {safety.findingsCount > 0 && (
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Safety Findings:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {safety.criticalFindingsCount > 0 && (
                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <div className="text-xs text-red-600 dark:text-red-400">Kritisch</div>
                        <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                          {safety.criticalFindingsCount}
                        </div>
                      </div>
                    )}
                    {safety.highFindingsCount > 0 && (
                      <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <div className="text-xs text-orange-600 dark:text-orange-400">Hoch</div>
                        <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                          {safety.highFindingsCount}
                        </div>
                      </div>
                    )}
                    {safety.mediumFindingsCount > 0 && (
                      <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                        <div className="text-xs text-amber-600 dark:text-amber-400">Mittel</div>
                        <div className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                          {safety.mediumFindingsCount}
                        </div>
                      </div>
                    )}
                    {safety.lowFindingsCount > 0 && (
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-blue-600 dark:text-blue-400">Niedrig</div>
                        <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                          {safety.lowFindingsCount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Severity:</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {safety.overallSeverity}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Decision Display */}
        {decision && decision.decidedAt && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Decision History
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Decided By:</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {decision.reviewerRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Reason:</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {decision.reasonCode}
                </span>
              </div>
              {decision.notes && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Notes:</span>
                  <p className="mt-1 text-slate-900 dark:text-slate-50">{decision.notes}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Decided At:</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {new Date(decision.decidedAt).toLocaleString('de-DE')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => setShowApproveDialog(true)}
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowRejectDialog(true)}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {/* Approve Dialog */}
        {showApproveDialog && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-3">
              Approve Review
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grund auswählen:
                </label>
                <select
                  className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                  value={selectedReason || ''}
                  onChange={(e) => setSelectedReason(e.target.value as DecisionReason)}
                >
                  <option value="">-- Bitte wählen --</option>
                  <option value={DECISION_REASON.APPROVED_SAFE}>Sicher</option>
                  <option value={DECISION_REASON.APPROVED_FALSE_POSITIVE}>
                    Falsch-Positiv
                  </option>
                  <option value={DECISION_REASON.APPROVED_ACCEPTABLE_RISK}>
                    Akzeptables Risiko
                  </option>
                  <option value={DECISION_REASON.APPROVED_SAMPLED_OK}>Sample OK</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notizen (optional):
                </label>
                <textarea
                  className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  disabled={submitting || !selectedReason}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Confirm Approve'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowApproveDialog(false)
                    setSelectedReason(null)
                    setNotes('')
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-3">
              Reject Review
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grund auswählen:
                </label>
                <select
                  className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                  value={selectedReason || ''}
                  onChange={(e) => setSelectedReason(e.target.value as DecisionReason)}
                >
                  <option value="">-- Bitte wählen --</option>
                  <option value={DECISION_REASON.REJECTED_UNSAFE}>Unsicher</option>
                  <option value={DECISION_REASON.REJECTED_CONTRAINDICATION}>
                    Kontraindikation
                  </option>
                  <option value={DECISION_REASON.REJECTED_PLAUSIBILITY}>
                    Plausibilitätsproblem
                  </option>
                  <option value={DECISION_REASON.REJECTED_QUALITY}>Qualitätsproblem</option>
                  <option value={DECISION_REASON.REJECTED_POLICY}>Richtlinienverstoß</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notizen (optional):
                </label>
                <textarea
                  className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleReject}
                  disabled={submitting || !selectedReason}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Confirm Reject'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowRejectDialog(false)
                    setSelectedReason(null)
                    setNotes('')
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
