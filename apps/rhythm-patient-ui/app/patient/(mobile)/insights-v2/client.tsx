'use client'

import React, { useState } from 'react'
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
  initialLoading?: boolean
  hasError?: boolean
}

// ==========================================
// DEMO DATA - CLEARLY LABELED AS FIXTURE
// ==========================================

const __DEV_FIXTURE__HEALTH_SCORE = {
  score: 75,
  maxScore: 100,
  trend: 'up' as const,
}

const __DEV_FIXTURE__HEART_RATE_DATA: WeeklyData[] = [
  { day: 'Mon', value: 68 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 70 },
  { day: 'Thu', value: 69 },
  { day: 'Fri', value: 71 },
  { day: 'Sat', value: 73 },
  { day: 'Sun', value: 72 },
]

const __DEV_FIXTURE__SLEEP_DATA: WeeklyData[] = [
  { day: 'Mon', value: 7.5 },
  { day: 'Tue', value: 8 },
  { day: 'Wed', value: 7 },
  { day: 'Thu', value: 8.5 },
  { day: 'Fri', value: 8 },
  { day: 'Sat', value: 7.5 },
  { day: 'Sun', value: 8 },
]

const __DEV_FIXTURE__ACTIVITY_DATA: WeeklyData[] = [
  { day: 'Mon', value: 45 },
  { day: 'Tue', value: 60 },
  { day: 'Wed', value: 30 },
  { day: 'Thu', value: 75 },
  { day: 'Fri', value: 50 },
  { day: 'Sat', value: 80 },
  { day: 'Sun', value: 65 },
]

const __DEV_FIXTURE__STRESS_DATA: WeeklyData[] = [
  { day: 'Mon', value: 4 },
  { day: 'Tue', value: 5 },
  { day: 'Wed', value: 3 },
  { day: 'Thu', value: 4 },
  { day: 'Fri', value: 3 },
  { day: 'Sat', value: 2 },
  { day: 'Sun', value: 3 },
]

const __DEV_FIXTURE__MILESTONES: Milestone[] = [
  {
    id: '1',
    icon: '🏆',
    title: '7-Day Streak',
    description: 'Logged health data for 7 consecutive days',
    achievedAt: '2 days ago',
  },
  {
    id: '2',
    icon: '⭐',
    title: 'First Assessment Completed',
    description: 'Completed your first stress assessment',
    achievedAt: '1 week ago',
  },
  {
    id: '3',
    icon: '💪',
    title: 'Activity Goal Achieved',
    description: 'Met your weekly activity target',
    achievedAt: '3 days ago',
  },
]

