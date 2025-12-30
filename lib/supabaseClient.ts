import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createMissingEnvError() {
  return new Error(
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.'
  )
}

function createStubSupabaseClient(): ReturnType<typeof createClient> {
  const error = createMissingEnvError()
  const subscription = { unsubscribe: () => undefined }

  const auth = {
    getUser: async () => ({ data: { user: null }, error }),
    getSession: async () => ({ data: { session: null }, error }),
    onAuthStateChange: () => ({ data: { subscription }, error }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error }),
    signUp: async () => ({ data: { user: null, session: null }, error }),
    signOut: async () => ({ error }),
  }

  const queryResult = async () => ({ data: null, error })

  const createQueryBuilder = () => {
    const builder: any = {
      select: async () => queryResult(),
      insert: async () => queryResult(),
      update: async () => queryResult(),
      upsert: async () => queryResult(),
      delete: async () => queryResult(),
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => builder,
      single: async () => queryResult(),
      maybeSingle: async () => queryResult(),
    }
    return builder
  }

  const from = () => createQueryBuilder()

  return { auth, from } as unknown as ReturnType<typeof createClient>
}

// Always export a usable object:
// - real client when configured
// - stub client when env vars are missing (prevents TypeErrors in client components)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createStubSupabaseClient()
