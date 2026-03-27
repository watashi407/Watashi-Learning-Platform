import { createClient } from '@supabase/supabase-js'
import { assertRuntimeEnv, getRequiredServerEnv } from '../backend/env'

export function createServiceSupabaseClient() {
  assertRuntimeEnv('supabase-service')

  return createClient(
    getRequiredServerEnv('VITE_SUPABASE_URL'),
    getRequiredServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

export function createServerSupabaseAuthClient() {
  assertRuntimeEnv('supabase-auth')

  return createClient(
    getRequiredServerEnv('VITE_SUPABASE_URL'),
    getRequiredServerEnv('VITE_SUPABASE_ANON_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
