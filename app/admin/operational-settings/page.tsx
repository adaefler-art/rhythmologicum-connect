'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/lib/ui/Card'
import { Button } from '@/lib/ui/Button'
import { LoadingSpinner } from '@/lib/ui/LoadingSpinner'
import { ErrorState } from '@/lib/ui/ErrorState'
import { Badge } from '@/lib/ui/Badge'
import { PageHeader } from '@/lib/ui/PageHeader'
import { Eye, EyeOff, Clock, Target, Bell, Edit2 } from 'lucide-react'
import { spacing } from '@/lib/design-tokens'

type Tab = 'templates' | 'rules' | 'thresholds' | 'audit'

interface NotificationTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  channel: string
  subject_template: string | null
  body_template: string
  variables: string[]
  is_active: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}

interface ReassessmentRule {
  id: string
  rule_name: string
  description: string | null
  funnel_id: string | null
  trigger_condition: Record<string, unknown>
  schedule_interval_days: number | null
  schedule_cron: string | null
  priority: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface KPIThreshold {
  id: string
  kpi_key: string
  name: string
  description: string | null
  metric_type: string
  warning_threshold: number | null
  critical_threshold: number | null
  target_threshold: number | null
  unit: string | null
  evaluation_period_days: number | null
  is_active: boolean
  notify_on_breach: boolean
  created_at: string
  updated_at: string
}

interface AuditLog {
  id: string
  table_name: string
  record_id: string
  operation: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
  change_reason: string | null
}

export default function OperationalSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])

  // Rules state
  const [rules, setRules] = useState<ReassessmentRule[]>([])

  // Thresholds state
  const [thresholds, setThresholds] = useState<KPIThreshold[]>([])

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditTotal, setAuditTotal] = useState(0)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'templates') {
        const response = await fetch('/api/admin/notification-templates')
        const data = await response.json()
        if (data.success) {
          setTemplates(data.data.templates || [])
        } else {
          setError(data.error?.message || 'Fehler beim Laden der Templates')
        }
      } else if (activeTab === 'rules') {
        const response = await fetch('/api/admin/reassessment-rules')
        const data = await response.json()
        if (data.success) {
          setRules(data.data.rules || [])
        } else {
          setError(data.error?.message || 'Fehler beim Laden der Regeln')
        }
      } else if (activeTab === 'thresholds') {
        const response = await fetch('/api/admin/kpi-thresholds')
        const data = await response.json()
        if (data.success) {
          setThresholds(data.data.thresholds || [])
        } else {
          setError(data.error?.message || 'Fehler beim Laden der KPI-Schwellenwerte')
        }
      } else if (activeTab === 'audit') {
        const response = await fetch('/api/admin/operational-settings-audit?limit=50')
        const data = await response.json()
        if (data.success) {
          setAuditLogs(data.data.auditLogs || [])
          setAuditTotal(data.data.total || 0)
        } else {
          setError(data.error?.message || 'Fehler beim Laden der Audit-Logs')
        }
      }
    } catch (err) {
      setError('Netzwerkfehler beim Laden der Daten')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleTemplateActive(id: string, currentState: boolean) {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/notification-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      })

      const data = await response.json()
      if (data.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: !currentState } : t)),
        )
      } else {
        alert('Fehler beim Aktualisieren: ' + (data.error?.message || 'Unbekannter Fehler'))
      }
    } catch {
      alert('Netzwerkfehler beim Aktualisieren')
    } finally {
      setSaving(false)
    }
  }

  async function toggleRuleActive(id: string, currentState: boolean) {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/reassessment-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      })

      const data = await response.json()
      if (data.success) {
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !currentState } : r)))
      } else {
        alert('Fehler beim Aktualisieren: ' + (data.error?.message || 'Unbekannter Fehler'))
      }
    } catch {
      alert('Netzwerkfehler beim Aktualisieren')
    } finally {
      setSaving(false)
    }
  }

  async function toggleThresholdActive(id: string, currentState: boolean) {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/kpi-thresholds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      })

      const data = await response.json()
      if (data.success) {
        setThresholds((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: !currentState } : t)),
        )
      } else {
        alert('Fehler beim Aktualisieren: ' + (data.error?.message || 'Unbekannter Fehler'))
      }
    } catch {
      alert('Netzwerkfehler beim Aktualisieren')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Betriebseinstellungen"
        description="Verwaltung von Benachrichtigungsvorlagen, Nachuntersuchungsregeln und KPI-Schwellenwerten"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700" style={{ marginBottom: spacing.lg }}>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'templates'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="inline-block w-4 h-4 mr-2" />
          Benachrichtigungen
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'rules'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="inline-block w-4 h-4 mr-2" />
          Nachuntersuchungen
        </button>
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'thresholds'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Target className="inline-block w-4 h-4 mr-2" />
          KPI-Schwellenwerte
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'audit'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Edit2 className="inline-block w-4 h-4 mr-2" />
          Änderungsprotokoll
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <>
          {activeTab === 'templates' && (
            <TemplatesTab
              templates={templates}
              onToggleActive={toggleTemplateActive}
              saving={saving}
            />
          )}
          {activeTab === 'rules' && (
            <RulesTab rules={rules} onToggleActive={toggleRuleActive} saving={saving} />
          )}
          {activeTab === 'thresholds' && (
            <ThresholdsTab
              thresholds={thresholds}
              onToggleActive={toggleThresholdActive}
              saving={saving}
            />
          )}
          {activeTab === 'audit' && <AuditTab auditLogs={auditLogs} total={auditTotal} />}
        </>
      )}
    </div>
  )
}

