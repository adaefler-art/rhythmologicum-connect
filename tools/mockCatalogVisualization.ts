// Mock data showing how the catalog will look with new funnels
// This represents the data structure returned by GET /api/funnels/catalog

export const mockCatalogData = {
  success: true,
  data: {
    pillars: [
      {
        pillar: {
          id: 'nutrition-uuid',
          key: 'nutrition',
          title: 'Ernährung',
          description: 'Assessments zur Ernährung und gesunden Essgewohnheiten',
          sort_order: 1
        },
        funnels: [
          {
            id: 'heart-nutrition-uuid',
            slug: 'heart-health-nutrition',
            title: 'Heart Health Nutrition',
            pillar_id: 'nutrition',
            description: 'Bewertung Ihrer Ernährungsgewohnheiten für optimale Herzgesundheit',
            subtitle: null,
            est_duration_min: 12,
            outcomes: [
              'Ernährungsmuster analysieren',
              'Herzgesunde Lebensmittel identifizieren',
              'Personalisierte Ernährungstipps erhalten'
            ],
            is_active: true,
            default_version_id: 'version-uuid-1',
            default_version: '1.0.0'
          }
        ]
      },
      {
        pillar: {
          id: 'sleep-uuid',
          key: 'sleep',
          title: 'Schlaf',
          description: 'Assessments zur Schlafqualität und Schlafhygiene',
          sort_order: 3
        },
        funnels: [
          {
            id: 'sleep-quality-uuid',
            slug: 'sleep-quality',
            title: 'Sleep Quality Assessment',
            pillar_id: 'sleep',
            description: 'Umfassende Bewertung Ihrer Schlafqualität und Schlafhygiene',
            subtitle: null,
            est_duration_min: 10,
            outcomes: [
              'Schlafqualität bewerten',
              'Schlafstörungen erkennen',
              'Verbesserungstipps erhalten'
            ],
            is_active: true,
            default_version_id: 'version-uuid-2',
            default_version: '1.0.0'
          }
        ]
      },
      {
        pillar: {
          id: 'mental-health-uuid',
          key: 'mental-health',
          title: 'Mentale Gesundheit & Stressmanagement',
          description: 'Assessments zu Stress, Resilienz und mentaler Balance',
          sort_order: 4
        },
        funnels: [
          {
            id: 'stress-uuid',
            slug: 'stress-assessment',
            title: 'Stress Assessment',
            pillar_id: 'mental-health',
            description: 'Ein wissenschaftlich validiertes Assessment zur Messung von Stress und psychischer Belastung',
            subtitle: null,
            est_duration_min: 10,
            outcomes: [
              'Stresslevel ermitteln',
              'Risikofaktoren identifizieren',
              'Handlungsempfehlungen erhalten'
            ],
            is_active: true,
            default_version_id: 'version-uuid-3',
            default_version: '1.0.0'
          }
        ]
      },
      {
        pillar: {
          id: 'prevention-uuid',
          key: 'prevention',
          title: 'Prävention & Gesundheitsvorsorge',
          description: 'Assessments zur Vorsorge und Krankheitsprävention',
          sort_order: 7
        },
        funnels: [
          {
            id: 'cv-age-uuid',
            slug: 'cardiovascular-age',
            title: 'Cardiovascular Age Assessment',
            pillar_id: 'prevention',
            description: 'Bestimmen Sie Ihr kardiovaskuläres Alter basierend auf Risikofaktoren und Lebensstil',
            subtitle: null,
            est_duration_min: 8,
            outcomes: [
              'CV-Alter ermitteln',
              'Risikofaktoren identifizieren',
              'Präventionsstrategien erhalten'
            ],
            is_active: true,
            default_version_id: 'version-uuid-4',
            default_version: '1.0.0'
          }
        ]
      }
    ],
    uncategorized_funnels: []
  }
}

// Expected UI structure
export const expectedUILayout = `
┌─────────────────────────────────────────────────────────────┐
│                    Patient Funnel Catalog                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 Ernährung                                                │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Heart Health Nutrition                          12 min│  │
│  │ Bewertung Ihrer Ernährungsgewohnheiten für optimale   │  │
│  │ Herzgesundheit                                        │  │
│  │                                                       │  │
│  │ ✓ Ernährungsmuster analysieren                       │  │
│  │ ✓ Herzgesunde Lebensmittel identifizieren            │  │
│  │ ✓ Personalisierte Ernährungstipps erhalten           │  │
│  │                                                       │  │
│  │                              [Starten →]             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  😴 Schlaf                                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Sleep Quality Assessment                        10 min│  │
│  │ Umfassende Bewertung Ihrer Schlafqualität und         │  │
│  │ Schlafhygiene                                         │  │
│  │                                                       │  │
│  │ ✓ Schlafqualität bewerten                            │  │
│  │ ✓ Schlafstörungen erkennen                           │  │
│  │ ✓ Verbesserungstipps erhalten                        │  │
│  │                                                       │  │
│  │                              [Starten →]             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🧠 Mentale Gesundheit & Stressmanagement                   │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Stress Assessment                               10 min│  │
│  │ Ein wissenschaftlich validiertes Assessment zur       │  │
│  │ Messung von Stress und psychischer Belastung         │  │
│  │                                                       │  │
│  │ ✓ Stresslevel ermitteln                              │  │
│  │ ✓ Risikofaktoren identifizieren                      │  │
│  │ ✓ Handlungsempfehlungen erhalten                     │  │
│  │                                                       │  │
│  │                              [Starten →]             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🛡️ Prävention & Gesundheitsvorsorge                        │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Cardiovascular Age Assessment                    8 min│  │
│  │ Bestimmen Sie Ihr kardiovaskuläres Alter basierend   │  │
│  │ auf Risikofaktoren und Lebensstil                    │  │
│  │                                                       │  │
│  │ ✓ CV-Alter ermitteln                                 │  │
│  │ ✓ Risikofaktoren identifizieren                      │  │
│  │ ✓ Präventionsstrategien erhalten                     │  │
│  │                                                       │  │
│  │                              [Starten →]             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Total: 4 Funnels across 4 Pillars
New funnels added in V05-I02.3: 3
`

console.log('Mock Catalog Data Structure:')
console.log(JSON.stringify(mockCatalogData, null, 2))
console.log('\n\nExpected UI Layout:')
console.log(expectedUILayout)
