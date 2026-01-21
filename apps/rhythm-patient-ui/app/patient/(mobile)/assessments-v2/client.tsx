'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Chip,
  Button,
  ProgressBar,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from '@/lib/ui/mobile-v2'
import { ClipboardCheck, Clock, TrendingUp } from 'lucide-react'

// ==========================================
// TYPES
// ==========================================

type AssessmentStatus = 'not-started' | 'in-progress' | 'completed'

interface Assessment {
  id: string
  title: string
  description: string
  status: AssessmentStatus
  duration: string
  progress?: number
  route?: string
  comingSoon?: boolean
}

type FilterOption = 'all' | 'not-started' | 'in-progress' | 'completed'

// ==========================================
// DEMO DATA - CLEARLY LABELED AS FIXTURE
// ==========================================

const __DEV_FIXTURE__ASSESSMENTS: Assessment[] = [
  {
    id: 'stress-assessment',
    title: 'Stress Assessment',
    description: 'Evaluate your current stress levels and identify key stressors',
    status: 'not-started',
    duration: '10-15 min',
    route: '/patient/funnel/stress',
  },
  {
    id: 'sleep-quality',
    title: 'Sleep Quality',
    description: 'Track your sleep patterns and quality for better rest',
    status: 'in-progress',
    duration: '15-20 min',
    progress: 60,
    comingSoon: true,
  },
  {
    id: 'physical-activity',
    title: 'Physical Activity',
    description: 'Assess your daily activity levels and exercise habits',
    status: 'completed',
    duration: '10 min',
    comingSoon: true,
  },
  {
    id: 'mental-wellbeing',
    title: 'Mental Wellbeing',
    description: 'Understand your mental health and emotional balance',
    status: 'not-started',
    duration: '20 min',
    comingSoon: true,
  },
  {
    id: 'nutrition-habits',
    title: 'Nutrition Habits',
    description: 'Review your eating patterns and nutritional intake',
    status: 'completed',
    duration: '15 min',
    comingSoon: true,
  },
]

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getStatusColor(status: AssessmentStatus): 'neutral' | 'warning' | 'success' {
  switch (status) {
    case 'not-started':
      return 'neutral'
    case 'in-progress':
      return 'warning'
    case 'completed':
      return 'success'
    default:
      return 'neutral'
  }
}

function getStatusLabel(status: AssessmentStatus): string {
  switch (status) {
    case 'not-started':
      return 'Not started'
    case 'in-progress':
      return 'In progress'
    case 'completed':
      return 'Completed'
    default:
      return 'Unknown'
  }
}

function getCtaText(assessment: Assessment): string {
  if (assessment.comingSoon) {
    return 'Coming soon'
  }
  
  switch (assessment.status) {
    case 'not-started':
      return 'Start Now'
    case 'in-progress':
      return 'Continue'
    case 'completed':
      return 'View Results'
    default:
      return 'Start'
  }
}

function calculateOverallProgress(assessments: Assessment[]): number {
  const total = assessments.length
  const completed = assessments.filter((a) => a.status === 'completed').length
  const inProgress = assessments.filter((a) => a.status === 'in-progress').length
  
  // Count completed as 100% and in-progress as 50% of one assessment
  const progressValue = completed + inProgress * 0.5
  return Math.round((progressValue / total) * 100)
}

// ==========================================
// COMPONENT TYPES
// ==========================================

interface AssessmentsV2ClientProps {
  initialLoading?: boolean
  hasError?: boolean
  isEmpty?: boolean
}

