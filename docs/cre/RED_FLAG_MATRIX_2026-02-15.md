# CRE Red-Flag Matrix (Version 2026-02-15-v2)

Status: verbindlich  
Scope: Epic E2-01 / E2-02

## Versionierung
- Matrix-Version: `2026-02-15-v2`
- Policy-Version (Runtime): `2.1`
- Audit-Referenzen:
  - `structured_data.safety.triggered_rules[].rule_id`
  - `structured_data.safety.red_flags[].rule_id`
  - `structured_data.safety.quality.notes[]` (enthält Matrix-Version)

## Eskalationsstufen
- `A` = Hard Stop
- `B` = Priority Review
- `C` = Monitored Continuation

## Verbindliche Zuordnung (genau eine Stufe je Regel)

| Regel-ID | Domäne | Eskalation | Begründung |
|---|---|---|---|
| SFTY-2.1-R-CHEST-PAIN | cardio | B | Brustschmerz mit Qualifiern priorisiert abklären |
| SFTY-2.1-R-SYNCOPE | cardio | B | Synkope/Bewusstseinsverlust priorisiert abklären |
| SFTY-2.1-R-SEVERE-DYSPNEA | respiratory | A | Schwere Atemnot akut sicherheitskritisch |
| SFTY-2.1-R-SUICIDAL-IDEATION | mental-health | A/B* | Aktiv-intent A, passiv B (deterministische Downgrade-Logik) |
| SFTY-2.1-R-ACUTE-PSYCH | mental-health | B | Akute psychische Krise erfordert ärztliche Prüfung |
| SFTY-2.1-R-SEVERE-PALPITATIONS | cardio | B | Starkes Herzrasen priorisiert abklären |
| SFTY-2.1-R-ACUTE-NEURO | neurology | A | Akute neurologische Defizite hard stop |
| SFTY-2.1-R-SEVERE-UNCONTROLLED | general | A | Schwere unkontrollierte Symptomatik hard stop |
| SFTY-2.1-R-CHEST-PAIN-20M | cardio | A | Brustschmerz >=20 min zeitkritisch |
| SFTY-2.1-R-UNCERTAINTY-2PLUS | safety | C | Mehrere Unsicherheiten mit Sicherheitsfragen |
| SFTY-2.2-R-CORE-CHEST-DYSPNEA | core | A | Kombi Brustschmerz + Atemnot |
| SFTY-2.2-R-CARDIO-PALP-SYNCOPE | cardio | B | Kombi Palpitationen + Synkope |
| SFTY-2.2-R-NEURO-ACUTE-DEFICIT | neuro | A | Akute neuro Hinweise |
| SFTY-2.2-R-GP-RED-FLAG-UNCERTAINTY | gp | B | Red-Flag plus hohe Unsicherheit |
| SFTY-2.2-R-7S-SLEEP-FAILURE | 7s | B | Schwere Schlafstörung >7 Tage + Funktionsabfall |
| SFTY-2.2-R-CORE-CONTRADICTION | core | B | Widerspruch zwischen Red-Flag und expliziten Negativa |

\* `SFTY-2.1-R-SUICIDAL-IDEATION` wird ohne verifizierte A-Qualifier (Intent/Plan/Mittel) deterministisch auf `B` gesetzt.

## Determinismus-Regeln
- Safety ist regelbasiert, keine probabilistische Abschwächung.
- Reasoning darf Safety nicht überschreiben.
- Neue Domänenregeln dürfen erweitert, aber nicht entschärft werden ohne neue Matrix-Version.
