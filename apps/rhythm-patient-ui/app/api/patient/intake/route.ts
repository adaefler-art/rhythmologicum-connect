import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTAKE_ALIAS_REMOVED',
        message: 'This endpoint has been removed. Use /api/clinical-intake/generate instead.',
      },
    },
    { status: 410 },
  )
}
