#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Generate version info from git
 * Creates a version.json file with commit ID and timestamp
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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
  const versionInfo = getGitInfo()
  const outputPath = path.join(__dirname, '..', 'public', 'version.json')
  
  // Ensure public directory exists
  const publicDir = path.join(__dirname, '..', 'public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  
  // Write version info to file
  fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2))
  
  console.log('Version info generated:')
  console.log(`  Commit: ${versionInfo.commitHashShort} (${versionInfo.commitHash})`)
  console.log(`  Date: ${versionInfo.commitDate}`)
  console.log(`  Output: ${outputPath}`)
}

// Run the script
generateVersionFile()
