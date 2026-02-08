'use client'

/**
 * Dashboard Screen
 * 
 * Reference screen showing:
 * - AI assistant card
 * - Health metrics overview
 * - Quick actions
 * - Recent assessments
 */

import { Heart, Activity, Moon, Zap } from '@/lib/ui/mobile-v2/icons'
import {
  Header,
  AIAssistant,
  StatCard,
  QuickAction,
  AssessmentCard,
  HealthScore,
} from '@/src/components/patient-ui'
import type { HealthMetric, Assessment } from '@/src/vendor/rhythm_mobile_v2'

export default function DashboardScreen() {
  const healthMetrics: HealthMetric[] = [
    { id: '1', label: 'Heart Rate', value: '72', unit: 'bpm', icon: '❤️', color: 'green', trend: 'neutral' },
    { id: '2', label: 'Steps', value: '8,450', unit: 'steps', icon: '👟', color: 'blue', trend: 'up' },
    { id: '3', label: 'Sleep', value: '8.2', unit: 'hrs', icon: '😴', color: 'purple', trend: 'up' },
    { id: '4', label: 'Energy', value: '85', unit: '%', icon: '⚡', color: 'yellow', trend: 'up' },
  ]

  const recentAssessment: Assessment = {
    id: '1',
    title: 'Stress & Resilience Assessment',
    description: 'Complete your weekly check-in to track your progress',
    category: 'Mental Health',
    categoryColor: 'success',
    icon: '🧠',
    iconColor: 'text-[#5cb85c]',
    iconBgColor: 'bg-[#dcfce7]',
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Header */}
      <Header
        title="Dashboard"
        showBackButton={false}
        showMoreButton={true}
      />

      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold text-[#1f2937]">Welcome back! 👋</h2>
          <p className="text-[#6b7280] mt-1">Here&apos;s your health overview today</p>
        </div>

        {/* AI Assistant */}
        <AIAssistant
          onChatNow={() => {}}
        />

        {/* Health Score */}
        <div className="flex justify-center py-4">
          <HealthScore score={85} label="Overall Health Score" />
        </div>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {healthMetrics.map((metric) => (
            <StatCard
              key={metric.id}
              metric={metric}
              onClick={() => {}}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              title="Assess"
              icon={<Activity className="w-6 h-6" />}
              onClick={() => {}}
            />
            <QuickAction
              title="Progress"
              icon={<Heart className="w-6 h-6" />}
              onClick={() => {}}
            />
            <QuickAction
              title="Sleep"
              icon={<Moon className="w-6 h-6" />}
              onClick={() => {}}
            />
            <QuickAction
              title="Energy"
              icon={<Zap className="w-6 h-6" />}
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Recent Assessment */}
        <div>
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">Continue Assessment</h3>
          <AssessmentCard
            assessment={recentAssessment}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
