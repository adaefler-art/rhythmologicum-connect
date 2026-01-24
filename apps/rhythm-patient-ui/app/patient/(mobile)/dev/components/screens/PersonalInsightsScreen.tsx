'use client'

/**
 * Personal Insights Screen
 * 
 * Reference screen showing:
 * - Personal health trends
 * - Weekly progress chart
 * - Key insights and achievements
 */

import {
  Header,
  Card,
  Badge,
  StatCard,
  WeeklyChart,
  Button,
} from '@/src/components/patient-ui'
import type { HealthMetric, WeeklyData } from '@/src/vendor/rhythm_mobile_v2'

export default function PersonalInsightsScreen() {
  const weeklyData: WeeklyData[] = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 72 },
    { day: 'Wed', value: 68 },
    { day: 'Thu', value: 78 },
    { day: 'Fri', value: 75 },
    { day: 'Sat', value: 82 },
    { day: 'Sun', value: 80 },
  ]

  const keyMetrics: HealthMetric[] = [
    {
      id: '1',
      label: 'Avg. Stress',
      value: '3.2',
      unit: '/10',
      icon: '🧘',
      color: 'green',
      trend: 'down',
    },
    {
      id: '2',
      label: 'Sleep Quality',
      value: '8.5',
      unit: '/10',
      icon: '😴',
      color: 'purple',
      trend: 'up',
    },
    {
      id: '3',
      label: 'Energy Level',
      value: '7.8',
      unit: '/10',
      icon: '⚡',
      color: 'yellow',
      trend: 'up',
    },
    {
      id: '4',
      label: 'Activity',
      value: '9,200',
      unit: 'steps',
      icon: '👟',
      color: 'blue',
      trend: 'up',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Header */}
      <Header
        title="Personal Insights"
        showBackButton={true}
        showMoreButton={true}
        onBack={() => {}}
      />

      <div className="p-4 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-[#1f2937]">Your Health Journey</h2>
          <p className="text-[#6b7280] mt-1">Track your progress over time</p>
        </div>

        {/* Weekly Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-[#1f2937]">
              This Week&apos;s Progress
            </h3>
            <Badge variant="success">+8% vs last week</Badge>
          </div>
          
          <Card padding="lg">
            <WeeklyChart
              data={weeklyData}
              title="Wellness Score"
              color="blue"
            />
          </Card>
        </div>

        {/* Key Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {keyMetrics.map((metric) => (
              <StatCard
                key={metric.id}
                metric={metric}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
            Recent Achievements
          </h3>
          
          <div className="space-y-3">
            <Card padding="md">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#dcfce7]">
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#1f2937]">7-Day Streak</h4>
                  <p className="text-sm text-[#6b7280]">
                    Completed assessments for 7 days in a row
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#dbeafe]">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#1f2937]">Stress Reduction</h4>
                  <p className="text-sm text-[#6b7280]">
                    Reduced stress levels by 15% this month
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#fef9c3]">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#1f2937]">Sleep Champion</h4>
                  <p className="text-sm text-[#6b7280]">
                    Maintained 8+ hours of sleep for 10 days
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Insights Card */}
        <Card padding="lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <h4 className="text-lg font-semibold text-[#1f2937]">
                AI Insight
              </h4>
            </div>
            <p className="text-[#6b7280]">
              Your stress levels tend to be lower on days when you complete morning meditation. 
              Consider making this a daily habit!
            </p>
            <Button variant="primary" size="sm">
              View More Insights
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
