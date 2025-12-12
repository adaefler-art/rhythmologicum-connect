'use client'

import { useState } from 'react'
import MobileWelcomeScreen from '@/app/components/MobileWelcomeScreen'

/**
 * Demo page for MobileWelcomeScreen component
 * This page showcases the mobile welcome screen without requiring database access
 */
export default function MobileWelcomeDemoPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = () => {
    setIsLoading(true)
    setTimeout(() => {
      console.log('Assessment würde jetzt starten!')
      setIsLoading(false)
    }, 2000)
  }

  return (
    <MobileWelcomeScreen
      title="Willkommen zu Ihrem Stress- & Resilienz-Assessment"
      subtitle="Stress & Resilienz"
      description="Entdecken Sie Ihren aktuellen Stresslevel und Ihre persönlichen Resilienzfaktoren. Dieses Assessment hilft Ihnen, ein besseres Verständnis für Ihr Wohlbefinden zu entwickeln."
      bulletPoints={[
        'Beantworten Sie Fragen zu Ihrem aktuellen Stresslevel',
        'Erhalten Sie eine persönliche Auswertung Ihrer Ergebnisse',
        'Entdecken Sie Ihre individuellen Resilienzfaktoren',
        'Bekommen Sie maßgeschneiderte Empfehlungen für Ihr Wohlbefinden',
      ]}
      ctaLabel="Assessment starten"
      onContinue={handleContinue}
      isLoading={isLoading}
    />
  )
}
