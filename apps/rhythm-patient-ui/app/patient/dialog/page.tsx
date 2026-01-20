import type { Metadata } from 'next'
import { MobileShellV2 } from '../components'
import { DialogScreenV2 } from './DialogScreenV2'

export const metadata: Metadata = {
  title: 'Dialog - Rhythmologicum Connect',
  description: 'Kommunikation und Beratung im Patientenportal.',
}

export default function DialogPage() {
  return (
    <MobileShellV2>
      <DialogScreenV2 />
    </MobileShellV2>
  )
}
