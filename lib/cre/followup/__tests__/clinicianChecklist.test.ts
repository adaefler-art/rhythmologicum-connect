import {
  extractFollowupObjectiveReviewItems,
  getObjectiveRequestedItemSuggestions,
  mapObjectiveStatusToCaseChecklistStatus,
} from '@/lib/cre/followup/clinicianChecklist'

declare const describe: any
declare const it: any
declare const expect: any

describe('clinicianChecklist', () => {
  it('maps objective statuses to normalized case checklist statuses', () => {
    expect(mapObjectiveStatusToCaseChecklistStatus('resolved')).toBe('captured')
    expect(mapObjectiveStatusToCaseChecklistStatus('missing')).toBe('missing')
    expect(mapObjectiveStatusToCaseChecklistStatus('blocked_by_safety')).toBe(
      'delegated_to_physician',
    )
    expect(mapObjectiveStatusToCaseChecklistStatus('unexpected_status')).toBe('unclear')
  })

  it('extracts review items and falls back invalid/missing status to unclear/missing semantics', () => {
    const items = extractFollowupObjectiveReviewItems({
      followup: {
        objectives: [
          { id: 'objective:onset', label: 'Beschwerdebeginn', status: 'missing' },
          { id: 'objective:course', label: 'Beschwerdeverlauf', status: 'unexpected_status' },
          { id: 'objective:duration', label: 'Dauer' },
          { id: '', label: 'invalid', status: 'missing' },
        ],
      },
    })

    expect(items).toEqual([
      { id: 'objective:onset', label: 'Beschwerdebeginn', status: 'missing' },
      { id: 'objective:course', label: 'Beschwerdeverlauf', status: 'unclear' },
      { id: 'objective:duration', label: 'Dauer', status: 'missing' },
    ])
  })

  it('suggests requested items only for open-loop objectives', () => {
    const suggestions = getObjectiveRequestedItemSuggestions({
      followup: {
        active_objective_ids: ['objective:chief-complaint', 'objective:onset'],
        objectives: [
          { id: 'objective:chief-complaint', status: 'resolved' },
          { id: 'objective:onset', status: 'missing' },
          { id: 'objective:relevant-negatives', status: 'blocked_by_safety' },
        ],
      },
    })

    expect(suggestions).toEqual([
      'Bitte Beginn/erstes Auftreten zeitlich klären',
      'Bitte relevante Negativangaben ergänzen',
    ])
  })
})
