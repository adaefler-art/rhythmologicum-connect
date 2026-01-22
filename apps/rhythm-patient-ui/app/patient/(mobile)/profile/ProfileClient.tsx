'use client'

import { supabase } from '@/lib/supabaseClient'
import { Card, Button } from '@/lib/ui/mobile-v2'

export default function ProfileClient() {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    } catch {
      // Ignore network errors; client session is already cleared
    }
    window.location.assign('/')
  }

  return (
    <div className="w-full px-4 py-8">
      <Card padding="lg" shadow="sm">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937]">Mein Profil</h1>
            <p className="text-sm text-[#6b7280]">
              Verwalten Sie hier Ihre persönlichen Daten und Einstellungen.
            </p>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm text-sky-900">
              ⚙️ In Entwicklung: Profilbearbeitung und Einstellungen
            </p>
          </div>

          <Button variant="secondary" size="md" fullWidth onClick={handleSignOut}>
            Abmelden
          </Button>
        </div>
      </Card>
    </div>
  )
}
