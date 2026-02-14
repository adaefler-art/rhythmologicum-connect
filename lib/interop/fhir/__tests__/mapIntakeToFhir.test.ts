import { mapIntakeToFhir } from '../mapIntakeToFhir'

describe('mapIntakeToFhir', () => {
  it('maps intake to a FHIR-like bundle with patient, observations, conditions, and service requests', () => {
    const bundle = mapIntakeToFhir({
      intake: {
        id: 'intake-1',
        user_id: 'patient-user-123',
        version_number: 3,
        clinical_summary: 'Clinical summary',
        created_at: '2026-02-14T10:00:00.000Z',
        updated_at: '2026-02-14T11:00:00.000Z',
        structured_data: {
          chief_complaint: 'Palpitations',
          history_of_present_illness: {
            associated_symptoms: ['Dizziness', 'Dyspnea'],
          },
          vital_signs: {
            heart_rate: { value: 112, unit: 'bpm' },
            blood_pressure: '145/92',
          },
          reasoning: {
            differentials: [
              { label: 'Atrial fibrillation', likelihood: 'high' },
              { label: 'Anxiety-related tachycardia', likelihood: 'medium' },
            ],
            recommended_next_steps: ['12-lead ECG', 'Lab workup: TSH and electrolytes'],
          },
        },
      },
      generatedAt: '2026-02-14T12:00:00.000Z',
    })

    expect(bundle.resourceType).toBe('Bundle')
    expect(bundle.type).toBe('collection')
    expect(bundle.entry.length).toBeGreaterThanOrEqual(6)

    const patient = bundle.entry.find((entry) => entry.resource.resourceType === 'Patient')
    expect(patient).toBeDefined()

    const conditions = bundle.entry.filter((entry) => entry.resource.resourceType === 'Condition')
    expect(conditions).toHaveLength(2)
    expect(conditions[0]?.resource.verificationStatus).toEqual({ text: 'suspected' })

    const serviceRequests = bundle.entry.filter(
      (entry) => entry.resource.resourceType === 'ServiceRequest',
    )
    expect(serviceRequests).toHaveLength(2)
  })

  it('returns stable minimal bundle when optional data is absent', () => {
    const bundle = mapIntakeToFhir({
      intake: {
        id: 'intake-2',
        user_id: 'patient-user-456',
        version_number: 1,
        clinical_summary: null,
        created_at: '2026-02-14T10:00:00.000Z',
        updated_at: '2026-02-14T11:00:00.000Z',
        structured_data: {},
      },
      generatedAt: '2026-02-14T12:00:00.000Z',
    })

    expect(bundle).toMatchInlineSnapshot(`
{
  "entry": [
    {
      "fullUrl": "urn:rhythmologicum:fhir-like/Patient/patient-pt-e927ebe61b91",
      "resource": {
        "active": true,
        "id": "patient-pt-e927ebe61b91",
        "identifier": [
          {
            "system": "urn:rhythmologicum:pseudonym",
            "value": "PT-e927ebe61b91",
          },
        ],
        "resourceType": "Patient",
      },
    },
  ],
  "id": "bundle-intake-intake-2-v1",
  "meta": {
    "profile": [
      "https://rhythmologicum.dev/fhir-like/intake-bundle/v1",
    ],
    "source": "clinical-intake/intake-2",
  },
  "resourceType": "Bundle",
  "timestamp": "2026-02-14T12:00:00.000Z",
  "type": "collection",
}
`)
  })
})
