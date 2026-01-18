'use client'

import ContentPageEditor from '@/app/components/ContentPageEditor'

export const dynamic = 'force-dynamic'

export default function NewContentPage() {
  return <ContentPageEditor mode="create" />
}
