/**
 * Example: Adaptive Stress Assessment Questionnaire (V05-I03.2)
 * 
 * This demonstrates a realistic 40-50 question stress assessment with conditional logic.
 * Shows branching based on stress levels, age, and other factors.
 * 
 * Usage in a page component:
 * ```tsx
 * import StressAssessmentExample from '@/lib/questionnaire/examples/stressAssessment'
 * 
 * export default function StressAssessmentPage() {
 *   return <StressAssessmentExample />
 * }
 * ```
 */

'use client'

import QuestionnaireRunner from '../QuestionnaireRunner'
import type { FunnelQuestionnaireConfig } from '@/lib/contracts/funnelManifest'
import { QUESTION_TYPE } from '@/lib/contracts/registry'

const stressAssessmentConfig: FunnelQuestionnaireConfig = {
  version: '1.0',
  steps: [
    // Step 1: Demographics (5 questions)
    {
      id: 'demographics',
      title: 'Demografische Angaben',
      description: 'Bitte geben Sie einige grundlegende Informationen an',
      questions: [
        {
          id: 'age',
          key: 'age',
          type: QUESTION_TYPE.NUMBER,
          label: 'Wie alt sind Sie?',
          required: true,
          validation: { min: 18, max: 120 },
        },
        {
          id: 'gender',
          key: 'gender',
          type: QUESTION_TYPE.RADIO,
          label: 'Geschlecht',
          required: true,
          options: [
            { value: 'male', label: 'Männlich' },
            { value: 'female', label: 'Weiblich' },
            { value: 'other', label: 'Divers' },
            { value: 'prefer_not_to_say', label: 'Keine Angabe' },
          ],
        },
        {
          id: 'occupation_status',
          key: 'occupation_status',
          type: QUESTION_TYPE.RADIO,
          label: 'Berufsstatus',
          required: true,
          options: [
            { value: 'employed', label: 'Angestellt' },
            { value: 'self_employed', label: 'Selbstständig' },
            { value: 'student', label: 'Student/in' },
            { value: 'retired', label: 'Im Ruhestand' },
            { value: 'unemployed', label: 'Arbeitslos' },
            { value: 'homemaker', label: 'Hausfrau/-mann' },
          ],
        },
      ],
    },

    // Step 2: Work-related stress (only for employed/self-employed)
    {
      id: 'work_stress',
      title: 'Beruflicher Stress',
      description: 'Fragen zu Ihrem Arbeitsumfeld',
      questions: [
        {
          id: 'work_hours',
          key: 'work_hours',
          type: QUESTION_TYPE.NUMBER,
          label: 'Wie viele Stunden arbeiten Sie durchschnittlich pro Woche?',
          required: true,
          validation: { min: 0, max: 168 },
        },
        {
          id: 'work_stress_level',
          key: 'work_stress_level',
          type: QUESTION_TYPE.SCALE,
          label: 'Wie gestresst fühlen Sie sich bei der Arbeit?',
          helpText: '1 = überhaupt nicht, 10 = extrem gestresst',
          required: true,
          minValue: 1,
          maxValue: 10,
        },
        {
          id: 'work_pressure',
          key: 'work_pressure',
          type: QUESTION_TYPE.CHECKBOX,
          label: 'Welche Faktoren tragen zu Ihrem Arbeitsstress bei? (Mehrfachauswahl)',
          required: false,
          options: [
            { value: 'deadlines', label: 'Enge Fristen' },
            { value: 'workload', label: 'Hohe Arbeitsbelastung' },
            { value: 'conflicts', label: 'Konflikte mit Kollegen/Vorgesetzten' },
            { value: 'unclear_expectations', label: 'Unklare Erwartungen' },
            { value: 'job_insecurity', label: 'Arbeitsplatzunsicherheit' },
            { value: 'lack_control', label: 'Fehlende Kontrolle' },
          ],
        },
      ],
      conditionalLogic: {
        type: 'show',
        conditions: [
          {
            questionId: 'occupation_status',
            operator: 'in',
            value: ['employed', 'self_employed'],
          },
        ],
        logic: 'or',
      },
    },

    // Step 3: General stress symptoms (10 questions)
    {
      id: 'stress_symptoms',
      title: 'Stresssymptome',
      description: 'Wie häufig haben Sie in den letzten 4 Wochen folgende Symptome erlebt?',
      questions: [
        {
          id: 'sleep_problems',
          key: 'sleep_problems',
          type: QUESTION_TYPE.SCALE,
          label: 'Schlafprobleme oder Schlaflosigkeit',
          required: true,
          minValue: 0,
          maxValue: 4,
        },
        {
          id: 'headaches',
          key: 'headaches',
          type: QUESTION_TYPE.SCALE,
          label: 'Kopfschmerzen',
          required: true,
          minValue: 0,
          maxValue: 4,
        },
        {
          id: 'fatigue',
          key: 'fatigue',
          type: QUESTION_TYPE.SCALE,
          label: 'Erschöpfung oder Müdigkeit',
          required: true,
          minValue: 0,
          maxValue: 4,
        },
        {
          id: 'irritability',
          key: 'irritability',
          type: QUESTION_TYPE.SCALE,
          label: 'Reizbarkeit oder Nervosität',
          required: true,
          minValue: 0,
          maxValue: 4,
        },
        {
          id: 'concentration',
          key: 'concentration',
          type: QUESTION_TYPE.SCALE,
          label: 'Konzentrationsschwierigkeiten',
          required: true,
          minValue: 0,
          maxValue: 4,
        },
      ],
    },

    // Step 4: High stress follow-up (only if stress level >= 7)
    {
      id: 'high_stress_followup',
      title: 'Zusätzliche Fragen für hohen Stress',
      description: 'Da Sie einen hohen Stresslevel angegeben haben, möchten wir mehr erfahren',
      questions: [
        {
          id: 'stress_duration',
          key: 'stress_duration',
          type: QUESTION_TYPE.RADIO,
          label: 'Wie lange fühlen Sie sich schon so gestresst?',
          required: true,
          options: [
            { value: 'less_than_month', label: 'Weniger als 1 Monat' },
            { value: '1_3_months', label: '1-3 Monate' },
            { value: '3_6_months', label: '3-6 Monate' },
            { value: 'more_than_6_months', label: 'Mehr als 6 Monate' },
          ],
        },
        {
          id: 'panic_attacks',
          key: 'panic_attacks',
          type: QUESTION_TYPE.RADIO,
          label: 'Hatten Sie in letzter Zeit Panikattacken?',
          required: true,
          options: [
            { value: 'yes', label: 'Ja' },
            { value: 'no', label: 'Nein' },
          ],
        },
        {
          id: 'professional_help',
          key: 'professional_help',
          type: QUESTION_TYPE.RADIO,
          label: 'Haben Sie bereits professionelle Hilfe in Anspruch genommen?',
          required: true,
          options: [
            { value: 'yes_currently', label: 'Ja, aktuell in Behandlung' },
            { value: 'yes_past', label: 'Ja, in der Vergangenheit' },
            { value: 'no', label: 'Nein' },
          ],
        },
      ],
      conditionalLogic: {
        type: 'show',
        conditions: [
          {
            questionId: 'work_stress_level',
            operator: 'gte',
            value: 7,
          },
        ],
        logic: 'and',
      },
    },

    // Step 5: Lifestyle factors (10 questions)
    {
      id: 'lifestyle',
      title: 'Lebensstil',
      description: 'Fragen zu Ihrem täglichen Leben und Ihren Gewohnheiten',
      questions: [
        {
          id: 'exercise_frequency',
          key: 'exercise_frequency',
          type: QUESTION_TYPE.RADIO,
          label: 'Wie oft treiben Sie Sport oder bewegen Sie sich?',
          required: true,
          options: [
            { value: 'never', label: 'Nie' },
            { value: 'rarely', label: 'Selten (1x pro Woche oder weniger)' },
            { value: 'sometimes', label: 'Manchmal (2-3x pro Woche)' },
            { value: 'often', label: 'Oft (4-5x pro Woche)' },
            { value: 'daily', label: 'Täglich' },
          ],
        },
        {
          id: 'sleep_hours',
          key: 'sleep_hours',
          type: QUESTION_TYPE.NUMBER,
          label: 'Wie viele Stunden schlafen Sie durchschnittlich pro Nacht?',
          required: true,
          validation: { min: 0, max: 24 },
        },
        {
          id: 'social_support',
          key: 'social_support',
          type: QUESTION_TYPE.SCALE,
          label: 'Wie gut fühlen Sie sich von Freunden und Familie unterstützt?',
          helpText: '1 = überhaupt nicht, 10 = sehr gut',
          required: true,
          minValue: 1,
          maxValue: 10,
        },
      ],
    },

    // Step 6: Coping strategies
    {
      id: 'coping',
      title: 'Bewältigungsstrategien',
      description: 'Wie gehen Sie mit Stress um?',
      questions: [
        {
          id: 'coping_strategies',
          key: 'coping_strategies',
          type: QUESTION_TYPE.CHECKBOX,
          label: 'Welche Strategien nutzen Sie, um mit Stress umzugehen? (Mehrfachauswahl)',
          required: false,
          options: [
            { value: 'exercise', label: 'Sport und Bewegung' },
            { value: 'meditation', label: 'Meditation oder Achtsamkeit' },
            { value: 'hobbies', label: 'Hobbys und Freizeitaktivitäten' },
            { value: 'social_contact', label: 'Soziale Kontakte' },
            { value: 'professional_help', label: 'Professionelle Hilfe' },
            { value: 'none', label: 'Keine spezifischen Strategien' },
          ],
        },
        {
          id: 'stress_management_interest',
          key: 'stress_management_interest',
          type: QUESTION_TYPE.RADIO,
          label:
            'Sind Sie daran interessiert, neue Strategien zur Stressbewältigung zu erlernen?',
          required: true,
          options: [
            { value: 'yes', label: 'Ja, sehr interessiert' },
            { value: 'maybe', label: 'Vielleicht' },
            { value: 'no', label: 'Nein, nicht interessiert' },
          ],
        },
      ],
    },

    // Step 7: Summary
    {
      id: 'additional_info',
      title: 'Zusätzliche Informationen',
      description: 'Gibt es noch etwas, das Sie uns mitteilen möchten?',
      questions: [
        {
          id: 'comments',
          key: 'comments',
          type: QUESTION_TYPE.TEXTAREA,
          label: 'Zusätzliche Kommentare oder Anmerkungen (optional)',
          required: false,
          helpText: 'Teilen Sie uns alles mit, was Ihnen wichtig erscheint',
        },
      ],
    },
  ],
}

export default function StressAssessmentExample() {
  const handleComplete = (answers: Record<string, string | number | boolean | string[]>) => {
    console.log('Assessment completed:', answers)
    alert(
      `Fragebogen abgeschlossen!\n\nAnzahl der Antworten: ${Object.keys(answers).length}\n\nErgebnisse wurden in der Konsole protokolliert.`,
    )
  }

  const handleAnswersChange = (answers: Record<string, string | number | boolean | string[]>) => {
    console.log('Answers updated:', answers)
  }

  return (
    <QuestionnaireRunner
      config={stressAssessmentConfig}
      onComplete={handleComplete}
      onAnswersChange={handleAnswersChange}
      title="Stress & Resilienz Assessment"
    />
  )
}
