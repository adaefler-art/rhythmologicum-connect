'use client'

/**
 * Screen Gallery
 * 
 * Demonstrates 5 reference screens composed from vendor components:
 * 1. Dashboard
 * 2. Assessments List
 * 3. Assessment Question
 * 4. Results/Next Steps
 * 5. Personal Insights
 */

import { useState } from 'react'
import DashboardScreen from './screens/DashboardScreen'
import AssessmentsScreen from './screens/AssessmentsScreen'
import AssessmentQuestionScreen from './screens/AssessmentQuestionScreen'
import ResultsScreen from './screens/ResultsScreen'
import PersonalInsightsScreen from './screens/PersonalInsightsScreen'

export default function ScreenGallery() {
  const [activeScreen, setActiveScreen] = useState<
    'dashboard' | 'assessments' | 'question' | 'results' | 'insights'
  >('dashboard')

  const screens = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'question', label: 'Assessment Question' },
    { id: 'results', label: 'Results/Next Steps' },
    { id: 'insights', label: 'Personal Insights' },
  ] as const

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1f2937]">Screen Gallery</h2>
      
      <p className="text-[#6b7280]">
        Reference screens composed from vendor components demonstrating pixel-accurate implementations.
      </p>

      {/* Screen Selector */}
      <div className="flex flex-wrap gap-2">
        {screens.map((screen) => (
          <button
            key={screen.id}
            onClick={() => setActiveScreen(screen.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeScreen === screen.id
                ? 'bg-gradient-to-r from-[#4a90e2] to-[#6c63ff] text-white shadow-lg'
                : 'bg-white text-[#374151] hover:bg-[#f3f4f6] border border-[#d1d5db]'
            }`}
          >
            {screen.label}
          </button>
        ))}
      </div>

      {/* Screen Display Area */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="w-full bg-[#f7f9fc]">
          {activeScreen === 'dashboard' && <DashboardScreen />}
          {activeScreen === 'assessments' && <AssessmentsScreen />}
          {activeScreen === 'question' && <AssessmentQuestionScreen />}
          {activeScreen === 'results' && <ResultsScreen />}
          {activeScreen === 'insights' && <PersonalInsightsScreen />}
        </div>
      </div>
    </div>
  )
}
