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
const STUDIO_ADMIN_EMAIL = process.env.STUDIO_ADMIN_EMAIL
const STUDIO_ADMIN_USER_ID = process.env.STUDIO_ADMIN_USER_ID

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
}

async function resolveStudioUser(client) {
  if (STUDIO_ADMIN_EMAIL) {
    const result = await client.query(
      'select id, email from auth.users where email = $1',
      [STUDIO_ADMIN_EMAIL],
    )

    if (result.rows.length !== 1) {
      throw new Error(`User lookup by email failed: ${STUDIO_ADMIN_EMAIL}`)
    }

    return {
      userId: result.rows[0].id,
      email: result.rows[0].email || STUDIO_ADMIN_EMAIL,
    }
  }

  if (STUDIO_ADMIN_USER_ID) {
    const result = await client.query(
      'select id, email from auth.users where id = $1',
      [STUDIO_ADMIN_USER_ID],
    )

    if (result.rows.length !== 1) {
      throw new Error(`User lookup by id failed: ${STUDIO_ADMIN_USER_ID}`)
    }

    return {
      userId: result.rows[0].id,
      email: result.rows[0].email || null,
    }
  }

  throw new Error('Missing required env: STUDIO_ADMIN_EMAIL or STUDIO_ADMIN_USER_ID')
}

async function main() {
  requireEnv(DATABASE_URL, 'SUPABASE_DB_URL or DATABASE_URL')
  if (!STUDIO_ADMIN_EMAIL && !STUDIO_ADMIN_USER_ID) {
    throw new Error('Missing required env: STUDIO_ADMIN_EMAIL or STUDIO_ADMIN_USER_ID')
  }

  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    await client.query('begin')

    const { userId: studioUserId, email: resolvedEmail } = await resolveStudioUser(client)

    const orgAndPatientQuery = `
      select distinct
        uom.organization_id
      from assessments a
      join patient_profiles pp on pp.id = a.patient_id
      join user_org_membership uom on uom.user_id = pp.user_id;
    `

    const orgResult = await client.query(orgAndPatientQuery)
    if (orgResult.rows.length !== 1) {
      throw new Error('Organization lookup from assessment must return exactly one row')
    }

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

    const upsertResult = await client.query(upsertQuery, [studioUserId, orgId])
    await client.query('commit')

    console.log('[seed-org-membership-from-assessment] Upserted membership', {
      resolvedUserId: studioUserId,
      resolvedEmail,
      organizationId: orgId,
      rowcount: upsertResult.rowCount,
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
