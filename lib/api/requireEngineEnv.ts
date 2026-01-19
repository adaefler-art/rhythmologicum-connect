import { NextResponse } from 'next/server'
import { getEngineEnv } from '@/lib/env'

export function requireEngineEnv() {
  try {
    getEngineEnv()
    return null
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Missing env'
    const missing = message.startsWith('Missing env:')
      ? message.replace('Missing env:', '').split(',').map((item) => item.trim()).filter(Boolean)
      : []

    return NextResponse.json(
      {
        error: message,
        missing,
      },
      { status: 500 },
    )
  }
}
