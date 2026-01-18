/**
 * Document Confirmation Page (V05-I04.3)
 * 
 * Patient can review and confirm/correct extracted document data
 */

import { redirect } from 'next/navigation'
import { getDocumentForConfirmation } from '@/lib/actions/confirmations'
import ConfirmationClient from './client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function DocumentConfirmationPage({ params }: Props) {
  const { id } = await params

  // Fetch document with extraction data
  const result = await getDocumentForConfirmation(id)

  if (!result.success || !result.data) {
    // Redirect to patient home with error
    redirect(`/patient?error=${result.error?.code || 'NOT_FOUND'}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ConfirmationClient documentId={id} initialData={result.data} />
    </div>
  )
}
