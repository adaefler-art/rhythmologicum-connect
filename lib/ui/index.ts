/**
 * UI Component Library
 * 
 * V0.4 Design System Components
 * 
 * This module exports all reusable UI components that make up the
 * Rhythmologicum Connect design system.
 * 
 * Components:
 * - Alert: Notification and callout messages
 * - Badge: Status and category labels
 * - Button: Primary action component with multiple variants
 * - Card: Content container with header/footer support
 * - Input: Text input with error states
 * - Textarea: Multi-line text input
 * - Select: Dropdown selection
 * - Label: Form field labels
 * - FormField: Complete form field wrapper
 * - Modal: Dialog overlay component
 * - Table: Data display table with sorting
 * - Tabs: Tabbed navigation component
 * 
 * Usage:
 * ```tsx
 * import { Button, Card, Input, FormField, Badge, Alert, Modal } from '@/lib/ui'
 * 
 * <FormField label="Email" required>
 *   <Input type="email" />
 * </FormField>
 * 
 * <Button variant="primary">Save</Button>
 * <Badge variant="success">Active</Badge>
 * <Alert variant="info">Important message</Alert>
 * ```
 */

export { Alert } from './Alert'
export type { AlertProps, AlertVariant } from './Alert'

export { Badge } from './Badge'
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge'

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

export { HelperText } from './HelperText'
export type { HelperTextProps } from './HelperText'

export { ErrorText } from './ErrorText'
export type { ErrorTextProps } from './ErrorText'

export { Progress } from './Progress'
export type { ProgressProps } from './Progress'

export { DesktopLayout } from './DesktopLayout'
export type { DesktopLayoutProps, NavItem } from './DesktopLayout'

export { Tabs, TabsList, TabTrigger, TabContent } from './Tabs'
export type { TabsProps, TabsListProps, TabTriggerProps, TabContentProps } from './Tabs'

export { ThemeToggle } from './ThemeToggle'

export { LoadingSpinner } from './LoadingSpinner'
export type { LoadingSpinnerProps, LoadingSpinnerSize } from './LoadingSpinner'

export { Modal } from './Modal'
export type { ModalProps, ModalSize } from './Modal'

export { ErrorState } from './ErrorState'
export type { ErrorStateProps } from './ErrorState'

export { PageHeader } from './PageHeader'
export type { PageHeaderProps } from './PageHeader'

export { SectionHeader } from './SectionHeader'
export type { SectionHeaderProps } from './SectionHeader'
