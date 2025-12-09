'use client'

/**
 * Mobile UI Components Demo Page
 * 
 * Demonstrates the new mobile UI components from C2:
 * - MobileCard
 * - MobileProgress
 * - MobileSectionTitle
 */

import MobileCard from '@/app/components/MobileCard'
import MobileProgress from '@/app/components/MobileProgress'
import MobileSectionTitle from '@/app/components/MobileSectionTitle'
import { colors } from '@/lib/design-tokens'

export default function MobileComponentsDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4">
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        {/* Page Header */}
        <MobileSectionTitle size="xl" align="center" icon="📱" marginBottom>
          Mobile UI Components
        </MobileSectionTitle>

        {/* MobileSectionTitle Demo */}
        <section>
          <MobileSectionTitle size="lg" subtitle="Verschiedene Größen und Stile">
            MobileSectionTitle
          </MobileSectionTitle>

          <MobileCard padding="lg" className="space-y-4">
            <MobileSectionTitle size="sm">Small Title</MobileSectionTitle>
            <MobileSectionTitle size="md" subtitle="Mit Untertitel">
              Medium Title
            </MobileSectionTitle>
            <MobileSectionTitle size="lg" icon="✨">
              Large Title mit Icon
            </MobileSectionTitle>
            <MobileSectionTitle size="xl" align="center">
              Extra Large Title (Centered)
            </MobileSectionTitle>
          </MobileCard>
        </section>

        {/* MobileCard Demo */}
        <section>
          <MobileSectionTitle size="lg" subtitle="Verschiedene Stile und Varianten">
            MobileCard
          </MobileSectionTitle>

          <div className="space-y-4">
            <MobileCard padding="sm" shadow="sm">
              <p className="text-sm text-slate-700">
                Small Padding + Small Shadow
              </p>
            </MobileCard>

            <MobileCard padding="md" shadow="md">
              <p className="text-slate-700">
                Medium Padding + Medium Shadow (Standard)
              </p>
            </MobileCard>

            <MobileCard padding="lg" shadow="lg">
              <p className="text-slate-700">
                Large Padding + Large Shadow
              </p>
            </MobileCard>

            <MobileCard padding="lg" shadow="lg" radius="md" border={false}>
              <p className="text-slate-700">
                Ohne Border, kleinerer Radius
              </p>
            </MobileCard>

            <MobileCard
              padding="lg"
              shadow="lg"
              interactive
              onClick={() => alert('Card clicked!')}
            >
              <div className="flex items-center justify-between">
                <p className="text-slate-700 font-medium">
                  Interaktive Card (klickbar)
                </p>
                <span className="text-sky-600">→</span>
              </div>
            </MobileCard>
          </div>
        </section>

        {/* MobileProgress Demo */}
        <section>
          <MobileSectionTitle
            size="lg"
            subtitle="Fortschrittsanzeige für Funnels"
          >
            MobileProgress
          </MobileSectionTitle>

          <MobileCard padding="lg" className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Bar Variant (Standard)
              </p>
              <MobileProgress currentStep={2} totalSteps={5} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Ohne Prozentangabe
              </p>
              <MobileProgress
                currentStep={1}
                totalSteps={4}
                showPercentage={false}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Nur Progress Bar (kein Text)
              </p>
              <MobileProgress
                currentStep={3}
                totalSteps={6}
                showStepText={false}
                showPercentage={false}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Steps Variant
              </p>
              <MobileProgress
                currentStep={1}
                totalSteps={4}
                variant="steps"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Steps ohne Text
              </p>
              <MobileProgress
                currentStep={3}
                totalSteps={6}
                variant="steps"
                showStepText={false}
                showPercentage={false}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Custom Color (Grün)
              </p>
              <MobileProgress
                currentStep={4}
                totalSteps={5}
                color={colors.semantic.success}
              />
            </div>
          </MobileCard>
        </section>

        {/* Combined Example */}
        <section>
          <MobileSectionTitle
            size="lg"
            subtitle="Kombination aller Komponenten"
          >
            Vollständiges Beispiel
          </MobileSectionTitle>

          <MobileCard padding="lg">
            <MobileSectionTitle
              size="md"
              subtitle="Eine typische Funnel-Ansicht"
              icon="📋"
              marginBottom
            >
              Stress Assessment
            </MobileSectionTitle>

            <MobileProgress currentStep={2} totalSteps={8} className="mb-6" />

            <MobileCard padding="md" shadow="sm" className="bg-sky-50">
              <p className="text-slate-700 leading-relaxed">
                Wie häufig haben Sie sich in den letzten zwei Wochen gestresst oder überfordert
                gefühlt?
              </p>
            </MobileCard>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-200 transition-colors">
                Zurück
              </button>
              <button className="flex-1 bg-sky-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-sky-700 transition-colors shadow-md">
                Weiter
              </button>
            </div>
          </MobileCard>
        </section>

        {/* Documentation Link */}
        <MobileCard padding="lg" shadow="sm" className="bg-slate-50">
          <MobileSectionTitle size="sm" marginBottom={false}>
            💡 Verwendung
          </MobileSectionTitle>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Diese Komponenten basieren auf den Design Tokens aus C1 und können einfach
            importiert werden:
          </p>
          <pre className="mt-3 p-3 bg-white rounded-lg text-xs overflow-x-auto border border-slate-200">
            {`import {
  MobileCard,
  MobileProgress,
  MobileSectionTitle
} from '@/app/components/mobile'`}
          </pre>
        </MobileCard>
      </div>
    </div>
  )
}
