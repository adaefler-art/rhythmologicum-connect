'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Badge, LoadingSpinner, ErrorState } from '@/lib/ui'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Package,
  Workflow,
  FileText,
  Palette,
  History,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type NavigationItem = {
  id: string
  route: string
  default_label: string
  default_icon: string | null
  default_order: number
  is_system: boolean
  description: string | null
}

type NavigationItemConfig = {
  id: string
  role: string
  navigation_item_id: string
  is_enabled: boolean
  custom_label: string | null
  custom_icon: string | null
  order_index: number
}

type RoleConfig = {
  item: NavigationItem
  config: NavigationItemConfig | null
}

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'clinician', label: 'Clinician' },
  { value: 'admin', label: 'Administrator' },
  { value: 'nurse', label: 'Nurse' },
] as const

type Role = (typeof ROLES)[number]['value']

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  ClipboardCheck: <ClipboardCheck className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Workflow: <Workflow className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  History: <History className="w-5 h-5" />,
}

export default function NavigationConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<NavigationItem[]>([])
  const [configs, setConfigs] = useState<NavigationItemConfig[]>([])
  const [selectedRole, setSelectedRole] = useState<Role>('clinician')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadNavigationConfig()
  }, [])

  const loadNavigationConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/navigation')

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Navigation-Konfiguration')
      }

      const data = await response.json()
      setItems(data.data.items || [])
      setConfigs(data.data.configs || [])
      setHasChanges(false)
    } catch (err) {
      console.error('Error loading navigation config:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const getRoleConfigs = (role: Role): RoleConfig[] => {
    return items.map((item) => {
      const config = configs.find(
        (c) => c.role === role && c.navigation_item_id === item.id,
      )
      return { item, config }
    })
  }

  const getCurrentRoleConfigs = (): RoleConfig[] => {
    return getRoleConfigs(selectedRole)
      .filter((rc) => rc.config !== null)
      .sort((a, b) => (a.config?.order_index ?? 0) - (b.config?.order_index ?? 0))
  }

  const toggleItemEnabled = (navigationItemId: string) => {
    setConfigs((prev) => {
      const config = prev.find(
        (c) => c.role === selectedRole && c.navigation_item_id === navigationItemId,
      )

      if (config) {
        // Toggle existing config
        return prev.map((c) =>
          c.role === selectedRole && c.navigation_item_id === navigationItemId
            ? { ...c, is_enabled: !c.is_enabled }
            : c,
        )
      } else {
        // Add new config (enabled by default when added)
        const item = items.find((i) => i.id === navigationItemId)
        if (!item) return prev

        const newConfig: NavigationItemConfig = {
          id: `temp-${Date.now()}`,
          role: selectedRole,
          navigation_item_id: navigationItemId,
          is_enabled: true,
          custom_label: null,
          custom_icon: null,
          order_index: prev.filter((c) => c.role === selectedRole).length,
        }
        return [...prev, newConfig]
      }
    })
    setHasChanges(true)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const roleConfigs = getCurrentRoleConfigs()
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === roleConfigs.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updatedConfigs = [...roleConfigs]
    ;[updatedConfigs[index], updatedConfigs[newIndex]] = [
      updatedConfigs[newIndex],
      updatedConfigs[index],
    ]

    // Update order_index for all items
    const reorderedConfigs = updatedConfigs.map((rc, idx) => ({
      ...rc.config!,
      order_index: idx,
    }))

    setConfigs((prev) => {
      const otherRoleConfigs = prev.filter((c) => c.role !== selectedRole)
      return [...otherRoleConfigs, ...reorderedConfigs]
    })
    setHasChanges(true)
  }

  const saveChanges = async () => {
    try {
      setSaving(true)
      setError(null)

      const roleConfigs = configs
        .filter((c) => c.role === selectedRole)
        .map((c) => ({
          navigation_item_id: c.navigation_item_id,
          is_enabled: c.is_enabled,
          custom_label: c.custom_label,
          custom_icon: c.custom_icon,
          order_index: c.order_index,
        }))

      const response = await fetch(`/api/admin/navigation/${selectedRole}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configs: roleConfigs }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Konfiguration')
      }

      await loadNavigationConfig()
      setHasChanges(false)
    } catch (err) {
      console.error('Error saving navigation config:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const resetChanges = () => {
    loadNavigationConfig()
    setHasChanges(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Lade Navigation-Konfiguration…" centered />
      </div>
    )
  }

  if (error && items.length === 0) {
    return <ErrorState message={error} />
  }

  const currentRoleConfigs = getCurrentRoleConfigs()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Navigation verwalten
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Konfigurieren Sie die Navigation für verschiedene Benutzerrollen
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button variant="secondary" onClick={resetChanges} disabled={saving}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Zurücksetzen
              </Button>
              <Button onClick={saveChanges} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Speichern…' : 'Änderungen speichern'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Role Selector */}
      <Card>
        <div className="p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Rolle auswählen
          </label>
          <div className="flex gap-2">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedRole === role.value
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Navigation Items List */}
      <Card>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Navigation für {ROLES.find((r) => r.value === selectedRole)?.label}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Aktivieren/deaktivieren Sie Menüpunkte und ändern Sie die Reihenfolge
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {currentRoleConfigs.map((rc, index) => {
            const isEnabled = rc.config?.is_enabled ?? false
            const icon =
              ICON_MAP[rc.config?.custom_icon || rc.item.default_icon || 'FileText']

            return (
              <div
                key={rc.item.id}
                className={`p-4 flex items-center gap-4 ${
                  !isEnabled ? 'opacity-50' : ''
                }`}
              >
                {/* Drag Handle */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0 || !isEnabled}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GripVertical className="w-4 h-4 text-slate-400 rotate-180" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === currentRoleConfigs.length - 1 || !isEnabled}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 text-slate-500 dark:text-slate-400">
                  {icon}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {rc.config?.custom_label || rc.item.default_label}
                    </p>
                    {rc.item.is_system && (
                      <Badge variant="secondary" size="sm">
                        System
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {rc.item.route}
                  </p>
                  {rc.item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {rc.item.description}
                    </p>
                  )}
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  onClick={() => toggleItemEnabled(rc.item.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isEnabled
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title={isEnabled ? 'Deaktivieren' : 'Aktivieren'}
                >
                  {isEnabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            )
          })}

          {currentRoleConfigs.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Keine Navigation-Einträge für diese Rolle konfiguriert
            </div>
          )}
        </div>
      </Card>

      {/* Available Items to Add */}
      <Card>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Verfügbare Navigation-Einträge
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Klicken Sie auf einen Eintrag, um ihn zur Navigation hinzuzufügen
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {items
            .filter(
              (item) =>
                !configs.find(
                  (c) => c.role === selectedRole && c.navigation_item_id === item.id,
                ),
            )
            .map((item) => {
              const icon = ICON_MAP[item.default_icon || 'FileText']

              return (
                <button
                  key={item.id}
                  onClick={() => toggleItemEnabled(item.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex-shrink-0 text-slate-500 dark:text-slate-400">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {item.default_label}
                      </p>
                      {item.is_system && (
                        <Badge variant="secondary" size="sm">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {item.route}
                    </p>
                  </div>
                </button>
              )
            })}

          {items.filter(
            (item) =>
              !configs.find(
                (c) => c.role === selectedRole && c.navigation_item_id === item.id,
              ),
          ).length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Alle verfügbaren Einträge sind bereits hinzugefügt
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
