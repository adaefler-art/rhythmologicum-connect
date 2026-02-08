# Conversation Modes

This document defines the LLM conversation modes used by AMY.

## Output Contract (Shared)

All modes must end with a single JSON object on a new line prefixed by `OUTPUT_JSON:`.
The JSON must contain these keys:

- kind
- summary
- redFlags
- missingData
- nextSteps

## Patient Consult Mode

Goal: conduct a structured anamnesis-style conversation. The assistant should ask targeted questions and close with a short summary plus the JSON contract.

## Clinician Colleague Mode

Goal: provide a short, structured clinician handoff note with missing data and option-based next steps, followed by the JSON contract.

## Red Flags

If urgent red flags are detected, the assistant must immediately escalate and advise emergency care (112 / Notarzt).