import { POST as createAnamnesisEntry } from '@/app/api/patient/anamnesis/route'

export async function POST(request: Request) {
  const body = await request.json()
  const headers = new Headers(request.headers)
  headers.set('Content-Type', 'application/json')

  const nextRequest = new Request(request.url.replace('/patient/intake', '/patient/anamnesis'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...body,
      entry_type: 'intake',
    }),
  })

  return createAnamnesisEntry(nextRequest)
}
