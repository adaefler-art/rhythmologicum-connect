/**
 * Mobile UI v2 Usage Example - Wellness Dashboard
 * 
 * Example patient-facing page using mobile-v2 components.
 * Demonstrates practical usage of the design system.
 */

'use client'

import { Button, Card, Chip, ListRow, ProgressBar, Icon } from '@/lib/ui/mobile-v2'
import { Heart, Activity, Moon, TrendingUp, Clock, Calendar } from 'lucide-react'

export default function WellnessDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <Card padding="lg" shadow="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Wellness Dashboard</h1>
              <p className="text-neutral-600 mt-1">Track your health progress</p>
            </div>
            <Icon size="xl" color="#4a90e2">
              <Heart className="w-full h-full" />
            </Icon>
          </div>
          <div className="flex gap-2">
            <Chip variant="success">Active</Chip>
            <Chip variant="primary">Premium</Chip>
          </div>
        </Card>

        {/* Health Metrics */}
        <Card padding="md" shadow="sm">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Health Metrics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-700 flex items-center gap-2">
                  <Icon size="sm" color="#22c55e">
                    <Activity className="w-full h-full" />
                  </Icon>
                  Daily Activity
                </span>
                <Chip variant="success" size="sm">
                  On Track
                </Chip>
              </div>
              <ProgressBar value={75} color="success" showLabel size="md" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-700 flex items-center gap-2">
                  <Icon size="sm" color="#4a90e2">
                    <Moon className="w-full h-full" />
                  </Icon>
                  Sleep Quality
                </span>
                <Chip variant="primary" size="sm">
                  Good
                </Chip>
              </div>
              <ProgressBar value={85} color="primary" showLabel size="md" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-700 flex items-center gap-2">
                  <Icon size="sm" color="#f0ad4e">
                    <TrendingUp className="w-full h-full" />
                  </Icon>
                  Stress Management
                </span>
                <Chip variant="warning" size="sm">
                  Improving
                </Chip>
              </div>
              <ProgressBar value={60} color="warning" showLabel size="md" />
            </div>
          </div>
        </Card>

        {/* Recent Activities */}
        <Card padding="none" shadow="sm">
          <h2 className="text-lg font-semibold text-neutral-900 px-6 pt-4 pb-2">
            Recent Activities
          </h2>
          <div className="divide-y divide-neutral-200">
            <ListRow
              icon={
                <Icon size="md" color="#22c55e">
                  <Activity className="w-full h-full" />
                </Icon>
              }
              subtitle="Morning workout completed"
              trailing={
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  2h ago
                </span>
              }
            >
              Exercise Session
            </ListRow>
            <ListRow
              icon={
                <Icon size="md" color="#4a90e2">
                  <Heart className="w-full h-full" />
                </Icon>
              }
              subtitle="Heart rate: 72 bpm"
              trailing={
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  4h ago
                </span>
              }
            >
              Health Check
            </ListRow>
            <ListRow
              icon={
                <Icon size="md" color="#6c63ff">
                  <Moon className="w-full h-full" />
                </Icon>
              }
              subtitle="8.5 hours of quality sleep"
              trailing={
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  12h ago
                </span>
              }
            >
              Sleep Tracking
            </ListRow>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card padding="md" shadow="sm" hover>
            <div className="text-center">
              <Icon size="lg" color="#4a90e2">
                <Calendar className="w-full h-full mx-auto mb-3" />
              </Icon>
              <h3 className="font-semibold text-neutral-900 mb-2">Schedule Assessment</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Book your next health check-up
              </p>
              <Button variant="primary" size="sm" fullWidth>
                Book Now
              </Button>
            </div>
          </Card>

          <Card padding="md" shadow="sm" hover>
            <div className="text-center">
              <Icon size="lg" color="#22c55e">
                <TrendingUp className="w-full h-full mx-auto mb-3" />
              </Icon>
              <h3 className="font-semibold text-neutral-900 mb-2">View Progress</h3>
              <p className="text-sm text-neutral-600 mb-4">See your wellness trends</p>
              <Button variant="secondary" size="sm" fullWidth>
                View Report
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-neutral-500 text-sm pt-4">
          <p>Mobile UI v2 Design System</p>
        </div>
      </div>
    </div>
  )
}
