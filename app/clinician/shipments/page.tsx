'use client'

/**
 * Shipments Management Page - V05-I08.3
 * 
 * Clinician interface for managing device shipments
 * - View shipment list with status badges
 * - Create new shipments
 * - Update shipment status and tracking
 * - View shipment history and events
 * - Send manual reminders
 */

import { useEffect, useState, useCallback } from 'react'
import { Button, Card, Table, LoadingSpinner, ErrorState, Badge } from '@/lib/ui'
import type { TableColumn } from '@/lib/ui/Table'
import {
  Package,
  Plus,
  TruckIcon,
  Bell,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react'
import {
  type DeviceShipment,
  SHIPMENT_STATUS,
  ShipmentStatus,
  getShipmentStatusLabel,
  getShipmentStatusColor,
  isShipmentOverdue,
} from '@/lib/contracts/shipment'
import ShipmentCreateDialog from './ShipmentCreateDialog'
import ShipmentDetailDialog from './ShipmentDetailDialog'

type ShipmentWithPatient = DeviceShipment & {
  patient_profiles: {
    id: string
    full_name: string | null
    user_id: string
  } | null
}

export default function ShipmentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shipments, setShipments] = useState<ShipmentWithPatient[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithPatient | null>(null)
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all')
  const [overdueOnly, setOverdueOnly] = useState(false)

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (overdueOnly) {
        params.append('needs_reminder', 'true')
      }

      const response = await fetch(`/api/shipments?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Fehler beim Laden der Sendungen')
      }

      setShipments(result.data ?? [])
    } catch (e: unknown) {
      console.error('Failed to load shipments:', e)
      const errorMessage = e instanceof Error ? e.message : 'Fehler beim Laden der Sendungen.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, overdueOnly])

  useEffect(() => {
    loadShipments()
  }, [loadShipments])

  const handleShipmentCreated = useCallback(() => {
    setShowCreateDialog(false)
    loadShipments()
  }, [loadShipments])

  const handleShipmentUpdated = useCallback(() => {
    setSelectedShipment(null)
    loadShipments()
  }, [loadShipments])

  const columns: TableColumn<ShipmentWithPatient>[] = [
    {
      header: 'Patient:in',
      accessor: 'patient_profiles',
      render: (patient) => (
        <span className="font-medium">
          {patient?.full_name || patient?.user_id || 'Unbekannt'}
        </span>
      ),
    },
    {
      header: 'Gerät',
      accessor: 'device_type',
      render: (deviceType) => <span className="text-sm">{deviceType}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status, shipment) => {
        const isOverdue = isShipmentOverdue(shipment)
        return (
          <div className="flex items-center gap-2">
            <Badge className={getShipmentStatusColor(status as ShipmentStatus)}>
              {getShipmentStatusLabel(status as ShipmentStatus)}
            </Badge>
            {isOverdue && (
              <AlertCircle className="w-4 h-4 text-orange-500" title="Überfällig" />
            )}
          </div>
        )
      },
    },
    {
      header: 'Tracking-Nr.',
      accessor: 'tracking_number',
      render: (trackingNumber) => (
        <span className="text-sm font-mono">
          {trackingNumber || <span className="text-slate-400">—</span>}
        </span>
      ),
    },
    {
      header: 'Erwartete Lieferung',
      accessor: 'expected_delivery_at',
      render: (date) => {
        if (!date) return <span className="text-slate-400">—</span>
        const deliveryDate = new Date(date)
        const isOverdue = deliveryDate < new Date()
        return (
          <span className={isOverdue ? 'text-orange-600 font-medium' : 'text-sm'}>
            {deliveryDate.toLocaleDateString('de-DE')}
          </span>
        )
      },
    },
    {
      header: 'Erinnerungen',
      accessor: 'reminder_count',
      render: (count) => (
        <div className="flex items-center gap-1">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{count || 0}</span>
        </div>
      ),
    },
    {
      header: 'Erstellt am',
      accessor: 'created_at',
      render: (date) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(date).toLocaleDateString('de-DE')}
        </span>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Geräteversand
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Versandstatus verwalten und Erinnerungen senden
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} icon={<Plus className="w-4 h-4" />}>
          Neue Sendung
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
            >
              <option value="all">Alle</option>
              <option value={SHIPMENT_STATUS.ORDERED}>Bestellt</option>
              <option value={SHIPMENT_STATUS.SHIPPED}>Versendet</option>
              <option value={SHIPMENT_STATUS.IN_TRANSIT}>Unterwegs</option>
              <option value={SHIPMENT_STATUS.DELIVERED}>Zugestellt</option>
              <option value={SHIPMENT_STATUS.RETURNED}>Zurückgesendet</option>
              <option value={SHIPMENT_STATUS.CANCELLED}>Storniert</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overdueOnly"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="overdueOnly"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Nur überfällige Sendungen
            </label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadShipments}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Aktualisieren
          </Button>
        </div>
      </Card>

      {/* Shipments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState
          title="Fehler beim Laden"
          message={error}
          actionLabel="Erneut versuchen"
          onAction={loadShipments}
        />
      ) : shipments.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Keine Sendungen vorhanden
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {statusFilter !== 'all' || overdueOnly
              ? 'Keine Sendungen entsprechen den Filterkriterien.'
              : 'Erstellen Sie eine neue Sendung, um zu beginnen.'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)} icon={<Plus className="w-4 h-4" />}>
            Neue Sendung erstellen
          </Button>
        </Card>
      ) : (
        <Card>
          <Table
            data={shipments}
            columns={columns}
            onRowClick={(shipment) => setSelectedShipment(shipment)}
            className="cursor-pointer"
          />
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {shipments.length} {shipments.length === 1 ? 'Sendung' : 'Sendungen'} angezeigt
            </p>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <ShipmentCreateDialog
          onClose={() => setShowCreateDialog(false)}
          onShipmentCreated={handleShipmentCreated}
        />
      )}

      {selectedShipment && (
        <ShipmentDetailDialog
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onShipmentUpdated={handleShipmentUpdated}
        />
      )}
    </div>
  )
}
