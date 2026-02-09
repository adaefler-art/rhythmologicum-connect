/**
 * Issue 7: Fact Extraction Tests
 * 
 * Unit tests for consultation fact extraction logic
 */

import { describe, it, expect } from '@jest/globals'
import type { ConsultNoteContent } from '@/lib/types/consultNote'
import { extractFactsFromConsultation, validateExtractedFacts } from '../factExtraction'

describe('extractFactsFromConsultation', () => {
  it('should extract stress level from problem list', () => {
    const content: ConsultNoteContent = {
      header: {
        timestamp: '2026-02-09T00:00:00Z',
        consultationType: 'first',
        source: 'PAT',
        uncertaintyProfile: 'qualitative',
        assertiveness: 'conservative',
        audience: 'patient',
      },
      chiefComplaint: { text: 'Feeling stressed' },
      hpi: {},
      redFlagsScreening: { screened: false, positive: [] },
      medicalHistory: {},
      medications: {},
      objectiveData: {},
      problemList: [
        'Work stress',
        'Sleep problems',
        'Anxiety',
        'Tension headaches',
        'Fatigue',
      ],
      preliminaryAssessment: { options: [] },
      missingData: { critical: [], helpful: [], contextual: [] },
      nextSteps: { patient: [], clinician: [] },
      handoffSummary: [],
    } as ConsultNoteContent

    const result = extractFactsFromConsultation({
      consultNoteId: 'test-consult-id',
      patientId: 'test-patient-id',
      content,
      consultationType: 'first',
      uncertaintyProfile: 'qualitative',
      minConfidence: 0.5,
    })

    expect(result.extractedFacts).toBeDefined()
    expect(result.extractedFacts.length).toBeGreaterThan(0)

    const stressFact = result.extractedFacts.find((f) => f.questionId === 'stress_level_overall')
    expect(stressFact).toBeDefined()
    expect(stressFact?.answerValue).toBe(7) // 5 problems → moderate-high (7)
    expect(stressFact?.confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('should extract sleep quality from objective data', () => {
    const content: ConsultNoteContent = {
      header: {
        timestamp: '2026-02-09T00:00:00Z',
        consultationType: 'first',
        source: 'PAT',
        uncertaintyProfile: 'qualitative',
        assertiveness: 'conservative',
        audience: 'patient',
      },
      chiefComplaint: { text: 'Sleep issues' },
      hpi: {},
      redFlagsScreening: { screened: false, positive: [] },
      medicalHistory: {},
      medications: {},
      objectiveData: {
        values: {
          sleep_hours: 8,
        },
      },
      problemList: [],
      preliminaryAssessment: { options: [] },
      missingData: { critical: [], helpful: [], contextual: [] },
      nextSteps: { patient: [], clinician: [] },
      handoffSummary: [],
    } as ConsultNoteContent

    const result = extractFactsFromConsultation({
      consultNoteId: 'test-consult-id',
      patientId: 'test-patient-id',
      content,
      consultationType: 'first',
      uncertaintyProfile: 'qualitative',
      minConfidence: 0.5,
    })

    const sleepFact = result.extractedFacts.find((f) => f.questionId === 'sleep_quality')
    expect(sleepFact).toBeDefined()
    expect(sleepFact?.answerValue).toBe(8) // 8 hours → good quality
    expect(sleepFact?.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('should extract red flags count when screening performed', () => {
    const content: ConsultNoteContent = {
      header: {
        timestamp: '2026-02-09T00:00:00Z',
        consultationType: 'first',
        source: 'PAT',
        uncertaintyProfile: 'qualitative',
        assertiveness: 'conservative',
        audience: 'patient',
      },
      chiefComplaint: { text: 'Chest pain' },
      hpi: {},
      redFlagsScreening: {
        screened: true,
        positive: ['Chest pain at rest', 'Shortness of breath'],
      },
      medicalHistory: {},
      medications: {},
      objectiveData: {},
      problemList: [],
      preliminaryAssessment: { options: [] },
      missingData: { critical: [], helpful: [], contextual: [] },
      nextSteps: { patient: [], clinician: [] },
      handoffSummary: [],
    } as ConsultNoteContent

    const result = extractFactsFromConsultation({
      consultNoteId: 'test-consult-id',
      patientId: 'test-patient-id',
      content,
      consultationType: 'first',
      uncertaintyProfile: 'qualitative',
      minConfidence: 0.5,
    })

    const redFlagsFact = result.extractedFacts.find((f) => f.questionId === 'red_flags_count')
    expect(redFlagsFact).toBeDefined()
    expect(redFlagsFact?.answerValue).toBe(2) // 2 positive red flags
    expect(redFlagsFact?.confidence).toBe(1.0) // Max confidence when screened
  })

  it('should filter facts below minimum confidence', () => {
    const content: ConsultNoteContent = {
      header: {
        timestamp: '2026-02-09T00:00:00Z',
        consultationType: 'first',
        source: 'PAT',
        uncertaintyProfile: 'qualitative',
        assertiveness: 'conservative',
        audience: 'patient',
      },
      chiefComplaint: { text: 'Test' },
      hpi: {},
      redFlagsScreening: { screened: false, positive: [] },
      medicalHistory: {},
      medications: {},
      objectiveData: {},
      problemList: ['Single problem'], // Low confidence due to count
      preliminaryAssessment: { options: [] },
      missingData: { critical: [], helpful: [], contextual: [] },
      nextSteps: { patient: [], clinician: [] },
      handoffSummary: [],
    } as ConsultNoteContent

    const resultLowThreshold = extractFactsFromConsultation({
      consultNoteId: 'test-consult-id',
      patientId: 'test-patient-id',
      content,
      consultationType: 'first',
      uncertaintyProfile: 'qualitative',
      minConfidence: 0.0, // Accept all
    })

    const resultHighThreshold = extractFactsFromConsultation({
      consultNoteId: 'test-consult-id',
      patientId: 'test-patient-id',
      content,
      consultationType: 'first',
      uncertaintyProfile: 'qualitative',
      minConfidence: 0.9, // High threshold
    })

    // With low threshold, should extract stress fact
    expect(resultLowThreshold.extractedFacts.length).toBeGreaterThan(0)

    // With high threshold, might filter out low-confidence facts
    expect(resultHighThreshold.extractedFacts.length).toBeLessThanOrEqual(
      resultLowThreshold.extractedFacts.length,
    )
  })

  it('should include extraction metadata', () => {
    const content: ConsultNoteContent = {
      header: {
        timestamp: '2026-02-09T00:00:00Z',
        consultationType: 'first',
        source: 'PAT',
        uncertaintyProfile: 'qualitative',
        assertiveness: 'conservative',
        audience: 'patient',
      },
      chiefComplaint: { text: 'Test' },
      hpi: {},
      redFlagsScreening: { screened: true, positive: [] },
      medicalHistory: {},
      medications: {},
      objectiveData: { values: { sleep_hours: 7 } },
      problemList: ['Problem 1', 'Problem 2', 'Problem 3'],
      preliminaryAssessment: { options: [] },
      missingData: { critical: [], helpful: [], contextual: [] },
      nextSteps: { patient: [], clinician: [] },
      handoffSummary: [],
    } as ConsultNoteContent

    const result = extractFactsFromConsultation({
      consultNoteId: 'test-consult-id',
      patientId: 'test-patient-id',
      content,
      consultationType: 'first',
      uncertaintyProfile: 'qualitative',
      minConfidence: 0.5,
    })

    expect(result.metadata).toBeDefined()
    expect(result.metadata?.consultationType).toBe('first')
    expect(result.metadata?.uncertaintyProfile).toBe('qualitative')
    expect(result.metadata?.totalFactsExtracted).toBe(result.extractedFacts.length)
    expect(result.metadata?.averageConfidence).toBeGreaterThan(0)
    expect(result.metadata?.averageConfidence).toBeLessThanOrEqual(1)
  })
})

describe('validateExtractedFacts', () => {
  it('should pass validation for valid facts', () => {
    const facts = [
      {
        questionId: 'stress_level_overall',
        answerValue: 7,
        confidence: 0.8,
        source: 'consultation.problem_list',
        extractedAt: new Date().toISOString(),
      },
    ]

    const result = validateExtractedFacts(facts)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail validation for non-integer answer value', () => {
    const facts = [
      {
        questionId: 'stress_level_overall',
        answerValue: 7.5, // Non-integer
        confidence: 0.8,
        source: 'consultation.problem_list',
        extractedAt: new Date().toISOString(),
      },
    ]

    const result = validateExtractedFacts(facts)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('must be integer')
  })

  it('should fail validation for out-of-range confidence', () => {
    const facts = [
      {
        questionId: 'stress_level_overall',
        answerValue: 7,
        confidence: 1.5, // > 1
        source: 'consultation.problem_list',
        extractedAt: new Date().toISOString(),
      },
    ]

    const result = validateExtractedFacts(facts)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('confidence must be 0-1')
  })

  it('should fail validation for missing source', () => {
    const facts = [
      {
        questionId: 'stress_level_overall',
        answerValue: 7,
        confidence: 0.8,
        source: '', // Empty source
        extractedAt: new Date().toISOString(),
      },
    ]

    const result = validateExtractedFacts(facts)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('Missing source attribution')
  })
})
