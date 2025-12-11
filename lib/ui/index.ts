/**
 * UI Component Library
 * 
 * V0.4 Design System Components
 * 
 * This module exports all reusable UI components that make up the
 * Rhythmologicum Connect design system.
 * 
 * Components:
 * - Button: Primary action component with multiple variants
 * - Card: Content container with header/footer support
 * - Input: Text input with error states
 * - Textarea: Multi-line text input
 * - Select: Dropdown selection
 * - Label: Form field labels
 * - FormField: Complete form field wrapper
 * - Table: Data display table with sorting
 * 
 * Usage:
 * ```tsx
 * import { Button, Card, Input, FormField } from '@/lib/ui'
 * 
 * <FormField label="Email" required>
 *   <Input type="email" />
 * </FormField>
 * 
 * <Button variant="primary">Save</Button>
 * ```
 */

export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { Card } from './Card'
export type { CardProps } from './Card'

export { Input } from './Input'
export type { InputProps } from './Input'

export { Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'

export { Select } from './Select'
export type { SelectProps } from './Select'

export { Label } from './Label'
export type { LabelProps } from './Label'

export { FormField } from './FormField'
export type { FormFieldProps } from './FormField'

export { Table } from './Table'
export type { TableProps, TableColumn } from './Table'

export { AppShell } from './AppShell'
export type { AppShellProps } from './AppShell'
