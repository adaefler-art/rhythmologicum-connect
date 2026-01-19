import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-neutral-900">Impressum</h1>
        <p className="mt-4 text-sm text-neutral-600">Inhalt folgt.</p>
        <Link
          href="/patient"
          className="mt-6 inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          Zurück zum Patient-Bereich
        </Link>
      </div>
    </main>
  )
}
