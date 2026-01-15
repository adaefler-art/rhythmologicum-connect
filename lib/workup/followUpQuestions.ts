/**
 * E6.4.5: Follow-up Question Templates
 *
 * Deterministic follow-up questions for missing data fields.
 * These are NOT diagnostic questions - purely data collection.
 */

import type { FollowUpQuestion } from '@/lib/types/workup'

/**
 * Follow-up question templates by field key
 * These questions are asked when specific data is missing
 */
export const FOLLOW_UP_QUESTION_TEMPLATES: Record<string, FollowUpQuestion> = {
  sleep_quality: {
    id: 'followup_sleep_quality',
    fieldKey: 'sleep_quality',
    questionText: 'Wie würden Sie Ihre Schlafqualität in den letzten 4 Wochen bewerten?',
    inputType: 'scale',
    priority: 10,
  },
  stress_triggers: {
    id: 'followup_stress_triggers',
    fieldKey: 'stress_triggers',
    questionText: 'Welche Situationen oder Faktoren lösen bei Ihnen am häufigsten Stress aus?',
    inputType: 'text',
    priority: 8,
  },
  daily_routine: {
    id: 'followup_daily_routine',
    fieldKey: 'daily_routine',
    questionText: 'Beschreiben Sie kurz Ihren typischen Tagesablauf.',
    inputType: 'text',
    priority: 6,
  },
  exercise_frequency: {
    id: 'followup_exercise_frequency',
    fieldKey: 'exercise_frequency',
    questionText: 'Wie oft treiben Sie pro Woche Sport oder bewegen sich aktiv?',
    inputType: 'select',
    priority: 7,
    choices: [
      'Nie',
      '1-2 Mal pro Woche',
      '3-4 Mal pro Woche',
      '5 oder mehr Mal pro Woche',
    ],
  },
  nutrition_habits: {
    id: 'followup_nutrition_habits',
    fieldKey: 'nutrition_habits',
    questionText: 'Wie regelmäßig nehmen Sie Ihre Mahlzeiten ein?',
    inputType: 'select',
    priority: 5,
    choices: ['Sehr regelmäßig', 'Meist regelmäßig', 'Unregelmäßig', 'Sehr unregelmäßig'],
  },
  social_support: {
    id: 'followup_social_support',
    fieldKey: 'social_support',
    questionText: 'Haben Sie Personen in Ihrem Umfeld, mit denen Sie über Belastungen sprechen können?',
    inputType: 'boolean',
    priority: 9,
  },
  work_stress: {
    id: 'followup_work_stress',
    fieldKey: 'work_stress',
    questionText: 'Wie stark belastet Sie Ihre berufliche Situation?',
    inputType: 'scale',
    priority: 8,
  },
  family_history: {
    id: 'followup_family_history',
    fieldKey: 'family_history',
    questionText:
      'Gibt es in Ihrer Familie Vorerkrankungen im Bereich Herz-Kreislauf oder psychische Belastungen?',
    inputType: 'text',
    priority: 4,
  },
}

/**
 * Get a follow-up question for a missing data field
 *
 * @param fieldKey - The missing data field key
 * @returns The follow-up question, or undefined if no template exists
 */
export function getFollowUpQuestion(fieldKey: string): FollowUpQuestion | undefined {
  return FOLLOW_UP_QUESTION_TEMPLATES[fieldKey]
}

/**
 * Get multiple follow-up questions for missing data fields
 * Returns questions sorted by priority (highest first)
 *
 * @param fieldKeys - Array of missing data field keys
 * @returns Array of follow-up questions, sorted by priority
 */
export function getFollowUpQuestions(fieldKeys: string[]): FollowUpQuestion[] {
  const questions = fieldKeys
    .map((key) => getFollowUpQuestion(key))
    .filter((q): q is FollowUpQuestion => q !== undefined)

  // Sort by priority (highest first)
  return questions.sort((a, b) => b.priority - a.priority)
}
