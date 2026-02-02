'use client'
import { Card, Button } from '@/lib/ui/mobile-v2'

type DashboardHeroProps = {
  greetingName?: string
  onChat: () => void
}

export default function DashboardHero({ greetingName, onChat }: DashboardHeroProps) {
  const resolvedName = greetingName?.trim() || 'there'

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Good morning, {resolvedName}
        </h1>
        <p className="text-slate-600">How are you feeling today?</p>
      </div>

      <Card
        padding="lg"
        shadow="md"
        className="bg-gradient-to-br from-[#4a90e2] via-[#6c63ff] to-[#7c3aed] text-white"
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h2 className="text-lg font-semibold">AMY Assistant</h2>
              <p className="text-white/90 text-sm">Your health companion</p>
            </div>
            <p className="text-white/90 text-sm">
              Chat with AMY to check in, reflect on your day, or get gentle guidance.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 text-slate-900 hover:bg-white"
              onClick={onChat}
            >
              Chat with AMY →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
