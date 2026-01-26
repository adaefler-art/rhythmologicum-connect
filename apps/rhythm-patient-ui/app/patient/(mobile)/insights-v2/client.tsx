'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  HealthScore,
  WeeklyChart,
  StatCard,
  Card,
  Button,
  Chip,
  ListRow,
  Badge,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from '@/lib/ui/mobile-v2'
import type { WeeklyData, HealthMetric } from '@/lib/ui/mobile-v2/types'
import {
  Heart,
  Moon,
  Activity,
  Brain,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  ClipboardList,
} from 'lucide-react'
import type { PatientStateV01, ActivityItem, MetricSeries } from '@/lib/api/contracts/patient/state'

// ==========================================
// TYPES
// ==========================================

interface Milestone {
  id: string
  icon: string
  title: string
  description: string
  achievedAt: string
}

interface RecentActivity {
  id: string
  type: 'assessment' | 'appointment' | 'log'
  title: string
  subtitle: string
  timestamp: string
  icon: React.ReactNode
}

interface Props {
  initialPatientState: PatientStateV01 | null
  hasError?: boolean
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Converts ActivityItem from state to RecentActivity for UI
 */
function mapActivityItemToUI(item: ActivityItem, index: number): RecentActivity {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'assessment_completed':
        return <ClipboardList className="w-5 h-5 text-[#4a90e2]" />
      case 'result_generated':
        return <FileText className="w-5 h-5 text-[#22c55e]" />
      case 'dialog_session':
        return <Brain className="w-5 h-5 text-[#a855f7]" />
      case 'measure_recorded':
        return <Activity className="w-5 h-5 text-[#eab308]" />
      default:
        return <Calendar className="w-5 h-5 text-[#6b7280]" />
    }
  }

  const getDisplayType = (type: ActivityItem['type']): 'assessment' | 'appointment' | 'log' => {
    if (type === 'assessment_completed') return 'assessment'
    if (type === 'dialog_session') return 'appointment'
    return 'log'
  }

  // Format timestamp to relative time
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      return date.toLocaleDateString()
    } catch {
      return 'Recently'
    }
  }

  return {
    id: `${item.type}-${index}`,
    type: getDisplayType(item.type),
    title: item.label,
    subtitle: item.metadata?.subtitle as string || '',
    timestamp: formatTimestamp(item.timestamp),
    icon: getIcon(item.type),
  }
}

/**
 * Converts MetricSeries to WeeklyData for charts
 * Takes last 7 data points and maps to days of week
 */
function mapMetricSeriesToWeeklyData(series: MetricSeries): WeeklyData[] {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Get last 7 data points
  const recentData = series.data.slice(-7)
  
  if (recentData.length === 0) {
    return []
  }

  // If less than 7 points, fill with empty values
  const weeklyData: WeeklyData[] = []
  for (let i = 0; i < 7; i++) {
    const dataPoint = recentData[i]
    weeklyData.push({
      day: daysOfWeek[i],
      value: dataPoint?.value || 0,
    })
  }

  return weeklyData
}

/**
 * Gets chart title for metric type
 */
