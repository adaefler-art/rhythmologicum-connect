/**
 * E72.ALIGN.P1.DETCON.001: Example API route demonstrating StrictApiResponse<T> usage
 * 
 * This is a reference implementation showing how to use the strict API response type.
 * New/changed API routes should follow this pattern.
 */

import { NextResponse } from 'next/server'
import { ok, fail, ErrorCode } from '@/lib/types/api'

// Example: GET /api/example/users
export async function GET() {
  try {
    // Simulate fetching users
    const users = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ]
    
    // Use ok() helper for success response
    return NextResponse.json(ok(users))
    // Returns: { success: true, data: [...] }
  } catch (error) {
    // Use fail() helper with ErrorCode enum for error response
    return NextResponse.json(
      fail(ErrorCode.INTERNAL_ERROR, 'Failed to fetch users'),
      { status: 500 }
    )
    // Returns: { success: false, error: { code: 'INTERNAL_ERROR', message: '...' } }
  }
}

// Example: POST /api/example/users
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validation example with ErrorCode enum
    if (!body.email) {
      return NextResponse.json(
        fail(ErrorCode.VALIDATION_FAILED, 'Email is required'),
        { status: 400 }
      )
    }
    
    // Simulate creating a user
    const newUser = {
      id: '3',
      name: body.name,
      email: body.email,
    }
    
    return NextResponse.json(ok(newUser), { status: 201 })
  } catch (error) {
    return NextResponse.json(
      fail(ErrorCode.INTERNAL_ERROR, 'Failed to create user'),
      { status: 500 }
    )
  }
}

