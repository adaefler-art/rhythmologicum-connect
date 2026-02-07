/**
 * E78.6 — Triage SLA Configuration
 * 
 * Provides centralized configuration for triage SLA (Service Level Agreement) settings.
 * 
 * SLA Hierarchy (v1.1):
 * 1. Funnel-specific setting (from funnel_triage_settings table) - highest priority
 * 2. Environment variable (TRIAGE_SLA_DAYS_DEFAULT)
 * 3. Hardcoded default (7 days) - lowest priority
 * 
 * v1 Implementation:
 * - ENV-based configuration only
 * - Default: 7 days
 * 
 * v1.1 Implementation (optional):
 * - Database table support for per-funnel overrides
 * - Precedence: funnel_triage_settings > ENV > default
 */

import { env } from '@/lib/env'

/**
 * Default SLA in days if no configuration is provided
 */
const DEFAULT_TRIAGE_SLA_DAYS = 7

/**
 * Get the default triage SLA in days from environment variable or fallback
 * 
 * @returns {number} Number of days before a case is marked as overdue
 */
export function getDefaultTriageSLADays(): number {
  const envValue = env.TRIAGE_SLA_DAYS_DEFAULT
  
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
    // Log warning for invalid value but continue with default
    console.warn(
      `[SLA Config] Invalid TRIAGE_SLA_DAYS_DEFAULT value: "${envValue}". Using default: ${DEFAULT_TRIAGE_SLA_DAYS}`,
    )
  }
  
  return DEFAULT_TRIAGE_SLA_DAYS
}

/**
 * Get the triage SLA in days for a specific funnel
 * 
 * v1: Returns default SLA (no funnel-specific overrides)
 * v1.1: Will query funnel_triage_settings table for funnel-specific value
 * 
 * @param {string} funnelId - The funnel ID to get SLA for
 * @returns {Promise<number>} Number of days before a case is marked as overdue
 */
export async function getTriageSLADaysForFunnel(funnelId: string): Promise<number> {
  // v1: Return default only
  // TODO v1.1: Query funnel_triage_settings table for funnel-specific override
  return getDefaultTriageSLADays()
}

/**
 * Get SLA configuration as a PostgreSQL interval string
 * 
 * @param {number} days - Number of days
 * @returns {string} PostgreSQL interval string (e.g., "7 days")
 */
export function formatSLAAsInterval(days: number): string {
  return `${days} days`
}

/**
 * Calculate the due date for a triage case
 * 
 * @param {Date} assignedAt - The timestamp when the case was assigned
 * @param {number} slaDays - Number of days for the SLA
 * @returns {Date} The due date
 */
export function calculateDueDate(assignedAt: Date, slaDays: number): Date {
  const dueDate = new Date(assignedAt)
  dueDate.setDate(dueDate.getDate() + slaDays)
  return dueDate
}

/**
 * Check if a case is overdue
 * 
 * @param {Date} assignedAt - The timestamp when the case was assigned
 * @param {number} slaDays - Number of days for the SLA
 * @param {Date | null} completedAt - The timestamp when the case was completed (null if not completed)
 * @returns {boolean} True if the case is overdue
 */
export function isOverdue(
  assignedAt: Date,
  slaDays: number,
  completedAt: Date | null,
): boolean {
  // Case is not overdue if it's already completed
  if (completedAt) {
    return false
  }
  
  const dueDate = calculateDueDate(assignedAt, slaDays)
  const now = new Date()
  
  return now > dueDate
}
