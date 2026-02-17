import 'dotenv/config'

import type { CapacitorConfig } from '@capacitor/cli'

const DEFAULT_PATIENT_ROUTE = '/patient/dashboard'
const baseUrlFromEnv =
  process.env.PATIENT_BASE_URL ?? process.env.NEXT_PUBLIC_PATIENT_BASE_URL ?? ''
const normalizedEnvUrl = baseUrlFromEnv.replace(/\/+$/, '')

const buildStartUrl = () => {
  if (!normalizedEnvUrl) {
    return `https://example.invalid${DEFAULT_PATIENT_ROUTE}?rc_platform=ios_shell`
  }

  try {
    const parsed = new URL(normalizedEnvUrl)
    const hasPath = parsed.pathname && parsed.pathname !== '/'
    const path = hasPath ? parsed.pathname.replace(/\/+$/, '') : DEFAULT_PATIENT_ROUTE
    parsed.pathname = path
    parsed.searchParams.set('rc_platform', 'ios_shell')
    return parsed.toString()
  } catch {
    return `https://example.invalid${DEFAULT_PATIENT_ROUTE}?rc_platform=ios_shell`
  }
}

const startUrl = buildStartUrl()

if (!normalizedEnvUrl) {
  console.warn(
    '[rhythm-patient-ios] PATIENT_BASE_URL is not set. Set PATIENT_BASE_URL before running cap sync.',
  )
}

let navigationHost = ''
try {
  navigationHost = new URL(normalizedEnvUrl).hostname
} catch {
  navigationHost = ''
}

const config: CapacitorConfig = {
  appId: 'com.rhythmologicum.connect.patient',
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