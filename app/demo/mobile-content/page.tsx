'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileContentPage } from '@/app/components/mobile'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'

/**
 * Demo Page for Mobile Content Page Component
 * 
 * Demonstrates the mobile-first content page layout with:
 * - Title and subtitle
 * - Scrollable markdown content
 * - Sticky bottom CTA
 * - Optional secondary action
 */
export default function MobileContentDemo() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = () => {
    setIsLoading(true)
    // Simulate navigation delay
    setTimeout(() => {
      setIsLoading(false)
      alert('CTA clicked! In production, this would navigate to the next page.')
    }, 1500)
  }

  const handleSecondary = () => {
    router.back()
  }

  const sampleMarkdown = `
# Willkommen zum Stress-Assessment

Dieses Assessment hilft Ihnen, Ihr **aktuelles Stresslevel** besser zu verstehen und Wege zur **Verbesserung Ihrer Resilienz** zu finden.

## Was Sie erwartet

Das Assessment besteht aus verschiedenen Fragen zu folgenden Bereichen:

1. **Körperliche Symptome** – Wie fühlt sich Ihr Körper an?
2. **Emotionale Belastung** – Wie geht es Ihnen emotional?
3. **Schlafqualität** – Wie gut schlafen Sie?
4. **Soziale Unterstützung** – Haben Sie Menschen, auf die Sie zählen können?

> **Hinweis**: Es gibt keine richtigen oder falschen Antworten. Antworten Sie so ehrlich wie möglich.

## Datenschutz

Ihre Daten werden:

- **Vertraulich behandelt** – Nur autorisierte Kliniker:innen haben Zugriff
- **Verschlüsselt gespeichert** – Nach aktuellen Sicherheitsstandards
- **Nicht weitergegeben** – Keine Weitergabe an Dritte ohne Ihre Zustimmung

## Wichtige Links

- [Datenschutzerklärung](https://example.com/datenschutz)
- [Nutzungsbedingungen](https://example.com/terms)
- [Kontakt](https://example.com/kontakt)

### Technische Details

\`\`\`typescript
interface AssessmentData {
  userId: string
  timestamp: Date
  responses: Record<string, any>
  score: number
}
\`\`\`

## Bereit zu starten?

Klicken Sie auf den Button unten, um mit dem Assessment zu beginnen. Die Durchführung dauert etwa **5-10 Minuten**.
  `.trim()

  return (
    <MobileContentPage
      title="Stress & Resilienz Assessment"
      subtitle="Informationen"
      ctaLabel="Assessment starten"
      onCtaClick={handleContinue}
      secondaryLabel="Abbrechen"
      onSecondaryClick={handleSecondary}
      isLoading={isLoading}
    >
      <MarkdownRenderer content={sampleMarkdown} />
    </MobileContentPage>
  )
}
