/**
 * E6.6.8 — Emergency Contact Info Component
 *
 * Reusable component for displaying emergency contact information.
 * Ensures consistent styling and content across all escalation paths.
 */

import { Phone } from 'lucide-react'
import { EMERGENCY_CONTACTS, getEmergencyContactsList } from '@/lib/safety/disclaimers'

type EmergencyContactInfoProps = {
  /** Visual style variant */
  variant?: 'default' | 'compact'
  /** Title to display above contacts */
  title?: string
  /** Optional description text */
  description?: string
  /** Show all contacts or just emergency (112) */
  showAll?: boolean
}

/**
 * EmergencyContactInfo Component
 *
 * Displays emergency contact numbers in a consistent format.
 * Used in EscalationOfferCard, escalation placeholder page, and AI assistant results.
 *
 * @example
 * // Red flag escalation (show all contacts)
 * <EmergencyContactInfo
 *   title="Bei akuter Gefahr"
 *   description="Wenden Sie sich bitte umgehend an:"
 *   showAll={true}
 * />
 *
 * @example
 * // Standard emergency (compact, 112 only)
 * <EmergencyContactInfo
 *   variant="compact"
 *   showAll={false}
 * />
 */
export function EmergencyContactInfo({
  variant = 'default',
  title = 'Bei akuter Gefahr',
  description,
  showAll = true,
}: EmergencyContactInfoProps) {
  const contacts = showAll ? getEmergencyContactsList() : [EMERGENCY_CONTACTS.EMERGENCY]

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2">
        <Phone className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-red-900 dark:text-red-100">
            {title}
            {': '}
            <span className="font-mono font-bold">{EMERGENCY_CONTACTS.EMERGENCY.number}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <Phone className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
      <div>
        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">{description}</p>
        )}
        <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
          {contacts.map((contact) => (
            <li key={contact.number} className="flex items-center gap-2">
              <span className="font-mono font-bold">{contact.number}</span>
              <span>— {contact.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default EmergencyContactInfo
