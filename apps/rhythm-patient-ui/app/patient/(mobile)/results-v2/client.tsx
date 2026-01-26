'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Chip,
  Button,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  HealthScore,
  ActionCard,
  ListRow,
} from '@/lib/ui/mobile-v2'
import {
  Bot,
  Sparkles,
  Shield,
  CheckCircle,
  Clock,
} from 'lucide-react'
import type { Action } from '@/lib/ui/mobile-v2/types'

// ==========================================
// TYPES
// ==========================================

interface CurrentSituation {
  stressLevel: {
    label: string
    value: string
    score: string
  }
  sleepQuality: {
    label: string
    value: string
  }
  physicalActivity: {
    label: string
    value: string
  }
  overallWellbeing: {
    label: string
    value: number
  }
}

interface NextStep {
  step: number
  title: string
  description: string
  completed?: boolean
}

// ==========================================
// DEMO DATA - CLEARLY LABELED AS FIXTURE
// ==========================================

const __DEV_FIXTURE__AMY_SUMMARY = `Based on your assessment, your overall wellness score is 72/100. You're showing moderate stress levels but excellent sleep quality.`

const __DEV_FIXTURE__CURRENT_SITUATION: CurrentSituation = {
  stressLevel: {
    label: 'Stress level',
    value: 'Moderate',
    score: '6/10',
  },
  sleepQuality: {
    label: 'Sleep quality',
    value: 'Excellent (8.5 hours average)',
  },
  physicalActivity: {
    label: 'Physical activity',
    value: 'Good (4 days/week)',
  },
  overallWellbeing: {
    label: 'Overall wellbeing',
    value: 72,
  },
}

const __DEV_FIXTURE__ACTIONS: Action[] = [
  {
    id: 'download-pdf',
    title: 'Download Full Report',
    description: 'Get a detailed summary of your assessment results',
    icon: 'download',
    iconColor: 'text-[#4a90e2]',
    iconBgColor: 'bg-[#4a90e2]/10',
    type: 'primary',
    buttonText: 'View Report (stub)',
  },
  {
    id: 'video-consultation',
    title: 'Start Video Consultation',
    description: 'Connect with a specialist via video call',
    icon: 'video',
    iconColor: 'text-[#5cb85c]',
    iconBgColor: 'bg-[#5cb85c]/10',
    type: 'success',
    buttonText: 'Coming Soon',
    disabled: true,
    disabledReason: 'Video consultations coming soon',
  },
  {
    id: 'book-visit',
    title: 'Book In-Person Visit',
    description: 'Schedule an appointment at our clinic',
    icon: 'calendar',
    iconColor: 'text-[#f5a623]',
    iconBgColor: 'bg-[#f5a623]/10',
    type: 'warning',
    buttonText: 'Coming Soon',
    disabled: true,
    disabledReason: 'Pilot not yet enabled',
  },
  {
    id: 'continue-amy',
    title: 'Continue Dialog with AMY',
    description: 'Get personalized recommendations and support',
    icon: 'message',
    iconColor: 'text-[#6c63ff]',
    iconBgColor: 'bg-[#6c63ff]/10',
    type: 'secondary',
    buttonText: 'Chat Now',
  },
]

const __DEV_FIXTURE__NEXT_STEPS: NextStep[] = [
  {
    step: 1,
    title: 'Review your personalized report',
    description: 'Download and read through your detailed assessment results',
    completed: false,
  },
  {
    step: 2,
    title: 'Schedule follow-up if needed',
    description: 'Book a consultation to discuss your results with a specialist',
    completed: false,
  },
  {
    step: 3,
    title: 'Track progress in Personal Insights',
    description: 'Monitor your wellness journey and see improvements over time',
    completed: false,
  },
]

// ==========================================
// COMPONENT TYPES
// ==========================================

interface ResultsV2ClientProps {
  initialLoading?: boolean
  hasError?: boolean
  isEmpty?: boolean
}

