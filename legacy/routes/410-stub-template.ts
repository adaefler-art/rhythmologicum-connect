/**
 * E73.6 Legacy Ghosting Framework - 410 Gone Stub Template
 * 
 * This template shows how to create a 410 Gone response for a ghosted legacy endpoint.
 * 
 * Usage:
 * 1. Copy this file to the appropriate location in production app
 * 2. Replace [ROUTE_PATH] with the actual route path
 * 3. Update deprecatedAt timestamp
 * 4. Add alternative endpoint if available
 * 5. Add migration guide URL if available
 * 
 * Example:
 *   apps/rhythm-studio-ui/app/api/admin/old-endpoint/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * R-LEGACY-002: Legacy Ghosted Endpoint
 * 
 * This endpoint has been permanently deprecated and moved to the legacy quarantine zone.
 * 
 * Original implementation: legacy/code/app/api/[ROUTE_PATH]/route.ts
 * 
 * @returns HTTP 410 Gone with error details
 */
export async function GET(request: NextRequest) {
  return legacyGhostedResponse('/api/[ROUTE_PATH]', {
    alternative: '/api/[NEW_ROUTE_PATH]', // Optional: new endpoint to use instead
    docsUrl: 'https://docs.example.com/migration/[route-name]', // Optional: migration guide
  })
}

export async function POST(request: NextRequest) {
  return legacyGhostedResponse('/api/[ROUTE_PATH]', {
    alternative: '/api/[NEW_ROUTE_PATH]',
    docsUrl: 'https://docs.example.com/migration/[route-name]',
  })
}

export async function PUT(request: NextRequest) {
  return legacyGhostedResponse('/api/[ROUTE_PATH]', {
    alternative: '/api/[NEW_ROUTE_PATH]',
    docsUrl: 'https://docs.example.com/migration/[route-name]',
  })
}

export async function DELETE(request: NextRequest) {
  return legacyGhostedResponse('/api/[ROUTE_PATH]', {
    alternative: '/api/[NEW_ROUTE_PATH]',
    docsUrl: 'https://docs.example.com/migration/[route-name]',
  })
}

export async function PATCH(request: NextRequest) {
  return legacyGhostedResponse('/api/[ROUTE_PATH]', {
    alternative: '/api/[NEW_ROUTE_PATH]',
    docsUrl: 'https://docs.example.com/migration/[route-name]',
  })
}

// ============================================================================
// Helper Function
// ============================================================================

interface LegacyGhostedOptions {
  alternative?: string
  docsUrl?: string
  deprecatedAt?: string
}

function legacyGhostedResponse(
  route: string,
  options: LegacyGhostedOptions = {}
): NextResponse {
  const {
    alternative,
    docsUrl,
    deprecatedAt = '2026-01-28', // Update this to actual ghosting date
  } = options

  const response = {
    error: 'LEGACY_GHOSTED',
    route,
    message: alternative
      ? `This endpoint has been permanently deprecated. Please use ${alternative} instead.`
      : 'This endpoint has been permanently deprecated. Please contact support for assistance.',
    deprecatedAt,
    ...(alternative && { alternative }),
    ...(docsUrl && { docsUrl }),
  }

  return NextResponse.json(response, {
    status: 410,
    headers: {
      'Content-Type': 'application/json',
      'X-Legacy-Ghosted': 'true',
      'X-Deprecated-At': deprecatedAt,
      ...(alternative && { 'X-Alternative-Endpoint': alternative }),
    },
  })
}
