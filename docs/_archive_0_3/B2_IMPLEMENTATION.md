# B2 Save-Logic für neue Messungen - Implementation Details

## Zusammenfassung

Die Speicherung von Messungen erfolgt jetzt vollständig innerhalb des `/api/amy/stress-report` Flows. Sobald ein Report erstellt oder aktualisiert wird, entsteht (oder aktualisiert sich) automatisch ein `patient_measures` Datensatz mit Scores und Risiko-Level – ohne separaten Save-Endpoint.

## Implementierte Änderungen

### 1. Schema-Refresh für `patient_measures`

**Dateien:**
- `supabase/migrations/20241204210000_create_patient_measures_table.sql`
- `supabase/migrations/20241209103000_update_patient_measures_schema.sql`

Der ursprüngliche Table-Stub wurde durch eine Migration ergänzt, die das Schema an die produktive Realität anpasst:

- `patient_id` verweist auf `patient_profiles`
- `report_id` verknüpft Messungen mit Reports (Idempotenz pro Report)
- `stress_score` und `sleep_score` speichern normalisierte Werte (0–100)
- `risk_level` kennt `low | moderate | high | pending`
- `created_at` markiert den Messzeitpunkt
- Trigger & Columns für `assessment_id`/`measurement_type`/`status` wurden entfernt

### 2. Stress-Report Endpoint übernimmt Persistenz

**Datei:** `app/api/amy/stress-report/route.ts`

- Liest Assessment + Antworten, berechnet Scores und generiert (oder aktualisiert) den AMY-Report
- Nutzt `upsertPatientMeasure(...)`, um anhand `report_id` genau einen Messdatensatz pro Report zu halten
- Persistiert `stress_score`, `sleep_score`, `risk_level` sofort – auch wenn das LLM einen Fallback liefert
- Setzt `risk_level = 'pending'`, falls noch keine Einstufung möglich ist

### 3. Frontend-Integration

**Dateien:**
- `app/patient/stress-check/result/StressResultClient.tsx`
- `app/patient/history/PatientHistoryClient.tsx`

Änderungen:
- Ergebnis-Client ruft nur noch `/api/amy/stress-report` auf – kein separater Save-Call
- History-Ansicht konsumiert die neuen Felder (`stress_score`, `sleep_score`, `risk_level`, `report_id`, `created_at`)

### 4. Export & Doku

**Dateien:**
- `app/api/patient-measures/export/route.ts`
- `docs/JSON_EXPORT.md`
- `supabase/README.md`

Der Export liefert jetzt genau die Werte aus `patient_measures` plus optionale Report-Metadaten. Dokumentation beschreibt das neue Format und die Idempotenz über `report_id`.

## Akzeptanzkriterien - Erfüllung

✅ **Messung wird genau einmal gespeichert**
- `report_id` fungiert als natürliche Idempotenz, der Endpoint upsertet statt zu insertieren

✅ **Scores + Risiko werden persistiert**
- `patient_measures` enthält die normalisierten Werte und das finale Risiko-Level (oder `pending`)

✅ **Fehlerhandling**
- Stress-Report Endpoint loggt Fehler zentral; Fallback-Text stellt Response sicher
- Misslungene `patient_measures` Updates führen zu 500, damit Monitoring greift

## Testen

- `npm run dev` starten
- Beide Migrationen in Supabase anwenden (`20241204...` + `20241209...`)
- Anschließend die Schritte aus `docs/B2_TESTING_GUIDE.md` befolgen (Stress-Check durchspielen, doppelte Aufrufe beobachten, Export prüfen)

## Sicherheit & Betrieb

- Supabase Service Role bleibt serverseitig
- Kein separater Endpoint mehr → kleinere Angriffsfläche
- RLS-Policies für `patient_measures` weiterhin offen (TODO)

## Dateien

| Datei | Zweck |
|-------|-------|
| `supabase/migrations/20241204210000_create_patient_measures_table.sql` | Initiales Table-Schema |
| `supabase/migrations/20241209103000_update_patient_measures_schema.sql` | Schema-Refresh (Scores/Risiko) |
| `app/api/amy/stress-report/route.ts` | Persistenz & Report-Generierung |
| `app/patient/stress-check/result/StressResultClient.tsx` | Trigger für Report-Erstellung |
| `app/patient/history/PatientHistoryClient.tsx` | Anzeige der neuen Messwerte |
| `app/api/patient-measures/export/route.ts` | JSON-Export mit Report-Anreicherung |
| `docs/B2_IMPLEMENTATION.md` | Diese Datei |

---

**Erstellt am:** 2024-12-04  
**Letztes Update:** 2024-12-09  
**Status:** Implementiert
