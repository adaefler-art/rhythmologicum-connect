/**
 * Button Wrapper - Delegates to vendor rhythm_mobile_v2
 * 
 * This is a 1:1 wrapper that delegates to the vendor Button component.
 * No business logic or modifications - pure delegation.
 */

import { Button as VendorButton } from '@/src/vendor/rhythm_mobile_v2'

export { VendorButton as Button }
export type { ButtonVariant, ButtonSize } from '@/src/vendor/rhythm_mobile_v2'
