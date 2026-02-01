import type { FunnelContentManifest, FunnelQuestionnaireConfig } from '@/lib/contracts/funnelManifest'

export const createMinimalQuestionnaireConfig = (
  overrides: Partial<FunnelQuestionnaireConfig> = {},
): FunnelQuestionnaireConfig => ({
  schema_version: 'v1',
  version: '1.0',
  steps: [
    {
      id: 'step-1',
      title: 'Grunddaten',
      questions: [
        {
          id: 'q1-age',
          key: 'age',
          type: 'number',
          label: 'Wie alt sind Sie?',
          required: true,
        },
      ],
    },
  ],
  ...overrides,
})

export const createMinimalContentManifest = (
  overrides: Partial<FunnelContentManifest> = {},
): FunnelContentManifest => ({
  schema_version: 'v1',
  version: '1.0',
  pages: [
    {
      slug: 'intro',
      title: 'Willkommen',
      sections: [
        {
          key: 'hero',
          type: 'hero',
          content: {
            title: 'Assessment',
          },
        },
      ],
    },
  ],
  ...overrides,
})

export const cardiovascularAgeQuestionnaireConfig: FunnelQuestionnaireConfig = {
  schema_version: 'v1',
  version: '1.0',
  steps: [
    {
      id: 'step-1',
      title: 'Grunddaten',
      description: 'Ihre persönlichen Daten',
      questions: [
        {
          id: 'q1-age',
          key: 'age',
          type: 'number',
          label: 'Wie alt sind Sie?',
          required: true,
        },
        {
          id: 'q2-gender',
          key: 'gender',
          type: 'radio',
          label: 'Geschlecht',
          required: true,
          options: [
            { value: 'male', label: 'Männlich' },
            { value: 'female', label: 'Weiblich' },
            { value: 'other', label: 'Divers' },
          ],
        },
      ],
    },
    {
      id: 'step-2',
      title: 'Gesundheitsfaktoren',
      description: 'Aktuelle Gesundheitsindikatoren',
      questions: [
        {
          id: 'q3-blood-pressure',
          key: 'blood_pressure',
          type: 'radio',
          label: 'Blutdruck-Status',
          required: true,
          options: [
            { value: 'normal', label: 'Normal' },
            { value: 'elevated', label: 'Erhöht' },
            { value: 'high', label: 'Hoch' },
          ],
        },
      ],
    },
  ],
}

export const cardiovascularAgeContentManifest: FunnelContentManifest = {
  schema_version: 'v1',
  version: '1.0',
  pages: [
    {
      slug: 'intro',
      title: 'Willkommen',
      sections: [
        {
          key: 'hero',
          type: 'hero',
          content: {
            title: 'Cardiovascular Age Assessment',
          },
        },
      ],
    },
  ],
}
