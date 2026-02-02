# E76.4 - Diagnosis Run Workflow

## Sequence Diagram

```
┌─────────┐          ┌──────────┐          ┌─────────┐          ┌──────────┐
│ Client  │          │   API    │          │ Worker  │          │ Database │
└────┬────┘          └────┬─────┘          └────┬────┘          └────┬─────┘
     │                    │                     │                     │
     │ POST /diagnosis-   │                     │                     │
     │ runs               │                     │                     │
     ├───────────────────>│                     │                     │
     │                    │                     │                     │
     │                    │ createDiagnosisRun()│                     │
     │                    ├────────────────────>│                     │
     │                    │                     │                     │
     │                    │                     │ INSERT diagnosis_   │
     │                    │                     │ runs (status=queued)│
     │                    │                     ├────────────────────>│
     │                    │                     │                     │
     │                    │                     │<────────────────────┤
     │                    │                     │ runId               │
     │                    │                     │                     │
     │                    │<────────────────────┤                     │
     │                    │ { runId, status }   │                     │
     │                    │                     │                     │
     │<───────────────────┤                     │                     │
     │ 200 OK             │                     │                     │
     │ { runId, status }  │                     │                     │
     │                    │                     │                     │
     │                    │                     │                     │
     │ POST /diagnosis-   │                     │                     │
     │ runs/{id}/process  │                     │                     │
     ├───────────────────>│                     │                     │
     │                    │                     │                     │
     │                    │ executeDiagnosisRun()                     │
     │                    ├────────────────────>│                     │
     │                    │                     │                     │
     │                    │                     │ SELECT diagnosis_   │
     │                    │                     │ runs WHERE id=...   │
     │                    │                     ├────────────────────>│
     │                    │                     │                     │
     │                    │                     │<────────────────────┤
     │                    │                     │ run (status=queued) │
     │                    │                     │                     │
     │                    │                     │ UPDATE status=      │
     │                    │                     │ in_progress         │
     │                    │                     ├────────────────────>│
     │                    │                     │                     │
     │                    │                     │<────────────────────┤
     │                    │                     │                     │
     │                    │                     │ SELECT assessment_  │
     │                    │                     │ answers, assessment,│
     │                    │                     │ patient_profile     │
     │                    │                     ├────────────────────>│
     │                    │                     │                     │
     │                    │                     │<────────────────────┤
     │                    │                     │ context_pack data   │
     │                    │                     │                     │
     │                    │                     │ UPDATE context_pack │
     │                    │                     ├────────────────────>│
     │                    │                     │                     │
     │                    │                     │                     │
┌────┴────┐          ┌────┴─────┐          ┌────┴────┐          ┌────┴─────┐
│Anthropic│          │          │          │         │          │          │
│  API    │          │          │          │         │          │          │
└────┬────┘          │          │          │         │          │          │
     │               │          │          │         │          │          │
     │               │          │ POST /messages      │          │          │
     │               │          │<────────────────────┤          │          │
     │               │          │ (context_pack)      │          │          │
     │               │          │                     │          │          │
     │<──────────────┼──────────┤                     │          │          │
     │ Claude API    │          │                     │          │          │
     │ request       │          │                     │          │          │
     │               │          │                     │          │          │
     ├───────────────┼──────────>                     │          │          │
     │ diagnosis     │          │                     │          │          │
     │ response      │          │                     │          │          │
     │               │          │                     │          │          │
     │               │          ├────────────────────>│          │          │
     │               │          │ diagnosis_result    │          │          │
     │               │          │                     │          │          │
     │               │          │                     │ validateDiagnosisResult()
     │               │          │                     │          │          │
     │               │          │                     │ UPDATE diagnosis_   │
     │               │          │                     │ result, status=     │
     │               │          │                     │ completed           │
     │               │          │                     ├─────────────────────>
     │               │          │                     │          │          │
     │               │          │                     │<─────────────────────┤
     │               │          │                     │          │          │
     │               │          │<────────────────────┤          │          │
     │               │          │ { success, runId }  │          │          │
     │               │          │                     │          │          │
     │               │<─────────┤                     │          │          │
     │               │ 200 OK   │                     │          │          │
     │               │          │                     │          │          │
     │               │          │                     │          │          │
     │ GET /diagnosis-runs/{id} │                     │          │          │
     ├──────────────────────────>                     │          │          │
     │               │          │                     │          │          │
     │               │          │ SELECT diagnosis_runs          │          │
     │               │          │ WHERE id=...        │          │          │
     │               │          ├────────────────────────────────────────────>
     │               │          │                     │          │          │
     │               │          │<────────────────────────────────────────────┤
     │               │          │ run (with diagnosis_result)    │          │
     │               │          │                     │          │          │
     │<──────────────────────────                     │          │          │
     │ 200 OK        │          │                     │          │          │
     │ { run }       │          │                     │          │          │
     │               │          │                     │          │          │
```

## State Transitions

