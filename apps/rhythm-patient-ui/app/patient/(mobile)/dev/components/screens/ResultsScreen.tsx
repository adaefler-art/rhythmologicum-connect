'use client'

/**
 * Results/Next Steps Screen
 * 
 * Reference screen showing:
 * - Assessment results summary
 * - Health score visualization
 * - Recommended actions
 */

import {
  Header,
  HealthScore,
  Card,
  Badge,
  ActionCard,
  Button,
} from '@/src/components/patient-ui'
import type { Action } from '@/src/vendor/rhythm_mobile_v2'

export default function ResultsScreen() {
  const recommendedActions: Action[] = [
    {
      id: '1',
      title: 'Morning Meditation',
      description: 'Start your day with a 10-minute guided meditation',
      icon: '🧘',
      iconColor: 'text-[#6c63ff]',
      iconBgColor: 'bg-[#f3f4f6]',
      type: 'primary',
      buttonText: 'Start Now',
      buttonColor: 'primary',
    },
    {
      id: '2',
      title: 'Breathing Exercise',
      description: 'Practice deep breathing to reduce stress',
      icon: '🌬️',
      iconColor: 'text-[#4a90e2]',
      iconBgColor: 'bg-[#dbeafe]',
      type: 'secondary',
      buttonText: 'Begin',
      buttonColor: 'secondary',
    },
    {
      id: '3',
      title: 'Evening Walk',
      description: 'Take a 20-minute walk to improve your mood',
      icon: '🚶',
      iconColor: 'text-[#5cb85c]',
      iconBgColor: 'bg-[#dcfce7]',
      type: 'success',
      buttonText: 'View Details',
      buttonColor: 'success',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Header */}
      <Header
        title="Assessment Complete"
        showBackButton={true}
        showMoreButton={false}
        onBack={() => {}}
      />

      <div className="p-4 space-y-6">
        {/* Completion Message */}
        <Card padding="lg">
          <div className="text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-[#1f2937]">
              Great Job!
            </h2>
            <p className="text-[#6b7280]">
              You've completed your Stress & Resilience Assessment
            </p>
          </div>
        </Card>

        {/* Results Summary */}
        <div>
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">Your Results</h3>
          
          {/* Health Score */}
          <Card padding="lg">
            <div className="flex flex-col items-center space-y-4">
              <HealthScore score={78} label="Stress Resilience Score" />
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="success">Good Progress</Badge>
                <Badge variant="neutral">Improved from last week</Badge>
              </div>

              <p className="text-center text-[#6b7280]">
                Your stress levels have decreased by 12% compared to last week. 
                Keep up the great work!
              </p>
            </div>
          </Card>
        </div>

        {/* Recommended Actions */}
        <div>
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
            Recommended Next Steps
          </h3>
          <p className="text-[#6b7280] mb-4">
            Based on your results, here are some personalized recommendations:
          </p>
          
          <div className="space-y-3">
            {recommendedActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button variant="primary" size="lg" fullWidth>
            View Detailed Report
          </Button>
          <Button variant="outline" size="md" fullWidth>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
