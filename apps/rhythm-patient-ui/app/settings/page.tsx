import { redirect } from 'next/navigation'

export default function SettingsRedirectPage() {
  redirect('/patient/profile')
}
