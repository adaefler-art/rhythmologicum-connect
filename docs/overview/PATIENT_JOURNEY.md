# Patient Journey (v0.5)

This is the primary end-to-end user flow for patients in v0.5.

## 1) Sign in

Patients authenticate via Supabase Auth. A valid cookie session is required to access `/patient/*` routes.

## 2) Start or resume an assessment

Patients enter the stress assessment funnel from the patient portal.

Key invariants:
- The **current step** is fetched from the backend runtime, not derived purely from client state.
- On reload, the UI resumes by loading the assessment state and current step from the runtime.

## 3) Answer questions step-by-step

For each step:
- The client submits the step answers.
- The runtime validates required questions.
- Navigation proceeds only using the runtime’s `nextStep` response (step-skipping prevention).

## 4) Complete and review results

Once completed:
- The assessment becomes **read-only**.
- Patients can review the assessment history and results in the patient history section.

## 5) Clinician visibility (separate role)

Clinician dashboards are protected (`/clinician/*`) and require both authentication and clinician/admin role.
