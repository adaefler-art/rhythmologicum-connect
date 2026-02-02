import { CANONICAL_ROUTES } from '../utils/navigation'

export type PatientMobileMenuItem = {
  id: string
  label: string
  href: string
  icon: {
    src: string
    alt: string
  }
  order: number
}

export const PATIENT_MOBILE_MENU_ITEMS: PatientMobileMenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: CANONICAL_ROUTES.DASHBOARD,
    icon: {
      src: '/icons/nav-home.png',
      alt: 'Home',
    },
    order: 0,
  },
  {
    id: 'check-in',
    label: 'Check-In',
    href: CANONICAL_ROUTES.ASSESS,
    icon: {
      src: '/icons/nav-check-in.png',
      alt: 'Check-In',
    },
    order: 1,
  },
  {
    id: 'anamnese',
    label: 'Timeline',
    href: CANONICAL_ROUTES.ANAMNESE_TIMELINE,
    icon: {
      src: '/icons/nav-timeline.png',
      alt: 'Timeline',
    },
    order: 2,
  },
  {
    id: 'dialog',
    label: 'Dialog',
    href: CANONICAL_ROUTES.DIALOG,
    icon: {
      src: '/icons/nav-dialog.png',
      alt: 'Dialog',
    },
    order: 3,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: CANONICAL_ROUTES.PROFILE,
    icon: {
      src: '/icons/nav-profile.png',
      alt: 'Profile',
    },
    order: 4,
  },
]
