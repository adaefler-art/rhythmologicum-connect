import { UC1_SAFETY_ROUTE, type Uc1SafetyRoute } from '@/lib/api/contracts/triage'

export type SupportRouteUi = {
  title: string
  message: string
  blocked: boolean
}

export function isUc1SafetyRoute(value: string | null | undefined): value is Uc1SafetyRoute {
  if (!value) {
    return false
  }

  return Object.values(UC1_SAFETY_ROUTE).includes(value as Uc1SafetyRoute)
}

export function getSupportRouteUi(
  route: Uc1SafetyRoute | null,
  message: string | null,
): SupportRouteUi {
  if (route === UC1_SAFETY_ROUTE.NOTRUF) {
    return {
      title: 'Akute Gefahr: Bitte sofort Notruf 112 kontaktieren',
      message: message || 'Ihre Angaben deuten auf eine akute Notfallsituation hin.',
      blocked: true,
    }
  }

  if (route === UC1_SAFETY_ROUTE.NOTAUFNAHME) {
    return {
      title: 'Bitte jetzt in eine Notaufnahme gehen',
      message: message || 'Ihre Angaben erfordern eine direkte medizinische Abklärung.',
      blocked: true,
    }
  }

  if (route === UC1_SAFETY_ROUTE.DRINGENDER_TERMIN) {
    return {
      title: 'Bitte zeitnah einen dringenden Termin vereinbaren',
      message: message || 'Setzen Sie den Intake fort und planen Sie zeitnah ärztliche Unterstützung ein.',
      blocked: false,
    }
  }

  return {
    title: 'Unterstützung',
    message: message || 'Wenn Sie sich akut unsicher fühlen, kontaktieren Sie bitte umgehend den Notruf 112.',
    blocked: false,
  }
}

export function buildSafetyGateSupportUrl(params: {
  route: Uc1SafetyRoute
  message: string
  source?: string
}): string {
  const query = new URLSearchParams({
    source: params.source || 'uc1_safety_gate',
    route: params.route,
    message: params.message,
  })

  return `/patient/support?${query.toString()}`
}