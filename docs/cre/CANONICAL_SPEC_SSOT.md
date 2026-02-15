# CRE Canonical Spec (SSOT)

Stand: 2026-02-15  
Status: verbindlich für neue CRE-Implementierungen (Intake/Safety/Reasoning/Follow-up/HITL)

## 1. Scope
Diese Spezifikation ist die Single Source of Truth für:
- Clinical Intake Datenmodell
- Safety-/Red-Flag-Verhalten
- Reasoning-Paket (intern)
- Follow-up-Lebenszyklus
- Human-in-the-Loop/Human-in-the-Lead Gates

Nicht-Ziele:
- autonome Diagnose
- autonome Therapieänderung
- ungeprüfte klinische Finalisierung ohne Sign-off

## 2. Globale API-Konvention
Alle CRE-Endpunkte liefern:

```ts
type CreApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: Record<string, unknown> }
  requestId?: string
}
```

## 3. Core Data Objects

### 3.1 Clinical Intake
Pflichtfelder:
- `id` (uuid)
- `status` (`draft | in_review | approved | needs_more_info | rejected`)
- `version_number` (number)
- `clinical_summary` (string | null)
- `structured_data` (object)
- `created_at`, `updated_at`

Optional:
- `trigger_reason`
- `last_updated_from_messages`
- `policy_override`

### 3.2 Structured Intake (`structured_data`)
Mindeststruktur:
- `symptom` (inkl. Leitsymptom und zeitliche Einordnung)
- `history` (PMH/PSH/FH/SH/Meds/Allergien/ROS, stufenweise erweiterbar)
- `safety`
- `red_flags`
- `reasoning`
- `followup`

## 4. Safety Model (führend)

### 4.1 Eskalationsstufen
- `A` = Hard Stop
- `B` = Priority Review
- `C` = Monitored Continuation

### 4.2 Invarianten
- Safety ist deterministisch regelbasiert.
- Reasoning darf Safety-Entscheidung nicht überschreiben.
- Jede Eskalation ist auditierbar (`rule_ids`, `check_ids`, Trigger-Evidence).

### 4.3 Effective Safety State
Es gilt immer:
- `policy_result` + optionaler gültiger `policy_override` => `effective_level`, `effective_action`

## 5. Reasoning Model (intern)
Mindestausgabe in `structured_data.reasoning`:
- `differentials[]`
- `open_questions[]`
- `recommended_next_steps[]`
- `uncertainties[]` (wenn vorhanden)

Regeln:
- keine patientensichtbare Diagnoseausgabe
- offene Fragen und fehlende Daten explizit
- kompatibel zu Safety-Output

## 6. Follow-up Model
Mindestausgabe in `structured_data.followup`:
- `next_questions[]`
- `asked_question_ids[]`
- optional `queue[]`

Regeln:
- beantwortete Fragen dürfen nicht erneut als aktiv erscheinen
- Follow-up-Antworten müssen in Versionierung nachvollziehbar sein

## 7. Workflow / Gates (HITL/HIC)
Statusfluss:
1. `draft`
2. `in_review`
3. `approved` oder `needs_more_info` oder `rejected`

Verbindlich:
- klinische Nutzung/Export nur nach freigegebenem Gate
- Gate-Entscheidungen sind auditierbar

## 8. Versioning & Audit
- Jede relevante Änderung erzeugt nachvollziehbare Versionierung.
- Regel-/Policy-/Prompt-Änderungen werden versioniert referenziert.
- Audit enthält mindestens: Zeit, Akteur, Aktion, Begründung.

## 9. Konfliktentscheidungen gegenüber älterer CRE-Doku
1. API-Envelopes: verbindlich `success/data/error/requestId`.
2. Safety-Hoheit: Safety vor Reasoning ohne Ausnahme.
3. Sign-off: Draft allein ist nie klinischer Endstatus.

## 10. Mapping zu E1
- E1-01 erfüllt durch dieses Dokument.
- E1-02 und E1-03 referenzieren diese SSOT als normative Grundlage.