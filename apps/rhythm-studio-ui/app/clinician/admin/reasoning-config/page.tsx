'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingSpinner,
  PageHeader,
  SectionHeader,
  Select,
  Textarea,
} from '@/lib/ui'
import { spacing } from '@/lib/design-tokens'
import { useActiveNavLabel } from '@/lib/contexts/NavigationContext'

type ReasoningLikelihood = 'low' | 'medium' | 'high'

type ReasoningConfig = {
  differential_templates: Array<{
    label: string
    trigger_terms: string[]
    required_terms?: string[]
    exclusions?: string[]
    base_likelihood: ReasoningLikelihood
  }>
  risk_weighting: {
    red_flag_weight: number
    chronicity_weight: number
    anxiety_modifier: number
  }
  open_question_templates: Array<{
    condition_label: string
    questions: Array<{ text: string; priority: 1 | 2 | 3 }>
  }>
}

type VersionRecord = {
  id: string
  version: number
  status: 'draft' | 'active' | 'archived'
  config_json: ReasoningConfig
  change_reason: string
  created_by: string
  created_at: string
}

type SandboxResult = {
  active_result: {
    risk_estimation: { score: number; level: ReasoningLikelihood }
    differentials: Array<{ label: string; likelihood: ReasoningLikelihood }>
    open_questions: Array<{ condition_label: string; text: string; priority: 1 | 2 | 3 }>
  }
  selected_result: {
    risk_estimation: { score: number; level: ReasoningLikelihood }
    differentials: Array<{ label: string; likelihood: ReasoningLikelihood }>
    open_questions: Array<{ condition_label: string; text: string; priority: 1 | 2 | 3 }>
  } | null
  differences: {
    risk_level_changed: boolean
    active_only_differentials: string[]
    selected_only_differentials: string[]
    open_question_count_delta: number
  } | null
}

type ApiErrorPayload = {
  success?: boolean
  code?: string
  message?: string
  details?: {
    code?: string | null
  }
  error?: {
    code?: string
    message?: string
    details?: {
      code?: string | null
    }
  }
}

const formatApiError = (payload: ApiErrorPayload | null, fallback: string): string => {
  if (!payload) return fallback

  const message = payload.message || payload.error?.message || fallback
  const detailCode = payload.details?.code || payload.error?.details?.code || payload.code || payload.error?.code

  if (detailCode) {
    return `${message} (${detailCode})`
  }

  return message
}

const defaultSandboxInput = {
  status: 'draft',
  chief_complaint: 'Ich habe Herzrasen und starke Angst seit gestern.',
  history_of_present_illness: {
    duration: 'seit 2 Tagen',
    associated_symptoms: ['Schwindel'],
  },
  psychosocial_factors: ['hoher Stress im Beruf'],
  uncertainties: ['unklare Ausloeser'],
  safety: {
    triggered_rules: [{ rule_id: 'SFTY-2.1-R-SEVERE-PALPITATIONS', verified: true }],
  },
}

