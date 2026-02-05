#!/usr/bin/env node
/**
 * Org Membership Bootstrapper
 *
 * Ensures a studio user (admin/clinician) and a patient user
 * are assigned to the same organization for RLS access.
 *
 * Idempotent: uses upsert on user_org_membership.
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: process.env.DOTENV_PATH || '.env.local' })

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ORG_ID = process.env.ORG_ID
const ORG_SLUG = process.env.ORG_SLUG || 'pilot-org'
const ORG_NAME = process.env.ORG_NAME || 'Pilot Organization'

const STUDIO_ROLE = process.env.STUDIO_ROLE || 'admin'
const STUDIO_ADMIN_USER_ID = process.env.STUDIO_ADMIN_USER_ID
const STUDIO_ADMIN_EMAIL = process.env.STUDIO_ADMIN_EMAIL

const PATIENT_USER_ID = process.env.SEED_PATIENT_USER_ID
const PATIENT_EMAIL = process.env.SEED_PATIENT_EMAIL
const PATIENT_PROFILE_ID = process.env.SEED_PATIENT_PROFILE_ID
const ASSESSMENT_ID = process.env.SEED_ASSESSMENT_ID

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
}

async function resolveUserIdByEmail(supabase, email) {
  const { data, error } = await supabase.auth.admin.getUserByEmail(email)
  if (error || !data?.user) {
    throw new Error(`User not found for email: ${email}`)
  }
  return data.user.id
}

async function resolvePatientUserId(supabase) {
  if (PATIENT_USER_ID) return PATIENT_USER_ID

  if (PATIENT_EMAIL) {
    return resolveUserIdByEmail(supabase, PATIENT_EMAIL)
  }

  if (PATIENT_PROFILE_ID) {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('user_id')
      .eq('id', PATIENT_PROFILE_ID)
      .single()

    if (error || !data?.user_id) {
      throw new Error(`Patient profile not found: ${PATIENT_PROFILE_ID}`)
    }

    return data.user_id
  }

  if (ASSESSMENT_ID) {
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('patient_id')
      .eq('id', ASSESSMENT_ID)
      .single()

    if (assessmentError || !assessment?.patient_id) {
      throw new Error(`Assessment not found: ${ASSESSMENT_ID}`)
    }

    const { data: profile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('user_id')
      .eq('id', assessment.patient_id)
      .single()

    if (profileError || !profile?.user_id) {
      throw new Error(`Patient profile not found for assessment: ${ASSESSMENT_ID}`)
    }

    return profile.user_id
  }

  throw new Error(
    'Missing patient identifiers. Provide SEED_PATIENT_USER_ID, SEED_PATIENT_EMAIL, SEED_PATIENT_PROFILE_ID, or SEED_ASSESSMENT_ID.',
  )
}

async function resolveStudioUserId(supabase) {
  if (STUDIO_ADMIN_USER_ID) return STUDIO_ADMIN_USER_ID
  if (STUDIO_ADMIN_EMAIL) return resolveUserIdByEmail(supabase, STUDIO_ADMIN_EMAIL)

  throw new Error(
    'Missing studio user identifiers. Provide STUDIO_ADMIN_USER_ID or STUDIO_ADMIN_EMAIL.',
  )
}

async function ensureOrganization(supabase) {
  if (ORG_ID) {
    const { data, error } = await supabase
      .from('organizations')
      .upsert(
        {
          id: ORG_ID,
          name: ORG_NAME,
          slug: ORG_SLUG,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('id')
      .single()

    if (error || !data?.id) {
      throw new Error(`Failed to upsert organization by id: ${error?.message}`)
    }

    return data.id
  }

  const { data: existing, error: fetchError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', ORG_SLUG)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to lookup organization by slug: ${fetchError.message}`)
  }

  if (existing?.id) return existing.id

  const { data: inserted, error: insertError } = await supabase
    .from('organizations')
    .insert({
      name: ORG_NAME,
      slug: ORG_SLUG,
      is_active: true,
    })
    .select('id')
    .single()

  if (insertError || !inserted?.id) {
    throw new Error(`Failed to create organization: ${insertError?.message}`)
  }

  return inserted.id
}

async function upsertMembership(supabase, payload) {
  const { error } = await supabase
    .from('user_org_membership')
    .upsert(payload, { onConflict: 'user_id,organization_id' })

  if (error) {
    throw new Error(`Failed to upsert org membership: ${error.message}`)
  }
}

async function main() {
  requireEnv(SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  requireEnv(SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const orgId = await ensureOrganization(supabase)
  const studioUserId = await resolveStudioUserId(supabase)
  const patientUserId = await resolvePatientUserId(supabase)

  await upsertMembership(supabase, {
    user_id: studioUserId,
    organization_id: orgId,
    role: STUDIO_ROLE,
    is_active: true,
    updated_at: new Date().toISOString(),
  })

  await upsertMembership(supabase, {
    user_id: patientUserId,
    organization_id: orgId,
    role: 'patient',
    is_active: true,
    updated_at: new Date().toISOString(),
  })

  console.log('Seeded org memberships', {
    organizationId: orgId,
    studioUserId,
    studioRole: STUDIO_ROLE,
    patientUserId,
  })
}

main().catch((error) => {
  console.error('[seed-org-membership] Failed:', error.message)
  process.exit(1)
})
