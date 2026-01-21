'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  HealthScore,
  StatCard,
  AIAssistant,
  QuickAction,
  AppointmentCard,
  WeeklyChart,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  Chip,
} from '@/lib/ui/mobile-v2'
import { HealthMetric, Appointment, WeeklyData } from '@/lib/ui/mobile-v2/types'
import {
  Heart,
  Moon,
  Activity,
  Brain,
  ClipboardList,
  History,
  Calendar,
} from 'lucide-react'

// ==========================================
// DEMO DATA - CLEARLY LABELED AS FIXTURE
// ==========================================

const __DEV_FIXTURE__HEALTH_METRICS: HealthMetric[] = [
  {
    id: 'heart-rate',
    label: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    icon: '❤️',
    color: 'green',
    trend: 'up',
  },
  {
    id: 'sleep-quality',
    label: 'Sleep Quality',
    value: '85',
    unit: '%',
    icon: '🌙',
    color: 'blue',
    trend: 'up',
  },
  {
    id: 'activity-level',
    label: 'Activity Level',
    value: '6.2',
    unit: 'km',
    icon: '🏃',
    color: 'yellow',
    trend: 'up',
  },
  {
    id: 'stress-level',
    label: 'Stress Level',
    value: '3.2',
    unit: '/10',
    icon: '🧠',
    color: 'purple',
    trend: 'down',
  },
]

const __DEV_FIXTURE__WEEKLY_DATA: WeeklyData[] = [
  { day: 'Mon', value: 45 },
  { day: 'Tue', value: 62 },
  { day: 'Wed', value: 38 },
  { day: 'Thu', value: 75 },
  { day: 'Fri', value: 58 },
  { day: 'Sat', value: 82 },
  { day: 'Sun', value: 65 },
]

const __DEV_FIXTURE__APPOINTMENT: Appointment = {
  id: 'apt-001',
  title: 'Follow-up Consultation',
  subtitle: 'Dr. Sarah Mitchell - Cardiology',
  date: 'Mar 15, 2024',
  time: '10:30 AM',
  type: 'Video Call',
}

// ==========================================
// COMPONENT TYPES
// ==========================================

interface DashboardV2ClientProps {
  initialLoading?: boolean
  hasError?: boolean
  isEmpty?: boolean
}

export default function DashboardV2Client({
  initialLoading = false,
  hasError = false,
  isEmpty = false,
}: DashboardV2ClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(hasError ? 'Failed to load dashboard data' : null)

  // ==========================================
  // TIME-BASED GREETING
  // ==========================================
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleChatWithAMY = () => {
    // TODO: Navigate to AMY chat when implemented
    console.log('Navigate to AMY chat')
  }

  const handleStartAssessment = () => {
    router.push('/patient/funnels')
  }

  const handleViewHistory = () => {
    router.push('/patient/history')
  }

  const handleScheduleAppointment = () => {
    // TODO: Navigate to appointment scheduler when implemented
    console.log('Navigate to appointment scheduler - Coming soon')
  }

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    
    // Simulate data fetch
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-4 space-y-4">
        <LoadingSkeleton variant="text" count={1} className="mb-6" />
        <LoadingSkeleton variant="card" count={1} />
        <div className="grid grid-cols-2 gap-3">
          <LoadingSkeleton variant="card" count={2} />
          <LoadingSkeleton variant="card" count={2} />
        </div>
        <LoadingSkeleton variant="list" count={3} />
        <LoadingSkeleton variant="card" count={1} />
      </div>
    )
  }

  // ==========================================
  // ERROR STATE
  // ==========================================
  if (error) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-4 flex items-center justify-center">
        <ErrorState
          title="Unable to load dashboard"
          message={error}
          retryText="Retry"
          onRetry={handleRetry}
        />
      </div>
    )
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-4 flex items-center justify-center">
        <EmptyState
          iconVariant="inbox"
          title="Welcome to your dashboard"
          message="Start your wellness journey by taking your first assessment. We'll track your progress and provide personalized insights."
          ctaText="Start Assessment"
          onCtaClick={handleStartAssessment}
        />
      </div>
    )
  }

  // ==========================================
  // MAIN DASHBOARD RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
        
        {/* GREETING HEADER */}
        <header className="mb-2">
          <h1 className="text-2xl font-bold text-[#1f2937] mb-1">
            {getGreeting()}
          </h1>
          <p className="text-sm text-[#6b7280]">
            Here's your wellness overview
          </p>
          <Chip variant="primary" size="sm" className="mt-2">
            Demo data
          </Chip>
        </header>

        {/* HEALTH SCORE CARD */}
        <section>
          <HealthScore
            score={82}
            maxScore={100}
            label="Overall Health Score"
            trend="up"
          />
        </section>

        {/* AMY ASSISTANT CARD */}
        <section>
          <AIAssistant onChatNow={handleChatWithAMY} />
        </section>

        {/* HEALTH METRICS GRID */}
        <section>
          <h2 className="text-base font-semibold text-[#1f2937] mb-3">
            Health Metrics
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {__DEV_FIXTURE__HEALTH_METRICS.map((metric) => (
              <StatCard key={metric.id} metric={metric} />
            ))}
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <h2 className="text-base font-semibold text-[#1f2937] mb-3">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <QuickAction
              icon={<ClipboardList className="w-5 h-5" />}
              title="Start Assessment"
              subtitle="Track your stress and wellness"
              iconBg="bg-[#dbeafe]"
              iconColor="text-[#4a90e2]"
              onClick={handleStartAssessment}
            />
            <QuickAction
              icon={<History className="w-5 h-5" />}
              title="View History"
              subtitle="Review past assessments"
              iconBg="bg-[#dcfce7]"
              iconColor="text-[#22c55e]"
              onClick={handleViewHistory}
            />
            <QuickAction
              icon={<Calendar className="w-5 h-5" />}
              title="Schedule Appointment"
              subtitle="Coming soon"
              iconBg="bg-[#fef9c3]"
              iconColor="text-[#eab308]"
              onClick={handleScheduleAppointment}
              badge={<Chip variant="warning" size="sm">Soon</Chip>}
            />
          </div>
        </section>

        {/* WEEKLY TREND */}
        <section>
          <WeeklyChart
            title="Weekly Activity"
            data={__DEV_FIXTURE__WEEKLY_DATA}
            color="purple"
          />
        </section>

        {/* UPCOMING APPOINTMENT */}
        <section>
          <h2 className="text-base font-semibold text-[#1f2937] mb-3">
            Upcoming Appointment
          </h2>
          <AppointmentCard
            appointment={__DEV_FIXTURE__APPOINTMENT}
            onClick={() => console.log('View appointment details')}
          />
        </section>

      </div>
    </div>
  )
}
