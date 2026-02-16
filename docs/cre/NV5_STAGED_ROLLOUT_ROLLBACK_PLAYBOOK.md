# NV5 Staged Rollout & Rollback Playbook

Stand: 2026-02-16

Ziel:
- Sichere, stufenweise Inbetriebnahme von v0.8 mit klaren Stop-/Rollback-Regeln.
- Eindeutige Verantwortlichkeiten für Entscheidung und Ausführung.

## 1) Rollout-Phasen

### Phase 0 — Preflight (Go/No-Go)
- Go/No-Go Vorlage final befüllen (`docs/cre/V0_8_GO_NO_GO_TEMPLATE.md`)
- Kritische Alerts und offene Safety-Themen prüfen
- Monitoring + Alerting Funktionsprobe durchführen

### Phase 1 — Canary
- Kleines Fallvolumen / begrenzte Nutzergruppe
- Laufzeit: 24-48h
- Fokus: Safety-Alerts, Follow-up-Stabilität, Reviewer-Feedback

### Phase 2 — Controlled Ramp
- Volumen stufenweise erhöhen
- Laufzeit: 3-5 Tage
- Fokus: KPI-Trends (`clarification_loop_rate`, `resolved_followup_rate`, hard-stop Verhalten)

### Phase 3 — Broad Rollout
- Regulärer Betrieb
- Fortlaufendes Monitoring nach Weekly-Cadence

## 2) Stop-/Rollback-Kriterien

Sofortiger Stopp bei:
- unadressiertem `critical` Alert
- klinisch relevantem Safety-Regression-Befund
- reproduzierbarer schwerer Workflow-Störung im Kernpfad

Rollback auslösen bei:
- 2+ kritischen Vorfällen im selben 24h-Fenster
- klarer negativer KPI-Trend über definierten Schwellwert
- medizinischem Risikoentscheid durch Medical Lead

## 3) Rollback-Strategie (operativ)

1. Rollout sofort anhalten (keine weitere Volumenerhöhung)
2. Letzte stabile Konfiguration/Version reaktivieren
3. Monitoring auf Stabilisierung prüfen (mind. 2h engmaschig)
4. Incident-Notiz mit Root-Cause-Hypothese anlegen
5. Re-Entry-Kriterien für erneuten Rollout definieren

## 4) Verantwortlichkeiten

- Medical Lead: Risikoentscheid, klinische Freigabe
- Backend Lead: technische Rollout-/Rollback-Ausführung
- Ops Owner: Monitoring, Incident-Dokumentation, Statuskommunikation
- Product Owner: Stakeholder-Kommunikation, Priorisierung von Folgearbeiten

## 5) Checkliste je Rollout-Phase

| Schritt | Owner | Status |
|---|---|---|
| Preflight-Go/No-Go dokumentiert | _offen_ | _offen_ |
| Canary gestartet und überwacht | _offen_ | _offen_ |
| Ramp-Entscheidung getroffen | _offen_ | _offen_ |
| Broad Rollout freigegeben | _offen_ | _offen_ |
| Rollback-Pfad getestet (Tabletop) | _offen_ | _offen_ |

## 6) Evidence/Links

- `docs/cre/V0_8_GO_NO_GO_TEMPLATE.md`
- `docs/cre/NV5_RELEASE_READINESS_REPORT_DRAFT.md`
- `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
