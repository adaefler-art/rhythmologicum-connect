import type { Metadata } from 'next'
import { DialogScreenV2 } from './DialogScreenV2'

export const metadata: Metadata = {
  title: 'Dialog - Rhythmologicum Connect',
  description: 'Kommunikation und Beratung im Patientenportal.',
}

export default function DialogPage() {
  return <DialogScreenV2 />
}
