/**
 * Modal Component
 * 
 * A dialog overlay component for displaying content above the main page.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Accessible with proper ARIA attributes and focus management
 * - Backdrop click and Escape key to close
 * - Optional header and footer sections
 * - Configurable sizes
 * - Uses semantic design tokens
 * - Smooth animations
 * - Body scroll lock when open
 * 
 * @example
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Action">
 *   Are you sure you want to proceed?
 * </Modal>
 * 
 * @example
 * // Modal with footer actions
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Delete Assessment"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={handleClose}>Cancel</Button>
 *       <Button variant="destructive" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   This action cannot be undone.
 * </Modal>
 */

import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean
  
  /**
   * Callback when modal should close
   */
  onClose: () => void
  
  /**
   * Optional modal title
   */
  title?: string
  
  /**
   * Modal content
   */
  children: ReactNode
  
  /**
   * Optional footer content (usually buttons)
   */
  footer?: ReactNode
  
  /**
   * Size preset
   * @default 'md'
   */
  size?: ModalSize
  
  /**
   * Whether clicking the backdrop closes the modal
   * @default true
   */
  closeOnBackdropClick?: boolean
  
  /**
   * Whether pressing Escape closes the modal
   * @default true
   */
  closeOnEscape?: boolean
  
  /**
   * Additional CSS classes for the modal content
   */
  className?: string
}

/**
 * Modal dialog component
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Size configurations
  const sizeConfig = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Handle focus trap and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the modal
    modalRef.current?.focus()

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow

      // Restore focus to previous element
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeConfig[size]}
          bg-white dark:bg-slate-800
          rounded-xl shadow-xl
          max-h-[90vh] flex flex-col
          transition-all duration-200
          ${className}
        `}
        style={{
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-2xl)',
        }}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700"
            style={{ padding: 'var(--spacing-xl)' }}
          >
            <h2
              id="modal-title"
              className="text-xl font-semibold text-slate-900 dark:text-slate-100"
              style={{ fontSize: 'var(--font-size-xl)' }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg p-2
                text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                hover:bg-slate-100 dark:hover:bg-slate-700
                focus:outline-none focus:ring-2 focus:ring-sky-500
                transition-colors duration-200
              "
              aria-label="Close modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ padding: 'var(--spacing-xl)' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700"
            style={{
              padding: 'var(--spacing-xl)',
              gap: 'var(--spacing-md)',
            }}
          >
            {footer}
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            className="
              absolute top-4 right-4
              rounded-lg p-2
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
              hover:bg-slate-100 dark:hover:bg-slate-700
              focus:outline-none focus:ring-2 focus:ring-sky-500
              transition-colors duration-200
            "
            aria-label="Close modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Modal
