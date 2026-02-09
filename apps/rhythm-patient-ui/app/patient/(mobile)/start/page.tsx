'use client'

import { useRouter } from 'next/navigation'
import { Card, Button } from '@/lib/ui/mobile-v2'
import { MessageCircle, Shield, Clock, Heart, ChevronRight } from '@/lib/ui/mobile-v2/icons'

export default function PatientEntryScreen() {
  const router = useRouter()

  return (
    <div className="w-full overflow-x-hidden bg-slate-50">
      <div className="flex min-h-[calc(100dvh-56px)] flex-col px-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-5">
        <div className="flex-1 space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Willkommen</h1>
            <p className="text-sm text-slate-600">
              Schoen, dass Sie da sind. Nehmen Sie sich einen Moment Zeit.
            </p>
          </header>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Ihr Inhalt</p>
                <p className="text-sm text-slate-600">
                  Platzhalter fuer kuenftige Inhalte und Hinweise.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <span className="h-2 w-6 rounded-md bg-slate-900" />
              <span className="h-2 w-2 rounded-md bg-slate-300" />
              <span className="h-2 w-2 rounded-md bg-slate-300" />
            </div>
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Hier koennen Sie sprechen</p>
                  <p className="text-xs text-slate-500">Ihr persoenlicher Dialog mit PAT</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Shield className="h-4 w-4 text-slate-500" />
                  <span>Vertraulich</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span>Jederzeit</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Heart className="h-4 w-4 text-slate-500" />
                  <span>Unterstuetzend</span>
                </div>
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ChevronRight className="h-5 w-5" />}
            iconPosition="right"
            onClick={() => router.push('/patient/dialog')}
          >
            Gespraech beginnen
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Sie koennen jederzeit pausieren oder das Gespraech beenden
          </p>
        </div>
      </div>
    </div>
  )
}
