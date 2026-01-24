'use client'

import Link from 'next/link'
import { Card, Button, Badge } from '@/lib/ui/mobile-v2'

export function DialogScreenV2() {
  return (
    <div className="w-full px-4 pb-8 pt-5 sm:px-6">
      <div className="w-full flex flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            Dialog &amp; Beratung
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Ihr direkter Kontakt
          </h1>
          <p className="text-sm text-slate-600">
            Hier finden Sie sichere Nachrichten, Rückfragen und nächste Schritte zu Ihrem
            Assessment.
          </p>
        </header>

        <Card padding="md" shadow="sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900">
                Status
              </h2>
              <p className="text-sm text-slate-600">
                Der Dialogbereich wird aktuell vorbereitet. Sobald eine Betreuung aktiviert wird,
                erscheinen hier Ihre Nachrichten.
              </p>
            </div>
            <Badge variant="warning" size="sm">In Vorbereitung</Badge>
          </div>
        </Card>

        <Card padding="md" shadow="sm">
          <h2 className="text-base font-semibold text-slate-900">
            Schnelle Hilfe
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Haben Sie Fragen oder möchten Sie ein Anliegen senden? Erstellen Sie eine
            Support-Anfrage.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/patient/support">
              <Button variant="primary" size="md">
                Support-Anfrage starten
              </Button>
            </Link>
            <Link href="/patient/history">
              <Button variant="secondary" size="md">
                Verlauf ansehen
              </Button>
            </Link>
          </div>
        </Card>

        <Card padding="md" shadow="none" className="border border-dashed border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">
            Nächste Schritte
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
            <li>Wir informieren Sie, sobald Nachrichten verfügbar sind.</li>
            <li>Nutzen Sie den Support für organisatorische Fragen.</li>
            <li>Alle Antworten werden in Ihrer Verlaufshistorie dokumentiert.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
