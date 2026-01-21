import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil - Rhythmologicum Connect',
  description: 'Mein Profil und Einstellungen',
}

export default function ProfilePage() {
  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Mein Profil
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Verwalten Sie hier Ihre persönlichen Daten und Einstellungen.
        </p>
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-md p-4">
          <p className="text-sm text-sky-900 dark:text-sky-100">
            ⚙️ In Entwicklung: Profilbearbeitung und Einstellungen
          </p>
        </div>
      </div>
    </div>
  )
}