export default function ReasoningConfigPage() {
  useActiveNavLabel('Reasoning Config')
  const [versions, setVersions] = useState<VersionRecord[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [configJsonText, setConfigJsonText] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [sandboxText, setSandboxText] = useState(JSON.stringify(defaultSandboxInput, null, 2))
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [newDifferential, setNewDifferential] = useState({
    label: '',
    trigger_terms: '',
    required_terms: '',
    exclusions: '',
    base_likelihood: 'medium' as ReasoningLikelihood,
  })
  const [newQuestionTemplate, setNewQuestionTemplate] = useState({
    condition_label: '',
    question_text: '',
    priority: 2 as 1 | 2 | 3,
  })

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? null,
    [versions, selectedVersionId],
  )
  const isDraft = selectedVersion?.status === 'draft'

  const parsedConfig = useMemo(() => {
    try {
      return JSON.parse(configJsonText) as ReasoningConfig
    } catch {
      return null
    }
  }, [configJsonText])

  const hydrateEditor = (version: VersionRecord | null) => {
    setConfigJsonText(version ? JSON.stringify(version.config_json, null, 2) : '')
  }

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/reasoning-config')
      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Failed to load reasoning config')
      }

      const versionList = (data.data?.versions ?? []) as VersionRecord[]
      setVersions(versionList)

      const active = versionList.find((version) => version.status === 'active') ?? versionList[0] ?? null
      setSelectedVersionId(active?.id ?? null)
      hydrateEditor(active)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reasoning config')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const updateConfigJson = (updater: (config: ReasoningConfig) => ReasoningConfig) => {
    if (!parsedConfig) {
      setActionError('config_json must be valid JSON.')
      return
    }
    const next = updater(parsedConfig)
    setConfigJsonText(JSON.stringify(next, null, 2))
    setActionError(null)
  }

  const handleCreateDraft = async () => {
    if (!changeReason.trim()) {
      setActionError('change_reason is required for draft creation.')
      return
    }

    setActionError(null)
    const response = await fetch('/api/admin/reasoning-config/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change_reason: changeReason.trim() }),
    })
    const data = (await response.json().catch(() => null)) as ApiErrorPayload | null

    if (!response.ok || !data?.success) {
      setActionError(formatApiError(data, 'Failed to create draft version'))
      return
    }

    setChangeReason('')
    await loadOverview()
  }

  const handleSaveDraft = async () => {
    if (!selectedVersionId || !isDraft) return
    if (!parsedConfig) {
      setActionError('config_json must be valid JSON.')
      return
    }

    const response = await fetch(`/api/admin/reasoning-config/versions/${selectedVersionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config_json: parsedConfig }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      setActionError(data?.error?.message || 'Failed to save draft version')
      return
    }

    setActionError(null)
    setDetailLoading(true)
    await loadOverview()
    setDetailLoading(false)
  }

  const handleActivate = async () => {
    if (!selectedVersionId || !isDraft) return
    if (!changeReason.trim()) {
      setActionError('change_reason is required for activation.')
      return
    }

    const response = await fetch(`/api/admin/reasoning-config/versions/${selectedVersionId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change_reason: changeReason.trim() }),
    })
    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      setActionError(data?.error?.message || 'Failed to activate draft version')
      return
    }

    setActionError(null)
    setChangeReason('')
    await loadOverview()
  }

  const handleSandbox = async () => {
    let intakeJson: unknown
    try {
      intakeJson = JSON.parse(sandboxText)
    } catch {
      setActionError('Sandbox intake must be valid JSON.')
      return
    }

    const versionForSandbox = selectedVersion?.status === 'draft' ? selectedVersion.id : undefined

    const response = await fetch('/api/admin/reasoning-config/sandbox/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intake_json: intakeJson,
        version_id: versionForSandbox,
      }),
    })
    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      setActionError(data?.error?.message || 'Failed to run sandbox')
      setSandboxResult(null)
      return
    }

    setActionError(null)
    setSandboxResult(data.data as SandboxResult)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading reasoning config..." centered />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState title="Failed to load" message={error} onRetry={loadOverview} centered />
      </div>
    )
  }

  const activeVersion = versions.find((version) => version.status === 'active') ?? null

  return (
    <div className="w-full">
      <PageHeader
        title="Clinical Reasoning Config"
        description="MVP tooling for versioned reasoning templates, weighting, sandbox and activation"
      />

      <div style={{ marginBottom: spacing.lg }}>
        <Link
          href="/clinician"
          className="inline-flex items-center text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <Card padding="lg">
          <SectionHeader title="Overview" description="Active version and history" />
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-500">Active version</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {activeVersion ? `v${activeVersion.version}` : 'None'}
              </div>
              <div className="mt-1 text-xs text-slate-500">Last change: {versions[0]?.created_at ?? 'n/a'}</div>
            </div>

            <div className="space-y-2">
              {versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => {
                    setSelectedVersionId(version.id)
                    hydrateEditor(version)
                    setActionError(null)
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                    version.id === selectedVersionId
                      ? 'border-sky-500 bg-sky-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      v{version.version}
                    </div>
                    <Badge variant={version.status === 'active' ? 'success' : 'secondary'} size="sm">
                      {version.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{version.change_reason}</div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card padding="lg">
            <SectionHeader title="Editor" description="Draft-based editing with JSON + form helpers" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Selected version</label>
                <Select
                  value={selectedVersionId ?? ''}
                  onChange={(event) => {
                    const nextId = event.target.value
                    setSelectedVersionId(nextId)
                    const nextVersion = versions.find((version) => version.id === nextId) ?? null
                    hydrateEditor(nextVersion)
                    setActionError(null)
                  }}
                >
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      v{version.version} ({version.status})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Change reason</label>
                <Input
                  value={changeReason}
                  onChange={(event) => setChangeReason(event.target.value)}
                  placeholder="Required for draft creation and activation"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[
                { key: 'red_flag_weight', label: 'Red-Flag Weight', min: 0, max: 10 },
                { key: 'chronicity_weight', label: 'Chronicity Weight', min: 0, max: 10 },
                { key: 'anxiety_modifier', label: 'Anxiety Modifier', min: -5, max: 5 },
              ].map((slider) => (
                <div key={slider.key}>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{slider.label}</label>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={1}
                    disabled={!isDraft || !parsedConfig}
                    value={(parsedConfig?.risk_weighting as Record<string, number> | undefined)?.[slider.key] ?? 0}
                    onChange={(event) =>
                      updateConfigJson((current) => ({
                        ...current,
                        risk_weighting: {
                          ...current.risk_weighting,
                          [slider.key]: Number(event.target.value),
                        },
                      }))
                    }
                    className="mt-2 w-full"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {(parsedConfig?.risk_weighting as Record<string, number> | undefined)?.[slider.key] ?? '-'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Add differential template</div>
                <div className="space-y-2">
                  <Input placeholder="Label" value={newDifferential.label} onChange={(event) => setNewDifferential((prev) => ({ ...prev, label: event.target.value }))} disabled={!isDraft} />
                  <Input placeholder="Trigger terms (comma separated)" value={newDifferential.trigger_terms} onChange={(event) => setNewDifferential((prev) => ({ ...prev, trigger_terms: event.target.value }))} disabled={!isDraft} />
                  <Input placeholder="Required terms (optional)" value={newDifferential.required_terms} onChange={(event) => setNewDifferential((prev) => ({ ...prev, required_terms: event.target.value }))} disabled={!isDraft} />
                  <Input placeholder="Exclusions (optional)" value={newDifferential.exclusions} onChange={(event) => setNewDifferential((prev) => ({ ...prev, exclusions: event.target.value }))} disabled={!isDraft} />
                  <Select value={newDifferential.base_likelihood} onChange={(event) => setNewDifferential((prev) => ({ ...prev, base_likelihood: event.target.value as ReasoningLikelihood }))} disabled={!isDraft}>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </Select>
                  <Button
                    variant="secondary"
                    disabled={!isDraft}
                    onClick={() => {
                      if (!newDifferential.label.trim() || !newDifferential.trigger_terms.trim()) {
                        setActionError('Differential label and trigger terms are required.')
                        return
                      }

                      updateConfigJson((current) => ({
                        ...current,
                        differential_templates: [
                          ...current.differential_templates,
                          {
                            label: newDifferential.label.trim(),
                            trigger_terms: newDifferential.trigger_terms.split(',').map((item) => item.trim()).filter(Boolean),
                            required_terms: newDifferential.required_terms
                              ? newDifferential.required_terms.split(',').map((item) => item.trim()).filter(Boolean)
                              : undefined,
                            exclusions: newDifferential.exclusions
                              ? newDifferential.exclusions.split(',').map((item) => item.trim()).filter(Boolean)
                              : undefined,
                            base_likelihood: newDifferential.base_likelihood,
                          },
                        ],
                      }))
                    }}
                  >
                    Add differential
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Add open question template</div>
                <div className="space-y-2">
                  <Input placeholder="Condition label" value={newQuestionTemplate.condition_label} onChange={(event) => setNewQuestionTemplate((prev) => ({ ...prev, condition_label: event.target.value }))} disabled={!isDraft} />
                  <Input placeholder="Question text" value={newQuestionTemplate.question_text} onChange={(event) => setNewQuestionTemplate((prev) => ({ ...prev, question_text: event.target.value }))} disabled={!isDraft} />
                  <Select value={String(newQuestionTemplate.priority)} onChange={(event) => setNewQuestionTemplate((prev) => ({ ...prev, priority: Number(event.target.value) as 1 | 2 | 3 }))} disabled={!isDraft}>
                    <option value="1">Priority 1</option>
                    <option value="2">Priority 2</option>
                    <option value="3">Priority 3</option>
                  </Select>
                  <Button
                    variant="secondary"
                    disabled={!isDraft}
                    onClick={() => {
                      if (!newQuestionTemplate.condition_label.trim() || !newQuestionTemplate.question_text.trim()) {
                        setActionError('Condition label and question text are required.')
                        return
                      }

                      updateConfigJson((current) => {
                        const existingIndex = current.open_question_templates.findIndex(
                          (entry) =>
                            entry.condition_label.toLowerCase() ===
                            newQuestionTemplate.condition_label.trim().toLowerCase(),
                        )

                        if (existingIndex === -1) {
                          return {
                            ...current,
                            open_question_templates: [
                              ...current.open_question_templates,
                              {
                                condition_label: newQuestionTemplate.condition_label.trim(),
                                questions: [
                                  {
                                    text: newQuestionTemplate.question_text.trim(),
                                    priority: newQuestionTemplate.priority,
                                  },
                                ],
                              },
                            ],
                          }
                        }

                        const nextTemplates = [...current.open_question_templates]
                        nextTemplates[existingIndex] = {
                          ...nextTemplates[existingIndex],
                          questions: [
                            ...nextTemplates[existingIndex].questions,
                            {
                              text: newQuestionTemplate.question_text.trim(),
                              priority: newQuestionTemplate.priority,
                            },
                          ],
                        }

                        return {
                          ...current,
                          open_question_templates: nextTemplates,
                        }
                      })
                    }}
                  >
                    Add question
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">config_json</label>
              <Textarea
                rows={16}
                value={configJsonText}
                onChange={(event) => setConfigJsonText(event.target.value)}
                disabled={!isDraft}
              />
            </div>

            {actionError && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{actionError}</div>}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleCreateDraft}>New draft version</Button>
              <Button variant="primary" onClick={handleSaveDraft} disabled={!isDraft || detailLoading}>Save draft</Button>
              <Button variant="outline" onClick={handleActivate} disabled={!isDraft}>Activate draft</Button>
            </div>
          </Card>

          <Card padding="lg">
            <SectionHeader title="Sandbox" description="Compare active config with selected draft on intake JSON" />
            <Textarea rows={12} value={sandboxText} onChange={(event) => setSandboxText(event.target.value)} />
            <div className="mt-3">
              <Button variant="primary" onClick={handleSandbox}>Run sandbox</Button>
            </div>

            {sandboxResult && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">Active result</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Risk: {sandboxResult.active_result.risk_estimation.level} ({sandboxResult.active_result.risk_estimation.score})
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Differentials: {sandboxResult.active_result.differentials.map((item) => `${item.label} (${item.likelihood})`).join(', ') || 'none'}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Open questions: {sandboxResult.active_result.open_questions.length}</div>
                </div>

                {sandboxResult.selected_result && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">Selected draft result</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Risk: {sandboxResult.selected_result.risk_estimation.level} ({sandboxResult.selected_result.risk_estimation.score})
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Differentials: {sandboxResult.selected_result.differentials.map((item) => `${item.label} (${item.likelihood})`).join(', ') || 'none'}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">Open questions: {sandboxResult.selected_result.open_questions.length}</div>
                  </div>
                )}

                {sandboxResult.differences && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">Differences</div>
                    <ul className="mt-1 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <li>Risk level changed: {sandboxResult.differences.risk_level_changed ? 'yes' : 'no'}</li>
                      <li>Active-only differentials: {sandboxResult.differences.active_only_differentials.join(', ') || 'none'}</li>
                      <li>Draft-only differentials: {sandboxResult.differences.selected_only_differentials.join(', ') || 'none'}</li>
                      <li>Open question delta: {sandboxResult.differences.open_question_count_delta}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