export default function ResultsV2Client({
  initialLoading = false,
  hasError = false,
  isEmpty = false,
}: ResultsV2ClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState(hasError)

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleActionClick = async (actionId: string) => {
    switch (actionId) {
      case 'download-pdf':
        try {
          console.log('[RESULTS_V2] Fetching report stub...')
          const response = await fetch('/api/patient/reports/latest')
          const data = await response.json()
          
          if (data.success) {
            // For stub: show alert with stub data
            alert(`Report Stub (JSON)\n\n${data.data.message}\n\nOverall Score: ${data.data.summary.overallScore}\nStress Level: ${data.data.summary.stressLevel}`)
            console.log('[RESULTS_V2] Report stub retrieved:', data)
          } else {
            console.error('[RESULTS_V2] Failed to fetch report:', data.error)
            alert('Failed to fetch report: ' + data.error.message)
          }
        } catch (err) {
          console.error('[RESULTS_V2] Error fetching report:', err)
          alert('Error fetching report. Please try again.')
        }
        break
      case 'video-consultation':
        // Disabled - no action
        break
      case 'book-visit':
        // Disabled - no action
        break
      case 'continue-amy':
        // I2.2: Navigate with context and assessmentId
        // For MVP, use a demo assessment ID (in future, get from actual assessment data)
        const demoAssessmentId = 'demo-assessment-123'
        router.push(`/patient/dialog?context=results&assessmentId=${demoAssessmentId}`)
        break
      default:
        break
    }
  }

  const handleRetry = () => {
    setError(false)
    setIsLoading(true)

    // Simulate retry
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-[#f3f4f6] rounded animate-pulse w-64" />
            <Chip variant="neutral" size="sm">
              Demo data
            </Chip>
          </div>

          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={4} />
        </div>
      </div>
    )
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <div className="w-full">
          <ErrorState
            title="Failed to load results"
            message="We couldn't load your assessment results. Please try again."
            onRetry={handleRetry}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#1f2937]">Results & Next Steps</h1>
            <Chip variant="neutral" size="sm">
              Demo data
            </Chip>
          </div>

          <EmptyState
            iconVariant="inbox"
            title="No results available"
            message="You haven't completed any assessments yet. Start an assessment to see your results here."
            ctaText="Start Assessment"
            onCtaClick={() => router.push('/patient/assess')}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // MAIN CONTENT
  // ==========================================

  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1f2937]">Results & Next Steps</h1>
          <Chip variant="neutral" size="sm">
            Demo data
          </Chip>
        </div>

        {/* AMY Summary Card */}
        <Card
          padding="lg"
          shadow="md"
          className="bg-gradient-to-br from-[#4a90e2] to-[#6c63ff]"
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-white">AMY Summary</h2>
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>

              <p className="text-sm text-white/95 leading-relaxed">
                {__DEV_FIXTURE__AMY_SUMMARY}
              </p>
            </div>
          </div>
        </Card>

        {/* Overall Wellbeing Score */}
        <HealthScore
          score={__DEV_FIXTURE__CURRENT_SITUATION.overallWellbeing.value}
          maxScore={100}
          label="Overall Wellbeing"
          trend="up"
        />

        {/* Current Situation */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-[#1f2937]">Current Situation</h2>

          <Card padding="none" shadow="sm">
            <ListRow
              icon={<CheckCircle className="w-5 h-5 text-[#f5a623]" />}
              trailing={
                <span className="text-sm font-medium text-[#6b7280]">
                  {__DEV_FIXTURE__CURRENT_SITUATION.stressLevel.score}
                </span>
              }
            >
              {__DEV_FIXTURE__CURRENT_SITUATION.stressLevel.label}
              <span className="ml-2 text-sm text-[#6b7280]">
                {__DEV_FIXTURE__CURRENT_SITUATION.stressLevel.value}
              </span>
            </ListRow>

            <div className="border-t border-[#e5e7eb]" />

            <ListRow icon={<Clock className="w-5 h-5 text-[#5cb85c]" />}>
              {__DEV_FIXTURE__CURRENT_SITUATION.sleepQuality.label}
              <span className="ml-2 text-sm text-[#6b7280]">
                {__DEV_FIXTURE__CURRENT_SITUATION.sleepQuality.value}
              </span>
            </ListRow>

            <div className="border-t border-[#e5e7eb]" />

            <ListRow icon={<CheckCircle className="w-5 h-5 text-[#5cb85c]" />}>
              {__DEV_FIXTURE__CURRENT_SITUATION.physicalActivity.label}
              <span className="ml-2 text-sm text-[#6b7280]">
                {__DEV_FIXTURE__CURRENT_SITUATION.physicalActivity.value}
              </span>
            </ListRow>
          </Card>
        </div>

        {/* Recommended Actions */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-[#1f2937]">Recommended Actions</h2>

          <div className="grid grid-cols-1 gap-4">
            {__DEV_FIXTURE__ACTIONS.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onAction={() => handleActionClick(action.id)}
              />
            ))}
          </div>
        </div>

        {/* Data Protection Card */}
        <Card padding="md" shadow="sm" className="border border-[#e5e7eb]">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#5cb85c]/10">
              <Shield className="w-5 h-5 text-[#5cb85c]" />
            </div>

            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#1f2937] mb-1">
                Your Data is Protected
              </h3>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                All your health information is encrypted and stored securely. We never share your
                personal data without your explicit consent.
              </p>
            </div>
          </div>
        </Card>

        {/* What Happens Next */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-[#1f2937]">What Happens Next</h2>

          <Card padding="lg" shadow="sm">
            <div className="space-y-6">
              {__DEV_FIXTURE__NEXT_STEPS.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        step.completed
                          ? 'bg-[#5cb85c] text-white'
                          : 'bg-[#4a90e2]/10 text-[#4a90e2]'
                      } font-semibold text-sm`}
                    >
                      {step.completed ? <CheckCircle className="w-5 h-5" /> : step.step}
                    </div>
                    {index < __DEV_FIXTURE__NEXT_STEPS.length - 1 && (
                      <div className="w-0.5 h-12 bg-[#e5e7eb] mt-2" />
                    )}
                  </div>

                  <div className="flex-1 pb-2">
                    <h4 className="text-base font-semibold text-[#1f2937] mb-1">{step.title}</h4>
                    <p className="text-sm text-[#6b7280] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Back to Dashboard */}
        <div className="pt-4">
          <Button variant="secondary" size="md" fullWidth onClick={() => router.push('/patient/dashboard-v2')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
