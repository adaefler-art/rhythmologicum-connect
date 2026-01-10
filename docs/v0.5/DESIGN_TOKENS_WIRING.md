# Design Tokens Wiring (v0.5)

## Status: Wired globally, low real usage
The design token system is **wired into the app root layout**, and supports **org-specific overrides from the database**, but (currently) **only an example component consumes tokens via context**. Most UI still uses Tailwind utilities and/or inline styles directly.

---

## What exists (implementation)

### 1) Default token source
- Default tokens are defined in: [lib/design-tokens.ts](../lib/design-tokens.ts)
- Includes spacing, typography, radii, shadows, motion, colors, and layout constraints.

### 2) Runtime loader + organization override
- Loader deep-merges per-organization overrides from the `design_tokens` table: [lib/design-tokens-loader.ts](../lib/design-tokens-loader.ts)
- It determines organization via `user_org_membership` (`getUserOrganizationId`) and then loads active overrides.

### 3) Client context provider + hook
- Provider + hook are in: [lib/contexts/DesignTokensContext.tsx](../lib/contexts/DesignTokensContext.tsx)
- Provider defaults to base tokens if none are passed.

### 4) Global wiring
- Root layout loads tokens server-side and wraps the entire app tree:
  - [app/layout.tsx](../app/layout.tsx)
  - Calls `loadUserDesignTokens()` and passes the result to `DesignTokensProvider`.

---

## Evidence of actual consumption
Only one component currently imports `useDesignTokens()`:
- [app/components/ExampleTokenConsumer.tsx](../app/components/ExampleTokenConsumer.tsx)

This implies tokens are ready for adoption, but the system is not yet the dominant styling mechanism.

---

## Implications / Delta
- ✅ **Positive**: Central token definitions exist; overrides are supported; wiring is in place.
- ⚠️ **Delta to “full design system”**: Most components don’t consume token context yet, so org-level theming will have limited visible impact.

---

## Recommended next actions (if desired)
- Pick a small surface (e.g., patient intro/result card shells) and migrate styles to use `useDesignTokens()`.
- Keep Tailwind for layout, but use tokens for semantic values (spacing scale, radii, colors).
- Add a clinician/admin UI confirmation that overrides apply (e.g., a preview component or a tiny “current tokens” debug view behind clinician role).
