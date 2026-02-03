import { CANONICAL_ROUTES } from '../utils/navigation'

export type PatientMobileMenuItem = {
  id: string
  label: string
  href: string
  order: number
}

export const PATIENT_MOBILE_MENU_ITEMS: PatientMobileMenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: CANONICAL_ROUTES.DASHBOARD,
    order: 0,
  },
  {
    id: 'check-in',
    label: 'Check-In',
    href: CANONICAL_ROUTES.ASSESS,
    order: 1,
  },
 
  {
    id: 'dialog',
    label: 'Dialog',
    href: CANONICAL_ROUTES.DIALOG,
    order: 2,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: CANONICAL_ROUTES.PROFILE,
    order: 3,
  },
]
