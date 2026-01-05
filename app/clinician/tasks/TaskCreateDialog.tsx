'use client'

/**
 * Task Create Dialog - V05-I07.4
 * 
 * Dialog for creating new tasks
 */

import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Input, Select, Textarea, Label } from '@/lib/ui'
import { X } from 'lucide-react'
import {
  TASK_TYPE,
  USER_ROLE,
  CreateTaskRequest,
  TaskType,
  UserRole,
  getTaskTypeLabel,
  getUserRoleLabel,
} from '@/lib/contracts/task'

type TaskCreateDialogProps = {
  onClose: () => void
  onTaskCreated: () => void
}

type PatientOption = {
  id: string
  full_name: string | null
  user_id: string
}

export default function TaskCreateDialog({ onClose, onTaskCreated }: TaskCreateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<PatientOption[]>([])

  const [patientId, setPatientId] = useState('')
  const [taskType, setTaskType] = useState<TaskType>(TASK_TYPE.LDL_MEASUREMENT)
  const [assignedToRole, setAssignedToRole] = useState<UserRole>(USER_ROLE.CLINICIAN)
  const [dueDate, setDueDate] = useState('')
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
        // Continue even if we can't load patients - user can still type patient ID
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
        const taskData: CreateTaskRequest = {
          patient_id: patientId,
          assigned_to_role: assignedToRole,
          task_type: taskType,
          payload: notes ? { notes } : undefined,
          due_at: dueDate || undefined,
        }

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Failed to create task')
        }

        onTaskCreated()
      } catch (e: unknown) {
        console.error(e)
        setError(e instanceof Error ? e.message : 'Fehler beim Erstellen der Aufgabe.')
      } finally {
        setLoading(false)
      }
    },
    [patientId, assignedToRole, taskType, notes, dueDate, onTaskCreated]
  )

  const taskTypeOptions = Object.values(TASK_TYPE).map((type) => ({
    value: type,
    label: getTaskTypeLabel(type),
  }))

  const roleOptions = [USER_ROLE.CLINICIAN, USER_ROLE.NURSE].map((role) => ({
    value: role,
    label: getUserRoleLabel(role),
  }))

  const patientOptions = patients.map((patient) => ({
    value: patient.id,
    label: patient.full_name || patient.user_id,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Neue Aufgabe erstellen
          </h2>
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
              disabled={loadingPatients}
            >
              <option value="">Bitte wählen...</option>
              {patientOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {loadingPatients && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Patienten werden geladen...
              </p>
            )}
          </div>

          {/* Task Type */}
          <div>
            <Label htmlFor="taskType">Aufgabentyp *</Label>
            <Select
              id="taskType"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              required
            >
              {taskTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Assigned To Role */}
          <div>
            <Label htmlFor="assignedToRole">Zuweisen an *</Label>
            <Select
              id="assignedToRole"
              value={assignedToRole}
              onChange={(e) => setAssignedToRole(e.target.value as UserRole)}
              required
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen zur Aufgabe..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Aufgabe erstellen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
