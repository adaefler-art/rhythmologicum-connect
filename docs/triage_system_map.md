# Triage System Map (Studio)

## Executive Summary
- Studio Triage liest Assessments clientseitig ueber den Public Supabase Client und reichert sie best-effort mit Patient/Funnel/Report/Processing-Daten an.
- Sichtbarkeit von Assessments basiert auf RLS: entweder Patient-eigene Datensaetze oder Org-basierte Staff-Policy via user_org_membership.
- Die Server-Healthroute zaehlt Assessments mit Service-Role und wird nur genutzt, wenn der Base-Query leer ist.
- JOIN-orientierte Blockaden beeinflussen aktuell nur Enrichment, nicht die Sichtbarkeit der Base-Row.
- Triage-Diagnose-Logs werden in der UI erzeugt; ein Loop kann entstehen, wenn NO_ROWS_VISIBLE den Healthcheck triggert und State-Updates das Effect erneut ausloesen.

## Architekturdiagramm
```mermaid
flowchart TD
  UI[Triage Page (Client)] -->|supabase auth.getUser| Auth[Supabase Auth]
  UI -->|Base Query: assessments| DB[(Postgres + RLS)]
  UI -->|Enrichment: patient_profiles| DB
  UI -->|Enrichment: funnels| DB
  UI -->|Enrichment: processing_jobs/reports/calculated_results| DB
  UI -->|/api/triage/health| API[Triage Health Route]
  API -->|createServerSupabaseClient (cookie)| Auth
  API -->|createAdminSupabaseClient (service role)| DB
```