const __DEV_FIXTURE__RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: '1',
    type: 'assessment',
    title: 'Completed Stress Assessment',
    subtitle: 'Score: 7/10 - Moderate stress levels',
    timestamp: '2 days ago',
    icon: <ClipboardList className="w-5 h-5 text-[#4a90e2]" />,
  },
  {
    id: '2',
    type: 'log',
    title: 'Logged Sleep Data',
    subtitle: '8 hours - Good quality sleep',
    timestamp: '1 day ago',
    icon: <Moon className="w-5 h-5 text-[#a855f7]" />,
  },
  {
    id: '3',
    type: 'appointment',
    title: 'Scheduled Follow-up',
    subtitle: 'Dr. Smith - Next Tuesday at 10:00 AM',
    timestamp: 'Today',
    icon: <Calendar className="w-5 h-5 text-[#22c55e]" />,
  },
]

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PersonalInsightsV2Client({ initialLoading, hasError }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(initialLoading)
  const [error, setError] = useState(hasError)

  // Mock: toggle between having data and no data
  const [hasData, setHasData] = useState(true)

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
          onRetry={() => {
            setError(false)
            setLoading(true)
            setTimeout(() => setLoading(false), 1000)
          }}
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
          <Chip variant="neutral" size="sm">
            Demo data
          </Chip>
        </div>
        <p className="text-sm text-[#6b7280] mt-1">Track your health journey</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Health Score Header */}
        <section>
          <HealthScore
            score={__DEV_FIXTURE__HEALTH_SCORE.score}
            maxScore={__DEV_FIXTURE__HEALTH_SCORE.maxScore}
            trend={__DEV_FIXTURE__HEALTH_SCORE.trend}
            label="Overall Health Score"
          />
        </section>

        {/* Key Metrics with Charts */}
        <section>
          <h2 className="text-lg font-semibold text-[#1f2937] mb-3">Weekly Trends</h2>
          <div className="space-y-4">
            {/* Heart Rate */}
            {hasData ? (
              <WeeklyChart
                title="Heart Rate"
                data={__DEV_FIXTURE__HEART_RATE_DATA}
                color="purple"
              />
            ) : (
              <Card padding="md" shadow="sm">
                <h3 className="text-base font-semibold text-[#1f2937] mb-2">Heart Rate</h3>
                <EmptyState
                  iconVariant="question"
                  title="No heart rate data"
                  message="Start tracking your heart rate to see trends here"
                  ctaText="Start tracking"
                  onCtaClick={() => alert('Start tracking heart rate')}
                  className="border border-[#e5e7eb]"
                />
              </Card>
            )}

            {/* Sleep Quality */}
            {hasData ? (
              <WeeklyChart
                title="Sleep Quality"
                data={__DEV_FIXTURE__SLEEP_DATA}
                color="blue"
              />
            ) : (
              <Card padding="md" shadow="sm">
                <h3 className="text-base font-semibold text-[#1f2937] mb-2">Sleep Quality</h3>
                <EmptyState
                  iconVariant="question"
                  title="No sleep data"
                  message="Start logging your sleep to see quality trends"
                  ctaText="Log sleep"
                  onCtaClick={() => alert('Log sleep')}
                  className="border border-[#e5e7eb]"
                />
              </Card>
            )}

            {/* Activity Level */}
            {hasData ? (
              <WeeklyChart
                title="Activity Level (minutes)"
                data={__DEV_FIXTURE__ACTIVITY_DATA}
                color="green"
              />
            ) : (
              <Card padding="md" shadow="sm">
                <h3 className="text-base font-semibold text-[#1f2937] mb-2">Activity Level</h3>
                <EmptyState
                  iconVariant="question"
                  title="No activity data"
                  message="Track your activity to see your progress"
                  ctaText="Track activity"
                  onCtaClick={() => alert('Track activity')}
                  className="border border-[#e5e7eb]"
                />
              </Card>
            )}

            {/* Stress Level */}
            {hasData ? (
              <WeeklyChart
                title="Stress Level (0-10)"
                data={__DEV_FIXTURE__STRESS_DATA}
                color="purple"
              />
            ) : (
              <Card padding="md" shadow="sm">
                <h3 className="text-base font-semibold text-[#1f2937] mb-2">Stress Level</h3>
                <EmptyState
                  iconVariant="question"
                  title="No stress data"
                  message="Complete stress assessments to track your stress levels"
                  ctaText="Take assessment"
                  onCtaClick={() => router.push('/patient/assessment-flow-v2')}
                  className="border border-[#e5e7eb]"
                />
              </Card>
            )}
          </div>
        </section>

        {/* Milestones */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#1f2937]">Milestones</h2>
            <Button variant="ghost" size="sm" onClick={() => alert('View all milestones')}>
              View all
            </Button>
          </div>

          {hasData && __DEV_FIXTURE__MILESTONES.length > 0 ? (
            <div className="space-y-3">
              {__DEV_FIXTURE__MILESTONES.map((milestone) => (
                <Card key={milestone.id} padding="md" shadow="sm" hover>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{milestone.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1f2937]">{milestone.title}</h3>
                      <p className="text-sm text-[#6b7280] mt-1">{milestone.description}</p>
                      <p className="text-xs text-[#9ca3af] mt-2">{milestone.achievedAt}</p>
                    </div>
                    <Badge variant="success" size="sm">
                      ✓
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              iconVariant="question"
              title="No milestones yet"
              message="Keep tracking your health to unlock achievements"
              ctaText="Start tracking"
              onCtaClick={() => alert('Start tracking')}
            />
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold text-[#1f2937] mb-3">Recent Activity</h2>

          {hasData && __DEV_FIXTURE__RECENT_ACTIVITIES.length > 0 ? (
            <Card padding="none" shadow="sm">
              {__DEV_FIXTURE__RECENT_ACTIVITIES.map((activity, index) => (
                <div key={activity.id}>
                  <ListRow
                    icon={activity.icon}
                    subtitle={activity.subtitle}
                    trailing={
                      <span className="text-xs text-[#9ca3af]">{activity.timestamp}</span>
                    }
                    onClick={() => alert(`View ${activity.type}: ${activity.title}`)}
                  >
                    {activity.title}
                  </ListRow>
                  {index < __DEV_FIXTURE__RECENT_ACTIVITIES.length - 1 && (
                    <div className="border-b border-[#e5e7eb]" />
                  )}
                </div>
              ))}
            </Card>
          ) : (
            <EmptyState
              iconVariant="inbox"
              title="No recent activity"
              message="Your recent health activities will appear here"
              ctaText="Start an assessment"
              onCtaClick={() => router.push('/patient/assessment-flow-v2')}
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

        {/* Dev Toggle (for testing empty states) */}
        <section className="pt-4 border-t border-[#e5e7eb]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHasData(!hasData)}
            className="w-full"
          >
            {hasData ? '🔄 Toggle Empty States' : '🔄 Toggle Data View'}
          </Button>
        </section>
      </div>
    </div>
  )
}
