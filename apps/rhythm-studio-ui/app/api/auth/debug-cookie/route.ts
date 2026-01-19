import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const cookieNames = cookieHeader
    ? cookieHeader
        .split(';')
        .map((part) => part.trim().split('=')[0])
        .filter(Boolean)
    : []

  return NextResponse.json({ cookieNames })
}
