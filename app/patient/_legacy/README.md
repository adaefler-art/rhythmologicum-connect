# Legacy Patient Demo Pages

This directory contains old prototype and demo pages that were used during development of the patient flow system. These pages are kept for reference but are **NOT** accessible through the main navigation or via their original routes.

## Archived Pages

- **stress-check/** - Original stress assessment implementation (pre-v0.4)
- **stress-check-v2/** - Second iteration of stress assessment
- **funnel-demo/** - Demo page for funnel components
- **funnel-definition-demo/** - Demo page for funnel definitions
- **answer-buttons-demo/** - Demo page for answer button components
- **mobile-components-demo/** - Demo page for mobile-specific components

## Removed Routes

The following routes have been **removed** and will return 404 errors:

**Under `/patient/`:**
- `/patient/stress-check` ❌ Removed
- `/patient/stress-check-v2` ❌ Removed  
- `/patient/stess-check` ❌ Removed (was a typo)

**At root level:**
- `/stress-check` ❌ Removed
- `/stress-check-v2` ❌ Removed
- `/stess-check` ❌ Removed (was a typo)

These routes previously redirected to the new Patient Flow V2 but have been removed to prevent confusion and ensure users only access the official flow.

## Current Patient Flow

As of v0.4, the **only** patient flow is located at:
- `/patient/funnel/[slug]` - Unified, data-driven funnel renderer
- **Main entry point:** `/patient/funnel/stress-assessment`

All navigation and links throughout the application point to this unified flow.

## Notes

- These legacy pages are preserved **only for internal reference** during the transition period.
- **Warning:** Legacy pages may contain outdated routes and references to old implementations. They should **never** be used as the basis for new features.
- Legacy pages in this folder are not routable and cannot be accessed by users.
