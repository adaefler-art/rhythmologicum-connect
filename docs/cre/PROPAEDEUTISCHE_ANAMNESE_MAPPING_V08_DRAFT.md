# V0.8 Draft – Mapping propädeutische Anamnese

Zweck:
- Einheitliches Mapping von medizinischen Anamnese-Blöcken auf strukturierte Datenfelder.
- Verbindliche Grundlage für PAT-Follow-up (Lückensteuerung, keine Re-Ask-Duplikate).

Status:
- Draft für spätere Wiedervorlage aus der v0.8 Execution Checkliste.

---

## 1) Block → Feld-Mapping

| Block (propädeutisch) | Primäre Felder (`STRUCTURED_INTAKE`) | Sekundärquelle | Mindeststatus |
|---|---|---|---|
| Leitsymptom / Anliegen | `chief_complaint` | `interpreted_clinical_summary.short_summary[]` | Pflicht |
| Aktuelle Beschwerde (OPQRST/10W) | `history_of_present_illness.*`, `opqrst.*`, `ten_w.*` | `uncertainties[]` | Pflicht |
| Red Flags / Sicherheit | `safety.red_flag_present`, `safety.effective_level`, `red_flags[]` | `safety.triggered_rules[]` | Pflicht |
| Vorerkrankungen | `past_medical_history[]`, `background_anamnesis.past_medical_history[]` | `uncertainties[]` | Pflicht |
| Medikation / Allergien | `medication[]`, `background_anamnesis.medications[]`, `background_anamnesis.allergies[]` | `uncertainties[]` | Pflicht |
| Familienanamnese | `background_anamnesis.family_history[]` | `uncertainties[]` | Pflicht |
| Sozial-/Lebensanamnese | `psychosocial_factors[]`, `background_anamnesis.social_history[]` | Erstaufnahme-Funnel (`assessment_answers`) | Pflicht |
| Systemanamnese (fokussiert) | `background_anamnesis.review_of_systems[]` | `uncertainties[]` | Optional/indikationsbasiert |
| Zusammenfassung / offene Fragen | `interpreted_clinical_summary.narrative_history`, `interpreted_clinical_summary.open_questions[]`, `followup.*` | `reasoning.open_questions[]` | Pflicht |

---

## 2) PAT-Follow-up-Regeln (Lückensteuerung)

1. PAT fragt nur Felder mit Status `missing` oder `unclear`.
2. Bereits beantwortete Felder dürfen nicht erneut gefragt werden (`asked_question_ids` + Objective-Status beachten).
3. Sicherheitsblock hat Vorrang: bei Level `A`/`hard_stop` keine inhaltlichen Follow-ups.
4. Sozial-/Lebensblock wird aus Erstaufnahme priorisiert übernommen; nur echte Inkonsistenzen nachfragen.
5. Bei Mehrdeutigkeit maximal eine Klärungsfrage pro Block-Runde.

---

## 3) Konkrete Regeln für Erstaufnahme-Sozio-Anamnese

Quelle:
- Funnel `first-intake-sociological-anamnesis` (`assessment_answers`).

Abgeleitete Faktoren (derzeit umgesetzt):
- geringe soziale Unterstützung
- erhöhtes Einsamkeitsempfinden
- hohe finanzielle Belastung
- sprachliche Hürden
- Pflege-/Betreuungsverantwortung
- primäre soziale Belastung (Freitext)

Verwendung:
- als Prompt-Kontext in `/api/amy/chat`
- als Input-Merge in `/api/clinical-intake/generate` (`psychosocial_factors[]`)

---

## 4) Offene Punkte (später)

- Einheitliche Prioritätsmatrix (welcher Block wird wann zuerst geschlossen).
- Explizite Feld-Qualitätskriterien pro Block (`answered` vs. `verified`).
- Klinisches Review der Lesbarkeit (Kurzbefund + Open Questions) pro Block.
- Erweiterung um blockbezogene KPI (`block_completion_rate`, `reask_per_block`).
