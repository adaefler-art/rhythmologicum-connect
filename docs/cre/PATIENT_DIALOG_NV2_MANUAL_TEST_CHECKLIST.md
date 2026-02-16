# Patient Dialog NV2 — Manuelle Test-Checkliste

Stand: 2026-02-16

Zweck:
- Operative manuelle Abdeckung der offenen NV2-Restpunkte.
- Ergänzt den automatisierten E2E-Nachweis aus dem UX-State-Katalog.

Scope:
- Patient-Dialog (`/patient/dialog`)
- Kernübergänge Follow-up, Safety-Hinweis, Eingabe/Interaktion

Hinweis zur Durchführung:
- Bei jedem Fall Ergebnis notieren (`ok` / `abweichung`) und kurze Evidence (Screenshot, Notiz, Zeitstempel) dokumentieren.

## A) Voice-/Dictation-Pfade

- [ ] A-01 Mikrofon starten: Aufnahmezustand wird klar angezeigt
- [ ] A-02 Mikrofon stoppen: Diktat endet kontrolliert ohne UI-Hänger
- [ ] A-03 Diktatfehler simulieren: Fehlermeldung ist verständlich und handlungsleitend
- [ ] A-04 Diktattext kann vor Versand editiert werden

## B) Netzwerk-/Fehlerverhalten

- [ ] B-01 Kurzzeitiger API-Fehler bei Chat-Submit zeigt verständliche Rückmeldung
- [ ] B-02 Retry nach Fehler funktioniert ohne Doppelversand
- [ ] B-03 Follow-up-Generierung mit Verzögerung bleibt bedienbar (kein Dead-End)
- [ ] B-04 Reload nach Fehler führt zu konsistentem Dialogzustand

## C) Accessibility-Basisprüfung

- [ ] C-01 Fokusreihenfolge sinnvoll (Eingabe, Senden, zentrale Aktionen)
- [ ] C-02 Keyboard-only Nutzung möglich (Tippen, Senden via Enter, Navigation)
- [ ] C-03 Interaktive Elemente haben erkennbare zugängliche Beschriftung
- [ ] C-04 Safety-Hinweis ist visuell und inhaltlich eindeutig wahrnehmbar

## D) Copy-/Klinik-Review Kernübergänge

- [ ] D-01 Follow-up-Leittexte nutzen konsistente "Frage"-Terminologie
- [ ] D-02 Kliniker-Hinweistext ist neutral und verständlich
- [ ] D-03 Keine redundanten/echoenden Prompt-Präfixe in Kernfragen
- [ ] D-04 Kritische Hinweise sind klar, ohne irreführende Formulierung

## E) Abschlussstatus für NV2 Exit

- [ ] Alle Testfälle A-01 bis D-04 wurden ausgeführt
- [ ] Keine offenen P0/P1 UI-Abweichungen aus manuellen Läufen
- [ ] Abweichungen sind als Folge-Issues mit Owner erfasst

## Evidence-Log (kurz)

| Datum/Zeit | Testfall | Ergebnis | Evidence/Notiz |
|---|---|---|---|
| _offen_ | _offen_ | _offen_ | _offen_ |

## Referenzen

- `docs/cre/PATIENT_DIALOG_UX_STATE_CATALOG_NV2.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`