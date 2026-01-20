#!/usr/bin/env node
 

/**
 * Generate version info from git
 * Creates a version.json file with commit ID and timestamp
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i]
    if (value === '--out-dir') {
      args.outDir = argv[i + 1]
      i += 1
    } else if (value === '--app') {
      args.app = argv[i + 1]
      i += 1
    } else if (value === '--version') {
      args.version = argv[i + 1]
      i += 1
    }
  }
  return args
}

function normalizeBaseUrl(value) {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://${value}`
}

function getGitInfo() {
  try {
    // Get commit hash
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    
    // Get committer date in ISO 8601 format
    const commitDate = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim()
    
    // Get short commit hash (first 7 characters)
    const commitHashShort = commitHash.substring(0, 7)
    
    return {
      commitHash,
      commitHashShort,
      commitDate,
      buildDate: new Date().toISOString()
    }
  } catch (error) {
    console.warn('Warning: Could not retrieve git information:', error.message)
    // Return default values if git is not available
    return {
      commitHash: 'unknown',
      commitHashShort: 'unknown',
      commitDate: new Date().toISOString(),
      buildDate: new Date().toISOString()
    }
  }
}

function generateVersionFile() {
  const args = parseArgs(process.argv.slice(2))
  const versionInfo = getGitInfo()
  const outDir = args.outDir ? path.resolve(process.cwd(), args.outDir) : path.join(__dirname, '..', 'public')
  const outputPath = path.join(outDir, 'version.json')
  const app = args.app || process.env.APP_NAME || 'engine'
  const version = args.version || process.env.APP_VERSION || 'v0.6'
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.STUDIO_BASE_URL ||
      process.env.PATIENT_BASE_URL ||
      process.env.ENGINE_BASE_URL ||
      process.env.VERCEL_URL,
  )
  
  // Ensure public directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  
  const payload = {
    app,
    version,
    commitSha: versionInfo.commitHash,
    generatedAt: new Date().toISOString(),
    baseUrl,
    commitHash: versionInfo.commitHash,
    commitHashShort: versionInfo.commitHashShort,
    commitDate: versionInfo.commitDate,
    buildDate: versionInfo.buildDate,
  }

  // Write version info to file
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2))
  
  console.log('Version info generated:')
  console.log(`  App: ${app}`)
  console.log(`  Version: ${version}`)
  console.log(`  Commit: ${versionInfo.commitHashShort} (${versionInfo.commitHash})`)
  console.log(`  Date: ${versionInfo.commitDate}`)
  console.log(`  Output: ${outputPath}`)
}

// Run the script
generateVersionFile()
