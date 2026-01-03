/**
 * Document Upload Types
 * 
 * Type definitions for document upload feature (V05-I04.1)
 */

import { Database } from './supabase'

export type ParsingStatus = Database['public']['Enums']['parsing_status']

export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

/**
 * Allowed MIME types for document uploads
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

/**
 * Maximum file size: 50MB
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

/**
 * Document upload request payload
 */
export type DocumentUploadRequest = {
  assessmentId: string
  file: File
  docType?: string
}

/**
 * Document upload response
 */
export type DocumentUploadResponse = {
  id: string
  assessmentId: string
  storagePath: string
  fileName: string
  mimeType: string
  size: number
  parsingStatus: ParsingStatus
  createdAt: string
}

/**
 * Parsing status transition map
 * Defines valid state transitions for parsing_status
 */
export const PARSING_STATUS_TRANSITIONS: Record<ParsingStatus, ParsingStatus[]> = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'partial', 'failed'],
  completed: [], // Terminal state
  partial: ['processing', 'completed', 'failed'],
  failed: ['processing'], // Allow retry
}

/**
 * Validates if a parsing status transition is allowed
 */
export function isValidParsingStatusTransition(
  from: ParsingStatus,
  to: ParsingStatus,
): boolean {
  const allowedTransitions = PARSING_STATUS_TRANSITIONS[from]
  return allowedTransitions.includes(to)
}

/**
 * Document metadata for storage
 */
export type DocumentMetadata = {
  userId: string
  assessmentId: string
  originalFilename: string
  mimeType: string
  size: number
  uploadedAt: string
}
