/**
 * E76.1: MCP Server Test Page
 * 
 * Literal callsite for /api/mcp endpoint (Strategy A compliance).
 * Tests MCP server integration with stubbed tool responses.
 */

'use client'

import { useState } from 'react'

export default function MCPTestPage() {
  const [healthStatus, setHealthStatus] = useState<string>('')
  const [toolResult, setToolResult] = useState<string>('')
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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">MCP Server Test (E76.1)</h1>

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
      </div>
    </div>
  )
}
