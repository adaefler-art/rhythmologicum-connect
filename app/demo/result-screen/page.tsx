'use client'

import { useRouter } from 'next/navigation'
import {
  ScoreCard,
  InsightCardsGroup,
  StressDistributionBar,
  FollowUpActions,
  AmyTextSection,
} from '@/app/patient/funnel/[slug]/result/components'

/**
 * Demo page to showcase the new Result Screen (AMY Lite) components
 * Issue 7: Patient Mobile – Result Screen (AMY Lite)
 */
export default function ResultScreenDemo() {
  const router = useRouter()

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
        'Einige Bereiche könnten von zusätzlicher Unterstützung profitieren.',
      variant: 'warning' as const,
    },
  ]

  const followUpActions = [
    {
      title: 'Termin besprechen',
      description:
        'Ihre Ergebnisse werden von Ihrem Behandlungsteam beim nächsten Termin besprochen.',
    },
    {
      title: 'Ressourcen ansehen',
      description:
        'Entdecken Sie hilfreiche Artikel und Strategien zum Umgang mit Stress.',
      actionLabel: 'Mehr erfahren',
      actionUrl: '#',
    },
  ]

  const sampleAmyText = `## Vielen Dank für Ihre Teilnahme

Ihre Antworten sind nun gesichert und werden für die weitere Betreuung verwendet.

### Was bedeutet das?

Ihre Angaben helfen Ihrem **Behandlungsteam** dabei, ein besseres Verständnis Ihrer aktuellen Situation zu entwickeln.

### Nächste Schritte

Bei Ihrem nächsten Termin können die Ergebnisse gemeinsam besprochen werden.`

  return (
    <main className="min-h-screen bg-muted px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border-2 border-amber-300 rounded-xl p-4 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            AMY Lite Result Screen Demo
          </h1>
          <p className="text-sm text-slate-600">Issue 7: Patient Mobile – Result Screen</p>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Assessment abgeschlossen!
          </h2>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Score Card</h3>
          <ScoreCard score={62} maxScore={100} level="medium" label="Moderates Stresslevel" />
        </div>

        <AmyTextSection text={sampleAmyText} title="Ihre Zusammenfassung" icon="🤖" />

        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">Wichtige Erkenntnisse</h3>
          <InsightCardsGroup insights={sampleInsights} />
        </div>

        <StressDistributionBar />

        <FollowUpActions actions={followUpActions} />

        <button
          onClick={() => router.push('/')}
          className="w-full px-6 py-4 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700"
        >
          Zurück zur Startseite
        </button>
      </div>
    </main>
  )
}
