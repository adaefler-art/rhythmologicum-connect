'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/lib/ui/mobile-v2'
import { ArrowLeft, ChevronRight, ClipboardList, Clock } from '@/lib/ui/mobile-v2/icons'

type OnsetPreset = 'today' | 'week' | 'month' | 'longer' | null

type StressScale = 1 | 2 | 3 | 4 | 5 | null

const ONSET_OPTIONS: Array<{ id: Exclude<OnsetPreset, null>; label: string }> = [
  { id: 'today', label: 'Heute' },
  { id: 'week', label: 'Seit < 1 Woche' },
  { id: 'month', label: 'Seit > 1 Woche' },
  { id: 'longer', label: 'Seit > 1 Monat' },
]

export default function PatientFastpassPage() {
  const router = useRouter()

  const [chiefConcern, setChiefConcern] = useState('')
  const [mainSymptom, setMainSymptom] = useState('')
  const [onsetPreset, setOnsetPreset] = useState<OnsetPreset>(null)
  const [takesMedication, setTakesMedication] = useState<boolean | null>(null)
  const [medicationNotes, setMedicationNotes] = useState('')
  const [stressScale, setStressScale] = useState<StressScale>(null)
  const [submitted, setSubmitted] = useState(false)

  const canSubmit = useMemo(
    () =>
      chiefConcern.trim().length > 0 &&
      mainSymptom.trim().length > 0 &&
      onsetPreset !== null &&
      takesMedication !== null &&
      stressScale !== null,
    [chiefConcern, mainSymptom, onsetPreset, stressScale, takesMedication],
  )

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitted(true)
  }

  return (
    <div className="w-full overflow-x-hidden bg-slate-50">
      <div className="mx-auto flex min-h-[calc(100dvh-56px)] w-full max-w-3xl flex-col px-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="md"
            icon={<ArrowLeft className="h-5 w-5" />}
            onClick={() => router.push('/patient/start')}
          >
            Zurueck
          </Button>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
            Fastpass (Form-first)
          </div>
        </header>

        <Card className="border border-slate-200" padding="lg" shadow="sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900">
              <ClipboardList className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Wartezimmer-Fastpass</h1>
            </div>
            <p className="text-sm text-slate-600">
              Kurze, tip-freundliche Erfassung fuer die Erstorientierung. Keine Spracheingabe.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
              <Clock className="h-4 w-4" />
              Zielzeit: unter 5 Minuten
            </div>
          </div>
        </Card>

        <div className="mt-4 space-y-4">
          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <label className="mb-2 block text-sm font-semibold text-slate-900">Hauptanliegen</label>
            <textarea
              value={chiefConcern}
              onChange={(event) => setChiefConcern(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-500"
              placeholder="Was ist heute Ihr wichtigstes Anliegen?"
            />
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <label className="mb-2 block text-sm font-semibold text-slate-900">Hauptsymptom</label>
            <input
              value={mainSymptom}
              onChange={(event) => setMainSymptom(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-500"
              placeholder="z. B. Brustschmerz, Schwindel, Atemnot"
            />
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <p className="mb-2 text-sm font-semibold text-slate-900">Beginn der Beschwerden</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ONSET_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  variant={onsetPreset === option.id ? 'primary' : 'secondary'}
                  size="lg"
                  fullWidth
                  onClick={() => setOnsetPreset(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <p className="mb-2 text-sm font-semibold text-slate-900">Nehmen Sie Medikamente?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={takesMedication === true ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={() => setTakesMedication(true)}
              >
                Ja
              </Button>
              <Button
                variant={takesMedication === false ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={() => setTakesMedication(false)}
              >
                Nein
              </Button>
            </div>

            {takesMedication === true && (
              <div className="mt-3">
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Kurz notieren (Name/Frequenz)
                </label>
                <textarea
                  value={medicationNotes}
                  onChange={(event) => setMedicationNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-500"
                  placeholder="z. B. Metoprolol 1x taeglich"
                />
              </div>
            )}
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <p className="mb-2 text-sm font-semibold text-slate-900">Belastungsgrad (1-5)</p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant={stressScale === value ? 'primary' : 'secondary'}
                  size="lg"
                  fullWidth
                  onClick={() => setStressScale(value as StressScale)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </Card>

          {!submitted ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<ChevronRight className="h-5 w-5" />}
              iconPosition="right"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Fastpass abschliessen
            </Button>
          ) : (
            <Card className="border border-emerald-200 bg-emerald-50" padding="lg" shadow="sm">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-emerald-900">
                  Fastpass erfasst. Sie koennen jetzt im Dialog fortsetzen.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<ChevronRight className="h-5 w-5" />}
                  iconPosition="right"
                  onClick={() => router.push('/patient/dialog?context=fastpass')}
                >
                  Weiter zu PAT
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
