# Patient Dialog UX-State-Katalog (NV2)

Stand: 2026-02-16

Ziel:
- Einheitliche, testbare Definition der relevanten UX-Zustände im Patient-Dialog (`/patient/dialog`).
- Grundlage für NV2-Exit-Check „100% definierte UX-States in manuellen Testfällen abgedeckt“.

Scope:
- Patient-Dialog im Mock-/Testbetrieb (funktional)
- Kernübergänge zwischen Follow-up, Safety-Hinweis und Eingabeinteraktion

Nicht im Scope:
- Clinician-UI
- Live-Produktivdatenqualität

## Zustandskatalog

| ID | Zustand | Trigger | Erwartetes UX-Verhalten | Aktuelle Evidenz |
|---|---|---|---|---|
| UX-01 | Dialog initial geladen | Route `/patient/dialog` geöffnet | Dialog-Ansicht ist erreichbar; Interaktionsbereich sichtbar | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-02 | Follow-up Frage sichtbar | Offene `next_questions` vorhanden | PAT zeigt fokussierte Folgefrage im Chatverlauf | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-03 | Follow-up Antwort senden (Button/Enter) | Patient sendet Antwort | Antwort wird übernommen; nächste Orchestrierung läuft | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-04 | Keine sofortige Re-Ask-Duplikation | Frage wurde beantwortet | Bereits beantwortete Frage wird nicht unmittelbar erneut gestellt | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-05 | Safety-Hard-Stop sichtbar | `effective_policy_result` => `A/hard_stop` | Sicherheits-Hinweis sichtbar; Senden deaktiviert | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-06 | Back/Forward stabil | Browser `Back`/`Forward` | Dialogzustand bleibt konsistent; Follow-up-Kontext bleibt nutzbar | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-07 | Reload stabil | Browser Reload auf Dialog | Zustand wird deterministisch wiederhergestellt; keine inkonsistente UI | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-08 | Mobile Viewport nutzbar | Kleiner Viewport (390x844) | Eingabe bleibt bedienbar; Scroll-Recovery funktioniert | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-09 | Keyboard-Flow mobil | Mobile Eingabe + `Enter` | Nachricht wird per Tastatur-Submit versendet | Automatisiert: `tests/e2e/patient-followup-loop.spec.ts` |
| UX-10 | Start-CTA zur Erstaufnahme sichtbar | Route `/patient/start` geöffnet | Erstaufnahme-Box + Start-CTA sichtbar | Automatisiert: `tests/e2e/patient-intake-start-cta.spec.ts` |

## Microcopy-Kernübergänge (Soll)

- Folgefragen verwenden konsistente "Frage"-Sprache (statt gemischter "Rueckfrage"-Varianten).
- Klinische Herkunft wird neutral als Hinweis formuliert (z. B. „Diese Frage wurde aerztlich angefordert.“).
- Bei mehreren offenen Punkten wird Priorisierung transparent kommuniziert.

## Offene manuelle Abdeckung (für NV2 Exit)

Die folgenden Punkte sind weiterhin als manuelle Testfälle zu dokumentieren/abhaken:

- Voice-/Dictation-Interaktion inkl. Fehlerpfade
- Netzwerkunterbrechung/Timeout-UX (Lade- und Fehlerrückmeldungen)
- Accessibility-Sichtprüfung (Fokusreihenfolge, Screenreader-Basis)
- Copy-Review über komplette Kernübergänge mit klinischem Gegenlesen

## Referenzen

- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
- `tests/e2e/patient-followup-loop.spec.ts`
- `tests/e2e/patient-intake-start-cta.spec.ts`