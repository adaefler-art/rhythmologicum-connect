'use client'

import { useEffect, useState } from 'react'
import type { FunnelDefinition } from '@/lib/types/funnel'
import { isQuestionStep as isQuestionStepGuard } from '@/lib/types/funnel'

/**
 * B1 Demo: Funnel Definition Viewer
 * 
 * This page demonstrates the new B1 funnel definition API.
 * It loads a funnel by slug and displays its complete structure.
 */
export default function FunnelDefinitionDemo() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [funnel, setFunnel] = useState<FunnelDefinition | null>(null)
  const [selectedSlug, setSelectedSlug] = useState('stress')

  useEffect(() => {
    async function loadFunnel() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/funnels/${selectedSlug}/definition`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || response.statusText)
        }

        const data = await response.json()
        setFunnel(data)
      } catch (err) {
        console.error('Error loading funnel:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadFunnel()
  }, [selectedSlug])

  return (
    <main className="bg-slate-50 min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">B1</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Funnel Definition Viewer
              </h1>
              <p className="text-sm text-slate-600">
                B1 Implementation: Database-driven Funnel Structure
              </p>
            </div>
          </div>

          {/* Slug Selector */}
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              Funnel Slug:
              <input
                type="text"
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="e.g., stress"
              />
            </label>
            <button
              onClick={() => setSelectedSlug(selectedSlug)}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-slate-600">Loading funnel definition...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Funnel Display */}
        {!loading && !error && funnel && (
          <div className="space-y-6">
            {/* Funnel Metadata */}
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Funnel Metadata</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-600">ID</dt>
                  <dd className="text-sm font-mono text-slate-900 break-all">{funnel.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600">Slug</dt>
                  <dd className="text-sm font-mono text-sky-700">{funnel.slug}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600">Title</dt>
                  <dd className="text-sm text-slate-900">{funnel.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600">Subtitle</dt>
                  <dd className="text-sm text-slate-900">{funnel.subtitle || '-'}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-slate-600">Description</dt>
                  <dd className="text-sm text-slate-900">{funnel.description || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600">Total Steps</dt>
                  <dd className="text-lg font-bold text-sky-600">{funnel.totalSteps}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600">Total Questions</dt>
                  <dd className="text-lg font-bold text-sky-600">{funnel.totalQuestions}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600">Status</dt>
                  <dd>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      funnel.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {funnel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600">Theme</dt>
                  <dd className="text-sm text-slate-900">{funnel.theme || 'Default'}</dd>
                </div>
              </dl>
            </section>

            {/* Steps */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Steps ({funnel.steps.length})
              </h2>
              <div className="space-y-4">
                {funnel.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-white border-2 border-slate-200 rounded-xl p-6"
                  >
                    {/* Step Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-sky-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {step.title}
                          </h3>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                            {step.type}
                          </span>
                        </div>
                        {step.description && (
                          <p className="text-sm text-slate-600">{step.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Questions (if question step) */}
                    {isQuestionStepGuard(step) && step.questions && step.questions.length > 0 && (
                      <div className="ml-16">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">
                          Questions ({step.questions.length})
                        </h4>
                        <div className="space-y-3">
                          {step.questions.map((question, qIndex) => (
                            <div
                              key={question.id}
                              className="bg-slate-50 border border-slate-200 rounded-lg p-4"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-slate-300 text-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {qIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-900 mb-1">
                                    {question.label}
                                  </p>
                                  {question.helpText && (
                                    <p className="text-xs text-slate-600 mb-2">
                                      💡 {question.helpText}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-mono">
                                      key: {question.key}
                                    </span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                                      {question.questionType}
                                    </span>
                                    {question.minValue !== null && question.maxValue !== null && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                        range: {question.minValue}–{question.maxValue}
                                      </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded font-semibold ${
                                      question.isRequired 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {question.isRequired ? 'Required' : 'Optional'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info content (if info step) */}
                    {'content' in step && step.content && (
                      <div className="ml-16">
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                          <p className="text-sm text-blue-900">{step.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* JSON Preview */}
            <section className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">JSON Structure</h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(funnel, null, 2))
                    alert('JSON copied to clipboard!')
                  }}
                  className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors"
                >
                  Copy JSON
                </button>
              </div>
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(funnel, null, 2)}
              </pre>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
