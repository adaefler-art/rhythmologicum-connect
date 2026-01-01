#!/usr/bin/env node
/**
 * DB Access Pattern Audit Tool
 * 
 * Scans the repository for all Supabase client creation and usage patterns.
 * Generates reports for documentation and analysis.
 * 
 * Usage: node scripts/db/audit-db-access.js
 */

const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '../..')
const EXCLUDE_DIRS = ['node_modules', '.next', 'build', 'out', '.git', 'dist']
const INCLUDE_EXTS = ['.ts', '.tsx']

function shouldScanFile(filePath) {
  const parts = filePath.split(path.sep)
  if (parts.some(p => EXCLUDE_DIRS.includes(p))) {
    return false
  }
  
  const ext = path.extname(filePath)
  return INCLUDE_EXTS.includes(ext)
}

function scanDirectory(dir) {
  const files = []
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          files.push(...scanDirectory(fullPath))
        }
      } else if (entry.isFile() && shouldScanFile(fullPath)) {
        files.push(fullPath)
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err.message)
  }
  
  return files
}

function analyzeFile(filePath) {
  const usages = []
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    // Extract imports
    const imports = []
    for (const line of lines) {
      if (line.includes('@supabase')) {
        imports.push(line.trim())
      }
    }
    
    // Scan for client creation patterns
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      // Direct createClient usage
      if (trimmed.includes('createClient(')) {
        usages.push({
          file: path.relative(REPO_ROOT, filePath),
          line: index + 1,
          pattern: 'createClient',
          context: trimmed.slice(0, 100),
          clientType: 'createClient',
          imports,
        })
      }
      
      // createServerClient usage
      if (trimmed.includes('createServerClient(')) {
        usages.push({
          file: path.relative(REPO_ROOT, filePath),
          line: index + 1,
          pattern: 'createServerClient',
          context: trimmed.slice(0, 100),
          clientType: 'createServerClient',
          imports,
        })
      }
      
      // Service role key usage
      if (trimmed.includes('SUPABASE_SERVICE_ROLE_KEY') || trimmed.includes('SUPABASE_SERVICE_KEY')) {
        usages.push({
          file: path.relative(REPO_ROOT, filePath),
          line: index + 1,
          pattern: 'SERVICE_ROLE_KEY',
          context: trimmed.slice(0, 100),
          clientType: 'other',
          imports,
        })
      }
      
      // Table access patterns
      const fromMatch = trimmed.match(/\.from\(['"]([^'"]+)['"]\)/)
      if (fromMatch) {
        usages.push({
          file: path.relative(REPO_ROOT, filePath),
          line: index + 1,
          pattern: `table:${fromMatch[1]}`,
          context: trimmed.slice(0, 100),
          clientType: 'supabase.from',
          imports,
        })
      }
      
      // process.env usage
      if (trimmed.includes('process.env.SUPABASE') || trimmed.includes('process.env.NEXT_PUBLIC_SUPABASE')) {
        usages.push({
          file: path.relative(REPO_ROOT, filePath),
          line: index + 1,
          pattern: 'process.env',
          context: trimmed.slice(0, 100),
          clientType: 'other',
          imports,
        })
      }
    })
  } catch (err) {
    console.error(`Error analyzing ${filePath}:`, err.message)
  }
  
  return usages
}

function categorizeFile(filePath) {
  if (filePath.startsWith('app/api/')) return 'API Routes'
  if (filePath.startsWith('app/')) return 'App Pages/Components'
  if (filePath.startsWith('lib/')) return 'Library/Utilities'
  if (filePath.startsWith('scripts/')) return 'Scripts'
  if (filePath.includes('__tests__') || filePath.includes('.test.')) return 'Tests'
  return 'Other'
}

function generateReport(result) {
  let report = '# DB Access Pattern Audit Report\n\n'
  report += `Generated: ${new Date().toISOString()}\n\n`
  report += '## Summary\n\n'
  report += `- Total files scanned: ${result.totalFiles}\n`
  report += `- Direct createClient calls: ${result.summary.directCreateClient}\n`
  report += `- createServerClient calls: ${result.summary.createServerClient}\n`
  report += `- Service role key usage: ${result.summary.serviceRoleUsage}\n`
  report += `- Existing helper usage: ${result.summary.existingHelpers}\n\n`
  
  report += '## Client Creation Patterns\n\n'
  
  const byCategory = new Map()
  for (const usage of result.clientCreations) {
    const cat = categorizeFile(usage.file)
    if (!byCategory.has(cat)) {
      byCategory.set(cat, [])
    }
    byCategory.get(cat).push(usage)
  }
  
  for (const [category, usages] of byCategory) {
    report += `### ${category} (${usages.length})\n\n`
    for (const usage of usages.slice(0, 20)) { // Limit to first 20 per category
      report += `- \`${usage.file}:${usage.line}\` - ${usage.pattern}\n`
    }
    if (usages.length > 20) {
      report += `  _... and ${usages.length - 20} more_\n`
    }
    report += '\n'
  }
  
  report += '## Table Access Patterns\n\n'
  
  const sortedTables = Array.from(result.tableAccesses.entries())
    .sort((a, b) => b[1].length - a[1].length)
  
  report += '| Table | Access Count | Files |\n'
  report += '|-------|--------------|-------|\n'
  
  for (const [table, accesses] of sortedTables) {
    const uniqueFiles = new Set(accesses.map(a => a.file))
    report += `| ${table} | ${accesses.length} | ${uniqueFiles.size} |\n`
  }
  
  report += '\n## Environment Variable Usage (process.env)\n\n'
  
  const envFiles = new Set()
  for (const usage of result.envUsages) {
    if (usage.pattern === 'process.env') {
      envFiles.add(usage.file)
    }
  }
  
  report += `Found direct process.env usage in ${envFiles.size} files:\n\n`
  for (const file of Array.from(envFiles).slice(0, 20)) {
    report += `- ${file}\n`
  }
  
  return report
}

