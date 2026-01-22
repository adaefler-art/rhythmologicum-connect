import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'

export const metadata: Metadata = {
  title: 'Profil - Rhythmologicum Connect',
  description: 'Mein Profil und Einstellungen',
}

export default function ProfilePage() {
  return <ProfileClient />
}
