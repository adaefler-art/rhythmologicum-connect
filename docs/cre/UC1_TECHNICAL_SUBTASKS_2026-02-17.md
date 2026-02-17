# UC1 Technical Subtasks (CRE-UC1-01..03) — Stand 2026-02-17

Zweck:
- Die drei UC1-Tickets in umsetzbare technische Arbeitspakete zerlegen.
- Fokus: API, UI, Daten-/State-Modell, Tests, klare Akzeptanzkriterien.

Referenzen:
- `docs/cre/ROLLOUT_USE_CASE_PLAN_2026-02-17.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`

---

## CRE-UC1-01 — Expliziter Abschluss-/Übermittlungs-Flow

### API/Server
- [x] Endpoint/Action für explizites Abschließen ergänzen (idempotent):
  - Ziel: aktuelles Intake explizit als `active` markieren (Submit).
  - Bei Wiederholung: kein Duplicate-Write, gleiche Erfolgsantwort.
- [x] Ownership/Auth-Guard wie bestehende Funnel-Runtime übernehmen.
- [x] Abschlussantwort standardisieren (`success`, `assessmentStatus`, `intakeStatus`, `nextRoute`).
- [x] Audit/Event-Log für Abschluss auslösen (`submitted_at`, `submitted_by`, `source=uc1`).

### UI/Client
- [x] Sichtbare CTA im Dialog: `Erfassung abschließen` (nur wenn Abschluss erlaubt).
- [x] Bestätigungszustand nach Submit (Loading/Success/Error) mit klarer Patientensprache.
- [x] Nach Erfolg deterministischer Abschlusszustand im Dialog (Read-only + Erfolgsstatus).
- [x] Submit während laufendem Request deaktivieren (Double-Submit-Schutz).

### Daten/State
- [x] Klare Statusübergänge definieren (`draft` -> `active`).
- [x] Read-only-Verhalten nach Abschluss erzwingen.
- [x] Persistente Timestamp-Felder verifizieren (`submitted_at`, ggf. `completed_at`).

### Tests
- [x] API-Test: erfolgreicher Submit + idempotenter Re-Submit.
- [x] API-Test: 401/403 bei fehlender Ownership/Rolle.
- [x] E2E-Test: CTA sichtbar, Submit erfolgreich, keine zweite aktive Eingabe danach.
- [x] E2E-Test: Reload nach Submit bleibt im abgeschlossenen Zustand.

### Akzeptanzkriterien
- [x] Abschluss erfolgt nur explizit per CTA.
- [x] Kein Duplicate-Submit möglich.
- [x] Nach Abschluss ist der Dialog im Read-only-Modus.

---

## CRE-UC1-02 — Pause/Resume als SSOT mit klarer Fortschrittsposition

### API/Server
- [x] Runtime-Status-Endpunkt als einzige Wahrheit für `currentStep/currentQuestion` nutzen.
- [x] Resume-Antwort erweitern um stabile Fortschrittsdaten (`step_index`, `total_steps`, `answered_count`).
- [x] Bei Inkonsistenzen deterministische Recovery-Regel implementieren (Server entscheidet Position).

### UI/Client
- [x] Beim Screen-Entry immer Runtime-Status laden, keine lokale Rekonstruktion als Truth Source.
- [x] Fortschrittsanzeige aus Serverdaten ableiten (nicht aus lokalem Message-Array).
- [x] Resume-Banner/Hint: „Du setzt an deiner letzten Stelle fort.“
- [x] Reload/Back/Forward auf identische Frageposition stabilisieren.

### Daten/State
- [x] Lokalen Cache für `assessmentId + currentStep` versionieren.
- [x] Konfliktregel: Server-State überschreibt Client-State.
- [x] Antwortspeicherung und Step-Wechsel transaktional koppeln (kein Step-Sprung ohne Save/Validate).

### Tests
- [x] Integrationstest: Resume nach Reload trifft dieselbe offene Position.
- [x] E2E-Test: Back/Forward/Reload führt nicht zu Frage-Duplikat oder Sprung.
- [x] Regressionstest: bereits beantwortete Frage wird nicht erneut als erste offene Frage gesetzt.

### Akzeptanzkriterien
- [x] Resume ist deterministisch und reproduzierbar.
- [x] Keine Regressionsfälle mit „Eingangsfrage kommt immer wieder“.
- [x] Fortschrittsanzeige konsistent mit Runtime-Status.

---

## CRE-UC1-03 — Open-Loop Qualitätsregeln pro Objective härten

### API/Server
- [ ] Objective-basierte Lückenregeln zentral definieren (`missing`, `unclear`, `resolved`).
- [ ] Follow-up-Auswahl nur aus offenen Objectives; keine bereits gelösten Re-Ask.
- [ ] Konsistente Priorisierung von Open-Loops (klinische Relevanz > Reihenfolge > Wiederholungsschutz).
- [ ] Intake-Generierung um strukturierte Open-Loop-Metadaten erweitern.

### UI/Client
- [ ] Dialoghinweise für fehlende Informationen neutral und nicht-diagnostisch halten.
- [ ] Optionaler Progress-Hinweis „offene Punkte verbleibend“ auf Objective-Basis.
- [ ] Keine irreführenden Aussagen wie „nächste Frage“ ohne tatsächlichen nächsten Schritt.

### Daten/State
- [ ] Objective-Zustände versioniert persistieren (inkl. `resolved_at`, `resolution_source`).
- [ ] Mapping Objective -> Frageknoten dokumentieren und stabil halten.

### Tests
- [ ] Unit-Tests für Objective-State-Transitions (`missing->resolved`, `unclear->resolved`).
- [ ] Golden-Set-Regression: `objective_reask_violation_count = 0` bleibt stabil.
- [ ] E2E-Szenario: unvollständige Angaben erzeugen Open-Loops, vollständige Angaben schließen sie.

### Akzeptanzkriterien
- Open-Loops sind nachvollziehbar, priorisiert und re-ask-frei.
- Intake enthält verwertbare Missing/Unclear-Information je Objective.
- Patientenkommunikation bleibt prozessbezogen, nicht diagnostisch.

---

## Empfohlene Umsetzungsreihenfolge (UC1, 2 Sprints)

Sprint 1:
1. CRE-UC1-02 (SSOT Resume)
2. CRE-UC1-01 (expliziter Abschluss)

Sprint 2:
3. CRE-UC1-03 (Open-Loop Qualität)
4. UC1 End-to-End Regression-Block

## UC1 Gate vor Übergang zu UC2
- [ ] Abschluss + Resume + Open-Loop Kriterien gemeinsam im Shadow-Mode-Slice bestanden
- [ ] Keine P0/P1 Regression im Patient-Dialog
- [ ] Klinisches Kurzfeedback zu Verständlichkeit der offenen Punkte dokumentiert
