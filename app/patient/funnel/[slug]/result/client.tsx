
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ContentPage } from '@/lib/types/content'
import type { ReportWithAssessment, KeyOutcomes } from '@/lib/db/queries/reports'
import { getResultPages, getInfoPages } from '@/lib/utils/contentPageHelpers'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { LoadingSpinner, ErrorState } from '@/lib/ui'
import MobileHeader from '@/app/components/MobileHeader'
import ContentContainer from '@/app/components/layout/ContentContainer'
import {
  ScoreCard,
  InsightCardsGroup,
  StressDistributionBar,
  FollowUpActions,
  AmyTextSection,
  ReportLibrary,
  KeyOutcomesCard,
  WorkupStatusCard,
} from './components'

const GENERIC_ERROR = 'Fehler beim Laden der Ergebnisse.'

type WorkupStatus = 'needs_more_data' | 'ready_for_review' | null

type ResultClientProps = {
  slug: string
  assessmentId: string
  reports: ReportWithAssessment[]
  keyOutcomes: KeyOutcomes | null
}

type AssessmentResult = {
  id: string
  funnel: string
  completedAt: string
  status: string
  funnelTitle: string | null
  workupStatus?: WorkupStatus
  missingDataFields?: string[]
}

type ResultResponse = {
  success: boolean
  data?: AssessmentResult
  error?: { message: string }
}

