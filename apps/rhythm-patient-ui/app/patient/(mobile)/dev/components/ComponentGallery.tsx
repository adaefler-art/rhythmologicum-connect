'use client'

/**
 * Component Gallery
 * 
 * Showcases all vendor components with their variants and states
 */

import { Heart, Activity, Zap } from '@/lib/ui/mobile-v2/icons'
import {
  Button,
  Card,
  Badge,
  ProgressBar,
  Radio,
  Input,
  StatCard,
  AssessmentCard,
  ActionCard,
  QuickAction,
  AIAssistant,
  HealthScore,
} from '@/src/components/patient-ui'
import type { HealthMetric, Assessment, Action } from '@/src/vendor/rhythm_mobile_v2'

export default function ComponentGallery() {
  // Mock data for components
  const mockMetric: HealthMetric = {
    id: '1',
    label: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    icon: '❤️',
    color: 'green',
    trend: 'neutral',
  }

  const mockAssessment: Assessment = {
    id: '1',
    title: 'How would you rate your overall energy level today?',
    description: 'This helps us understand your daily vitality and activity capacity.',
    category: 'Cardiovascular Health',
    categoryColor: 'primary',
    icon: '💙',
    iconColor: 'text-[#4a90e2]',
    iconBgColor: 'bg-[#dbeafe]',
  }

  const mockAction: Action = {
    id: '1',
    title: 'Morning Meditation',
    description: 'Start your day with a 10-minute guided meditation',
    icon: '🧘',
    iconColor: 'text-[#6c63ff]',
    iconBgColor: 'bg-[#f3f4f6]',
    type: 'primary',
    buttonText: 'Start',
    buttonColor: 'primary',
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-[#1f2937]">Component Gallery</h2>

      {/* Buttons */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-[#1f2937]">Buttons</h3>
        <Card padding="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#6b7280] mb-2">Primary</p>
                <Button variant="primary">Primary Button</Button>
              </div>
              <div>
                <p className="text-sm text-[#6b7280] mb-2">Secondary</p>
                <Button variant="secondary">Secondary Button</Button>
              </div>
              <div>
                <p className="text-sm text-[#6b7280] mb-2">Outline</p>
                <Button variant="outline">Outline Button</Button>
              </div>
              <div>
                <p className="text-sm text-[#6b7280] mb-2">Ghost</p>
                <Button variant="ghost">Ghost Button</Button>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#6b7280] mb-2">Success</p>
                <Button variant="success">Success Button</Button>
              </div>
              <div>
                <p className="text-sm text-[#6b7280] mb-2">Warning</p>
                <Button variant="warning">Warning Button</Button>
              </div>
              <div>
                <p className="text-sm text-[#6b7280] mb-2">Danger</p>
                <Button variant="danger">Danger Button</Button>
              </div>
              <div>
                <p className="text-sm text-[#6b7280] mb-2">With Icon</p>
                <Button variant="primary" icon={<Heart className="w-4 h-4" />}>
                  With Icon
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-[#1f2937]">Badges</h3>
        <Card padding="lg">
          <div className="flex flex-wrap gap-3">
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
          </div>
        </Card>
      </section>

      {/* Progress Bars */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-[#1f2937]">Progress Bars</h3>
        <Card padding="lg">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#6b7280] mb-2">Default (30%)</p>
              <ProgressBar value={30} max={100} showLabel />
            </div>
            <div>
              <p className="text-sm text-[#6b7280] mb-2">Success (75%)</p>
              <ProgressBar value={75} max={100} color="success" showLabel />
            </div>
            <div>
              <p className="text-sm text-[#6b7280] mb-2">Warning (50%)</p>
              <ProgressBar value={50} max={100} color="warning" showLabel />
            </div>
          </div>
        </Card>
      </section>

      {/* Radio Buttons */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-[#1f2937]">Radio Buttons</h3>
        <Card padding="lg">
          <div className="space-y-3">
            <Radio
              id="excellent"
              name="energy"
              value="excellent"
              checked={false}
              onChange={() => {}}
              label="Excellent"
              description="Full of energy and vitality"
              icon={<span>💚</span>}
              iconBg="bg-[#dcfce7]"
            />
            <Radio
              id="good"
              name="energy"
              value="good"
              checked={true}
              onChange={() => {}}
              label="Good"
              description="Feeling energetic most of the day"
              icon={<span>💙</span>}
              iconBg="bg-[#dbeafe]"
            />
            <Radio
              id="moderate"
              name="energy"
              value="moderate"
              checked={false}
              onChange={() => {}}
              label="Moderate"
              description="Some energy, occasional fatigue"
              icon={<span>💛</span>}
              iconBg="bg-[#fef9c3]"
            />
          </div>
        </Card>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-[#1f2937]">Inputs</h3>
        <Card padding="lg">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your name"
              label="Name"
            />
            <Input
              type="email"
              placeholder="email@example.com"
              label="Email"
              icon={<Activity className="w-4 h-4" />}
            />
          </div>
        </Card>
      </section>

      {/* Health Components */}
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-[#1f2937]">Health Components</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#6b7280] mb-2">StatCard</p>
            <StatCard metric={mockMetric} onClick={() => {}} />
          </div>

          <div>
            <p className="text-sm text-[#6b7280] mb-2">AssessmentCard</p>
            <AssessmentCard assessment={mockAssessment} onClick={() => {}} />
          </div>

          <div>
            <p className="text-sm text-[#6b7280] mb-2">ActionCard</p>
            <ActionCard action={mockAction} />
          </div>

          <div>
            <p className="text-sm text-[#6b7280] mb-2">QuickAction</p>
            <QuickAction
              title="Assessments"
              icon={<Activity className="w-6 h-6" />}
              onClick={() => {}}
            />
          </div>

          <div>
            <p className="text-sm text-[#6b7280] mb-2">AIAssistant</p>
            <AIAssistant
              onChatNow={() => {}}
            />
          </div>

          <div>
            <p className="text-sm text-[#6b7280] mb-2">HealthScore</p>
            <HealthScore score={85} label="Health Score" />
          </div>
        </div>
      </section>
    </div>
  )
}
