#!/usr/bin/env node
/**
 * Org Membership Bootstrapper (Assessment-sourced)
 *
 * Maps a studio admin user into the organization derived from the existing
 * assessment's patient membership. Uses a single deterministic query for org id.
 */

const { Client } = require('pg')
const dotenv = require('dotenv')

dotenv.config({ path: process.env.DOTENV_PATH || '.env.local' })

const DATABASE_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
const STUDIO_ADMIN_USER_ID = process.env.STUDIO_ADMIN_USER_ID
const STUDIO_ADMIN_EMAIL = process.env.STUDIO_ADMIN_EMAIL
const STUDIO_ME_URL = process.env.STUDIO_ME_URL
const STUDIO_COOKIE = process.env.STUDIO_COOKIE
const STUDIO_BEARER_TOKEN = process.env.STUDIO_BEARER_TOKEN

const SEED_ADMIN_USER_ID = process.env.SEED_ADMIN_USER_ID

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
}

async function resolveStudioUserId(client) {
  if (STUDIO_ADMIN_EMAIL) {
    const result = await client.query(
      'select id from auth.users where email = $1',
      [STUDIO_ADMIN_EMAIL],
    )

    if (result.rows.length !== 1) {
      throw new Error(`User lookup by email failed: ${STUDIO_ADMIN_EMAIL}`)
    }

    console.log('[seed-org-membership-from-assessment] Resolved user id by email')
    return result.rows[0].id
  }

  if (STUDIO_ME_URL) {
    const headers = {}

    if (STUDIO_COOKIE) {
      headers.cookie = STUDIO_COOKIE
    }

    if (STUDIO_BEARER_TOKEN) {
      headers.authorization = `Bearer ${STUDIO_BEARER_TOKEN}`
    }

    const response = await fetch(STUDIO_ME_URL, { headers })
    if (!response.ok) {
      throw new Error(`Studio /api/me lookup failed: ${response.status}`)
    }

    const payload = await response.json()
    if (!payload?.userId) {
      throw new Error('Studio /api/me response missing userId')
    }

    console.log('[seed-org-membership-from-assessment] Resolved user id via /api/me')
    return payload.userId
  }

  if (STUDIO_ADMIN_USER_ID) {
    return STUDIO_ADMIN_USER_ID
  }

  if (SEED_ADMIN_USER_ID) {
    console.log('[seed-org-membership-from-assessment] Using seed admin user id')
    return SEED_ADMIN_USER_ID
  }

  throw new Error('No studio user identifier provided')
}

async function main() {
  requireEnv(DATABASE_URL, 'SUPABASE_DB_URL or DATABASE_URL')

  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    await client.query('begin')

    const orgQuery = `
      select distinct uom.organization_id
      from assessments a
      join patient_profiles pp on pp.id = a.patient_id
      join user_org_membership uom on uom.user_id = pp.user_id
      limit 1;
    `

    const studioUserId = await resolveStudioUserId(client)

    const orgResult = await client.query(orgQuery)
    const orgId = orgResult.rows[0]?.organization_id

    if (!orgId) {
      throw new Error('No organization_id found for the existing assessment')
    }

    const upsertQuery = `
      insert into user_org_membership (user_id, organization_id, role, is_active)
      values ($1, $2, 'admin', true)
      on conflict (user_id, organization_id)
      do update set role = 'admin', is_active = true;
    `

    await client.query(upsertQuery, [studioUserId, orgId])
    await client.query('commit')

    console.log('[seed-org-membership-from-assessment] Upserted membership', {
      studioUserId,
      organizationId: orgId,
    })
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('[seed-org-membership-from-assessment] Failed:', error.message)
  process.exit(1)
})
