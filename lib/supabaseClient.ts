/**
 * Legacy Supabase Public Client Helper
 * 
 * This file is maintained for backward compatibility.
 * New code should import directly from @/lib/db/supabase.public
 * 
 * @deprecated Use @/lib/db/supabase.public instead
 */

// Re-export canonical public client
export { supabasePublic as supabase, createPublicClient } from '@/lib/db/supabase.public'
