import PatientHistoryClient from './PatientHistoryClient'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function PatientHistoryPage() {
  return <PatientHistoryClient />
}
