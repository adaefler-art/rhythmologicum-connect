import { defineConfig, devices } from '@playwright/test'
import { env } from './lib/env'

const appTarget = env.PATIENT_BASE_URL ? 'patient' : 'studio'
const baseURL =
  appTarget === 'patient'
    ? env.PATIENT_BASE_URL || 'http://127.0.0.1:3001'
    : env.STUDIO_BASE_URL || 'http://127.0.0.1:3000'
const isCiRuntime = process.env.CI === 'true' || process.env.CI === '1'
const reuseExistingServer = !isCiRuntime
const isTestRuntime = env.NODE_ENV === 'test'
const webServerCommand =
  appTarget === 'patient'
    ? isTestRuntime
      ? 'npm run dev:patient'
      : 'npm run start:patient'
    : 'npm run start:studio'
const webServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED: 'true',
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
  ENGINE_BASE_URL: env.ENGINE_BASE_URL || 'http://127.0.0.1:3002',
  PORT: appTarget === 'patient' ? '3001' : '3000',
  NODE_ENV: 'test',
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: 0,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
    env: webServerEnv,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
