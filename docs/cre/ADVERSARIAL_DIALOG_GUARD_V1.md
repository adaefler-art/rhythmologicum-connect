# Adversarial Dialog Guard v1 (PAT)

Stand: 2026-02-16

## Zweck

Der Guard erkennt im Dialogturn klaren Boundary-Test bzw. Nonsense und führt zurück in eine klinisch verwertbare Anamnese, ohne legitime medizinische Antworten zu unterdrücken.

## Klassifikation

- `clinical_or_ambiguous`
  - Standardfall: klinisches Signal oder unklare, aber potenziell relevante Antwort
  - Aktion: normaler Dialogpfad
- `boundary_test`
  - Prompt-Injection/Regelumgehung/Grenzen-Test ohne klinischen Inhalt
  - Aktion: kurzer professioneller Redirect in den Anamnese-Pfad
- `nonsense_noise`
  - Offensichtliches Rauschen ohne klinischen Inhalt
  - Aktion: Bitte um strukturierte medizinische Basisangabe

## Redirect-Strategie

- **Boundary-Test Reply:**
  - „Ich bleibe bei einer medizinisch sinnvollen, krankheitsbild-agnostischen Anamnese. Bitte nennen Sie Ihr Hauptsymptom und seit wann es besteht.“
- **Noise Reply:**
  - „Ich kann mit der letzten Nachricht medizinisch nicht sicher arbeiten. Bitte beschreiben Sie kurz Hauptsymptom, Beginn und Verlauf.“

## Implementierung v1

- Guard-Modul: `lib/cre/dialog/turnQualityGuard.ts`
- API-Integration: `apps/rhythm-patient-ui/app/api/amy/chat/route.ts`
- Unit Tests: `lib/cre/dialog/__tests__/turnQualityGuard.test.ts`

## Sicherheitsprinzip

Guardrails dürfen klinisches Reasoning nicht kastrieren.
Daher gilt in v1: **Nur klare Fälle werden umgeleitet**, unklare Fälle bleiben im klinischen Dialogpfad (`clinical_or_ambiguous`).

## Beobachtung / Telemetrie (v1)

Im Chat-Metadata werden für User/Assistant Turn-Guard-Infos gespeichert (`turnQualityLabel`, `turnQualityReason`, `guardTriggered`).
Diese Signale dienen der späteren Tuning-Schleife (False Positives vs. Containment-Rate).