export default function AssessmentsV2Client({
  initialLoading = false,
  hasError = false,
  isEmpty = false,
}: AssessmentsV2ClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState(hasError)
  const [filter, setFilter] = useState<FilterOption>('all')

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const filteredAssessments = useMemo(() => {
    if (filter === 'all') return __DEV_FIXTURE__ASSESSMENTS
    
    return __DEV_FIXTURE__ASSESSMENTS.filter((assessment) => {
      switch (filter) {
        case 'not-started':
          return assessment.status === 'not-started'
        case 'in-progress':
          return assessment.status === 'in-progress'
        case 'completed':
          return assessment.status === 'completed'
        default:
          return true
      }
    })
  }, [filter])

  const overallProgress = useMemo(
    () => calculateOverallProgress(__DEV_FIXTURE__ASSESSMENTS),
    []
  )

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleAssessmentClick = (assessment: Assessment) => {
    if (assessment.comingSoon) {
      // Show toast or modal for coming soon
      return
    }
    
    if (assessment.route) {
      router.push(assessment.route)
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
            <div className="h-8 bg-[#f3f4f6] rounded animate-pulse w-48" />
            <Chip variant="neutral" size="sm">
              Demo data
            </Chip>
          </div>
          
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={5} />
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
            title="Failed to load assessments"
            message="We couldn't load your assessments. Please try again."
            onRetry={handleRetry}
          />
        </div>
      </div>
    )
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (isEmpty || filteredAssessments.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#1f2937]">Assessments</h1>
            <Chip variant="neutral" size="sm">
              Demo data
            </Chip>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Chip
                variant={filter === 'all' ? 'primary' : 'neutral'}
                onClick={() => setFilter('all')}
              >
                All
              </Chip>
              <Chip
                variant={filter === 'not-started' ? 'primary' : 'neutral'}
                onClick={() => setFilter('not-started')}
              >
                Not started
              </Chip>
              <Chip
                variant={filter === 'in-progress' ? 'primary' : 'neutral'}
                onClick={() => setFilter('in-progress')}
              >
                In progress
              </Chip>
              <Chip
                variant={filter === 'completed' ? 'primary' : 'neutral'}
                onClick={() => setFilter('completed')}
              >
                Completed
              </Chip>
            </div>
          </div>

          <EmptyState
            iconVariant="inbox"
            title="No assessments available"
            message="There are no assessments matching your current filter. Try changing the filter or check back later."
            ctaText={filter !== 'all' ? 'Clear filter' : undefined}
            onCtaClick={filter !== 'all' ? () => setFilter('all') : undefined}
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
          <h1 className="text-2xl font-bold text-[#1f2937]">Assessments</h1>
          <Chip variant="neutral" size="sm">
            Demo data
          </Chip>
        </div>

        {/* Overall Progress Card */}
        <Card padding="lg" shadow="md">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#4a90e2] to-[#6c63ff]">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1f2937] mb-1">
                Overall Progress
              </h2>
              <p className="text-sm text-[#6b7280] mb-3">
                Track your assessment journey
              </p>
              <ProgressBar
                value={overallProgress}
                color="primary"
                showLabel
                label="Completion"
                size="md"
              />
            </div>
          </div>
        </Card>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <Chip
            variant={filter === 'all' ? 'primary' : 'neutral'}
            onClick={() => setFilter('all')}
          >
            All
          </Chip>
          <Chip
            variant={filter === 'not-started' ? 'primary' : 'neutral'}
            onClick={() => setFilter('not-started')}
          >
            Not started
          </Chip>
          <Chip
            variant={filter === 'in-progress' ? 'primary' : 'neutral'}
            onClick={() => setFilter('in-progress')}
          >
            In progress
          </Chip>
          <Chip
            variant={filter === 'completed' ? 'primary' : 'neutral'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Chip>
        </div>

        {/* Assessment Cards */}
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <Card
              key={assessment.id}
              padding="lg"
              shadow="sm"
              hover={!assessment.comingSoon}
              onClick={
                assessment.comingSoon ? undefined : () => handleAssessmentClick(assessment)
              }
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-1">
                      {assessment.title}
                    </h3>
                    <p className="text-sm text-[#6b7280] leading-relaxed">
                      {assessment.description}
                    </p>
                  </div>
                  
                  <Chip variant={getStatusColor(assessment.status)} size="sm">
                    {getStatusLabel(assessment.status)}
                  </Chip>
                </div>

                {/* Progress Bar (for in-progress assessments) */}
                {assessment.status === 'in-progress' && assessment.progress !== undefined && (
                  <ProgressBar
                    value={assessment.progress}
                    color="primary"
                    showLabel
                    label="Progress"
                    size="sm"
                  />
                )}

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                    <Clock className="w-4 h-4" />
                    <span>{assessment.duration}</span>
                  </div>
                  
                  <Button
                    variant={assessment.comingSoon ? 'ghost' : 'primary'}
                    size="sm"
                    disabled={assessment.comingSoon}
                    onClick={() => handleAssessmentClick(assessment)}
                  >
                    {getCtaText(assessment)}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