function getMetricChartTitle(metricType: MetricSeries['metricType'], unit: string): string {
  switch (metricType) {
    case 'HR':
      return 'Heart Rate'
    case 'BP_systolic':
      return 'Blood Pressure (Systolic)'
    case 'BP_diastolic':
      return 'Blood Pressure (Diastolic)'
    case 'Sleep':
      return `Sleep Quality (${unit})`
    case 'Weight':
      return `Weight (${unit})`
    default:
      return 'Health Metric'
  }
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PersonalInsightsV2Client({ initialPatientState, hasError }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(hasError)
  const [patientState, setPatientState] = useState<PatientStateV01 | null>(initialPatientState)

  // Determine if we have data
  const hasHealthScore = patientState && patientState.metrics.healthScore.current > 0
  const hasMetrics = patientState && patientState.metrics.keyMetrics.length > 0
  const hasActivity = patientState && patientState.activity.recentActivity.length > 0
  const hasAnyData = hasHealthScore || hasMetrics || hasActivity

  // Refresh state function
  const refreshState = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/patient/state')
      if (response.ok) {
        const result = await response.json()
        setPatientState(result.data)
        setError(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-4 space-y-4">
        <LoadingSkeleton variant="card" count={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-4">
        <ErrorState
          title="Unable to load insights"
          message="We couldn't load your health insights. Please try again."
          onRetry={refreshState}
        />
      </div>
    )
  }

  // Empty state - no patient data
  if (!hasAnyData) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4">
        <EmptyState
          iconVariant="inbox"
          title="No insights yet"
          message="Complete an assessment to start tracking your health journey"
          ctaText="Start Assessment"
          onCtaClick={() => router.push('/patient/assess')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1f2937]">Personal Insights</h1>
          <Button variant="ghost" size="sm" onClick={refreshState}>
            Refresh
          </Button>
        </div>
        <p className="text-sm text-[#6b7280] mt-1">Track your health journey</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Health Score Header */}
        {hasHealthScore && patientState && (
          <section>
            <HealthScore
              score={patientState.metrics.healthScore.current}
              maxScore={100}
              trend={patientState.metrics.healthScore.delta > 0 ? 'up' : patientState.metrics.healthScore.delta < 0 ? 'down' : 'neutral'}
              label="Overall Health Score"
            />
          </section>
        )}

        {/* Key Metrics with Charts */}
        {hasMetrics && patientState && (
          <section>
            <h2 className="text-lg font-semibold text-[#1f2937] mb-3">Weekly Trends</h2>
            <div className="space-y-4">
              {patientState.metrics.keyMetrics.map((metric, index) => {
                const weeklyData = mapMetricSeriesToWeeklyData(metric)
                
                if (weeklyData.length === 0) {
                  return (
                    <Card key={index} padding="md" shadow="sm">
                      <h3 className="text-base font-semibold text-[#1f2937] mb-2">
                        {getMetricChartTitle(metric.metricType, metric.unit)}
                      </h3>
                      <EmptyState
                        iconVariant="question"
                        title="No data available"
                        message="Data will appear here as you track this metric"
                        className="border border-[#e5e7eb]"
                      />
                    </Card>
                  )
                }

                return (
                  <WeeklyChart
                    key={index}
                    title={getMetricChartTitle(metric.metricType, metric.unit)}
                    data={weeklyData}
                    color={index % 3 === 0 ? 'purple' : index % 3 === 1 ? 'blue' : 'green'}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* If no metrics yet, show empty state for weekly trends */}
        {!hasMetrics && (
          <section>
            <h2 className="text-lg font-semibold text-[#1f2937] mb-3">Weekly Trends</h2>
            <EmptyState
              iconVariant="question"
              title="No metrics tracked yet"
              message="Start tracking your health metrics to see trends"
              ctaText="Start tracking"
              onCtaClick={() => alert('Tracking coming soon')}
            />
          </section>
        )}

        {/* Milestones - Placeholder for future */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#1f2937]">Milestones</h2>
          </div>
          <EmptyState
            iconVariant="question"
            title="No milestones yet"
            message="Keep tracking your health to unlock achievements"
            ctaText="Start tracking"
            onCtaClick={() => router.push('/patient/assess')}
          />
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold text-[#1f2937] mb-3">Recent Activity</h2>

          {hasActivity && patientState ? (
            <Card padding="none" shadow="sm">
              {patientState.activity.recentActivity.map((activityItem, index) => {
                const activity = mapActivityItemToUI(activityItem, index)
                return (
                  <div key={activity.id}>
                    <ListRow
                      icon={activity.icon}
                      subtitle={activity.subtitle}
                      trailing={
                        <span className="text-xs text-[#9ca3af]">{activity.timestamp}</span>
                      }
                      onClick={() => {
                        // Future: navigate to activity detail
                        console.log('Activity clicked:', activity)
                      }}
                    >
                      {activity.title}
                    </ListRow>
                    {index < patientState.activity.recentActivity.length - 1 && (
                      <div className="border-b border-[#e5e7eb]" />
                    )}
                  </div>
                )
              })}
            </Card>
          ) : (
            <EmptyState
              iconVariant="inbox"
              title="No recent activity"
              message="Your recent health activities will appear here"
              ctaText="Start an assessment"
              onCtaClick={() => router.push('/patient/assess')}
            />
          )}
        </section>

        {/* Export/Generate Report CTAs */}
        <section>
          <h2 className="text-lg font-semibold text-[#1f2937] mb-3">Reports</h2>
          <div className="space-y-3">
            <Card padding="md" shadow="sm" hover>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-[#eff6ff]">
                  <Download className="w-6 h-6 text-[#4a90e2]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1f2937]">Download Full Report</h3>
                  <p className="text-sm text-[#6b7280]">Get a comprehensive health report</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => alert('Coming soon: Download full report')}
                >
                  Download
                </Button>
              </div>
            </Card>

            <Card padding="md" shadow="sm" hover>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-[#fef9c3]">
                  <FileText className="w-6 h-6 text-[#eab308]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1f2937]">Generate PDF</h3>
                  <p className="text-sm text-[#6b7280]">Create a PDF of your insights</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => alert('Coming soon: Generate PDF report')}
                >
                  Generate
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
