'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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

type SafetyRule = {
  id: string
  key: string
  title: string
  created_at: string
  active_version?: SafetyRuleVersion | null
}

type SafetyRuleVersion = {
  id: string
  rule_id: string
  version: number
  status: 'draft' | 'active' | 'archived'
  logic_json: Record<string, unknown>
  defaults: Record<string, unknown>
  change_reason: string
  created_by: string
  created_at: string
}

type SandboxResult = {
  triggered_rules: Array<{
    rule_id: string
    title: string
    level: string
    verified: boolean
    action: string | null
    evidence: Array<{ source: string; source_id: string; excerpt: string }>
  }>
  escalation_level: string | null
}

export default function SafetyRulesPage() {
  const navLabel = useActiveNavLabel('Safety Rules')
  const [rules, setRules] = useState<SafetyRule[]>([])
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [versions, setVersions] = useState<SafetyRuleVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [logicJsonText, setLogicJsonText] = useState('')
  const [defaults, setDefaults] = useState({ level_default: '', action_default: '' })
  const [changeReason, setChangeReason] = useState('')
  const [sandboxText, setSandboxText] = useState('')
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/safety-rules')
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Failed to load safety rules')
      }
      setRules(data.data?.rules ?? [])
      if (!selectedRuleId && data.data?.rules?.length) {
        setSelectedRuleId(data.data.rules[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load safety rules')
    } finally {
      setLoading(false)
    }
  }

  const selectedRule = useMemo(
    () => rules.find((rule) => rule.id === selectedRuleId) ?? null,
    [rules, selectedRuleId],
  )

  useEffect(() => {
    if (!selectedRuleId) return
    loadRuleDetail(selectedRuleId)
  }, [selectedRuleId])

  const loadRuleDetail = async (ruleId: string) => {
    try {
      setDetailLoading(true)
      setDetailError(null)
      const response = await fetch(`/api/admin/safety-rules/${ruleId}`)
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Failed to load rule details')
      }
      const versionList = data.data?.versions ?? []
      setVersions(versionList)

      const activeVersion = versionList.find((entry: SafetyRuleVersion) => entry.status === 'active')
      const initialVersion = activeVersion ?? versionList[0] ?? null

      setSelectedVersionId(initialVersion?.id ?? null)
      hydrateEditor(initialVersion)
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load rule details')
      setVersions([])
      setSelectedVersionId(null)
      hydrateEditor(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const hydrateEditor = (version: SafetyRuleVersion | null) => {
    setLogicJsonText(version ? JSON.stringify(version.logic_json ?? {}, null, 2) : '')
    setDefaults({
      level_default: String(version?.defaults?.level_default ?? ''),
      action_default: String(version?.defaults?.action_default ?? ''),
    })
  }

  const selectedVersion = useMemo(
    () => versions.find((entry) => entry.id === selectedVersionId) ?? null,
    [versions, selectedVersionId],
  )

  const isDraft = selectedVersion?.status === 'draft'

  const handleCreateDraft = async () => {
    if (!selectedRuleId) return
    if (!changeReason.trim()) {
      setActionError('change_reason is required for new drafts.')
      return
    }
    setActionError(null)
    const response = await fetch(`/api/admin/safety-rules/${selectedRuleId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change_reason: changeReason.trim() }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      setActionError(data?.error?.message || 'Failed to create draft version')
      return
    }
    setChangeReason('')
    await loadRuleDetail(selectedRuleId)
  }

  const handleSaveDraft = async () => {
    if (!selectedVersionId || !isDraft) return
    let logic: Record<string, unknown>
    try {
      logic = JSON.parse(logicJsonText)
    } catch {
      setActionError('logic_json must be valid JSON.')
      return
    }

    const defaultsPayload: Record<string, unknown> = {}
    if (defaults.level_default) defaultsPayload.level_default = defaults.level_default
    if (defaults.action_default) defaultsPayload.action_default = defaults.action_default

    const response = await fetch(`/api/admin/safety-rules/versions/${selectedVersionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logic_json: logic, defaults: defaultsPayload }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      setActionError(data?.error?.message || 'Failed to save draft version')
      return
    }

    setActionError(null)
    if (selectedRuleId) {
      await loadRuleDetail(selectedRuleId)
    }
  }

  const handleActivate = async () => {
    if (!selectedVersionId || !isDraft) return
    if (!changeReason.trim()) {
      setActionError('change_reason is required for activation.')
      return
    }
    const response = await fetch(
      `/api/admin/safety-rules/versions/${selectedVersionId}/activate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_reason: changeReason.trim() }),
      },
    )
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      setActionError(data?.error?.message || 'Failed to activate rule version')
      return
    }
    setActionError(null)
    setChangeReason('')
    if (selectedRuleId) {
      await loadRuleDetail(selectedRuleId)
    }
    await loadRules()
  }

  const handleSandbox = async () => {
    setActionError(null)
    const response = await fetch('/api/admin/safety-rules/sandbox/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: sandboxText,
        rule_version_id: selectedVersionId ?? undefined,
      }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      setActionError(data?.error?.message || 'Failed to run sandbox evaluation')
      setSandboxResult(null)
      return
    }
    setSandboxResult(data.data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading safety rules..." centered />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState title="Failed to load" message={error} onRetry={loadRules} centered />
      </div>
    )
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Safety Rules"
        description="Minimal safety rule management for drafts, sandbox, and activation"
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
          <SectionHeader
            title="Rules"
            description="Active versions are shown on each rule"
          />
          <div className="space-y-3">
            {rules.map((rule) => (
              <button
                key={rule.id}
                type="button"
                onClick={() => setSelectedRuleId(rule.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                  rule.id === selectedRuleId
                    ? 'border-sky-500 bg-sky-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {rule.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{rule.key}</div>
                  </div>
                  {rule.active_version ? (
                    <Badge variant="success" size="sm">
                      v{rule.active_version.version}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" size="sm">
                      No active
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <SectionHeader
            title={selectedRule?.title || 'Rule details'}
            description={selectedRule?.key || 'Select a rule to edit'}
          />

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" text="Loading details..." centered />
            </div>
          ) : detailError ? (
            <ErrorState title="Failed to load" message={detailError} onRetry={() => selectedRuleId && loadRuleDetail(selectedRuleId)} centered />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Title</label>
                  <Input value={selectedRule?.title ?? ''} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Version</label>
                  <Select
                    value={selectedVersionId ?? ''}
                    onChange={(event) => {
                      const nextId = event.target.value
                      setSelectedVersionId(nextId)
                      const nextVersion = versions.find((entry) => entry.id === nextId) ?? null
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
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Default level</label>
                  <Select
                    value={defaults.level_default}
                    onChange={(event) =>
                      setDefaults((prev) => ({ ...prev, level_default: event.target.value }))
                    }
                    disabled={!isDraft}
                  >
                    <option value="">inherit</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Default action</label>
                  <Select
                    value={defaults.action_default}
                    onChange={(event) =>
                      setDefaults((prev) => ({ ...prev, action_default: event.target.value }))
                    }
                    disabled={!isDraft}
                  >
                    <option value="">inherit</option>
                    <option value="none">none</option>
                    <option value="warn">warn</option>
                    <option value="require_confirm">require_confirm</option>
                    <option value="hard_stop">hard_stop</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">logic_json</label>
                <Textarea
                  rows={12}
                  value={logicJsonText}
                  onChange={(event) => setLogicJsonText(event.target.value)}
                  disabled={!isDraft}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Change reason</label>
                <Input
                  value={changeReason}
                  onChange={(event) => setChangeReason(event.target.value)}
                  placeholder="Required for draft creation and activation"
                />
              </div>

              {actionError && (
                <div className="text-sm text-red-600 dark:text-red-400">{actionError}</div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleCreateDraft}>
                  New draft version
                </Button>
                <Button variant="primary" onClick={handleSaveDraft} disabled={!isDraft}>
                  Save draft
                </Button>
                <Button variant="outline" onClick={handleSandbox}>
                  Run sandbox
                </Button>
                <Button variant="primary" onClick={handleActivate} disabled={!isDraft}>
                  Activate
                </Button>
              </div>

              <Card padding="md">
                <SectionHeader
                  title="Sandbox"
                  description="Paste a sample conversation to test this rule version"
                />
                <div className="space-y-3">
                  <Textarea
                    rows={6}
                    value={sandboxText}
                    onChange={(event) => setSandboxText(event.target.value)}
                    placeholder="Paste text here..."
                  />
                  {sandboxResult && (
                    <div className="space-y-2 text-sm">
                      <div className="text-slate-600 dark:text-slate-300">
                        Escalation level: {sandboxResult.escalation_level ?? 'none'}
                      </div>
                      {sandboxResult.triggered_rules.length === 0 ? (
                        <div className="text-slate-500 dark:text-slate-400">No rules triggered.</div>
                      ) : (
                        <div className="space-y-2">
                          {sandboxResult.triggered_rules.map((rule) => (
                            <div key={rule.rule_id} className="rounded border border-slate-200 dark:border-slate-700 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {rule.rule_id}
                                </div>
                                <Badge variant={rule.verified ? 'success' : 'warning'} size="sm">
                                  {rule.level}
                                </Badge>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Action: {rule.action ?? 'inherit'}
                              </div>
                              <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                {rule.evidence.map((item) => (
                                  <li key={`${item.source}-${item.source_id}`}>
                                    {item.excerpt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