export default function ResultClient({
  slug,
  assessmentId,
  reports,
  keyOutcomes,
}: ResultClientProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
  const [contentUnavailable, setContentUnavailable] = useState(false)

  const canonicalSlug = assessment?.funnel ?? slug
  const funnelTitle = assessment?.funnelTitle ?? ''

  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/funnels/${slug}/assessments/${assessmentId}/result`,
          { credentials: 'include' },
        )

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as ResultResponse | null
          const message = payload?.error?.message || GENERIC_ERROR
          throw new Error(message)
        }

        const payload = (await response.json()) as ResultResponse
        if (!payload.success || !payload.data) {
          throw new Error(payload.error?.message || GENERIC_ERROR)
        }

        if (payload.data.status !== 'completed') {
          router.replace(`/patient/funnel/${payload.data.funnel}`)
          return
        }

        setAssessment(payload.data)

        try {
          const pagesRes = await fetch(`/api/funnels/${payload.data.funnel}/content-pages`)
          if (pagesRes.ok) {
            const pages: ContentPage[] = await pagesRes.json()
            setContentPages(pages)
            setContentUnavailable(pages.length === 0)
          } else {
            setContentPages([])
            setContentUnavailable(true)
          }
        } catch (err) {
          console.error('Error loading content pages:', err)
          setContentPages([])
          setContentUnavailable(true)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading result:', err)
        setError(err instanceof Error ? err.message : GENERIC_ERROR)
        setLoading(false)
      }
    }

    loadResultData()
  }, [assessmentId, slug, router])

  if (loading) {
    return (
      <main className="flex items-center justify-center bg-muted py-20">
        <LoadingSpinner size="md" text="Ergebnisse werden geladen…" />
      </main>
    )
  }

  if (error || !assessment) {
    return (
      <main className="flex items-center justify-center bg-muted py-20 px-4">
        <ErrorState
          title="Fehler"
          message={error || 'Ergebnisse konnten nicht geladen werden.'}
          onRetry={() => router.push('/patient/dashboard')}
          retryText="Zurück zum Dashboard"
        />
      </main>
    )
  }

  const resultPages = getResultPages(contentPages)
  const infoPages = getInfoPages(contentPages)

  // Sample insights - these would come from assessment analysis
  const sampleInsights = [
    {
      icon: '🎯',
      title: 'Stresslevel erkannt',
      description:
        'Ihre Antworten zeigen ein moderates Stresslevel. Dies ist wichtig für das Gespräch mit Ihrem Behandlungsteam.',
      variant: 'info' as const,
    },
    {
      icon: '💪',
      title: 'Resilienz-Faktoren',
      description:
        'Sie verfügen über gute Bewältigungsstrategien, die Ihnen helfen, mit Stress umzugehen.',
      variant: 'success' as const,
    },
    {
      icon: '⚡',
      title: 'Achtsamkeitspunkte',
      description:
        'Einige Bereiche könnten von zusätzlicher Unterstützung profitieren. Besprechen Sie diese beim nächsten Termin.',
      variant: 'warning' as const,
    },
  ]

  // Sample follow-up actions - E6.4.4: Updated to include follow-up questions and escalation
  const followUpActions = [
    // E6.4.4: Follow-up questions CTA (only if needs more data)
    ...(assessment.workupStatus === 'needs_more_data'
      ? [
          {
            title: 'Zusätzliche Fragen beantworten',
            description:
              'Ergänzen Sie fehlende Informationen, um eine vollständige Auswertung zu ermöglichen.',
            actionLabel: 'Fragen beantworten',
            onClick: () => router.push(`/patient/funnel/${canonicalSlug}`),
          },
        ]
      : []),
    {
      title: 'Termin besprechen',
      description:
        'Ihre Ergebnisse werden von Ihrem Behandlungsteam eingesehen und beim nächsten Termin besprochen.',
    },
    {
      title: 'Ressourcen ansehen',
      description:
        'Entdecken Sie hilfreiche Artikel und Strategien zum Umgang mit Stress und zur Stärkung Ihrer Resilienz.',
      ...(resultPages.length > 0 || infoPages.length > 0
        ? {
            actionLabel: 'Ressourcen ansehen',
            actionUrl: `/patient/funnel/${canonicalSlug}/content/${
              resultPages[0]?.slug || infoPages[0]?.slug
            }`,
          }
        : {}),
    },
    {
      title: 'Verlauf ansehen',
      description:
        'Verfolgen Sie Ihre Assessments über die Zeit und erkennen Sie Muster in Ihrer Historie.',
      actionLabel: 'Zur Historie',
      onClick: () => router.push('/patient/history'),
    },
    // E6.4.4: Escalation offer CTA (stub) - disabled until feature is available
    // Note: Commenting out instead of using alert() for better UX
    // {
    //   title: 'Rückfragen oder Unterstützung benötigt?',
    //   description:
    //     'Wenn Sie Fragen haben oder zusätzliche Unterstützung benötigen, können Sie sich jederzeit an Ihr Behandlungsteam wenden.',
    //   actionLabel: 'Support kontaktieren (demnächst verfügbar)',
    // },
  ]

  return (
    <>
      {/* Mobile Header - Only on Mobile */}
      {isMobile && (
        <MobileHeader
          variant="with-title"
          title="Ergebnisse"
          subtitle={funnelTitle || 'Assessment'}
          showBack={true}
        />
      )}
      
      <main className="min-h-screen bg-muted px-4 pt-8 sm:py-12" style={{
        paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))',
      }}>
        <ContentContainer className="space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4"
            style={{ backgroundColor: 'var(--color-success-light)' }}
          >
            <span className="text-3xl sm:text-4xl">✓</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            Assessment abgeschlossen!
          </h1>
          <p className="text-base sm:text-lg" style={{ color: 'var(--color-neutral-600)' }}>
            {funnelTitle || 'Ihr Assessment'} wurde erfolgreich gespeichert
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-neutral-500)' }}>
            {new Intl.DateTimeFormat('de-DE', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(assessment.completedAt))}
          </p>
        </div>

        {/* E6.4.4: Workup Status Card - Shows status and missing data */}
        <WorkupStatusCard
          status={assessment.workupStatus || null}
          missingDataFields={assessment.missingDataFields || []}
        />

        {/* Key Outcomes - Show real data if available */}
        <KeyOutcomesCard outcomes={keyOutcomes} />

        {/* Report Library */}
        <ReportLibrary reports={reports} />

        {/* Score Card - Only if we have outcome data - E6.4.4: Keep for non-diagnostic metrics */}
        {keyOutcomes && keyOutcomes.score_numeric !== null && (
          <ScoreCard
            score={keyOutcomes.score_numeric}
            maxScore={100}
            level={
              keyOutcomes.risk_level === 'low'
                ? 'low'
                : keyOutcomes.risk_level === 'high'
                  ? 'high'
                  : 'medium'
            }
            label="Stress-Level"
            description="Ihre Gesamtbewertung"
          />
        )}

        {/* AMY Text Section - E6.4.4: Updated to focus on next steps, not diagnoses */}
        <AmyTextSection
          text={`## Vielen Dank für Ihre Teilnahme

Ihre Antworten sind nun gesichert und werden für die weitere Betreuung verwendet.

### Ihre nächsten Schritte

${
  assessment.workupStatus === 'needs_more_data'
    ? `Es werden noch einige zusätzliche Informationen benötigt, um eine vollständige Auswertung zu ermöglichen. Bitte beantworten Sie die fehlenden Fragen über die Schaltfläche "Zusätzliche Fragen beantworten" in den nächsten Schritten.

`
    : ''
}Ihre Angaben helfen Ihrem Behandlungsteam dabei, ein besseres Verständnis Ihrer aktuellen Situation zu entwickeln. Die Ergebnisse werden vertraulich behandelt und nur mit autorisiertem medizinischem Personal geteilt.

### Wie geht es weiter?

Bei Ihrem nächsten Termin können die Ergebnisse gemeinsam besprochen werden. Ihr Behandlungsteam wird Sie über weitere Schritte informieren.`}
          title="Ihre Zusammenfassung"
          icon="🤖"
        />

        {/* Insight Cards - E6.4.4: Removed to avoid showing diagnostic content */}
        {/* Sample insights removed per AC1: Patient should not see diagnoses/differentials in v0.6 */}

        {/* Stress Distribution Bar - E6.4.4: Keep as non-diagnostic visual */}
        <StressDistributionBar />

        {/* Follow-Up Actions - What's Next */}
        <FollowUpActions actions={followUpActions} />

        {/* Additional Resources */}
        {(resultPages.length > 0 || infoPages.length > 0) && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">📚</span>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  Weitere Ressourcen
                </h3>
                <p className="text-sm sm:text-base text-slate-600 mb-4">
                  Erfahren Sie mehr über Stress, Resilienz und praktische Strategien:
                </p>
                <div className="grid gap-2">
                  {resultPages.map((page) => (
                    <a
                      key={page.id}
                      href={`/patient/funnel/${canonicalSlug}/content/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm sm:text-base text-sky-700 hover:text-sky-900 hover:underline font-medium p-2 hover:bg-sky-50 rounded transition-colors"
                    >
                      <span>📄</span>
                      <span>{page.title}</span>
                    </a>
                  ))}
                  {infoPages.map((page) => (
                    <a
                      key={page.id}
                      href={`/patient/funnel/${canonicalSlug}/content/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm sm:text-base text-sky-700 hover:text-sky-900 hover:underline font-medium p-2 hover:bg-sky-50 rounded transition-colors"
                    >
                      <span>📄</span>
                      <span>{page.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content missing (non-error state) */}
        {contentUnavailable && resultPages.length === 0 && infoPages.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">📚</span>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  Inhalte noch nicht verfügbar
                </h3>
                <p className="text-sm sm:text-base text-slate-600">
                  Für dieses Assessment sind aktuell noch keine zusätzlichen Inhalte hinterlegt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="w-full sm:flex-1 px-6 py-4 bg-sky-600 text-white rounded-xl text-base font-semibold hover:bg-sky-700 active:bg-sky-800 transition-colors shadow-md"
            style={{ minHeight: '56px' }}
          >
            Zum Dashboard
          </button>
          <button
            onClick={() => router.push('/patient/history')}
            className="w-full sm:flex-1 px-6 py-4 bg-slate-200 text-slate-700 rounded-xl text-base font-semibold hover:bg-slate-300 active:bg-slate-400 transition-colors"
            style={{ minHeight: '56px' }}
          >
            Meine Assessments
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🔒</span>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Ihre Daten sind sicher
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                Alle Ihre Antworten wurden verschlüsselt gespeichert und unterliegen strengen
                Datenschutzrichtlinien. Nur autorisiertes medizinisches Personal hat Zugriff auf
                Ihre Daten.
              </p>
            </div>
          </div>
        </div>
        </ContentContainer>
    </main>
    </>
  )
}
