/**
 * Question Option Mapping Helper
 * 
 * This file provides mappings from question.key to specific choice options
 * for single-choice and binary questions. It allows the UI to generate
 * appropriate answer buttons based on the question identifier.
 * 
 * Usage:
 * - Import getQuestionOptions() to get options for a specific question key
 * - Add new mappings as new question types are added to the system
 */

import type { ChoiceOption } from '@/app/components/SingleChoiceAnswerButtons'

/**
 * Predefined option sets for common single-choice questions
 */
export const QUESTION_OPTIONS: Record<string, ChoiceOption[]> = {
  // Exercise/Activity frequency
  exercise_frequency: [
    { value: 0, label: 'Nie' },
    { value: 1, label: '1-2x pro Woche' },
    { value: 2, label: '3-4x pro Woche' },
    { value: 3, label: 'Täglich' },
  ],
  
  // Employment status
  employment_status: [
    { value: 'fulltime', label: 'Vollzeit' },
    { value: 'parttime', label: 'Teilzeit' },
    { value: 'selfemployed', label: 'Selbstständig' },
    { value: 'unemployed', label: 'Arbeitslos' },
    { value: 'retired', label: 'Im Ruhestand' },
    { value: 'student', label: 'Student/in' },
  ],
  
  // General frequency scale
  frequency_general: [
    { value: 0, label: 'Nie' },
    { value: 1, label: 'Selten' },
    { value: 2, label: 'Manchmal' },
    { value: 3, label: 'Häufig' },
    { value: 4, label: 'Sehr häufig' },
  ],
  
  // Agreement scale
  agreement_scale: [
    { value: 0, label: 'Stimme gar nicht zu' },
    { value: 1, label: 'Stimme eher nicht zu' },
    { value: 2, label: 'Neutral' },
    { value: 3, label: 'Stimme eher zu' },
    { value: 4, label: 'Stimme voll zu' },
  ],
  
  // Quality rating
  quality_rating: [
    { value: 0, label: 'Sehr schlecht' },
    { value: 1, label: 'Schlecht' },
    { value: 2, label: 'Mittelmäßig' },
    { value: 3, label: 'Gut' },
    { value: 4, label: 'Sehr gut' },
  ],
}

/**
 * Binary question mappings
 * Maps question keys to their Yes/No labels and values
 */
export type BinaryQuestionConfig = {
  yesLabel: string
  noLabel: string
  yesValue: boolean | number | string
  noValue: boolean | number | string
}

export const BINARY_QUESTIONS: Record<string, BinaryQuestionConfig> = {
  // Standard yes/no
  has_medical_condition: {
    yesLabel: 'Ja',
    noLabel: 'Nein',
    yesValue: true,
    noValue: false,
  },
  
  // Agreement yes/no
  consent_data_processing: {
    yesLabel: 'Ich stimme zu',
    noLabel: 'Ich stimme nicht zu',
    yesValue: true,
    noValue: false,
  },
  
  // True/False style
  takes_medication: {
    yesLabel: 'Ja',
    noLabel: 'Nein',
    yesValue: 1,
    noValue: 0,
  },
}

/**
 * Get choice options for a given question key
 * 
 * @param questionKey - The question.key from the database
 * @returns Array of choice options or undefined if not found
 */
export function getQuestionOptions(questionKey: string): ChoiceOption[] | undefined {
  return QUESTION_OPTIONS[questionKey]
}

/**
 * Get binary question configuration for a given question key
 * 
 * @param questionKey - The question.key from the database
 * @returns Binary configuration or undefined if not found
 */
export function getBinaryQuestionConfig(questionKey: string): BinaryQuestionConfig | undefined {
  return BINARY_QUESTIONS[questionKey]
}

/**
 * Check if a question key has predefined options
 * 
 * @param questionKey - The question.key from the database
 * @returns true if options are defined
 */
export function hasQuestionOptions(questionKey: string): boolean {
  return questionKey in QUESTION_OPTIONS
}

/**
 * Check if a question key is configured as binary
 * 
 * @param questionKey - The question.key from the database
 * @returns true if binary configuration exists
 */
export function isBinaryQuestion(questionKey: string): boolean {
  return questionKey in BINARY_QUESTIONS
}
