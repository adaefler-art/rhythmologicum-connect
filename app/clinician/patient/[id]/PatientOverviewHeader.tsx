/**
 * PatientOverviewHeader Component
 * 
 * Displays patient demographic information and current status badges.
 * Part of the Patient Detail Page in the Clinician Dashboard.
 */

import { Badge } from '@/lib/ui'
import { User, Calendar, Activity } from 'lucide-react'

export interface PatientOverviewHeaderProps {
  /** Patient's full name */
  fullName: string | null
  /** Patient's birth year */
  birthYear: number | null
  /** Patient's sex/gender */
  sex: string | null
  /** Patient ID for reference */
  patientId: string
  /** Latest risk level */
  latestRiskLevel?: string | null
  /** Latest HRV status (placeholder for future) */
  hrvStatus?: 'low' | 'normal' | 'high' | null
  /** Pending assessment flag */
  hasPendingAssessment?: boolean
}

/**
 * Header component for patient detail page
 * Displays patient info and status badges
 */
export function PatientOverviewHeader({
  fullName,
  birthYear,
  sex,
  patientId,
  latestRiskLevel,
  hrvStatus,
  hasPendingAssessment,
}: PatientOverviewHeaderProps) {
  const displayName = fullName || 'Patient:in'
  const currentYear = new Date().getFullYear()
  const age = birthYear ? currentYear - birthYear : null

  // Risk level badge mapping
  const getRiskBadge = (risk: string | null | undefined) => {
    switch (risk) {
      case 'high':
        return { variant: 'danger' as const, label: 'High Risk' }
      case 'moderate':
        return { variant: 'warning' as const, label: 'Moderate Risk' }
      case 'low':
        return { variant: 'success' as const, label: 'Low Risk' }
      case 'pending':
        return { variant: 'secondary' as const, label: 'Pending' }
      default:
        return null
    }
  }

  // HRV badge mapping (placeholder for future)
  const getHrvBadge = (hrv: 'low' | 'normal' | 'high' | null | undefined) => {
    switch (hrv) {
      case 'low':
        return { variant: 'warning' as const, label: 'HRV Low' }
      case 'normal':
        return { variant: 'success' as const, label: 'HRV Normal' }
      case 'high':
        return { variant: 'info' as const, label: 'HRV High' }
      default:
        return null
    }
  }

  const riskBadge = getRiskBadge(latestRiskLevel)
  const hrvBadge = getHrvBadge(hrvStatus)

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm mb-6 transition-colors duration-150">
      {/* Patient Name */}
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">{displayName}</h1>

      {/* Basic Stats */}
      <div className="flex flex-wrap gap-4 mb-4 text-slate-600 dark:text-slate-300">
        {age && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-sm">
              {age} Jahre (Jahrgang {birthYear})
            </span>
          </div>
        )}
        {sex && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-sm">
              {sex === 'male' ? 'Männlich' : sex === 'female' ? 'Weiblich' : sex}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-sm text-slate-400 dark:text-slate-500">ID: {patientId.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        {riskBadge && <Badge variant={riskBadge.variant}>{riskBadge.label}</Badge>}
        {hrvBadge && <Badge variant={hrvBadge.variant}>{hrvBadge.label}</Badge>}
        {hasPendingAssessment && <Badge variant="secondary">Pending Assessment</Badge>}
      </div>
    </div>
  )
}
