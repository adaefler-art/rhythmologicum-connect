type CaseChecklistStatus = 'captured' | 'missing' | 'unclear' | 'delegated_to_physician'

type FollowupObjectiveReviewItem = {
  id: string
  label: string
  status: CaseChecklistStatus
}

const OBJECTIVE_REQUEST_TEXT: Record<string, string> = {
  'objective:chief-complaint': 'Bitte Hauptanliegen/Leitsymptom präzisieren',
  'objective:onset': 'Bitte Beginn/erstes Auftreten zeitlich klären',
  'objective:duration': 'Bitte Dauer/Frequenz genauer erfassen',
  'objective:course': 'Bitte Verlauf (stabil/verschlechtert/gebessert) konkretisieren',
  'objective:trigger': 'Bitte erkennbare Auslöser/Trigger der Beschwerden erfassen',
  'objective:frequency': 'Bitte Häufigkeit der Beschwerden genauer erfassen',
  'objective:medication': 'Bitte aktuelle Medikation/NEM vollständig erfassen',
  'objective:past-medical-history': 'Bitte relevante Vorerkrankungen ergänzen',
  'objective:prior-findings-upload': 'Bitte Vorbefunde/Arztbriefe nachreichen oder Upload klären',
  'objective:psychosocial': 'Bitte psychosoziale Belastungsfaktoren ergänzen',
  'objective:associated-symptoms': 'Bitte Begleitsymptome strukturiert erfassen',
  'objective:aggravating-relieving-factors':
    'Bitte verstärkende/lindernde Faktoren konkretisieren',
  'objective:relevant-negatives': 'Bitte relevante Negativangaben ergänzen',
}

export const mapObjectiveStatusToCaseChecklistStatus = (status: string): CaseChecklistStatus => {
  if (status === 'answered' || status === 'resolved' || status === 'verified') return 'captured'
  if (status === 'missing') return 'missing'
  if (status === 'blocked_by_safety') return 'delegated_to_physician'
  return 'unclear'
}

export const extractFollowupObjectiveReviewItems = (
  structuredIntakeData: Record<string, unknown> | null,
): FollowupObjectiveReviewItem[] => {
  if (!structuredIntakeData) return []

  const followup = structuredIntakeData.followup
  if (!followup || typeof followup !== 'object' || Array.isArray(followup)) return []

  const followupRecord = followup as Record<string, unknown>
  if (!Array.isArray(followupRecord.objectives)) return []

  return followupRecord.objectives
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => {
      const id = typeof entry.id === 'string' ? entry.id : ''
      const label = typeof entry.label === 'string' && entry.label.trim().length > 0 ? entry.label : id
      const rawStatus = typeof entry.status === 'string' ? entry.status : 'missing'

      return {
        id,
        label,
        status: mapObjectiveStatusToCaseChecklistStatus(rawStatus),
      }
    })
    .filter((entry) => entry.id)
}

export const getObjectiveRequestedItemSuggestions = (structuredIntakeData: Record<string, unknown> | null) => {
  if (!structuredIntakeData) return [] as string[]

  const followup = structuredIntakeData.followup
  if (!followup || typeof followup !== 'object' || Array.isArray(followup)) return [] as string[]

  const followupRecord = followup as Record<string, unknown>
  const activeObjectiveIds = Array.isArray(followupRecord.active_objective_ids)
    ? followupRecord.active_objective_ids.filter((id): id is string => typeof id === 'string')
    : []

  const objectiveStatuses = Array.isArray(followupRecord.objectives)
    ? followupRecord.objectives
        .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
        .filter((entry) => {
          const status =
            typeof entry.status === 'string' ? mapObjectiveStatusToCaseChecklistStatus(entry.status) : 'missing'
          return status === 'missing' || status === 'unclear' || status === 'delegated_to_physician'
        })
        .map((entry) => entry.id)
        .filter((id): id is string => typeof id === 'string')
    : []

  const candidateIds = objectiveStatuses.length > 0 ? objectiveStatuses : activeObjectiveIds

  return Array.from(new Set(candidateIds))
    .map((id) => OBJECTIVE_REQUEST_TEXT[id])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .slice(0, 3)
}

export type { CaseChecklistStatus, FollowupObjectiveReviewItem }
