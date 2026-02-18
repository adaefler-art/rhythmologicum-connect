import 'dotenv/config'

import type { CapacitorConfig } from '@capacitor/cli'

const DEFAULT_PATIENT_BASE_URL = 'https://rhythm-patient.vercel.app'
const DEFAULT_PATIENT_ROUTE = '/patient/start'
const baseUrlFromEnv =
  process.env.PATIENT_BASE_URL ?? process.env.NEXT_PUBLIC_PATIENT_BASE_URL ?? ''
const selectedBaseUrl = baseUrlFromEnv.trim() || DEFAULT_PATIENT_BASE_URL
const normalizedBaseUrl = selectedBaseUrl.replace(/\/+$/, '')

const buildStartUrl = () => {
  try {
    const parsed = new URL(normalizedBaseUrl)
    const hasPath = parsed.pathname && parsed.pathname !== '/'
    const path = hasPath ? parsed.pathname.replace(/\/+$/, '') : DEFAULT_PATIENT_ROUTE
    parsed.pathname = path
    parsed.searchParams.set('rc_platform', 'ios_shell')
    parsed.searchParams.set('rc_native_shell_nav', '1')
    return parsed.toString()
  } catch {
    return `${DEFAULT_PATIENT_BASE_URL}${DEFAULT_PATIENT_ROUTE}?rc_platform=ios_shell&rc_native_shell_nav=1`
  }
}

const startUrl = buildStartUrl()

if (!baseUrlFromEnv.trim()) {
  console.warn(
    '[rhythm-patient-ios] PATIENT_BASE_URL is not set. Using default https://rhythm-patient.vercel.app. Set PATIENT_BASE_URL before running cap sync to override.',
  )
}

let navigationHost = ''
try {
  navigationHost = new URL(normalizedBaseUrl).hostname
} catch {
  navigationHost = ''
}

const config: CapacitorConfig = {
  appId: 'com.pat.connect.patient',
  appName: 'Rhythmologicum Connect',
  webDir: 'www',
  bundledWebRuntime: false,
  appendUserAgent: 'RhythmPatientiOSShell/0.1',
  server: {
    url: startUrl,
    cleartext: false,
    allowNavigation: navigationHost ? [navigationHost] : [],
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config