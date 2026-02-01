#!/usr/bin/env node

/**
 * E74.2 Logic Simulation Test
 * 
 * This script simulates the migration and verification logic
 * without requiring a database connection. It verifies:
 * - Migration logic is correct
 * - Verification checks work as expected
 * - Error detection is accurate
 */

console.log('========================================')
console.log('E74.2 Logic Simulation Test')
console.log('========================================\n')

// Simulate database state BEFORE migration
const beforeMigration = {
  funnel_versions: [
    {
      id: '1',
      funnel_id: 'stress-id',
      version: '1.0.0',
      questionnaire_config: { version: '1.0', steps: [] }, // Missing schema_version
      content_manifest: { version: '1.0', pages: [] }, // Missing schema_version
    },
    {
      id: '2',
      funnel_id: 'sleep-id',
      version: '1.0.0',
      questionnaire_config: { version: '1.0', steps: [] },
      content_manifest: { version: '1.0', pages: [] },
    },
    {
      id: '3',
      funnel_id: 'cardio-id',
      version: '1.0.0',
      questionnaire_config: { version: '1.0', steps: [] },
      content_manifest: { version: '1.0', pages: [] },
    },
    {
      id: '4',
      funnel_id: 'nutrition-id',
      version: '1.0.0',
      questionnaire_config: { version: '1.0', steps: [] },
      content_manifest: { version: '1.0', pages: [] },
    },
  ],
  funnels_catalog: [
    {
      id: 'stress-id',
      slug: 'stress-assessment',
      pillar_id: 'mental-health',
      is_active: true,
      published: false, // Before migration
      default_version_id: '1',
    },
    {
      id: 'sleep-id',
      slug: 'sleep-quality',
      pillar_id: 'sleep',
      is_active: true,
      published: false, // Before migration
      default_version_id: '2',
    },
    {
      id: 'cardio-id',
      slug: 'cardiovascular-age',
      pillar_id: 'prevention',
      is_active: true,
      published: false,
      default_version_id: '3',
    },
    {
      id: 'nutrition-id',
      slug: 'heart-health-nutrition',
      pillar_id: 'nutrition',
      is_active: true,
      published: false,
      default_version_id: '4',
    },
  ],
  pillars: [
    { key: 'mental-health', title: 'Mental Health' },
    { key: 'sleep', title: 'Sleep' },
    { key: 'prevention', title: 'Prevention' },
    { key: 'nutrition', title: 'Nutrition' },
  ],
}

// Simulate migration logic
function simulateMigration(state) {
  console.log('🔧 Simulating E74.2 migration...\n')

  const migrated = JSON.parse(JSON.stringify(state)) // Deep clone

  // Step 1: Add schema_version to all funnel_versions
  for (const version of migrated.funnel_versions) {
    if (!version.questionnaire_config.schema_version) {
      version.questionnaire_config.schema_version = 'v1'
    }
    if (!version.content_manifest.schema_version) {
      version.content_manifest.schema_version = 'v1'
    }
  }

  // Step 2: Set published=true for A/B funnels
  const AB_FUNNELS = ['stress-assessment', 'sleep-quality']
  for (const funnel of migrated.funnels_catalog) {
    if (AB_FUNNELS.includes(funnel.slug)) {
      funnel.published = true
    }
  }

  // Step 3: Set published=false for archived funnels (already false, but explicit)
  const ARCHIVED_FUNNELS = ['cardiovascular-age', 'heart-health-nutrition']
  for (const funnel of migrated.funnels_catalog) {
    if (ARCHIVED_FUNNELS.includes(funnel.slug)) {
      funnel.published = false
    }
  }

  console.log('✅ Migration simulation complete\n')
  return migrated
}

