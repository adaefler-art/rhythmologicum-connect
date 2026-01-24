'use client'

/**
 * Assessments List Screen
 * 
 * Reference screen showing:
 * - List of available assessments
 * - Categories and status badges
 */

import {
  Header,
  AssessmentCard,
  Badge,
} from '@/src/components/patient-ui'
import type { Assessment } from '@/src/vendor/rhythm_mobile_v2'

export default function AssessmentsScreen() {
  const assessments: Assessment[] = [
    {
      id: '1',
      title: 'Stress & Resilience Assessment',
      description: 'Evaluate your current stress levels and coping mechanisms',
      category: 'Mental Health',
      categoryColor: 'success',
      icon: '🧠',
      iconColor: 'text-[#5cb85c]',
      iconBgColor: 'bg-[#dcfce7]',
    },
    {
      id: '2',
      title: 'Cardiovascular Health Check',
      description: 'Monitor your heart health and activity levels',
      category: 'Physical Health',
      categoryColor: 'primary',
      icon: '❤️',
      iconColor: 'text-[#4a90e2]',
      iconBgColor: 'bg-[#dbeafe]',
    },
    {
      id: '3',
      title: 'Sleep Quality Assessment',
      description: 'Track your sleep patterns and quality',
      category: 'Sleep',
      categoryColor: 'secondary',
      icon: '😴',
      iconColor: 'text-[#6c63ff]',
      iconBgColor: 'bg-[#f3f4f6]',
    },
    {
      id: '4',
      title: 'Nutrition & Energy',
      description: 'Assess your dietary habits and energy levels',
      category: 'Nutrition',
      categoryColor: 'warning',
      icon: '🥗',
      iconColor: 'text-[#f0ad4e]',
      iconBgColor: 'bg-[#fef9c3]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Header */}
      <Header
        title="Assessments"
        showBackButton={true}
        showMoreButton={false}
        onBack={() => {}}
      />

      <div className="p-4 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-[#1f2937]">Available Assessments</h2>
          <p className="text-[#6b7280] mt-1">Choose an assessment to get started</p>
        </div>

        {/* Assessment List */}
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onClick={() => {}}
            />
          ))}
        </div>

        {/* Info Card */}
        <div className="bg-[#dbeafe] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-semibold text-[#1f2937] mb-1">
                Regular Check-ins
              </h4>
              <p className="text-sm text-[#6b7280]">
                Complete assessments weekly to track your progress and get personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
