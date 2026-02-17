import { getUc1MissingRequiredFields } from '../uc1Completeness'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

describe('getUc1MissingRequiredFields', () => {
  it('returns no missing fields when UC1 minimum is complete and no medication is reported', () => {
    const structuredData: StructuredIntakeData = {
      status: 'draft',
      chief_complaint: 'Herzstolpern',
      history_of_present_illness: {
        onset: 'seit gestern',
        duration: 'jeweils 5 Minuten',
        course: 'zunehmend',
        trigger: 'bei Belastung',
        frequency: 'mehrfach taeglich',
      },
      medication: ['none_reported'],
      past_medical_history: ['Bluthochdruck'],
      prior_findings_documents: [{ id: 'doc-1', name: 'arztbrief.pdf' }],
    }

    expect(getUc1MissingRequiredFields(structuredData)).toEqual([])
  })

  it('requires medication details and photo upload when medication is present', () => {
    const structuredData: StructuredIntakeData = {
      status: 'draft',
      chief_complaint: 'Schwindel',
      history_of_present_illness: {
        onset: 'heute',
        duration: '15 Minuten',
        course: 'gleichbleibend',
        trigger: 'beim Aufstehen',
        frequency: '2x taeglich',
      },
      medication: ['Metoprolol'],
      past_medical_history: ['Hypertonie'],
      prior_findings_documents: [{ id: 'doc-2', name: 'befund.pdf' }],
    }

    expect(getUc1MissingRequiredFields(structuredData)).toEqual([
      'medication.details',
      'medication.photo_upload',
    ])
  })

  it('marks timeline and PMH fields as missing when incomplete', () => {
    const structuredData: StructuredIntakeData = {
      status: 'draft',
      chief_complaint: '',
      history_of_present_illness: {
        onset: '',
      },
      medication: [],
      past_medical_history: [],
      prior_findings_documents: [],
    }

    expect(getUc1MissingRequiredFields(structuredData)).toEqual([
      'chief_complaint',
      'history_of_present_illness.onset',
      'history_of_present_illness.course',
      'history_of_present_illness.duration',
      'history_of_present_illness.trigger',
      'history_of_present_illness.frequency',
      'medication',
      'past_medical_history',
      'prior_findings_documents',
    ])
  })
})
