import { CANONICAL_ROUTES } from '../utils/navigation'

export type PatientMobileMenuItem = {
  id: string
  label: string
  href: string
  icon: string
  order: number
}

export const PATIENT_MOBILE_MENU_ITEMS: PatientMobileMenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: CANONICAL_ROUTES.DASHBOARD,
    icon: '🏠',
    order: 0,
  },
  {
    id: 'check-in',
    label: 'Check-In',
    href: CANONICAL_ROUTES.ASSESS,
    icon: '📝',
    order: 1,
  },
  {
    id: 'anamnese',
    label: 'Timeline',
    href: CANONICAL_ROUTES.ANAMNESE_TIMELINE,
    icon: '📋',
    order: 2,
  },
  {
    id: 'dialog',
    label: 'Dialog',
    href: CANONICAL_ROUTES.DIALOG,
    icon: '💬',
    order: 3,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: CANONICAL_ROUTES.PROFILE,
    icon: '👤',
    order: 4,
  },
]
