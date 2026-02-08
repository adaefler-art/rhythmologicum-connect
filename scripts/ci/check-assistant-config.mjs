#!/usr/bin/env node

/**
 * Assistant Identity Configuration Checker
 * 
 * Validates that assistant identity is properly configured and not hard-coded.
 * Implements rules defined in /docs/ASSISTANT_IDENTITY_RULES.md
 * 
 * Exit codes:
 * - 0: No violations found
 * - 1: Violations found (fails CI)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')

function normalizeRelativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')
}

function normalizePathFragment(fragment) {
  return fragment.replace(/\\/g, '/').replace(/^\/+/, '')
}

// Patterns to detect hard-coded assistant names
const ASSISTANT_NAME_PATTERNS = [
  /\bAMY\b/g,        // "AMY" as whole word
  /\bAmy\b/g,        // "Amy" as whole word  
  /["']AMY["']/g,    // "AMY" in quotes
  /["']Amy["']/g,    // "Amy" in quotes
]

// Exempt paths (relative to project root)
const EXEMPT_PATHS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.audit',
  'docs/_archive',           // Archived documentation
  'docs/_archive_0_3',       // Archived documentation
  'docs/mobile/imports',     // Design mockups
  'docs/rhythm_mobile_v2',   // Design mockups
  'supabase/migrations',     // Database migrations (R-006)
  'apps/rhythm-legacy',      // Legacy code (R-006)
  'legacy',                  // Legacy code (R-006)
  '.env',                    // Environment files
  'package-lock.json',       // Lock files
  'prs.json',                // PR data
  'all-prs.json',            // PR data
  'all-issues.json',         // Issue data
  'issues.json',             // Issue data
  '/docs/api/endpoint-catalog.json', // API catalog (contains routes)
  '/apps/rhythm-studio-ui/public/dev/endpoint-catalog.json', // API catalog
  '/apps/rhythm-patient-ui/public/dev/endpoint-catalog.json', // API catalog
]

const EXEMPT_PATH_SEGMENTS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.audit',
]

// Exempt file patterns
const EXEMPT_FILE_PATTERNS = [
  /\.md$/,                      // Markdown files (handled separately with warnings)
  /\.sql$/,                     // SQL files (database migrations)
  /endpoint-catalog\.json$/,    // API endpoint catalogs
  /-COMPLETE\.md$/,             // Completion docs
  /-SUMMARY\.md$/,              // Summary docs
  /-VERIFICATION-REPORT\.md$/,  // Verification reports
  /TESTING-GUIDE\.md$/,         // Testing guides
]

// Paths that are allowed to contain "AMY" (backward compat)
const ALLOWED_PATHS = [
  '/lib/config/assistant.ts',        // Config source of truth
  '/lib/amyFallbacks.ts',            // File name kept for compat
  '/lib/featureFlags.ts',            // Comments explaining compat
  '/lib/contracts/registry.ts',      // Comments explaining compat
  '/lib/safety/disclaimers.ts',      // Comments explaining compat
  '/.github/copilot-instructions.md', // Project documentation
  '/docs/ASSISTANT_IDENTITY_RULES.md', // This rules document
  '/scripts/ci/check-assistant-config.mjs', // This check script
  '/RULES_VS_CHECKS_MATRIX.md',     // Rules matrix
]

// Files to include
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

let violations = []
let warnings = []

function isExemptPath(filePath) {
  const relativePath = normalizeRelativePath(filePath)
  const pathSegments = relativePath.split('/')

  for (const segment of EXEMPT_PATH_SEGMENTS) {
    if (pathSegments.includes(segment)) {
      return true
    }
  }
  
  // Check if path starts with any exempt path
  for (const exemptPath of EXEMPT_PATHS) {
    const normalizedExemptPath = normalizePathFragment(exemptPath)

    if (relativePath.startsWith(normalizedExemptPath)) {
      return true
    }
  }
  
  // Check file patterns
  for (const pattern of EXEMPT_FILE_PATTERNS) {
    if (pattern.test(relativePath)) {
      return true
    }
  }
  
  return false
}

function isAllowedPath(filePath) {
  const relativePath = '/' + normalizeRelativePath(filePath)
  
  for (const allowedPath of ALLOWED_PATHS) {
    if (relativePath === allowedPath || relativePath.endsWith(allowedPath)) {
      return true
    }
  }
  
  return false
}

function isApiRoute(filePath) {
  const relativePath = normalizeRelativePath(filePath)
  return relativePath.includes('/api/amy/')
}

function hasBackwardCompatComment(content, lineNumber) {
  // Check a few lines before the match for backward compat comments
  const lines = content.split('\n')
  const startLine = Math.max(0, lineNumber - 5)
  const contextLines = lines.slice(startLine, lineNumber + 1)
  const context = contextLines.join('\n')
  
  return (
    context.includes('backward compat') ||
    context.includes('backward compatibility') ||
    context.includes('kept for compat') ||
    context.includes('historical') ||
    context.includes('legacy')
  )
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const relativePath = normalizeRelativePath(filePath)
  const lines = content.split('\n')
  
  // Check for hard-coded assistant names
  for (const pattern of ASSISTANT_NAME_PATTERNS) {
    let match
    pattern.lastIndex = 0 // Reset regex state
    
    while ((match = pattern.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index)
      const lineNumber = beforeMatch.split('\n').length
      const line = lines[lineNumber - 1]
      
      // Skip if it's in a comment explaining backward compatibility
      if (hasBackwardCompatComment(content, lineNumber)) {
        continue
      }
      
      // Skip if it's in an API route import/call
      if (line.includes("'/api/amy/") || line.includes('"/api/amy/') || line.includes('`/api/amy/')) {
        continue
      }
      
      // Skip if importing from config
      if (line.includes("from '@/lib/config/assistant'") || line.includes('from "./config/assistant"')) {
        continue
      }
      
      // Check if it's using ASSISTANT_CONFIG
      if (line.includes('ASSISTANT_CONFIG.name') || line.includes('ASSISTANT_CONFIG.personaName')) {
        continue // This is correct usage
      }
      
      violations.push({
        file: relativePath,
        line: lineNumber,
        content: line.trim(),
        rule: 'R-002',
        message: `Hard-coded assistant name found. Use ASSISTANT_CONFIG instead.`,
      })
    }
  }
  
  // Check if file should import ASSISTANT_CONFIG but doesn't
  if (violations.length > 0) {
    if (!content.includes("from '@/lib/config/assistant'") && !content.includes('from "./config/assistant"')) {
      warnings.push({
        file: relativePath,
        message: 'File contains hard-coded assistant references but does not import ASSISTANT_CONFIG',
      })
    }
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (!isExemptPath(filePath)) {
        walkDirectory(filePath)
      }
    } else if (stat.isFile()) {
      const ext = path.extname(filePath)
      
      if (INCLUDE_EXTENSIONS.includes(ext)) {
        // Skip exempt paths
        if (isExemptPath(filePath)) {
          continue
        }
        
        // Skip explicitly allowed paths
        if (isAllowedPath(filePath)) {
          continue
        }
        
        // Skip API routes (R-006)
        if (isApiRoute(filePath)) {
          continue
        }
        
        checkFile(filePath)
      }
    }
  }
}

// Run the check
console.log('🔍 Checking assistant identity configuration...\n')

walkDirectory(ROOT_DIR)

// Report results
if (violations.length === 0 && warnings.length === 0) {
  console.log('✅ No violations found. All assistant references use ASSISTANT_CONFIG.\n')
  process.exit(0)
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:\n')
  warnings.forEach((warning) => {
    console.log(`  ${warning.file}`)
    console.log(`    ${warning.message}\n`)
  })
}

if (violations.length > 0) {
  console.log('❌ Violations found:\n')
  violations.forEach((violation) => {
    console.log(`  ${violation.file}:${violation.line}`)
    console.log(`    Rule: ${violation.rule}`)
    console.log(`    ${violation.message}`)
    console.log(`    Code: ${violation.content}\n`)
  })
  
  console.log(`\n❌ Found ${violations.length} violation(s).`)
  console.log('   Please update code to use ASSISTANT_CONFIG from /lib/config/assistant.ts')
  console.log('   See docs/ASSISTANT_IDENTITY_RULES.md for details.\n')
  process.exit(1)
}

console.log(`\n⚠️  Found ${warnings.length} warning(s). No critical violations.\n`)
process.exit(0)
