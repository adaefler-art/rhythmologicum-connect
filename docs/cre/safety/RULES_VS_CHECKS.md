# Safety Rules vs Checks

This map links each Safety 2.1 rule ID to its code implementation and UI action.

| Rule ID | Description | Check Implementation | UI/Action |
| --- | --- | --- | --- |
| SFTY-2.1-R-CHEST-PAIN | Chest pain detected | lib/cre/safety/rules/rules.ts | Level B escalation, clinician badge |
| SFTY-2.1-R-SYNCOPE | Syncope detected | lib/cre/safety/rules/rules.ts | Level B escalation, clinician badge |
| SFTY-2.1-R-SEVERE-DYSPNEA | Severe dyspnea detected | lib/cre/safety/rules/rules.ts | Level A hard stop |
| SFTY-2.1-R-SUICIDAL-IDEATION | Suicidal ideation detected | lib/cre/safety/rules/rules.ts | Level A hard stop |
| SFTY-2.1-R-ACUTE-PSYCH | Acute psychiatric crisis detected | lib/cre/safety/rules/rules.ts | Level B escalation |
| SFTY-2.1-R-SEVERE-PALPITATIONS | Severe palpitations detected | lib/cre/safety/rules/rules.ts | Level B escalation |
| SFTY-2.1-R-ACUTE-NEURO | Acute neurologic deficit detected | lib/cre/safety/rules/rules.ts | Level A hard stop |
| SFTY-2.1-R-SEVERE-UNCONTROLLED | Severe uncontrolled symptoms | lib/cre/safety/rules/rules.ts | Level A hard stop |
| SFTY-2.1-R-CHEST-PAIN-20M | Chest pain >= 20 minutes | lib/cre/safety/rules/rules.ts | Level A hard stop |
| SFTY-2.1-R-UNCERTAINTY-2PLUS | 2+ uncertainties | lib/cre/safety/rules/rules.ts | Level C follow-up |

Policy application:

- Policy config: [config/cre/safety-policy.v1.json](../../../config/cre/safety-policy.v1.json)
- Engine: [lib/cre/safety/policyEngine.ts](../../../lib/cre/safety/policyEngine.ts)
- Override endpoint: `PATCH /api/clinical-intake/patient/[patientId]/latest`

Checks (data quality):

- SFTY-2.1-C-CHIEF-OR-HPI -> lib/cre/safety/rules/checks.ts
- SFTY-2.1-C-UNCERTAINTY-ARRAY -> lib/cre/safety/rules/checks.ts
