import { redirect } from 'next/navigation'
import LoginPage from '@/app/page'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getStudioEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function AdminIndexRedirect() {
  getStudioEnv()

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      redirect('/admin/content')
    }
  } catch {
    // Fall through to login UI on auth/config errors.
  }

  return <LoginPage />
}
