#!/usr/bin/env node
/**
 * B1 Testing Script
 * 
 * Tests the funnel definition API endpoint to ensure it works correctly.
 * Run with: node tools/test-funnel-api.js
 */

const https = require('https')

// Configuration
const FUNNEL_SLUG = 'stress'
const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3000'
const API_ENDPOINT = `${API_BASE}/api/funnels/${FUNNEL_SLUG}/definition`

console.log('🧪 B1 Funnel Definition API Test')
console.log('================================\n')
console.log(`Testing endpoint: ${API_ENDPOINT}\n`)

// Simple HTTP GET request
function testAPI() {
  const url = new URL(API_ENDPOINT)
  const protocol = url.protocol === 'https:' ? https : require('http')
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  }

  return new Promise((resolve, reject) => {
    const req = protocol.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ statusCode: res.statusCode, data: jsonData })
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

// Validation functions
function validateFunnelDefinition(data) {
  const errors = []

  // Check required fields
  const requiredFields = ['id', 'slug', 'title', 'steps', 'totalSteps', 'totalQuestions', 'isActive']
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // Check slug matches
  if (data.slug !== FUNNEL_SLUG) {
    errors.push(`Slug mismatch: expected '${FUNNEL_SLUG}', got '${data.slug}'`)
  }

  // Check steps is an array
  if (!Array.isArray(data.steps)) {
    errors.push('steps must be an array')
  } else {
    // Validate each step
    data.steps.forEach((step, index) => {
      if (!step.id || !step.title || step.orderIndex === undefined || !step.type) {
        errors.push(`Step ${index} is missing required fields`)
      }

      // Validate question steps
      if ((step.type === 'question_step' || step.type === 'form') && !Array.isArray(step.questions)) {
        errors.push(`Step ${index} (${step.type}) should have questions array`)
      }
    })

    // Check order is sequential
    for (let i = 0; i < data.steps.length; i++) {
      if (data.steps[i].orderIndex !== i + 1) {
        errors.push(`Step orderIndex mismatch at position ${i}: expected ${i + 1}, got ${data.steps[i].orderIndex}`)
      }
    }
  }

  // Check totalSteps matches actual steps
  if (data.steps && data.steps.length !== data.totalSteps) {
    errors.push(`totalSteps (${data.totalSteps}) doesn't match steps array length (${data.steps.length})`)
  }

  // Check totalQuestions calculation
  if (data.steps && Array.isArray(data.steps)) {
    const actualQuestions = data.steps.reduce((total, step) => {
      return total + (step.questions ? step.questions.length : 0)
    }, 0)

    if (actualQuestions !== data.totalQuestions) {
      errors.push(`totalQuestions (${data.totalQuestions}) doesn't match actual question count (${actualQuestions})`)
    }
  }

  return errors
}

// Display results
function displayResults(data) {
  console.log('✅ API Response Received')
  console.log('========================\n')

  console.log('📊 Funnel Metadata:')
  console.log(`   Slug: ${data.slug}`)
  console.log(`   Title: ${data.title}`)
  console.log(`   Subtitle: ${data.subtitle || 'N/A'}`)
  console.log(`   Description: ${data.description || 'N/A'}`)
  console.log(`   Active: ${data.isActive}`)
  console.log(`   Theme: ${data.theme || 'Default'}`)
  console.log(`   Total Steps: ${data.totalSteps}`)
  console.log(`   Total Questions: ${data.totalQuestions}\n`)

  console.log('📋 Steps:')
  data.steps.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step.title} (${step.type})`)
    if (step.questions && step.questions.length > 0) {
      console.log(`      Questions: ${step.questions.length}`)
      step.questions.forEach((q, qIndex) => {
        console.log(`         ${qIndex + 1}. ${q.label} [${q.key}]`)
      })
    }
  })
  console.log()
}

// Main test execution
async function runTests() {
  try {
    console.log('⏳ Sending request...\n')

    const { statusCode, data } = await testAPI()

    if (statusCode !== 200) {
      console.error(`❌ Test Failed: HTTP ${statusCode}`)
      if (data.error) {
        console.error(`   Error: ${data.error}`)
      }
      process.exit(1)
    }

    displayResults(data)

    console.log('🔍 Validating structure...\n')
    const errors = validateFunnelDefinition(data)

    if (errors.length > 0) {
      console.error('❌ Validation Failed:')
      errors.forEach((error) => {
        console.error(`   - ${error}`)
      })
      process.exit(1)
    }

    console.log('✅ All validations passed!\n')
    console.log('🎉 B1 Implementation Test: SUCCESS\n')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Test Failed:')
    console.error(`   ${error.message}\n`)
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the development server is running:')
      console.error('   npm run dev\n')
    }
    
    process.exit(1)
  }
}

// Run the tests
runTests()
