#!/usr/bin/env node

/**
 * E73.6 Legacy Ghosting Framework Verification
 * 
 * This script verifies that the legacy ghosting framework is properly enforced:
 * 1. R-LEGACY-001: No imports from legacy/** in production code
 * 2. R-LEGACY-002: Legacy API routes return 410 Gone (manual test)
 * 3. R-LEGACY-003: TypeScript excludes legacy/** from compilation
 * 
 * Usage:
 *   node scripts/verify-legacy-ghosting.mjs
 * 
 * Exit Codes:
 *   0 - All checks passed
 *   1 - One or more checks failed
 */

import { readFileSync, existsSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

// ============================================================================
// Check 1: Verify legacy directory structure exists
// ============================================================================

async function checkLegacyStructure() {
  logInfo('Check 1: Verifying legacy directory structure...')
  
  const requiredPaths = [
    'legacy',
    'legacy/README.md',
    'legacy/code',
    'legacy/routes',
    'legacy/routes/README.md',
    'legacy/db',
    'legacy/db/README.md',
  ]
  
  let allExist = true
  
  for (const p of requiredPaths) {
    const fullPath = path.join(repoRoot, p)
    if (!existsSync(fullPath)) {
      logError(`Missing required path: ${p}`)
      allExist = false
    }
  }
  
  if (allExist) {
    logSuccess('Legacy directory structure is complete')
    return true
  } else {
    logError('Legacy directory structure is incomplete')
    return false
  }
}

// ============================================================================
// Check 2: Verify ESLint blocks legacy imports
// ============================================================================

async function checkEslintConfig() {
  logInfo('Check 2: Verifying ESLint configuration blocks legacy imports...')
  
  const eslintConfigPath = path.join(repoRoot, 'eslint.config.mjs')
  
  if (!existsSync(eslintConfigPath)) {
    logError('eslint.config.mjs not found')
    return false
  }
  
  const eslintConfig = readFileSync(eslintConfigPath, 'utf-8')
  
  // Check for legacy import restriction
  const hasLegacyPattern = eslintConfig.includes('legacy/**') || eslintConfig.includes('@/legacy/**')
  
  if (!hasLegacyPattern) {
    logError('ESLint config does not include legacy/** import restriction')
    return false
  }
  
  // Check for global ignore
  const hasGlobalIgnore = eslintConfig.includes('globalIgnores') && eslintConfig.includes('"legacy/**"')
  
  if (!hasGlobalIgnore) {
    logWarning('ESLint config may not have globalIgnores for legacy/** (this is OK if using different pattern)')
  }
  
  logSuccess('ESLint configuration includes legacy import restrictions')
  return true
}

// ============================================================================
// Check 3: Verify TypeScript excludes legacy
// ============================================================================

async function checkTsConfig() {
  logInfo('Check 3: Verifying TypeScript configuration excludes legacy...')
  
  const tsconfigPath = path.join(repoRoot, 'tsconfig.json')
  
  if (!existsSync(tsconfigPath)) {
    logError('tsconfig.json not found')
    return false
  }
  
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
  
  const excludes = tsconfig.exclude || []
  const hasLegacyExclude = excludes.some(pattern => 
    pattern === 'legacy/**' || pattern === 'legacy' || pattern.includes('legacy')
  )
  
  if (!hasLegacyExclude) {
    logError('tsconfig.json does not exclude legacy/**')
    return false
  }
  
  logSuccess('TypeScript configuration excludes legacy directory')
  return true
}

// ============================================================================
// Check 4: Search for legacy imports in production code
// ============================================================================

async function checkForLegacyImports() {
  logInfo('Check 4: Searching for legacy imports in production code...')
  
  try {
    // Use ripgrep if available, fallback to grep
    let useRipgrep = false
    
    try {
      await execAsync('which rg')
      useRipgrep = true
    } catch {
      // Will use grep
    }
    
    let command
    if (useRipgrep) {
      command = 'rg --type ts --type tsx --ignore-case -e "legacy" apps/rhythm-studio-ui apps/rhythm-patient-ui lib packages | grep -E "(from|import)" || true'
    } else {
      command = 'grep -r -i --include="*.ts" --include="*.tsx" "legacy" apps/rhythm-studio-ui apps/rhythm-patient-ui lib packages | grep -E "(from|import)" || true'
    }
    
    const { stdout } = await execAsync(command, {
      cwd: repoRoot,
    })
    
    if (stdout.trim()) {
      logError('Found legacy imports in production code:')
      console.log(stdout)
      return false
    }
    
    logSuccess('No legacy imports found in production code')
    return true
  } catch (error) {
    logError(`Error searching for legacy imports: ${error.message}`)
    return false
  }
}

// ============================================================================
// Check 5: Verify apps/rhythm-legacy is documented as ghosted
// ============================================================================

async function checkLegacyAppStatus() {
  logInfo('Check 5: Verifying apps/rhythm-legacy status...')
  
  const legacyAppPath = path.join(repoRoot, 'apps/rhythm-legacy')
  
  if (!existsSync(legacyAppPath)) {
    logWarning('apps/rhythm-legacy does not exist (may have been deleted)')
    return true
  }
  
  // Check if there's any code in it
  try {
    const { stdout } = await execAsync('find . -name "*.ts" -o -name "*.tsx" | wc -l', {
      cwd: legacyAppPath,
    })
    
    const fileCount = parseInt(stdout.trim(), 10)
    
    if (fileCount > 0) {
      logWarning(`apps/rhythm-legacy still contains ${fileCount} TypeScript files`)
      logInfo('Consider moving remaining files to legacy/code or deleting the app directory')
      return true // Not a failure, just a warning
    }
    
    logSuccess('apps/rhythm-legacy is empty or contains no TypeScript files')
    return true
  } catch (error) {
    logError(`Error checking apps/rhythm-legacy: ${error.message}`)
    return false
  }
}

// ============================================================================
// Main execution
// ============================================================================

async function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
  log('  E73.6 Legacy Ghosting Framework Verification', 'cyan')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')
  
  const results = []
  
  results.push(await checkLegacyStructure())
  results.push(await checkEslintConfig())
  results.push(await checkTsConfig())
  results.push(await checkForLegacyImports())
  results.push(await checkLegacyAppStatus())
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
  log('  Summary', 'cyan')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')
  
  const passed = results.filter(r => r).length
  const total = results.length
  
  if (passed === total) {
    logSuccess(`All ${total} checks passed! Legacy ghosting framework is properly enforced.`)
    log('\nNext steps:', 'cyan')
    log('  1. Test legacy endpoint returns 410 (manual test)', 'cyan')
    log('  2. Update RULES_VS_CHECKS_MATRIX.md with R-LEGACY-001, R-LEGACY-002, R-LEGACY-003', 'cyan')
    log('  3. Add this script to CI pipeline\n', 'cyan')
    process.exit(0)
  } else {
    logError(`${passed}/${total} checks passed. Please fix the issues above.`)
    process.exit(1)
  }
}

main().catch(error => {
  logError(`Unexpected error: ${error.message}`)
  console.error(error)
  process.exit(1)
})