// Simulate verification checks
function simulateVerification(state) {
  console.log('🔍 Simulating E74.2 verification checks...\n')

  const errors = []

  // Check 1: Schema versions
  for (const version of state.funnel_versions) {
    if (!version.questionnaire_config.schema_version) {
      errors.push({
        code: 'MISSING_SCHEMA_VERSION_QC',
        rule: 'R-E74.2-001',
        message: `Version ${version.version} missing schema_version in questionnaire_config`,
      })
    } else if (version.questionnaire_config.schema_version !== 'v1') {
      errors.push({
        code: 'INVALID_SCHEMA_VERSION_QC',
        rule: 'R-E74.2-001',
        message: `Version ${version.version} has invalid schema_version: ${version.questionnaire_config.schema_version}`,
      })
    }

    if (!version.content_manifest.schema_version) {
      errors.push({
        code: 'MISSING_SCHEMA_VERSION_CM',
        rule: 'R-E74.2-002',
        message: `Version ${version.version} missing schema_version in content_manifest`,
      })
    } else if (version.content_manifest.schema_version !== 'v1') {
      errors.push({
        code: 'INVALID_SCHEMA_VERSION_CM',
        rule: 'R-E74.2-002',
        message: `Version ${version.version} has invalid schema_version: ${version.content_manifest.schema_version}`,
      })
    }
  }

  // Check 2: Slug uniqueness
  const slugCounts = {}
  for (const funnel of state.funnels_catalog) {
    slugCounts[funnel.slug] = (slugCounts[funnel.slug] || 0) + 1
  }
  for (const [slug, count] of Object.entries(slugCounts)) {
    if (count > 1) {
      errors.push({
        code: 'DUPLICATE_SLUG',
        rule: 'R-E74.2-003',
        message: `Duplicate slug: ${slug} (appears ${count} times)`,
      })
    }
  }

  // Check 3: Pillar mappings
  const validPillarKeys = new Set(state.pillars.map((p) => p.key))
  for (const funnel of state.funnels_catalog) {
    if (funnel.pillar_id && !validPillarKeys.has(funnel.pillar_id)) {
      errors.push({
        code: 'INVALID_PILLAR_MAPPING',
        rule: 'R-E74.2-004',
        message: `Funnel ${funnel.slug} has invalid pillar_id: ${funnel.pillar_id}`,
      })
    }
  }

  // Check 4: A/B defaults
  const AB_FUNNELS = ['stress-assessment', 'sleep-quality']
  const publishedFunnels = state.funnels_catalog.filter((f) => f.published === true)

  if (publishedFunnels.length !== 2) {
    errors.push({
      code: 'INCORRECT_AB_COUNT',
      rule: 'R-E74.2-005',
      message: `Expected 2 published funnels, found ${publishedFunnels.length}`,
    })
  }

  for (const slug of AB_FUNNELS) {
    const funnel = state.funnels_catalog.find((f) => f.slug === slug)
    if (!funnel) {
      errors.push({
        code: 'INCORRECT_AB_PUBLISHED',
        rule: 'R-E74.2-005',
        message: `A/B funnel ${slug} not found`,
      })
    } else if (!funnel.published) {
      errors.push({
        code: 'INCORRECT_AB_PUBLISHED',
        rule: 'R-E74.2-005',
        message: `A/B funnel ${slug} is not published`,
      })
    } else {
      // Check is_active
      if (!funnel.is_active) {
        errors.push({
          code: 'PUBLISHED_NOT_ACTIVE',
          rule: 'R-E74.2-007',
          message: `Published funnel ${slug} is not active`,
        })
      }
      // Check default_version_id
      if (!funnel.default_version_id) {
        errors.push({
          code: 'PUBLISHED_NO_DEFAULT_VERSION',
          rule: 'R-E74.2-008',
          message: `Published funnel ${slug} has no default_version_id`,
        })
      }
    }
  }

  // Check 5: Archived funnels
  const ARCHIVED_FUNNELS = ['cardiovascular-age', 'heart-health-nutrition']
  for (const slug of ARCHIVED_FUNNELS) {
    const funnel = state.funnels_catalog.find((f) => f.slug === slug)
    if (!funnel) {
      errors.push({
        code: 'INCORRECT_ARCHIVED_PUBLISHED',
        rule: 'R-E74.2-006',
        message: `Archived funnel ${slug} not found`,
      })
    } else if (funnel.published) {
      errors.push({
        code: 'INCORRECT_ARCHIVED_PUBLISHED',
        rule: 'R-E74.2-006',
        message: `Archived funnel ${slug} is published (expected false)`,
      })
    }
  }

  return errors
}

// Run simulation
const afterMigration = simulateMigration(beforeMigration)
const errors = simulateVerification(afterMigration)

// Print results
console.log('========================================')
console.log('Verification Results')
console.log('========================================\n')

if (errors.length === 0) {
  console.log('✅ All checks passed!\n')

  console.log('Migration Summary:')
  console.log(
    `  • Schema versions added: ${afterMigration.funnel_versions.filter((v) => v.questionnaire_config.schema_version === 'v1').length}/${afterMigration.funnel_versions.length}`
  )
  console.log(
    `  • A/B funnels published: ${afterMigration.funnels_catalog.filter((f) => f.published === true).length}`
  )
  console.log(
    `  • Archived funnels: ${afterMigration.funnels_catalog.filter((f) => f.published === false).length}`
  )

  console.log('\nA/B Funnels (published=true):')
  afterMigration.funnels_catalog
    .filter((f) => f.published === true)
    .forEach((f) => console.log(`  - ${f.slug}`))

  console.log('\nArchived Funnels (published=false):')
  afterMigration.funnels_catalog
    .filter((f) => f.published === false)
    .forEach((f) => console.log(`  - ${f.slug}`))

  console.log('\n✅ E74.2 logic simulation PASSED')
  process.exit(0)
} else {
  console.log(`❌ ${errors.length} error(s) found:\n`)

  for (const error of errors) {
    console.log(`[${error.code}] violates ${error.rule}: ${error.message}`)
  }

  console.log('\n❌ E74.2 logic simulation FAILED')
  process.exit(1)
}
