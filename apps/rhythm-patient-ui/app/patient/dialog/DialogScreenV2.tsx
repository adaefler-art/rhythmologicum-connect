import Link from 'next/link'

export function DialogScreenV2() {
  return (
    <div className="px-4 pb-8 pt-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
            Dialog &amp; Beratung
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Ihr direkter Kontakt
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hier finden Sie sichere Nachrichten, Rückfragen und nächste Schritte zu Ihrem
            Assessment.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Status
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Der Dialogbereich wird aktuell vorbereitet. Sobald eine Betreuung aktiviert wird,
                erscheinen hier Ihre Nachrichten.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              In Vorbereitung
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Schnelle Hilfe
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Haben Sie Fragen oder möchten Sie ein Anliegen senden? Erstellen Sie eine
            Support-Anfrage.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/patient/support"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Support-Anfrage starten
            </Link>
            <Link
              href="/patient/history"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/40"
            >
              Verlauf ansehen
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Nächste Schritte
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-4">
            <li>Wir informieren Sie, sobald Nachrichten verfügbar sind.</li>
            <li>Nutzen Sie den Support für organisatorische Fragen.</li>
            <li>Alle Antworten werden in Ihrer Verlaufshistorie dokumentiert.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
