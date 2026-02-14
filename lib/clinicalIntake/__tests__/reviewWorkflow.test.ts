import { validateClinicalIntakeReviewInput } from '../reviewWorkflow'

describe('validateClinicalIntakeReviewInput', () => {
  it('accepts needs_more_info with requested_items and trims payload', () => {
    const result = validateClinicalIntakeReviewInput({
      status: 'needs_more_info',
      review_notes: '  ',
      requested_items: ['  Bitte Medikation angeben  ', 'Laborwerte nachreichen'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data).toEqual({
      status: 'needs_more_info',
      review_notes: null,
      requested_items: ['Bitte Medikation angeben', 'Laborwerte nachreichen'],
    })
  })

  it('rejects needs_more_info without requested_items', () => {
    const result = validateClinicalIntakeReviewInput({
      status: 'needs_more_info',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toContain('requested_items')
  })

  it('rejects approved without review_notes', () => {
    const result = validateClinicalIntakeReviewInput({
      status: 'approved',
      review_notes: '   ',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toContain('review_notes')
  })

  it('accepts rejected with review_notes', () => {
    const result = validateClinicalIntakeReviewInput({
      status: 'rejected',
      review_notes: 'Bitte vollständige Anamnese erneut erfassen.',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data).toEqual({
      status: 'rejected',
      review_notes: 'Bitte vollständige Anamnese erneut erfassen.',
      requested_items: null,
    })
  })

  it('rejects invalid status', () => {
    const result = validateClinicalIntakeReviewInput({
      status: 'unknown_state',
    })

    expect(result.ok).toBe(false)
  })
})
