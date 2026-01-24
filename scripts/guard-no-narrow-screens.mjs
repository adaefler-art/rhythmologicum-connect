#!/usr/bin/env node

/**
 * E71.F4 Guardrail - "Narrow Box" Prevention
 *
 * Prevents "narrow box" regression in Screen Gallery and similar dev/gallery contexts.
 * 
 * Checks:
 * 1. Screen Gallery components must use DeviceFrame or FullBleed
 * 2. Gallery wrappers must not apply container/prose/max-w-* without max-w-none
 * 3. Screen components rendered in galleries must not be constrained
 * 
 * Rationale:
 * - Parent layouts (e.g., PatientLayoutClient with max-w-6xl) can leak constraints
 * - Screen compositions must always render at full mobile width (390px in DeviceFrame)
 * - FullBleed wrapper neutralizes parent constraints
 * 
 * Usage:
 *   npm run verify:narrow-box
 *   or hook into npm run verify
 */

import { readFileSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// Target files to check
const SCREEN_GALLERY_FILE = join(
  ROOT,
  'apps',
  'rhythm-patient-ui',
  'app',
  'patient',
  '(mobile)',
  'dev',
  'components',
  'ScreenGallery.tsx',
)

const COMPONENT_GALLERY_FILE = join(
  ROOT,
  'apps',
  'rhythm-patient-ui',
  'app',
  'patient',
  '(mobile)',
  'dev',
  'components',
  'ComponentGallery.tsx',
)

const DEV_COMPONENTS_PAGE = join(
  ROOT,
  'apps',
  'rhythm-patient-ui',
  'app',
  'patient',
  '(mobile)',
  'dev',
  'components',
  'page.tsx',
)

const FULLBLEED_FILE = join(
  ROOT,
  'apps',
  'rhythm-patient-ui',
  'app',
  'patient',
  '(mobile)',
  'dev',
  'components',
  'FullBleed.tsx',
)

const DEVICEFRAME_FILE = join(
  ROOT,
  'apps',
  'rhythm-patient-ui',
  'app',
  'patient',
  '(mobile)',
  'dev',
  'components',
  'DeviceFrame.tsx',
)

const failures = []

function recordFailure(message) {
  failures.push(message)
}

/**
 * Check that FullBleed component exists and has correct implementation
 */
function checkFullBleedExists() {
  if (!existsSync(FULLBLEED_FILE)) {
    recordFailure(
      `E71.F4: FullBleed component missing at ${relative(ROOT, FULLBLEED_FILE)}. ` +
        'This component neutralizes parent layout constraints.',
    )
    return false
  }

  const content = readFileSync(FULLBLEED_FILE, 'utf8')
  
  // Check for required classes
  if (!content.includes('w-full') || !content.includes('max-w-none')) {
    recordFailure(
      `E71.F4: FullBleed component at ${relative(ROOT, FULLBLEED_FILE)} must include ` +
        '"w-full max-w-none" classes to neutralize parent constraints.',
    )
    return false
  }

  return true
}

/**
 * Check that DeviceFrame component exists and uses FullBleed
 */
function checkDeviceFrameExists() {
  if (!existsSync(DEVICEFRAME_FILE)) {
    recordFailure(
      `E71.F4: DeviceFrame component missing at ${relative(ROOT, DEVICEFRAME_FILE)}. ` +
        'This component provides phone-width rendering (390px).',
    )
    return false
  }

  const content = readFileSync(DEVICEFRAME_FILE, 'utf8')
  
  // Check for FullBleed usage
  if (!content.includes('FullBleed')) {
    recordFailure(
      `E71.F4: DeviceFrame component at ${relative(ROOT, DEVICEFRAME_FILE)} must use ` +
        'FullBleed to prevent constraint leakage.',
    )
  }

  // Check for phone width
  if (!content.includes('w-[390px]')) {
    recordFailure(
      `E71.F4: DeviceFrame component at ${relative(ROOT, DEVICEFRAME_FILE)} must set ` +
        'w-[390px] for standard mobile width.',
    )
  }

  return true
}

/**
 * Check that ScreenGallery uses DeviceFrame
 */
function checkScreenGalleryUsesDeviceFrame() {
  if (!existsSync(SCREEN_GALLERY_FILE)) {
    // If file doesn't exist, skip check (may have been refactored)
    return
  }

  const content = readFileSync(SCREEN_GALLERY_FILE, 'utf8')
  
  // Check for DeviceFrame import
  if (!content.includes('DeviceFrame')) {
    recordFailure(
      `E71.F4: ScreenGallery at ${relative(ROOT, SCREEN_GALLERY_FILE)} must use DeviceFrame ` +
        'to render screens at proper mobile width.',
    )
  }
}

/**
 * Check that gallery page doesn't apply narrow constraints
 */
function checkGalleryPageNoNarrowConstraints() {
  if (!existsSync(DEV_COMPONENTS_PAGE)) {
    return
  }

  const content = readFileSync(DEV_COMPONENTS_PAGE, 'utf8')
  const lines = content.split(/\r?\n/)
  
  const violations = []
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const trimmed = line.trim()
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      return
    }
    
    // Check for container class without max-w-none
    if (trimmed.includes('className') && trimmed.includes('container')) {
      // Check if same line has max-w-none
      if (!trimmed.includes('max-w-none')) {
        violations.push(`${relative(ROOT, DEV_COMPONENTS_PAGE)}:${lineNumber} → ${trimmed}`)
      }
    }
    
    // Check for prose class
    if (trimmed.includes('className') && trimmed.includes('prose')) {
      violations.push(`${relative(ROOT, DEV_COMPONENTS_PAGE)}:${lineNumber} → ${trimmed}`)
    }
    
    // Check for max-w- classes (except max-w-none, max-w-full)
    const maxWMatch = trimmed.match(/max-w-(?!none|full)/)
    if (maxWMatch && trimmed.includes('className')) {
      // Allow max-w-* in specific contexts (e.g., buttons)
      if (!trimmed.includes('button') && !trimmed.includes('Button')) {
        violations.push(`${relative(ROOT, DEV_COMPONENTS_PAGE)}:${lineNumber} → ${trimmed}`)
      }
    }
  })
  
  if (violations.length > 0) {
    recordFailure(
      [
        `E71.F4: Gallery page at ${relative(ROOT, DEV_COMPONENTS_PAGE)} has narrow constraints.`,
        'Remove container/prose/max-w-* or add max-w-none to prevent "narrow box" error.',
        ...violations.map((v) => `  - ${v}`),
      ].join('\n'),
    )
  }
}

/**
 * Scan for other gallery-like patterns that might need protection
 */
function checkForUnprotectedGalleries() {
  // This is a future-proofing check
  // Could scan for files matching *Gallery.tsx pattern
  // For now, we only check the known Screen/Component galleries
}

function run() {
  const fullBleedExists = checkFullBleedExists()
  const deviceFrameExists = checkDeviceFrameExists()
  
  // Only check usage if components exist
  if (fullBleedExists && deviceFrameExists) {
    checkScreenGalleryUsesDeviceFrame()
  }
  
  checkGalleryPageNoNarrowConstraints()
  checkForUnprotectedGalleries()

  if (failures.length > 0) {
    console.error('❌ E71.F4 (Narrow Box Prevention) verification failed:\n')
    failures.forEach((failure) => {
      console.error(failure)
      console.error('')
    })
    process.exit(1)
  }

  console.log('✅ E71.F4 (Narrow Box Prevention) verification passed.')
}

run()
