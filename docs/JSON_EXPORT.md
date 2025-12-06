# JSON Export für Verlaufsdaten

## Übersicht

Patientinnen und Patienten können ihre Verlaufsdaten im JSON-Format exportieren. Der Export enthält alle relevanten Messungen mit Scores, Risikobewertungen, Zeitstempeln und AMY-Auswertungen.

## Zugriff

Der Export ist nur für authentifizierte Patientinnen und Patienten verfügbar. Jede Person kann ausschließlich ihre eigenen Daten exportieren.

### API-Endpoint

```
GET /api/patient-measures/export
```

**Authentifizierung:** Bearer Token (automatisch über Browser-Session)

### UI-Button

In der Patientenansicht unter `/patient/history` steht ein "Als JSON exportieren"-Button zur Verfügung.

## Export-Format

### Struktur

```json
{
  "export_date": "2025-12-05T10:30:00.000Z",
  "patient_id": "uuid-of-patient",
  "total_count": 5,
  "measures": [
    {
      "measure_id": "uuid-of-measure",
      "patient_id": "uuid-of-patient",
      "measured_at": "2025-12-05T09:15:00.000Z",
      "stress_score": 65,
      "sleep_score": 72,
      "risk_level": "moderate",
      "report_id": "uuid-of-report",
      "scores": {
        "stress_score": 65,
        "sleep_score": 72
      },
      "report_assessment_id": "uuid-of-assessment",
      "amy_interpretation": "Ihre Stresswerte liegen im moderaten Bereich...",
      "report_created_at": "2025-12-05T09:16:00.000Z"
    }
  ]
}
```

### Felder-Beschreibung

#### Root-Level

- **export_date** (ISO 8601): Zeitstempel des Exports
- **patient_id** (UUID): Eindeutige Patienten-ID
- **total_count** (Zahl): Anzahl der exportierten Messungen
- **measures** (Array): Liste aller Messungen

#### Measures-Objekt

- **measure_id** (UUID): Eindeutige ID der Messung
- **patient_id** (UUID): Referenz zum Patientenprofil
- **measured_at** (ISO 8601): Zeitpunkt der Messung (Report-Zeitstempel)
- **stress_score** (Zahl | null): Normalisierter Stress-Score (0–100)
- **sleep_score** (Zahl | null): Normalisierter Schlaf-Score (0–100)
- **risk_level** (String): Einstufung `low`, `moderate`, `high` oder temporär `pending`
- **report_id** (UUID | null): Referenz zum Report
- **scores** (Objekt): Duplizierte Scores zur Rückwärtskompatibilität
  - **stress_score** (Zahl | null)
  - **sleep_score** (Zahl | null)
- **report_assessment_id** (UUID | null): Assessment, das dem Report zugrunde liegt
- **amy_interpretation** (String | null): Kurztext von AMY
- **report_created_at** (ISO 8601 | null): Zeitpunkt der Report-Erstellung

### Datei-Name

Die exportierte Datei wird automatisch heruntergeladen mit dem Namen:

```
verlaufsdaten-export-YYYY-MM-DD.json
```

Beispiel: `verlaufsdaten-export-2025-12-05.json`

## Verwendung

### Browser-Export

1. Als Patient:in anmelden
2. Zum Verlauf navigieren (`/patient/history`)
3. Button "Als JSON exportieren" klicken
4. Datei wird automatisch heruntergeladen

### Programmatischer Zugriff

```javascript
// Beispiel mit fetch API
const session = await supabase.auth.getSession()

const response = await fetch('/api/patient-measures/export', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

const exportData = await response.json()
console.log(exportData)
```

## Fehlerbehandlung

### Häufige Fehler

- **401 Unauthorized**: Nicht angemeldet oder ungültiger Token
- **403 Forbidden**: Kein Patientenprofil gefunden
- **500 Internal Server Error**: Server-Konfigurationsproblem

### Beispiel-Fehlermeldung

```json
{
  "error": "Nicht authentifiziert. Bitte melden Sie sich an."
}
```

## Sicherheit

- ✅ Nur authentifizierte Nutzer:innen können exportieren
- ✅ Jede Person kann nur ihre eigenen Daten abrufen
- ✅ Patient-ID wird über das verknüpfte Profil verifiziert
- ✅ Kein direkter Datenbankzugriff über URL-Parameter möglich

## Datenschutz

Die exportierten Daten enthalten personenbezogene Gesundheitsdaten und sollten entsprechend den Datenschutzrichtlinien behandelt werden.
