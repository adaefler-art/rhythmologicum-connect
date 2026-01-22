import type { Metadata } from 'next'
import AssessmentFlowV2Client from '../../../assessment-flow-v2/client'

export const metadata: Metadata = {
  title: 'Assessment Flow - Rhythmologicum Connect',
  description: 'Assessment durchführen',
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AssessmentFlowPage({ params }: PageProps) {
  await params

  return (
    <AssessmentFlowV2Client
      initialLoading={false}
      hasError={false}
      mode="live"
    />
  )
}