```
┌─────────┐
│ queued  │
└────┬────┘
     │
     │ POST /process
     │ (worker starts)
     v
┌──────────────┐
│ in_progress  │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       │ Success         │ Failure
       │ (artifact       │ (error logged)
       │  persisted)     │
       v                 v
┌───────────┐     ┌─────────┐
│ completed │     │ failed  │
└───────────┘     └─────────┘
```

## Error Handling Flow

```
Worker Execution
     │
     ├─> Fetch Run
     │   └─> NOT FOUND ──> Return { errorCode: RUN_NOT_FOUND }
     │
     ├─> Check Status
     │   └─> NOT QUEUED ──> Return { errorCode: INVALID_STATUS }
     │
     ├─> Fetch Context Pack
     │   └─> FAILED ──> Update status=failed
     │                  Add error entry (CONTEXT_FETCH_ERROR)
     │                  Return { errorCode: CONTEXT_FETCH_ERROR }
     │
     ├─> Call LLM/MCP
     │   └─> FAILED ──> Update status=failed
     │                  Add error entry (LLM_ERROR)
     │                  Return { errorCode: LLM_ERROR }
     │
     ├─> Validate Result
     │   └─> INVALID ──> Update status=failed
     │                   Add error entry (VALIDATION_ERROR)
     │                   Return { errorCode: VALIDATION_ERROR }
     │
     └─> Persist Artifact
         └─> FAILED ──> Update status=failed
                        Add error entry (PERSISTENCE_ERROR)
                        Return { errorCode: PERSISTENCE_ERROR }
```

## Data Flow

```
Assessment
    │
    ├─> assessment_answers ─┐
    ├─> funnel_config       ├─> Context Pack
    └─> patient_profile     ┘
                │
                v
         ┌──────────────┐
         │ context_pack │
         │   (JSONB)    │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │ Anthropic    │
         │ Claude API   │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │  diagnosis_  │
         │   result     │
         │   (JSONB)    │
         └──────────────┘
```

## Idempotency

```
Request 1:
  assessmentId: "abc-123"
  correlationId: "corr-456"
  
  ──> INSERT diagnosis_runs
      (assessment_id, correlation_id, schema_version)
      VALUES ('abc-123', 'corr-456', 'v1')
  
  <── { runId: "run-001", status: "queued" }

Request 2 (duplicate):
  assessmentId: "abc-123"
  correlationId: "corr-456"
  
  ──> SELECT FROM diagnosis_runs
      WHERE assessment_id = 'abc-123'
        AND correlation_id = 'corr-456'
        AND schema_version = 'v1'
  
  <── { runId: "run-001", status: "queued" }
      (existing run returned)
```

## RLS Policy Flow

```
Patient Request:
  User: patient-001
  
  ──> SELECT FROM diagnosis_runs WHERE id = 'run-001'
  
  RLS Check:
    diagnosis_runs.assessment_id ──> assessments.patient_id
                                  ──> patient_profiles.user_id
                                  ──> auth.uid()
  
  ✅ Match: user_id = patient-001
  
  <── Return run data

Clinician Request:
  User: clinician-002
  
  ──> SELECT FROM diagnosis_runs WHERE id = 'run-001'
  
  RLS Check:
    diagnosis_runs.assessment_id ──> assessments.patient_id
                                  ──> clinician_patient_assignments
                                  ──> clinician_user_id
  
  ✅ Match: clinician assigned to patient
  
  <── Return run data

Unauthorized Request:
  User: other-user-003
  
  ──> SELECT FROM diagnosis_runs WHERE id = 'run-001'
  
  RLS Check:
    diagnosis_runs.assessment_id ──> assessments.patient_id
                                  ──> No match found
  
  ❌ No match
  
  <── 404 Not Found (RLS filtered)
```

## Concurrency Handling

```
Request A                    Request B
    │                            │
    │ createDiagnosisRun()       │
    ├───────────────>            │
    │                            │
    │ SELECT existing run        │
    │ (not found)                │
    │                            │ createDiagnosisRun()
    │                            ├───────────────>
    │                            │
    │                            │ SELECT existing run
    │                            │ (not found)
    │                            │
    │ INSERT diagnosis_runs      │
    ├──────────────────────>     │
    │                            │
    │<─────────────────────┤     │
    │ Success (runId)            │
    │                            │
    │                            │ INSERT diagnosis_runs
    │                            ├──────────────────────>
    │                            │
    │                            │<──────────────────────┤
    │                            │ ERROR: 23505 (unique
    │                            │ constraint violation)
    │                            │
    │                            │ SELECT existing run
    │                            │ (retry)
    │                            ├──────────────────────>
    │                            │
    │                            │<──────────────────────┤
    │                            │ Success (same runId)
    │                            │
    │<───────────────┤            │<───────────────┤
    │ Return runId                │ Return runId
    │                            │
```

---

**Legend:**
- ┌─┐ : Component
- ───> : Request/Call
- <─── : Response/Return
- ├─> : Conditional branch
- └─> : Sub-step
