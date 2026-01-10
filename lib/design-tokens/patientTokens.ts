import designTokens from '@/lib/design-tokens'

// Patient-scoped design tokens.
// Intentionally static (no DB, no cookies/headers) so patient UI can evolve
// as a product-scoped design system for future iOS/Android parity.
//
// Today this reuses the shared defaults; later it can diverge safely.
const patientTokens = designTokens

export default patientTokens
