/**
 * Database Types (Auto-generated)
 * 
 * NOTE: This file should be regenerated using `npm run db:typegen` after migrations.
 * For now, it contains a minimal stub to allow the build to proceed.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, any>
    Views: Record<string, any>
    Functions: Record<string, any>
    Enums: Record<string, any>
    CompositeTypes: Record<string, any>
  }
}
