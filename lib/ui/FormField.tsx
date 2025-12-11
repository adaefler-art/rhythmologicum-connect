import { type ReactNode } from 'react'
import Label from './Label'
import { spacing } from '@/lib/design-tokens'

export interface FormFieldProps {
  /** Field label */
  label?: string
  /** Whether field is required */
  required?: boolean
  /** Input/control element */
  children: ReactNode
  /** Additional helper text */
  description?: string
  /** htmlFor attribute for label */
  htmlFor?: string
}

/**
 * FormField Component
 * 
 * A wrapper component that combines a label with a form control.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Consistent label and control spacing
 * - Optional description text
 * - Required field indicator
 * - Accessible structure
 * 
 * @example
 * <FormField label="Email Address" required htmlFor="email">
 *   <Input id="email" type="email" />
 * </FormField>
 * 
 * @example
 * <FormField
 *   label="Country"
 *   description="Select your country of residence"
 *   htmlFor="country"
 * >
 *   <Select id="country">
 *     <option value="">Choose...</option>
 *     <option value="de">Germany</option>
 *   </Select>
 * </FormField>
 */
export function FormField({
  label,
  required = false,
  children,
  description,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className="w-full" style={{ marginBottom: spacing.lg }}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {description && (
        <p className="text-sm text-slate-600 mb-2" style={{ marginLeft: spacing.xs }}>
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

export default FormField
