import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Datenschutz</h1>
        <p className="mt-4 text-sm text-muted-foreground">Inhalt folgt.</p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:text-primary/90"
        >
          Zurück zum Studio
        </Link>
      </div>
    </main>
  )
}
