# Issue 4: Design Decision — Language Mixing

## Context

During implementation of Issue 4, the term "Anamnese" was replaced with "Patient Record" throughout the UI. This creates instances where English product terminology appears in German UI text.

## Examples

- German: "Patient Record-Einträge werden geladen…"
- German: "Aktuelle Patient Record"
- German: "Noch keine Patient Record-Einträge vorhanden"

## Design Decision

**Decision:** Keep "Patient Record" as English product terminology within German UI text.

**Rationale:**

1. **Product Term:** "Patient Record" is defined as a "Produktbegriff" (product concept/term) in the issue, not just a translation
2. **Brand Identity:** Similar to how technical products use English brand names in German UI (e.g., "Dashboard", "Timeline", "Inbox")
3. **Consistency:** Using a consistent product term across languages aids recognition and reduces confusion
4. **Chat-First Approach:** "Patient Record" better communicates the transparent, accessible nature intended for the chat-first approach

## Alternative Considered

**Option A:** Translate to German equivalent
- "Patientenakte" (traditional medical record)
- "Krankenakte" (patient file)

**Why rejected:** These traditional German medical terms carry form-based, bureaucratic connotations that contradict the chat-first, transparent approach the product aims to achieve.

**Option B:** Full English UI for this feature

**Why rejected:** Inconsistent with rest of German UI; would confuse users.

## Precedent

This approach follows established patterns in German technical UIs:
- "Email" in German interfaces (not "E-Post")
- "Dashboard" in German applications (not "Armaturenbrett")
- "Timeline" in German social media (not "Zeitleiste")
- "Workflow" in German business software (not "Arbeitsablauf")

## Conclusion

The language mixing is **intentional** and **by design**. "Patient Record" functions as a product-specific term of art, similar to other English technical terminology commonly used in German interfaces.

## Future Considerations

If user testing reveals confusion, consider:
1. Adding tooltips explaining "Patient Record"
2. Introducing the term explicitly in onboarding
3. Using quotes on first appearance: "Patient Record"

For now, the current implementation correctly reflects the product design intent specified in Issue 4.

---

**Author:** GitHub Copilot  
**Date:** 2026-02-08  
**Related:** Issue 4, ISSUE-04-IMPLEMENTATION-SUMMARY.md
