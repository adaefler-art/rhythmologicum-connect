/**
 * Legacy Supabase Server Client Helper
 * 
 * This file is maintained for backward compatibility.
 * New code should import directly from @/lib/db/supabase.server
 * 
 * @deprecated Use @/lib/db/supabase.server instead
 */

// Re-export canonical server client functions
export {
  createServerSupabaseClient as createClient,
  getCurrentUser,
  hasClinicianRole,
  hasAdminOrClinicianRole,
  getUserRole,
} from '@/lib/db/supabase.server'
