import {
  FunnelContentManifestSchema,
  FunnelQuestionnaireConfigSchema,
} from '@/lib/contracts/funnelManifest'
import {
  cardiovascularAgeContentManifest,
  cardiovascularAgeQuestionnaireConfig,
  createMinimalContentManifest,
  createMinimalQuestionnaireConfig,
} from '@/lib/fixtures/funnelManifestFixtures'

describe('funnel manifest fixtures', () => {
  it('validates minimal questionnaire config', () => {
    const result = FunnelQuestionnaireConfigSchema.safeParse(createMinimalQuestionnaireConfig())
    expect(result.success).toBe(true)
  })

  it('validates minimal content manifest', () => {
    const result = FunnelContentManifestSchema.safeParse(createMinimalContentManifest())
    expect(result.success).toBe(true)
  })

  it('validates cardiovascular age questionnaire config', () => {
    const result = FunnelQuestionnaireConfigSchema.safeParse(
      cardiovascularAgeQuestionnaireConfig,
    )
    expect(result.success).toBe(true)
  })

  it('validates cardiovascular age content manifest', () => {
    const result = FunnelContentManifestSchema.safeParse(cardiovascularAgeContentManifest)
    expect(result.success).toBe(true)
  })
})
