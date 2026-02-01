#!/usr/bin/env node

/**
 * E74.2 Canonical v1 Migration Verification Script
 * 
 * Purpose: Verify that all 4 funnel datasets have been successfully migrated to canonical v1
 * 
 * Validation Rules:
 * - R-E74.2-001: All funnel_versions must have schema_version 'v1' in questionnaire_config
 * - R-E74.2-002: All funnel_versions must have schema_version 'v1' in content_manifest
 * - R-E74.2-003: All funnels_catalog entries must have unique slugs
 * - R-E74.2-004: All funnels must have valid pillar mappings
 * - R-E74.2-005: Exactly 2 A/B funnels must be published (stress-assessment, sleep-quality)
 * - R-E74.2-006: Exactly 2 archived funnels must be unpublished (cardiovascular-age, heart-health-nutrition)
 * - R-E74.2-007: All published funnels must be active (is_active=true)
 * - R-E74.2-008: All published funnels must have default_version_id set
 * 
 * Exit Codes:
 * - 0: All checks passed
 * - 1: One or more validation failures
 * - 2: Script error (config, database connection, etc.)
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(2)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Expected configuration for E74.2
const AB_FUNNELS = ['stress-assessment', 'sleep-quality']
const ARCHIVED_FUNNELS = ['cardiovascular-age', 'heart-health-nutrition']
const ALL_FUNNELS = [...AB_FUNNELS, ...ARCHIVED_FUNNELS]

// Error code to rule ID mapping
const ERROR_CODE_TO_RULE_ID = {
  MISSING_SCHEMA_VERSION_QC: 'R-E74.2-001',
  INVALID_SCHEMA_VERSION_QC: 'R-E74.2-001',
  MISSING_SCHEMA_VERSION_CM: 'R-E74.2-002',
  INVALID_SCHEMA_VERSION_CM: 'R-E74.2-002',
  DUPLICATE_SLUG: 'R-E74.2-003',
  INVALID_PILLAR_MAPPING: 'R-E74.2-004',
  INCORRECT_AB_COUNT: 'R-E74.2-005',
  INCORRECT_AB_PUBLISHED: 'R-E74.2-005',
  INCORRECT_ARCHIVED_COUNT: 'R-E74.2-006',
  INCORRECT_ARCHIVED_PUBLISHED: 'R-E74.2-006',
  PUBLISHED_NOT_ACTIVE: 'R-E74.2-007',
  PUBLISHED_NO_DEFAULT_VERSION: 'R-E74.2-008',
}

// ============================================================================
// Validation Functions
// ============================================================================

async function checkSchemaVersions() {
  console.log('\n🔍 Checking schema_version in funnel_versions...')
  
  const { data: versions, error } = await supabase
    .from('funnel_versions')
    .select('id, funnel_id, version, questionnaire_config, content_manifest')
  
  if (error) {
    console.error('❌ Database error:', error.message)
    return { passed: false, errors: [] }
  }
  
  const errors = []
  
  for (const v of versions) {
    // Check questionnaire_config
    if (!v.questionnaire_config?.schema_version) {
      errors.push({
        code: 'MISSING_SCHEMA_VERSION_QC',
        message: `Funnel version ${v.version} (${v.id}) missing schema_version in questionnaire_config`,
        details: { funnel_version_id: v.id, version: v.version }
      })
    } else if (v.questionnaire_config.schema_version !== 'v1') {
      errors.push({
        code: 'INVALID_SCHEMA_VERSION_QC',
        message: `Funnel version ${v.version} (${v.id}) has invalid schema_version in questionnaire_config: "${v.questionnaire_config.schema_version}"`,
        details: { funnel_version_id: v.id, version: v.version, found: v.questionnaire_config.schema_version }
      })
    }
    
    // Check content_manifest
    if (!v.content_manifest?.schema_version) {
      errors.push({
        code: 'MISSING_SCHEMA_VERSION_CM',
        message: `Funnel version ${v.version} (${v.id}) missing schema_version in content_manifest`,
        details: { funnel_version_id: v.id, version: v.version }
      })
    } else if (v.content_manifest.schema_version !== 'v1') {
      errors.push({
        code: 'INVALID_SCHEMA_VERSION_CM',
        message: `Funnel version ${v.version} (${v.id}) has invalid schema_version in content_manifest: "${v.content_manifest.schema_version}"`,
        details: { funnel_version_id: v.id, version: v.version, found: v.content_manifest.schema_version }
      })
    }
  }
  
  return { 
    passed: errors.length === 0, 
    errors,
    count: versions.length
  }
}

async function checkSlugUniqueness() {
  console.log('\n🔍 Checking slug uniqueness...')
  
  const { data: funnels, error } = await supabase
    .from('funnels_catalog')
    .select('slug')
  
  if (error) {
    console.error('❌ Database error:', error.message)
    return { passed: false, errors: [] }
  }
  
  const slugCounts = {}
  const errors = []
  
  for (const f of funnels) {
    slugCounts[f.slug] = (slugCounts[f.slug] || 0) + 1
  }
  
  for (const [slug, count] of Object.entries(slugCounts)) {
    if (count > 1) {
      errors.push({
        code: 'DUPLICATE_SLUG',
        message: `Duplicate slug found: "${slug}" (appears ${count} times)`,
        details: { slug, count }
      })
    }
  }
  
  return { 
    passed: errors.length === 0, 
    errors,
    count: funnels.length
  }
}

async function checkPillarMappings() {
  console.log('\n🔍 Checking pillar mappings...')
  
  const { data: funnels, error: funnelError } = await supabase
    .from('funnels_catalog')
    .select('id, slug, pillar_id')
    .not('pillar_id', 'is', null)
  
  if (funnelError) {
    console.error('❌ Database error:', funnelError.message)
    return { passed: false, errors: [] }
  }
  
  const { data: pillars, error: pillarError } = await supabase
    .from('pillars')
    .select('key')
  
  if (pillarError) {
    console.error('❌ Database error:', pillarError.message)
    return { passed: false, errors: [] }
  }
  
  const validPillarKeys = new Set(pillars.map(p => p.key))
  const errors = []
  
  for (const f of funnels) {
    if (!validPillarKeys.has(f.pillar_id)) {
      errors.push({
        code: 'INVALID_PILLAR_MAPPING',
        message: `Funnel "${f.slug}" has invalid pillar_id: "${f.pillar_id}"`,
        details: { funnel_slug: f.slug, pillar_id: f.pillar_id }
      })
    }
  }
  
  return { 
    passed: errors.length === 0, 
    errors,
    count: funnels.length
  }
}

async function checkABDefaults() {
  console.log('\n🔍 Checking A/B defaults (published funnels)...')
  
  const { data: funnels, error } = await supabase
    .from('funnels_catalog')
    .select('slug, published, is_active, default_version_id')
    .in('slug', ALL_FUNNELS)
  
  if (error) {
    console.error('❌ Database error:', error.message)
    return { passed: false, errors: [] }
  }
  
  const errors = []
  const publishedFunnels = funnels.filter(f => f.published === true)
  const abFunnelsInDb = funnels.filter(f => AB_FUNNELS.includes(f.slug))
  
  // Check count of published funnels
  if (publishedFunnels.length !== 2) {
    errors.push({
      code: 'INCORRECT_AB_COUNT',
      message: `Expected exactly 2 published funnels, found ${publishedFunnels.length}`,
      details: { 
        expected: 2, 
        found: publishedFunnels.length,
        published_slugs: publishedFunnels.map(f => f.slug)
      }
    })
  }
  
  // Check that A/B funnels are published
  for (const slug of AB_FUNNELS) {
    const funnel = funnels.find(f => f.slug === slug)
    if (!funnel) {
      errors.push({
        code: 'INCORRECT_AB_PUBLISHED',
        message: `A/B funnel "${slug}" not found in database`,
        details: { expected_slug: slug }
      })
    } else if (!funnel.published) {
      errors.push({
        code: 'INCORRECT_AB_PUBLISHED',
        message: `A/B funnel "${slug}" is not published (expected published=true)`,
        details: { funnel_slug: slug, published: funnel.published }
      })
    }
    
    // Check is_active for published funnels
    if (funnel && funnel.published && !funnel.is_active) {
      errors.push({
        code: 'PUBLISHED_NOT_ACTIVE',
        message: `Published funnel "${slug}" is not active (expected is_active=true)`,
        details: { funnel_slug: slug, is_active: funnel.is_active }
      })
    }
    
    // Check default_version_id for published funnels
    if (funnel && funnel.published && !funnel.default_version_id) {
      errors.push({
        code: 'PUBLISHED_NO_DEFAULT_VERSION',
        message: `Published funnel "${slug}" has no default_version_id`,
        details: { funnel_slug: slug }
      })
    }
  }
  
  return { 
    passed: errors.length === 0, 
    errors,
    count: abFunnelsInDb.length
  }
}

async function checkArchivedFunnels() {
  console.log('\n🔍 Checking archived funnels (unpublished)...')
  
  const { data: funnels, error } = await supabase
    .from('funnels_catalog')
    .select('slug, published')
    .in('slug', ALL_FUNNELS)
  
  if (error) {
    console.error('❌ Database error:', error.message)
    return { passed: false, errors: [] }
  }
  
  const errors = []
  const archivedFunnelsInDb = funnels.filter(f => ARCHIVED_FUNNELS.includes(f.slug))
  
  // Check count
  if (archivedFunnelsInDb.length !== 2) {
    errors.push({
      code: 'INCORRECT_ARCHIVED_COUNT',
      message: `Expected exactly 2 archived funnels in database, found ${archivedFunnelsInDb.length}`,
      details: { 
        expected: 2, 
        found: archivedFunnelsInDb.length,
        archived_slugs: archivedFunnelsInDb.map(f => f.slug)
      }
    })
  }
  
  // Check that archived funnels are NOT published
  for (const slug of ARCHIVED_FUNNELS) {
    const funnel = funnels.find(f => f.slug === slug)
    if (!funnel) {
      errors.push({
        code: 'INCORRECT_ARCHIVED_PUBLISHED',
        message: `Archived funnel "${slug}" not found in database`,
        details: { expected_slug: slug }
      })
    } else if (funnel.published) {
      errors.push({
        code: 'INCORRECT_ARCHIVED_PUBLISHED',
        message: `Archived funnel "${slug}" is published (expected published=false)`,
        details: { funnel_slug: slug, published: funnel.published }
      })
    }
  }
  
  return { 
    passed: errors.length === 0, 
    errors,
    count: archivedFunnelsInDb.length
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('========================================')
  console.log('E74.2 Canonical v1 Migration Verification')
  console.log('========================================')
  
  const results = {
    schemaVersions: await checkSchemaVersions(),
    slugUniqueness: await checkSlugUniqueness(),
    pillarMappings: await checkPillarMappings(),
    abDefaults: await checkABDefaults(),
    archivedFunnels: await checkArchivedFunnels(),
  }
  
  // Collect all errors
  const allErrors = [
    ...results.schemaVersions.errors,
    ...results.slugUniqueness.errors,
    ...results.pillarMappings.errors,
    ...results.abDefaults.errors,
    ...results.archivedFunnels.errors,
  ]
  
  // Print errors with rule violations
  if (allErrors.length > 0) {
    console.log('\n❌ Validation Failures:\n')
    for (const error of allErrors) {
      const ruleId = ERROR_CODE_TO_RULE_ID[error.code] || 'UNKNOWN'
      console.log(`[${error.code}] violates ${ruleId}: ${error.message}`)
      if (error.details) {
        console.log(`  Details: ${JSON.stringify(error.details)}`)
      }
    }
  }
  
  // Print summary
  console.log('\n========================================')
  console.log('Verification Summary')
  console.log('========================================')
  console.log(`Schema Versions:     ${results.schemaVersions.passed ? '✅' : '❌'} (${results.schemaVersions.count} versions checked)`)
  console.log(`Slug Uniqueness:     ${results.slugUniqueness.passed ? '✅' : '❌'} (${results.slugUniqueness.count} funnels checked)`)
  console.log(`Pillar Mappings:     ${results.pillarMappings.passed ? '✅' : '❌'} (${results.pillarMappings.count} funnels checked)`)
  console.log(`A/B Defaults:        ${results.abDefaults.passed ? '✅' : '❌'} (${results.abDefaults.count} A/B funnels checked)`)
  console.log(`Archived Funnels:    ${results.archivedFunnels.passed ? '✅' : '❌'} (${results.archivedFunnels.count} archived funnels checked)`)
  console.log('========================================')
  console.log(`Total Errors:        ${allErrors.length}`)
  console.log('========================================')
  
  if (allErrors.length === 0) {
    console.log('\n✅ All E74.2 validation checks passed!')
    console.log('\n📋 Migration Status:')
    console.log('   • 4 funnels migrated to canonical v1')
    console.log('   • 2 A/B funnels published (stress-assessment, sleep-quality)')
    console.log('   • 2 archived funnels unpublished (cardiovascular-age, heart-health-nutrition)')
    process.exit(0)
  } else {
    console.log(`\n❌ ${allErrors.length} validation error(s) found.`)
    console.log('   Please fix the issues and re-run this script.')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ Script error:', error)
  process.exit(2)
})
