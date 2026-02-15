# CRE API Konvention

Stand: 2026-02-15

## Ziel
Einheitliches API-Response-Envelope für CRE-nahe Endpunkte.

## Verbindliches Format

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  requestId?: string
}
```

## Regeln
1. Erfolgsantworten liefern immer `success: true` und ein `data`-Objekt.
2. Fehlerantworten liefern immer `success: false` und `error.code` + `error.message`.
3. `requestId` soll gesetzt werden, wenn Correlation-ID verfügbar ist.
4. Domänendaten werden ausschließlich unter `data` ausgeliefert.
5. Legacy-Top-Level-Felder sind nur als Übergang erlaubt und mittelfristig zu entfernen.

## Betroffene CRE-Endpunkte (MVP)
- `POST /api/clinical-intake/generate`
- `GET /api/clinical-intake/latest`
- `GET /api/clinician/patient/[patientId]/clinical-intake/latest`
- `PATCH /api/clinician/patient/[patientId]/clinical-intake/latest`
- `GET /api/clinician/patient/[patientId]/clinical-intake/history`
- `GET /api/clinician/patient/[patientId]/intake/version/[versionNumber]`

## Fehlercode-Richtlinie
- Primär `ErrorCode` aus `lib/api/responseTypes.ts` verwenden.
- Falls endpoint-spezifische Codes nötig sind, konsistent dokumentieren.

## Rollout
- E1-03 harmonisiert die oben genannten Kernendpunkte.
- Weitere CRE-Subendpunkte (`export/*`, `review/*`) folgen in E3/E4 bei Bedarf.