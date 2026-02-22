function getPayloadAdminUrl(): string | null {
  const baseUrl = process.env.CMS_PAYLOAD_BASE_URL?.trim()
  if (!baseUrl) {
    return null
  }

  try {
    return new URL('/admin', baseUrl).toString()
  } catch {
    return null
  }
}

export default function AdminCmsPage() {
  const payloadAdminUrl = getPayloadAdminUrl()

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">CMS</h1>
        <p className="text-sm text-muted-foreground">
          Zugriff auf das externe Payload-CMS für redaktionelle Inhalte.
        </p>
      </header>

      {payloadAdminUrl ? (
        <a
          href={payloadAdminUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Payload CMS öffnen
        </a>
      ) : (
        <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
          CMS-URL nicht konfiguriert. Setze <strong>CMS_PAYLOAD_BASE_URL</strong>, um den
          Payload-Admin-Link bereitzustellen.
        </div>
      )}
    </section>
  )
}
