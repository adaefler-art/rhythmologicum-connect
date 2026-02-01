import type { Metadata } from 'next'
import { FunnelRunnerPage } from './client'

export const metadata: Metadata = {
  title: 'Assessment - Rhythmologicum Connect',
  description: 'Führen Sie Ihr Assessment durch',
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AssessmentFlowPageV3({ params }: PageProps) {
  const { id } = await params

  return <FunnelRunnerPage slug={id} />
}