function generateMatrix(result) {
  let matrix = '# DB Access Matrix\n\n'
  matrix += '## Surface → Endpoint → Client Type → Tables\n\n'
  matrix += '| File | Type | Pattern | Tables Accessed | Has Service Role |\n'
  matrix += '|------|------|---------|-----------------|------------------|\n'
  
  const fileMap = new Map()
  
  for (const usage of result.clientCreations) {
    if (!fileMap.has(usage.file)) {
      fileMap.set(usage.file, {
        patterns: new Set(),
        tables: new Set(),
        hasServiceRole: false,
      })
    }
    const entry = fileMap.get(usage.file)
    entry.patterns.add(usage.pattern)
    if (usage.pattern.includes('SERVICE_ROLE')) {
      entry.hasServiceRole = true
    }
  }
  
  for (const [table, accesses] of result.tableAccesses) {
    for (const access of accesses) {
      if (!fileMap.has(access.file)) {
        fileMap.set(access.file, {
          patterns: new Set(),
          tables: new Set(),
          hasServiceRole: false,
        })
      }
      fileMap.get(access.file).tables.add(table)
    }
  }
  
  const sortedFiles = Array.from(fileMap.entries()).sort((a, b) => {
    const catA = categorizeFile(a[0])
    const catB = categorizeFile(b[0])
    if (catA !== catB) return catA.localeCompare(catB)
    return a[0].localeCompare(b[0])
  })
  
  for (const [file, info] of sortedFiles) {
    const category = categorizeFile(file)
    const patterns = Array.from(info.patterns).join(', ')
    const tables = Array.from(info.tables).slice(0, 3).join(', ')
    const moreTablesCount = info.tables.size > 3 ? ` +${info.tables.size - 3}` : ''
    matrix += `| ${file} | ${category} | ${patterns} | ${tables}${moreTablesCount} | ${info.hasServiceRole ? '✓' : ''} |\n`
  }
  
  return matrix
}

async function main() {
  console.log('Starting DB access pattern audit...')
  console.log(`Scanning: ${REPO_ROOT}`)
  
  const files = scanDirectory(REPO_ROOT)
  console.log(`Found ${files.length} TypeScript files`)
  
  const result = {
    totalFiles: files.length,
    clientCreations: [],
    tableAccesses: new Map(),
    envUsages: [],
    summary: {
      directCreateClient: 0,
      createServerClient: 0,
      existingHelpers: 0,
      serviceRoleUsage: 0,
    },
  }
  
  for (const file of files) {
    const usages = analyzeFile(file)
    
    for (const usage of usages) {
      if (usage.clientType === 'createClient' || usage.clientType === 'createServerClient') {
        result.clientCreations.push(usage)
        
        if (usage.clientType === 'createClient') {
          result.summary.directCreateClient++
        } else {
          result.summary.createServerClient++
        }
      }
      
      if (usage.clientType === 'supabase.from') {
        const table = usage.pattern.replace('table:', '')
        if (!result.tableAccesses.has(table)) {
          result.tableAccesses.set(table, [])
        }
        result.tableAccesses.get(table).push(usage)
      }
      
      if (usage.pattern === 'SERVICE_ROLE_KEY') {
        result.summary.serviceRoleUsage++
      }
      
      if (usage.pattern === 'process.env') {
        result.envUsages.push(usage)
      }
    }
  }
  
  // Check for existing helper usage
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    if (content.includes('from \'@/lib/supabaseServer\'') || 
        content.includes('from "@/lib/supabaseServer"') ||
        content.includes('from \'@/lib/supabaseClient\'') ||
        content.includes('from "@/lib/supabaseClient"')) {
      result.summary.existingHelpers++
    }
  }
  
  console.log('\nGenerating reports...')
  
  const reportPath = path.join(REPO_ROOT, 'docs/canon/DB_ACCESS_PATTERNS.md')
  const matrixPath = path.join(REPO_ROOT, 'docs/canon/DB_ACCESS_MATRIX.md')
  
  fs.writeFileSync(reportPath, generateReport(result))
  console.log(`✓ Report saved to: ${reportPath}`)
  
  fs.writeFileSync(matrixPath, generateMatrix(result))
  console.log(`✓ Matrix saved to: ${matrixPath}`)
  
  console.log('\nAudit complete!')
  console.log(`\nSummary:`)
  console.log(`  - Total files: ${result.totalFiles}`)
  console.log(`  - Client creations: ${result.clientCreations.length}`)
  console.log(`  - Unique tables: ${result.tableAccesses.size}`)
  console.log(`  - Service role usage: ${result.summary.serviceRoleUsage}`)
  console.log(`  - Existing helper imports: ${result.summary.existingHelpers}`)
}

main().catch(console.error)
