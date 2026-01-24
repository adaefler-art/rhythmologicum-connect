'use client'

/**
 * Assessment Question Screen
 * 
 * Reference screen showing:
 * - Question with progress indicator
 * - Radio button options
 * - Navigation buttons
 */

import { useState } from 'react'
import {
  Header,
  ProgressBar,
  Radio,
  Button,
  Card,
} from '@/src/components/patient-ui'

export default function AssessmentQuestionScreen() {
  const [selected, setSelected] = useState<string>('good')

  const options = [
    {
      id: 'excellent',
      label: 'Excellent',
      description: 'Full of energy and vitality',
      icon: '💚',
      iconBg: 'bg-[#dcfce7]',
    },
    {
      id: 'good',
      label: 'Good',
      description: 'Feeling energetic most of the day',
      icon: '💙',
      iconBg: 'bg-[#dbeafe]',
    },
    {
      id: 'moderate',
      label: 'Moderate',
      description: 'Some energy, occasional fatigue',
      icon: '💛',
      iconBg: 'bg-[#fef9c3]',
    },
    {
      id: 'low',
      label: 'Low',
      description: 'Often tired, limited energy',
      icon: '🧡',
      iconBg: 'bg-[#ffedd5]',
    },
    {
      id: 'very-low',
      label: 'Very Low',
      description: 'Constantly exhausted, minimal energy',
      icon: '❤️',
      iconBg: 'bg-[#fee2e2]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      {/* Header */}
      <Header
        title="Assessment"
        showBackButton={true}
        showMoreButton={false}
        onBack={() => {}}
      />

      {/* Progress */}
      <div className="px-4 py-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#6b7280]">Question 3 of 10</span>
          <span className="text-sm font-medium text-[#4a90e2]">30%</span>
        </div>
        <ProgressBar value={30} max={100} color="primary" />
      </div>

      {/* Question Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Question */}
        <Card padding="lg">
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-[#dcfce7] text-[#5cb85c] text-sm font-medium rounded-full">
              Energy Level
            </div>
            <h2 className="text-xl font-bold text-[#1f2937] leading-tight">
              How would you rate your overall energy level today?
            </h2>
            <p className="text-[#6b7280]">
              This helps us understand your daily vitality and activity capacity.
            </p>
          </div>
        </Card>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => (
            <Radio
              key={option.id}
              id={option.id}
              name="energy"
              value={option.id}
              checked={selected === option.id}
              onChange={(value) => setSelected(value)}
              label={option.label}
              description={option.description}
              icon={<span>{option.icon}</span>}
              iconBg={option.iconBg}
            />
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="p-4 bg-white border-t border-[#e5e7eb] space-y-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => {}}
        >
          Continue
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => {}}
        >
          Skip Question
        </Button>
      </div>
    </div>
  )
}
