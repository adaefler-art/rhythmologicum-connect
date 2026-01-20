/**
 * Mobile UI v2 Type Definitions
 * 
 * Type definitions for mobile-v2 health components
 */

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface HealthMetric {
  id: string
  label: string
  value: string | number
  unit?: string
  icon: string
  color: string
  trend?: 'up' | 'down' | 'neutral'
}

export interface Assessment {
  id: string
  title: string
  description: string
  category: string
  categoryColor: string
  icon: string
  iconColor: string
  iconBgColor: string
}

export interface AssessmentOption {
  id: string
  label: string
  description: string
  icon: string
  iconColor: string
  iconBgColor: string
}

export interface Action {
  id: string
  title: string
  description: string
  icon: string
  iconColor: string
  iconBgColor: string
  type: 'primary' | 'secondary' | 'success' | 'warning'
  buttonText?: string
  buttonColor?: string
}

export interface WeeklyData {
  day: string
  value: number
}

export interface Appointment {
  id: string
  title: string
  subtitle: string
  date: string
  time: string
  type: string
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'
