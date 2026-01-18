'use client'

/**
 * Shipment Detail Dialog - V05-I08.3
 * 
 * Dialog for viewing and updating shipment details
 * - View shipment information
 * - Update status
 * - Add tracking information
 * - View event history
 * - Send manual reminders
 */

import { useState, useCallback } from 'react'
import { Button, Card, Input, Select, Textarea, Label, Badge } from '@/lib/ui'
import { X, Package, Bell, AlertCircle } from 'lucide-react'
import {
  type DeviceShipment,
  type ShipmentStatus,
  SHIPMENT_STATUS,
  getShipmentStatusLabel,
  getShipmentStatusColor,
  getValidStatusTransitions,
  isShipmentOverdue,
} from '@/lib/contracts/shipment'

type ShipmentDetailDialogProps = {
  shipment: DeviceShipment
  onClose: () => void
  onShipmentUpdated: () => void
}

export default function ShipmentDetailDialog({
  shipment,
  onClose,
  onShipmentUpdated,
}: ShipmentDetailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [status, setStatus] = useState<ShipmentStatus>(shipment.status as ShipmentStatus)
  const [trackingNumber, setTrackingNumber] = useState(shipment.tracking_number || '')
  const [carrier, setCarrier] = useState(shipment.carrier || '')
  const [returnTrackingNumber, setReturnTrackingNumber] = useState(
    shipment.return_tracking_number || ''
  )
  const [returnReason, setReturnReason] = useState(shipment.return_reason || '')
  const [notes, setNotes] = useState(shipment.notes || '')

  const isOverdue = isShipmentOverdue(shipment)
  const validTransitions = getValidStatusTransitions(shipment.status as ShipmentStatus)

  const handleUpdate = useCallback(async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const updateData: Record<string, unknown> = {}

      if (status !== shipment.status) {
        updateData.status = status
      }
      if (trackingNumber !== shipment.tracking_number) {
        updateData.tracking_number = trackingNumber || null
      }
      if (carrier !== shipment.carrier) {
        updateData.carrier = carrier || null
      }
      if (returnTrackingNumber !== shipment.return_tracking_number) {
        updateData.return_tracking_number = returnTrackingNumber || null
      }
      if (returnReason !== shipment.return_reason) {
        updateData.return_reason = returnReason || null
      }
      if (notes !== shipment.notes) {
        updateData.notes = notes || null
      }

      if (Object.keys(updateData).length === 0) {
        setError('Keine Änderungen vorgenommen')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Fehler beim Aktualisieren der Sendung')
      }

      setSuccess('Sendung erfolgreich aktualisiert')
      setTimeout(() => {
        onShipmentUpdated()
      }, 1500)
    } catch (e: unknown) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren der Sendung.')
    } finally {
      setLoading(false)
    }
  }, [
    status,
    trackingNumber,
    carrier,
    returnTrackingNumber,
    returnReason,
    notes,
    shipment,
    onShipmentUpdated,
  ])

  const carrierOptions = [
    { value: '', label: 'Kein Versanddienstleister' },
    { value: 'DHL', label: 'DHL' },
    { value: 'DPD', label: 'DPD' },
    { value: 'Hermes', label: 'Hermes' },
    { value: 'UPS', label: 'UPS' },
    { value: 'FedEx', label: 'FedEx' },
    { value: 'GLS', label: 'GLS' },
    { value: 'Deutsche Post', label: 'Deutsche Post' },
    { value: 'Andere', label: 'Andere' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {shipment.device_type}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getShipmentStatusColor(shipment.status as ShipmentStatus)}>
                  {getShipmentStatusLabel(shipment.status as ShipmentStatus)}
                </Badge>
                {isOverdue && (
                  <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Überfällig
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}

          {/* Status Update */}
          <div>
            <Label htmlFor="status">Status aktualisieren</Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
            >
              {Array.from(
                new Set<ShipmentStatus>([
                  shipment.status as ShipmentStatus,
                  ...validTransitions,
                ])
              ).map((s) => (
                <option key={s} value={s}>
                  {getShipmentStatusLabel(s)}
                </option>
              ))}
            </Select>
          </div>

          {/* Tracking Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              Tracking-Informationen
            </h3>

            <div>
              <Label htmlFor="carrier">Versanddienstleister</Label>
              <Select
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              >
                {carrierOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="trackingNumber">Tracking-Nummer</Label>
              <Input
                id="trackingNumber"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="z.B. 1234567890"
              />
            </div>
          </div>

          {/* Return Information (if status is returned) */}
          {(status === SHIPMENT_STATUS.RETURNED || shipment.status === SHIPMENT_STATUS.RETURNED) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                Rücksendeinformationen
              </h3>

              <div>
                <Label htmlFor="returnTrackingNumber">Rücksende-Tracking-Nummer</Label>
                <Input
                  id="returnTrackingNumber"
                  type="text"
                  value={returnTrackingNumber}
                  onChange={(e) => setReturnTrackingNumber(e.target.value)}
                  placeholder="z.B. 1234567890"
                />
              </div>

              <div>
                <Label htmlFor="returnReason">Grund für Rücksendung</Label>
                <Textarea
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="z.B. defekt, ungenutzt, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen zur Sendung"
              rows={3}
            />
          </div>

          {/* Shipment Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Erstellt am:</span>
              <span className="font-medium">
                {new Date(shipment.created_at).toLocaleString('de-DE')}
              </span>
            </div>
            {shipment.expected_delivery_at && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Erwartete Lieferung:</span>
                <span className={`font-medium ${isOverdue ? 'text-orange-600' : ''}`}>
                  {new Date(shipment.expected_delivery_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Erinnerungen gesendet:</span>
              <span className="font-medium flex items-center gap-1">
                <Bell className="w-4 h-4" />
                {shipment.reminder_count}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleUpdate} disabled={loading} className="flex-1">
              {loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Schließen
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
