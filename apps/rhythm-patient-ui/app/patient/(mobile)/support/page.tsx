'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card } from '@/lib/ui/mobile-v2'
import { UC1_SAFETY_ROUTE, type Uc1SafetyRoute } from '@/lib/api/contracts/triage'

type RouteUi = {
  title: string
  message: string
  blocked: boolean
}

function isUc1SafetyRoute(value: string | null): value is Uc1SafetyRoute {
  if (!value) {
    return false
  }

  return Object.values(UC1_SAFETY_ROUTE).includes(value as Uc1SafetyRoute)
}

function getRouteUi(route: Uc1SafetyRoute | null, message: string | null): RouteUi {
  if (route === UC1_SAFETY_ROUTE.NOTRUF) {
    return {
      title: 'Akute Gefahr: Bitte sofort Notruf 112 kontaktieren',
      message: message || 'Ihre Angaben deuten auf eine akute Notfallsituation hin.',
      blocked: true,
    }
  }

  if (route === UC1_SAFETY_ROUTE.NOTAUFNAHME) {
    return {
      title: 'Bitte jetzt in eine Notaufnahme gehen',
      message: message || 'Ihre Angaben erfordern eine direkte medizinische Abklärung.',
      blocked: true,
    }
  }

  if (route === UC1_SAFETY_ROUTE.DRINGENDER_TERMIN) {
    return {
      title: 'Bitte zeitnah einen dringenden Termin vereinbaren',
      message: message || 'Setzen Sie den Intake fort und planen Sie zeitnah ärztliche Unterstützung ein.',
      blocked: false,
    }
  }

  return {
    title: 'Unterstützung',
    message: message || 'Wenn Sie sich akut unsicher fühlen, kontaktieren Sie bitte umgehend den Notruf 112.',
    blocked: false,
  }
}

export default function PatientSupportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const routeFromQuery = searchParams.get('route')
  const messageFromQuery = searchParams.get('message')
  const source = searchParams.get('source')

  const route = isUc1SafetyRoute(routeFromQuery) ? routeFromQuery : null

  const ui = useMemo(() => getRouteUi(route, messageFromQuery), [route, messageFromQuery])

  return (
    <div className="w-full overflow-x-hidden bg-slate-50">
      <div className="mx-auto flex min-h-[calc(100dvh-56px)] w-full max-w-md flex-col px-4 pb-8 pt-5">
        <header className="mb-4 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Unterstützung</h1>
          <p className="text-sm text-slate-600">
            {source === 'uc1_safety_gate'
              ? 'Sicherheits-Hinweis aus dem Intake.'
              : 'Triage-Hinweis für den nächsten sicheren Schritt.'}
          </p>
        </header>

        <Card
          padding="lg"
          className={ui.blocked ? 'border border-rose-200 bg-rose-50' : 'border border-amber-200 bg-amber-50'}
        >
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">{ui.title}</h2>
            <p className="text-sm text-slate-700">{ui.message}</p>
            {route && <p className="text-xs text-slate-500">Route: {route}</p>}
          </div>
        </Card>

        <div className="mt-4 space-y-3">
          {route === UC1_SAFETY_ROUTE.NOTRUF ? (
            <a
              href="tel:112"
              className="inline-flex w-full items-center justify-center rounded-lg bg-rose-600 px-4 py-3 text-sm font-medium text-white"
            >
              Notruf 112 anrufen
            </a>
          ) : (
            <Button variant="primary" size="md" fullWidth onClick={() => router.push('/patient/dashboard')}>
              Zur Übersicht
            </Button>
          )}

          <Button variant="secondary" size="md" fullWidth onClick={() => router.push('/patient/dialog')}>
            Zurück zum Dialog
          </Button>
        </div>
      </div>
    </div>
  )
}
