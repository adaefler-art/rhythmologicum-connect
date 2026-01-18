/**
 * Rhythm Core Fixtures - Cardiovascular Age POC
 */

export const CARDIOVASCULAR_AGE_FIXTURE = {
  slug: 'cardiovascular-age',
  assessmentId: '00000000-0000-4000-8000-000000000001',
  answers: [
    { questionId: 'q1-age', value: 54 },
    { questionId: 'q2-gender', value: 'male' },
  ],
  expectedResult: {
    kind: 'poc' as const,
    summaryTitle: 'Ergebnis wird vorbereitet',
    summaryBullets: [
      'Ihre Antworten wurden erfolgreich gespeichert.',
      'Die Auswertung wird aktuell vorbereitet.',
      'Sie erhalten die Ergebnisse in Kürze.',
    ],
    derived: {
      cardiovascularAgeYears: 54,
      riskBand: 'unknown' as const,
    },
  },
}
