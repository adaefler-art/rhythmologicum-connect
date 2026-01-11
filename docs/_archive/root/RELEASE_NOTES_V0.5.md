# Release Notes: v0.5

**Release Date:** verify via git tag/commit

**Evidence Sources:**
- `RELEASE_CHECKLIST_V0.5.md`
- `supabase/migrations/` (verify via command: `Get-ChildItem -Path supabase/migrations -Filter *.sql | Select-Object Name`)
- Build verification (verify via command: `npm run build`)

---

## Known limitations

- **Evidence-first only:** This document does not make feature claims beyond what is verifiable via file paths or commands.
- **Design Tokens consumption scope:**
  - DB schema + RLS: `supabase/migrations/20260107083000_v05_i09_2_create_design_tokens.sql` (verify via command: `npx supabase db reset`).
  - Admin UI/API exist for managing tokens:
    - UI: `app/admin/design-tokens/page.tsx`
    - API: `app/api/admin/design-tokens/route.ts`
  - Runtime loading exists (verify via code):
    - Loader: `lib/design-tokens-loader.ts`
    - App usage: `app/layout.tsx`
- **Manual QA required:** verify critical paths via `V0.5_MANUAL_TESTS.md` (no automated end-to-end suite is asserted here; verify coverage via command: `npm test`).
