/**
 * E76.1: MCP Server Test Page
 * E76.2: Added test for context pack endpoint
 * E76.4: Added test for diagnosis execution endpoint
 * E76.5: Added test for diagnosis prompt endpoint
 * 
 * Literal callsite for /api/mcp, /api/mcp/context-pack, /api/studio/diagnosis/execute, and /api/studio/diagnosis/prompt endpoints (Strategy A compliance).
 * Tests MCP server integration with real context pack builder, diagnosis execution worker, and diagnosis prompt schema.
 */

'use client'

import { useState } from 'react'

export default function MCPTestPage() {
  const [healthStatus, setHealthStatus] = useState<string>('')
  const [toolResult, setToolResult] = useState<string>('')
  const [contextPackResult, setContextPackResult] = useState<string>('')
  const [diagnosisExecutionResult, setDiagnosisExecutionResult] = useState<string>('')
  const [diagnosisPromptResult, setDiagnosisPromptResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function testHealth() {
    setLoading(true)
    try {
      // Literal callsite: /api/mcp
      const response = await fetch('/api/mcp')
      const data = await response.json()
      setHealthStatus(JSON.stringify(data, null, 2))
    } catch (error) {
      setHealthStatus(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function testGetPatientContext() {
    setLoading(true)
    try {
      // Literal callsite: /api/mcp
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get_patient_context',
          input: { patient_id: '123e4567-e89b-12d3-a456-426614174000' },
        }),
      })
      const data = await response.json()
      setToolResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setToolResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function testRunDiagnosis() {
    setLoading(true)
    try {
      // Literal callsite: /api/mcp
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'run_diagnosis',
          input: {
            patient_id: '123e4567-e89b-12d3-a456-426614174000',
            options: { include_history: true },
          },
        }),
      })
      const data = await response.json()
      setToolResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setToolResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function testContextPack() {
    setLoading(true)
    try {
      // Literal callsite: /api/mcp/context-pack (E76.2)
      const response = await fetch('/api/mcp/context-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: '123e4567-e89b-12d3-a456-426614174000',
        }),
      })
      const data = await response.json()
      setContextPackResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setContextPackResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function testDiagnosisExecution() {
    setLoading(true)
    try {
      // Literal callsite: /api/studio/diagnosis/execute (E76.4)
      const response = await fetch('/api/studio/diagnosis/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 5, // Process up to 5 queued runs
        }),
      })
      const data = await response.json()
      setDiagnosisExecutionResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setDiagnosisExecutionResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function testDiagnosisPromptGet() {
    setLoading(true)
    try {
      // Literal callsite: /api/studio/diagnosis/prompt (E76.5)
      const response = await fetch('/api/studio/diagnosis/prompt')
      const data = await response.json()
      setDiagnosisPromptResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setDiagnosisPromptResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function testDiagnosisPromptValidate() {
    setLoading(true)
    try {
      // Literal callsite: /api/studio/diagnosis/prompt (E76.5)
      const response = await fetch('/api/studio/diagnosis/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: {
            summary: 'Test diagnosis summary for validation',
            patient_context_used: {
              assessments_count: 2,
              date_range: {
                earliest: '2026-01-01T00:00:00Z',
                latest: '2026-02-01T00:00:00Z',
              },
              data_sources: ['stress_assessment'],
              completeness_score: 0.8,
            },
            differential_diagnoses: [
              {
                condition: 'Test condition',
                rationale: 'Test rationale for diagnosis',
                confidence: 'moderate',
                supporting_factors: ['Factor 1', 'Factor 2'],
              },
            ],
            recommended_next_steps: [
              {
                step: 'Follow-up assessment',
                rationale: 'To monitor progress',
                priority: 'medium',
              },
            ],
            urgent_red_flags: [],
            disclaimer:
              'This analysis is NOT medical advice and is provided solely for clinician review.',
            schema_version: 'v1',
          },
        }),
      })
      const data = await response.json()
      setDiagnosisPromptResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setDiagnosisPromptResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        MCP Server Test (E76.1 + E76.2 + E76.4 + E76.5)
      </h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Health Check</h2>
          <button
            onClick={testHealth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Health Endpoint
          </button>
          {healthStatus && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">{healthStatus}</pre>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">MCP Tools</h2>
          <div className="space-x-2">
            <button
              onClick={testGetPatientContext}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test get_patient_context
            </button>
            <button
              onClick={testRunDiagnosis}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Test run_diagnosis
            </button>
          </div>
          {toolResult && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">{toolResult}</pre>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Context Pack Builder (E76.2)</h2>
          <button
            onClick={testContextPack}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Test Context Pack Endpoint
          </button>
          {contextPackResult && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              {contextPackResult}
            </pre>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Diagnosis Execution Worker (E76.4)</h2>
          <button
            onClick={testDiagnosisExecution}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Test Diagnosis Execution Endpoint
          </button>
          {diagnosisExecutionResult && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              {diagnosisExecutionResult}
            </pre>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Diagnosis Prompt Schema (E76.5)</h2>
          <div className="space-x-2">
            <button
              onClick={testDiagnosisPromptGet}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Test GET Prompt Metadata
            </button>
            <button
              onClick={testDiagnosisPromptValidate}
              disabled={loading}
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            >
              Test POST Validate Output
            </button>
          </div>
          {diagnosisPromptResult && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              {diagnosisPromptResult}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
