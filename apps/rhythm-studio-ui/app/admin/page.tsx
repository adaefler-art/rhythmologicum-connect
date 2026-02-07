'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminIndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    const redirectIfReady = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.replace('/clinician/triage')
      } else {
        router.replace('/')
      }
    }

    redirectIfReady()
  }, [router])

  return null
}