function TemplatesTab({
  templates,
  onToggleActive,
  saving,
}: {
  templates: NotificationTemplate[]
  onToggleActive: (id: string, currentState: boolean) => void
  saving: boolean
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Benachrichtigungsvorlagen</h2>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 ${template.is_active ? 'bg-white' : 'bg-neutral-50 opacity-75'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant={template.is_active ? 'success' : 'secondary'}>
                        {template.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      {template.is_system && <Badge variant="info">System</Badge>}
                      <Badge variant="secondary">{template.channel}</Badge>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">
                      Schlüssel:{' '}
                      <code className="bg-neutral-100 px-1 rounded">{template.template_key}</code>
                    </p>
                    {template.description && (
                      <p className="text-sm text-neutral-600 mb-2">{template.description}</p>
                    )}
                    {template.variables && template.variables.length > 0 && (
                      <div className="text-sm text-neutral-500">
                        Variablen: {template.variables.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(template.id, template.is_active)}
                      disabled={saving}
                    >
                      {template.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function RulesTab({
  rules,
  onToggleActive,
  saving,
}: {
  rules: ReassessmentRule[]
  onToggleActive: (id: string, currentState: boolean) => void
  saving: boolean
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Nachuntersuchungsregeln</h2>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${rule.is_active ? 'bg-white' : 'bg-neutral-50 opacity-75'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{rule.rule_name}</h3>
                      <Badge variant={rule.is_active ? 'success' : 'secondary'}>
                        {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <Badge
                        variant={
                          rule.priority === 'urgent'
                            ? 'danger'
                            : rule.priority === 'high'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {rule.priority}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-neutral-600 mb-2">{rule.description}</p>
                    )}
                    <div className="text-sm text-neutral-500">
                      {rule.schedule_interval_days && (
                        <span>Intervall: {rule.schedule_interval_days} Tage</span>
                      )}
                      {rule.schedule_cron && <span>Cron: {rule.schedule_cron}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(rule.id, rule.is_active)}
                      disabled={saving}
                    >
                      {rule.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function ThresholdsTab({
  thresholds,
  onToggleActive,
  saving,
}: {
  thresholds: KPIThreshold[]
  onToggleActive: (id: string, currentState: boolean) => void
  saving: boolean
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">KPI-Schwellenwerte</h2>
          <div className="space-y-3">
            {thresholds.map((threshold) => (
              <div
                key={threshold.id}
                className={`border rounded-lg p-4 ${threshold.is_active ? 'bg-white' : 'bg-neutral-50 opacity-75'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{threshold.name}</h3>
                      <Badge variant={threshold.is_active ? 'success' : 'secondary'}>
                        {threshold.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <Badge variant="secondary">{threshold.metric_type}</Badge>
                    </div>
                    {threshold.description && (
                      <p className="text-sm text-neutral-600 mb-2">{threshold.description}</p>
                    )}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {threshold.warning_threshold !== null && (
                        <div>
                          <span className="text-neutral-500">Warnung:</span>{' '}
                          <span className="font-medium text-yellow-600">
                            {threshold.warning_threshold} {threshold.unit}
                          </span>
                        </div>
                      )}
                      {threshold.critical_threshold !== null && (
                        <div>
                          <span className="text-neutral-500">Kritisch:</span>{' '}
                          <span className="font-medium text-red-600">
                            {threshold.critical_threshold} {threshold.unit}
                          </span>
                        </div>
                      )}
                      {threshold.target_threshold !== null && (
                        <div>
                          <span className="text-neutral-500">Ziel:</span>{' '}
                          <span className="font-medium text-green-600">
                            {threshold.target_threshold} {threshold.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(threshold.id, threshold.is_active)}
                      disabled={saving}
                    >
                      {threshold.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function AuditTab({ auditLogs, total }: { auditLogs: AuditLog[]; total: number }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Änderungsprotokoll ({total} Einträge)</h2>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        log.operation === 'INSERT'
                          ? 'success'
                          : log.operation === 'DELETE'
                            ? 'danger'
                            : 'info'
                      }
                    >
                      {log.operation}
                    </Badge>
                    <span className="font-medium">{log.table_name}</span>
                  </div>
                  <span className="text-neutral-500">
                    {new Date(log.changed_at).toLocaleString('de-DE')}
                  </span>
                </div>
                {log.change_reason && <p className="text-neutral-600 mb-2">{log.change_reason}</p>}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
