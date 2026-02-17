# Rollout Use-Case Plan (Stand 2026-02-17)

Zweck:
- Roadmap auf die drei priorisierten Rollout-Use-Cases ausrichten.
- Klar benennen, was noch fehlt, damit die Use-Cases operativ umsetzbar sind.

Leitplanken (Scope):
- Kein patient-facing Diagnose-/Clinical-Reasoning-Output.
- Hinweise für Ärzt:innen als `Missing/Unclear/Open Loops`, nicht als Verdachtsdiagnosen.
- Intake-Artefakt bleibt das zentrale Abschlussartefakt.

---

## Use Case 1 — Pre-Visit Structured Capture (Home, asynchron)

Zielbild:
- Patient erfasst vor dem Termin strukturiert und pausierbar.
- Abschluss erzeugt Intake + strukturierte Daten + Open Loops.

Bereits vorhanden:
- Strukturierte Follow-up-/Intake-Pipeline.
- Erste Erstaufnahme-Integration inkl. Kontextübernahme.
- Guardrails für patient-facing Antwortstil.

Fehlend bis rollout-fähig:
1. **Expliziter Abschluss-Flow** (statt impliziter Generierung im Dialog):
   - CTA `Erfassung abschließen/übermitteln`.
   - Eindeutiger Status `abgeschlossen/übermittelt` für Patient.
2. **Pause/Resume als First-Class UX**:
   - Fortschritts- und Wiedereinstiegslogik mit klarer Schritt-/Fragenposition.
3. **Open-Loops-Qualität**:
   - Konsistente Kennzeichnung fehlender Felder je Objective.
4. **Patienten-Output-Härtung**:
   - Keine medizinische Wertung im Abschluss-Text, nur Prozesshinweis.

Definition of Done UC1:
- Asynchrone Erfassung inkl. Pause/Resume stabil.
- Abschluss erzeugt Intake deterministisch.
- Patient sieht nur Prozessabschluss, keine Diagnose.

---

## Use Case 2 — Waiting Room Fastpass (Tablet/Kiosk, leise)

Zielbild:
- Sehr kurzer, tap-freundlicher Mindestdatensatz unter Zeitdruck.
- Intake auch bei Unvollständigkeit + markierte Missing Fields.
- Optionaler Übergang zu UC1 (QR/Link).

Bereits vorhanden:
- Intake kann mit fehlenden Feldern arbeiten.
- Open-Loop-/Missing-Logik ist konzeptionell angelegt.

Fehlend bis rollout-fähig:
1. **Fastpass-Modus (Form-first)**:
   - Große Targets, reduzierte Anzahl Felder, keine Sprache.
2. **Minimum-Dataset-Vertrag**:
   - Fixes Pflichtset (`Anliegen`, `Hauptsymptom+Beginn`, `Medikation`, Red-Flag-Prozesscheck, 1-2 Skalen).
3. **Kiosk/Tablet-Betriebsmodus**:
   - Datenschutz-/Session-Verhalten (Auto-Reset, Sichtschutz-Hinweise).
4. **Upgrade-Pfad zu UC1**:
   - QR/Deep-Link mit sicherer Fortsetzung der offenen Punkte.

Definition of Done UC2:
- Fastpass in <5 Minuten bedienbar.
- Intake erzeugt Minimum Dataset + Open Loops sichtbar für Ärzt:innen.
- Übergabe in UC1 technisch und UX-seitig stabil.

---

## Use Case 3 — Consult Mode Silent Listener (arztgeführt, Audio-first)

Zielbild:
- Während Konsultation: strukturierte Extraktion im Hintergrund.
- Arztpanel zeigt nur `Captured / Missing / Unclear`.
- Rückfragen als Vorschläge für Ärzt:innen, nicht Bot an Patient.

Bereits vorhanden:
- Strukturierte Intake-/Follow-up-Orchestrierung.
- Clinician Review-/Open-Loop-Bausteine.

Fehlend bis rollout-fähig:
1. **Audio + Consent-Layer**:
   - Sichtbarer Recording-Status, Consent-Handling, Audit-Events.
2. **Clinician-Panel Silent Listener**:
   - Minimal-UI mit wenigen, priorisierten offenen Punkten.
3. **Quellen-/Evidenzmarkierung**:
   - Fakten mit `source=conversation` + Timestamp.
4. **Arztgeführte Klärung**:
   - Vorschlagslogik, keine direkte Patientenansprache durch Bot im Consult Mode.

Definition of Done UC3:
- Arzt kann Sitzung ohne Gesprächsunterbrechung führen.
- Panel liefert verwertbare Missing/Unclear-Hinweise.
- Abschluss aktualisiert Intake inklusive Quellenhinweisen.

---

## Roadmap-Anpassung (empfohlen)

Phase A (2-3 Wochen): **UC1 Stabilisierung**
- Abschluss-Flow + Resume-Härtung + Open-Loop-Qualität.

Phase B (2-3 Wochen): **UC2 Fastpass**
- Fastpass UI, Minimum Dataset Contract, UC2→UC1 Übergabe.

Phase C (3-4 Wochen): **UC3 Silent Listener Pilot**
- Consent/Audio, Clinician-Panel, Evidence-Timestamps, ärztliche Rückfragevorschläge.

Phase D (2 Wochen): **Readiness & Rollout**
- KPI-Gates, Schulung/Runbook, Go/No-Go.

---

## Konkrete Arbeitspakete (neu)

- `CRE-UC1-01` Abschluss- und Übermittlungs-Flow im Patient Dialog.
- `CRE-UC1-02` Pause/Resume mit Fortschritts-SSOT.
- `CRE-UC1-03` Open-Loop-Qualitätsregeln je Objective.

- `CRE-UC2-01` Fastpass-Form (Tablet/Kiosk, no-audio, large targets).
- `CRE-UC2-02` Minimum-Dataset-Schema + Validierung.
- `CRE-UC2-03` QR/Deep-Link Upgrade zu UC1.

- `CRE-UC3-01` Consent + Recording Status + Audit Events.
- `CRE-UC3-02` Silent-Listener Clinician-Panel (`Captured/Missing/Unclear`).
- `CRE-UC3-03` Evidenz-/Timestamp-Mapping im Intake.
- `CRE-UC3-04` Ärztliche Rückfragevorschläge (physician-directed).

- `CRE-ROLL-01` KPI-/Go-No-Go-Matrix für UC1-UC3.
- `CRE-ROLL-02` Schulungs- und Betriebsrunbook pro Touchpoint.

---

## Offene Entscheidungen (für nächstes Alignment)

1. UC1 Abschluss: expliziter Submit-Button vs. Auto-Submit nach letzter Frage.
2. UC2 Gerätelogistik: Kiosk-Hardware/MDM vs. BYOD-Tablet.
3. UC3 Audio-Betrieb: lokale Transkription vs. Serverstreaming (Datenschutz/Latency).
4. Rollout-Reihenfolge: UC1-only Pilot vor UC2/UC3 oder paralleler Site-Pilot.
