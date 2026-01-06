'use client'

/**
 * Shipment Create Dialog - V05-I08.3
 * 
 * Dialog for creating new device shipments
 */

import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Input, Select, Textarea, Label } from '@/lib/ui'
import { X, Package } from 'lucide-react'
import { CreateShipmentRequest } from '@/lib/contracts/shipment'

type ShipmentCreateDialogProps = {
  onClose: () => void
  onShipmentCreated: () => void
  initialPatientId?: string
  initialTaskId?: string
}

type PatientOption = {
  id: string
  full_name: string | null
  user_id: string
}

export default function ShipmentCreateDialog({
  onClose,
  onShipmentCreated,
  initialPatientId,
  initialTaskId,
}: ShipmentCreateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<PatientOption[]>([])

  const [patientId, setPatientId] = useState(initialPatientId || '')
  const [deviceType, setDeviceType] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')

  // Load patients
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoadingPatients(true)
        const response = await fetch('/api/patient-profiles')
        if (!response.ok) {
          throw new Error('Failed to load patients')
        }
        const result = await response.json()
        setPatients(result.data ?? [])
      } catch (e) {
        console.error('Failed to load patients:', e)
        setError('Fehler beim Laden der Patienten')
      } finally {
        setLoadingPatients(false)
      }
    }

    loadPatients()
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      try {
        if (!patientId || !deviceType) {
          throw new Error('Bitte Patient:in und Gerätetyp auswählen')
        }

        const shipmentData: CreateShipmentRequest = {
          patient_id: patientId,
          task_id: initialTaskId,
          device_type: deviceType,
          device_serial_number: serialNumber || undefined,
          tracking_number: trackingNumber || undefined,
          carrier: carrier || undefined,
          shipping_address: shippingAddress || undefined,
          expected_delivery_at: expectedDeliveryDate || undefined,
          notes: notes || undefined,
        }

        const response = await fetch('/api/shipments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shipmentData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Fehler beim Erstellen der Sendung')
        }

        onShipmentCreated()
      } catch (e: unknown) {
        console.error(e)
        setError(e instanceof Error ? e.message : 'Fehler beim Erstellen der Sendung.')
      } finally {
        setLoading(false)
      }
    },
    [
      patientId,
      deviceType,
      serialNumber,
      trackingNumber,
      carrier,
      shippingAddress,
      expectedDeliveryDate,
      notes,
      initialTaskId,
      onShipmentCreated,
    ]
  )

  const patientOptions = patients.map((patient) => ({
    value: patient.id,
    label: patient.full_name || patient.user_id,
  }))

  const deviceTypeOptions = [
    { value: 'EKG-Gerät', label: 'EKG-Gerät' },
    { value: 'Blutdruckmessgerät', label: 'Blutdruckmessgerät' },
    { value: 'Blutzuckermessgerät', label: 'Blutzuckermessgerät' },
    { value: 'Fitness-Tracker', label: 'Fitness-Tracker' },
    { value: 'Pulsoximeter', label: 'Pulsoximeter' },
    { value: 'Andere', label: 'Andere' },
  ]

  const carrierOptions = [
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Neue Sendung erstellen
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <Label htmlFor="patient">Patient:in *</Label>
            <Select
              id="patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              disabled={loadingPatients || !!initialPatientId}
            >
              <option value="" disabled>
                {loadingPatients ? 'Lade Patienten...' : 'Patient:in auswählen'}
              </option>
              {patientOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Device Type */}
          <div>
            <Label htmlFor="deviceType">Gerätetyp *</Label>
            <Select
              id="deviceType"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              required
            >
              <option value="" disabled>
                Gerätetyp auswählen
              </option>
              {deviceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Serial Number */}
          <div>
            <Label htmlFor="serialNumber">Seriennummer (optional)</Label>
            <Input
              id="serialNumber"
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="z.B. SN123456"
            />
          </div>

          {/* Carrier */}
          <div>
            <Label htmlFor="carrier">Versanddienstleister (optional)</Label>
            <Select
              id="carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="">Versanddienstleister auswählen</option>
              {carrierOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Tracking Number */}
          <div>
            <Label htmlFor="trackingNumber">Tracking-Nummer (optional)</Label>
            <Input
              id="trackingNumber"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="z.B. 1234567890"
            />
          </div>

          {/* Shipping Address */}
          <div>
            <Label htmlFor="shippingAddress">Lieferadresse (optional)</Label>
            <Textarea
              id="shippingAddress"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Straße, PLZ, Ort"
              rows={3}
            />
          </div>

          {/* Expected Delivery Date */}
          <div>
            <Label htmlFor="expectedDeliveryDate">Erwartete Lieferung (optional)</Label>
            <Input
              id="expectedDeliveryDate"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen zur Sendung"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !patientId || !deviceType} className="flex-1">
              {loading ? 'Wird erstellt...' : 'Sendung erstellen'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
