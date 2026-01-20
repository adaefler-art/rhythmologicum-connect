/**
 * Mobile UI v2 Component Demo Page
 * 
 * Demonstrates all primitive components from the mobile-v2 design system.
 * This page validates that components render correctly and tokens are applied.
 */

'use client'

import { Button, Card, Chip, ListRow, ProgressBar, Icon } from '@/lib/ui/mobile-v2'
import { Heart, Star, CheckCircle, AlertCircle } from 'lucide-react'

export default function MobileV2DemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <Card padding="lg" shadow="md">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Mobile UI v2 Design System
          </h1>
          <p className="text-neutral-600">
            Demonstration of primitive components using mobile-v2 design tokens.
          </p>
        </Card>

        {/* Buttons */}
        <Card padding="md" shadow="sm">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm">
              Primary Small
            </Button>
            <Button variant="primary" size="md">
              Primary Medium
            </Button>
            <Button variant="primary" size="lg">
              Primary Large
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Button variant="secondary" size="md">
              Secondary
            </Button>
            <Button variant="ghost" size="md">
              Ghost
            </Button>
            <Button variant="primary" size="md" icon={<Heart />} iconPosition="left">
              With Icon
            </Button>
          </div>
        </Card>

        {/* Chips/Tags */}
        <Card padding="md" shadow="sm">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Chips & Tags</h2>
          <div className="flex flex-wrap gap-2">
            <Chip variant="primary" size="md">
              Primary
            </Chip>
            <Chip variant="success" size="md">
              Success
            </Chip>
            <Chip variant="warning" size="md">
              Warning
            </Chip>
            <Chip variant="danger" size="md">
              Danger
            </Chip>
            <Chip variant="neutral" size="md">
              Neutral
            </Chip>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Chip variant="primary" size="sm">
              Small
            </Chip>
            <Chip variant="success" size="md" removable onRemove={() => console.log('Removed')}>
              Removable
            </Chip>
          </div>
        </Card>

        {/* Progress Bars */}
        <Card padding="md" shadow="sm">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Progress Bars</h2>
          <div className="space-y-4">
            <ProgressBar value={25} color="primary" showLabel label="Primary Progress" />
            <ProgressBar value={50} color="success" showLabel label="Success Progress" />
            <ProgressBar value={75} color="warning" showLabel label="Warning Progress" />
            <ProgressBar value={90} color="danger" showLabel label="Danger Progress" size="lg" />
          </div>
        </Card>

        {/* List Rows */}
        <Card padding="none" shadow="sm">
          <h2 className="text-xl font-semibold text-neutral-900 px-6 pt-4 pb-2">List Rows</h2>
          <div className="divide-y divide-neutral-200">
            <ListRow
              icon={<Icon size="md" color="#4a90e2"><Heart /></Icon>}
              subtitle="Health assessment completed"
            >
              Assessment Results
            </ListRow>
            <ListRow
              icon={<Icon size="md" color="#22c55e"><CheckCircle /></Icon>}
              subtitle="All tasks completed"
              active
            >
              Active Item
            </ListRow>
            <ListRow
              icon={<Icon size="md" color="#f0ad4e"><AlertCircle /></Icon>}
              subtitle="Pending review"
              trailing={<Chip variant="warning" size="sm">Pending</Chip>}
            >
              Pending Review
            </ListRow>
            <ListRow
              icon={<Icon size="md" color="#6c63ff"><Star /></Icon>}
              subtitle="Click to view details"
              trailing={<span className="text-neutral-400">→</span>}
              onClick={() => console.log('Clicked')}
            >
              Clickable Item
            </ListRow>
          </div>
        </Card>

        {/* Cards with different variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card padding="md" shadow="sm">
            <h3 className="font-semibold text-neutral-900 mb-2">Small Shadow</h3>
            <p className="text-neutral-600 text-sm">Card with sm shadow</p>
          </Card>
          <Card padding="md" shadow="md">
            <h3 className="font-semibold text-neutral-900 mb-2">Medium Shadow</h3>
            <p className="text-neutral-600 text-sm">Card with md shadow</p>
          </Card>
          <Card padding="lg" shadow="lg" hover>
            <h3 className="font-semibold text-neutral-900 mb-2">Large Shadow + Hover</h3>
            <p className="text-neutral-600 text-sm">Hover over this card</p>
          </Card>
          <Card padding="sm" shadow="none">
            <h3 className="font-semibold text-neutral-900 mb-2">No Shadow</h3>
            <p className="text-neutral-600 text-sm">Card without shadow</p>
          </Card>
        </div>

        {/* Footer */}
        <Card padding="md" shadow="sm">
          <div className="text-center text-neutral-600 text-sm">
            <p>Mobile UI v2 Design System Demo</p>
            <p className="mt-1">
              All components use design tokens from{' '}
              <code className="bg-neutral-100 px-2 py-1 rounded text-xs">
                lib/ui/mobile-v2/
              </code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
