export default async function Page() {
  await fetch('/api/hello', { method: 'GET' })
  return null
}