## Datenbank-Objekte (Triage-relevant)
### Kern-Tabellen
- assessments (Base-Query): [supabase/migrations/20241203110000_init_patient_profiles_and_assessments.sql](supabase/migrations/20241203110000_init_patient_profiles_and_assessments.sql#L1-L78)
- patient_profiles (Enrichment + RLS-Join): [supabase/migrations/20241203110000_init_patient_profiles_and_assessments.sql](supabase/migrations/20241203110000_init_patient_profiles_and_assessments.sql#L1-L44)
- user_org_membership (Org-Zuordnung/Role): [supabase/migrations/20251230211228_v05_core_schema_jsonb_fields.sql](supabase/migrations/20251230211228_v05_core_schema_jsonb_fields.sql#L103-L150)
- funnels (Funnel-Metadata in Triage): [supabase/migrations/01_create_funnel_tables.sql](supabase/migrations/01_create_funnel_tables.sql#L1-L28)
- reports (Status/Risk): [supabase/migrations/20241204120000_create_reports_table.sql](supabase/migrations/20241204120000_create_reports_table.sql#L1-L24)
- calculated_results (Scores/Risk Models): [schema/schema.sql](schema/schema.sql#L2340-L2385)
- processing_jobs (Processing-Status): [schema/schema.sql](schema/schema.sql#L3818-L3865)
- clinician_patient_assignments (Staff-Patient-Zuordnung fuer RLS): [schema/schema.sql](schema/schema.sql#L2365-L2420)
- triage_sessions (Triage-Log/Debug; aktuell nicht im UI genutzt): [schema/schema.sql](schema/schema.sql#L4527-L4588)

### Relevante RLS-Policies (Auszug)
- assessments: Patienten lesen eigene Assessments: [supabase/migrations/20251207094000_enable_comprehensive_rls.sql](supabase/migrations/20251207094000_enable_comprehensive_rls.sql#L124-L158)
- assessments: Staff-Org-Policy (admin/clinician/nurse in gleicher Org): [supabase/migrations/20260205124500_rls_assessments_fallback_authenticated.sql](supabase/migrations/20260205124500_rls_assessments_fallback_authenticated.sql#L10-L70)
- patient_profiles: Patienten lesen eigene Profile: [supabase/migrations/20251207094000_enable_comprehensive_rls.sql](supabase/migrations/20251207094000_enable_comprehensive_rls.sql#L82-L118)
- patient_profiles: Staff kann Org- oder Assigned-Patienten sehen: [supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql](supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql#L444-L475)
- user_org_membership: Admins koennen Org-Memberships managen: [supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql](supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql#L420-L444)
- reports/results: Org-basierte Staff-Policy: [schema/schema.sql](schema/schema.sql#L7110-L7133)
- processing_jobs: Clinician/Patient Select Policies: [schema/schema.sql](schema/schema.sql#L7578-L7604)
- triage_sessions: Clinician/Admin read all: [schema/schema.sql](schema/schema.sql#L7812-L7834)

### Funktionen (RLS-Helpers)
- public.is_clinician(): [schema/schema.sql](schema/schema.sql#L1560-L1583)
- public.get_my_patient_profile_id(): [schema/schema.sql](schema/schema.sql#L1416-L1442)
- public.is_assigned_to_patient(patient_uid): [schema/schema.sql](schema/schema.sql#L1538-L1560)
- public.current_user_role(org_id): [schema/schema.sql](schema/schema.sql#L981-L1005)
- public.has_any_role(check_role): [schema/schema.sql](schema/schema.sql#L1467-L1488)
- public.has_role(check_role): [schema/schema.sql](schema/schema.sql#L1491-L1507)
- public.get_user_org_ids(): [schema/schema.sql](schema/schema.sql#L1446-L1466)
- public.is_member_of_org(org_id): [schema/schema.sql](schema/schema.sql#L1584-L1605)

Hinweis: Kein org_access-View/Table in schema.sql gefunden.

## RLS/Autorisierung fuer Staff-Assessment-Sichtbarkeit
Ein Admin/Clinician sieht Assessments, wenn mindestens eine der folgenden Bedingungen erfuellt ist:
1) Staff-Org-Policy (RLS auf assessments) greift:
   - Patient hat aktive Org-Membership (user_org_membership) in einer Org.
   - Staff-User hat aktive Membership in derselben Org.
   - Staff-Role ist admin/clinician/nurse.
   - Policy: "Staff can view org patient assessments" [supabase/migrations/20260205124500_rls_assessments_fallback_authenticated.sql](supabase/migrations/20260205124500_rls_assessments_fallback_authenticated.sql#L10-L70).
2) Patient-Policy (nur fuer Patient-User): patient_id = get_my_patient_profile_id().
   - Policy: "Patients can view own assessments" [supabase/migrations/20251207094000_enable_comprehensive_rls.sql](supabase/migrations/20251207094000_enable_comprehensive_rls.sql#L124-L158).

Zusaetzliche Join-Sichtbarkeit fuer Enrichment:
- patient_profiles: Staff-Org-Policy oder assignment [supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql](supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql#L444-L475).
- funnels: Authenticated read policy (Allow authenticated users to read funnels) ist in schema.sql definiert; bei Blockade wird im UI auf assessment.funnel fallbackt: [schema/schema.sql](schema/schema.sql#L6692-L6758).
- reports/calculated_results: Org-basierte Staff-Policies in [schema/schema.sql](schema/schema.sql#L7110-L7133).
- processing_jobs: Clinician-Select verwendet clinician_patient_assignments + auth.users role [schema/schema.sql](schema/schema.sql#L7578-L7604).

## Backend-Zugriffspfad (Triage)
1) UI (Client) -> Public Supabase Client
   - Client instanziierung: [lib/supabaseClient.ts](lib/supabaseClient.ts#L1-L12) -> [lib/db/supabase.public.ts](lib/db/supabase.public.ts#L1-L60)
   - Triage Page: [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L1-L312)
2) Server Health Route -> Service Role
   - Route: [apps/rhythm-studio-ui/app/api/triage/health/route.ts](apps/rhythm-studio-ui/app/api/triage/health/route.ts#L1-L74)
   - createServerSupabaseClient (cookie auth): [lib/db/supabase.server.ts](lib/db/supabase.server.ts#L1-L78)
   - createAdminSupabaseClient (service role): [lib/db/supabase.admin.ts](lib/db/supabase.admin.ts#L1-L84)

### Ablauf (UI -> Data -> DB)
1) TriagePage ruft auth.getUser und Base-Query auf assessments (RLS aktiv).
2) Bei Rows > 0: Enrichment via patient_profiles/funnels + processing_jobs/reports/calculated_results.
3) Bei Rows = 0: /api/triage/health count via Service-Role fuer RLS-Diagnose.

## Diagnose/Telemetry ("[triage-diagnose]")
- Logging in handleDiagnosis (non-OK): [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L240-L312)
- Healthcheck-Diagnose (RLS_BLOCKING/NO_DATA_IN_PROJECT): [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L338-L390)

Warum/ wann Diagnosen laufen:
- loadTriageData liefert NO_ROWS_VISIBLE, OK_BASE_VISIBLE oder JOIN_OR_ENRICHMENT_BLOCKED.
- NO_ROWS_VISIBLE triggert den Healthcheck-Effect, der assessmentsTotal (Service-Role) ermittelt.
- Jede nicht-OK Diagnose loggt mit baseCount, assessmentsTotal, userId, supabaseUrl.

Loop-Risiken (aktueller Zustand):
- Der Healthcheck-Effect haengt von diagnosis und healthAssessmentsTotal ab und setzt healthAssessmentsTotal selbst; bei NO_ROWS_VISIBLE kann dies wiederholt ausloesen. Siehe [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L338-L390).
- retryTrigger/handleRetry ermoeglicht wiederholte Requests ohne Debounce (User kann mehrfach retriggern), was die Diagnose-Logs erneut feuert. Siehe [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L392-L404).

## Mapping-Tabelle (UI -> Data -> DB)
| UI Component | Data function | Supabase call | DB object + relevante Policy |
| --- | --- | --- | --- |
| TriagePage | loadTriageData | supabase.from('assessments').select(...) | assessments + RLS (Patients own / Staff org) [supabase/migrations/20251207094000_enable_comprehensive_rls.sql](supabase/migrations/20251207094000_enable_comprehensive_rls.sql#L124-L158), [supabase/migrations/20260205124500_rls_assessments_fallback_authenticated.sql](supabase/migrations/20260205124500_rls_assessments_fallback_authenticated.sql#L10-L70) |
| TriagePage | loadTriageData | supabase.from('patient_profiles').in(...) | patient_profiles + Staff org/assigned [supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql](supabase/migrations/20251231072346_v05_comprehensive_rls_policies.sql#L444-L475) |
| TriagePage | loadTriageData | supabase.from('funnels').in(...) | funnels + authenticated read policy [schema/schema.sql](schema/schema.sql#L6692-L6758) |
| TriagePage | loadTriageData | supabase.from('processing_jobs').in(...) | processing_jobs + clinician/patient select [schema/schema.sql](schema/schema.sql#L7578-L7604) |
| TriagePage | loadTriageData | supabase.from('reports').in(...) | reports + staff org policy [schema/schema.sql](schema/schema.sql#L7110-L7125) |
| TriagePage | loadTriageData | supabase.from('calculated_results').in(...) | calculated_results + staff org policy [schema/schema.sql](schema/schema.sql#L7120-L7133) |
| TriagePage | loadHealth (Effect) | fetch('/api/triage/health') | /api/triage/health + admin count [apps/rhythm-studio-ui/app/api/triage/health/route.ts](apps/rhythm-studio-ui/app/api/triage/health/route.ts#L1-L74) |

## Root-Cause-Hypothesen fuer Diagnose-Loop
1) Healthcheck-Effect re-run durch eigenes State-Update:
   - loadHealth setzt healthAssessmentsTotal und ist selbst in den Dependencies; bei NO_ROWS_VISIBLE kann das zu wiederholten Runs fuehren.
   - Code: [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L338-L390).
2) Diagnose-Logging ohne Debounce + Retry-Trigger:
   - handleDiagnosis loggt jede nicht-OK Situation; handleRetry erhoeht retryTrigger und startet loadTriageData erneut.
   - Code: [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L240-L312), [apps/rhythm-studio-ui/app/clinician/triage/page.tsx](apps/rhythm-studio-ui/app/clinician/triage/page.tsx#L392-L404).

## Fix-Vorschlaege (A/B/C)
A) UI-Loop stoppen (geringer Aufwand, hoher Impact)
- One-shot Healthcheck pro Session (useRef + guard), plus debounce auf handleRetry.
- Erwarteter Effekt: keine wiederholten Healthcheck-Requests/Logs.

B) Query/Policy fuer garantierte Sichtbarkeit (mittlerer Aufwand, hoher Impact)
- Sicherstellen, dass Staff-Org-Policy immer vorhanden ist und user_org_membership konsistent gepflegt wird (Seed/Bootstrap). Keine Policy-Aufweichung, nur Membership-Konsistenz.

C) Hardening (mittlerer Aufwand, mittlerer Impact)
- E2E-Test: Login als Clinician, 1 Assessment vorhanden, keine Endlos-Spinner.
- CI-Guardrail: Test auf "NO_ROWS_VISIBLE" + Healthcheck wiederholt nur einmal.

## Empfohlener Plan (naechste 3 Commits)
1) Add guard/ref fuer loadHealth (once-per-session) + debounce fuer handleRetry.
2) Add Test (Playwright oder jest) fuer Triage: base rows visible -> keine RLS_BLOCKING Diagnose.
3) Add CI check, der mehrfaches Healthcheck-Logging verhindert (log counter or mock).
