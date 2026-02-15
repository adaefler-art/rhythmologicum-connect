# Rhythmologicum Connect – v0.4 Full Planning (GitHub Edition)

> Status: Draft  
> Version: 0.4-planning-1  
> Last updated: 2025-12-11

This document is designed to be used directly in GitHub (as a reference for Epics & Issues).
It defines the overall scope, epics, and ready-to-create issue bodies for v0.4.

---

## 1. Product Vision for v0.4

v0.4 delivers the **first live-ready, web-based version** of Rhythmologicum Connect.

Core goals:

- Modern, consistent UI/UX for Clinicians and Admins
- A single, coherent, mobile-friendly patient journey (Patient Flow V2)
- Integration of editorial content into the funnel engine (CONTENT_PAGE nodes)
- Clear role-based navigation (patient / clinician / admin)
- Clinician Dashboard V2 for real-world usage with test patients
- Technical cleanup and foundation for additional funnels (e.g., Sleep, Recovery)

v0.4 is _not_ about breadth of medical content; it is about **polish, structure, and stability** for early external tests.

---

## 2. Epic Overview

The following Epics should be created in GitHub Projects (e.g., as labels or milestones):

- **V0.4-E1 – Global UI Refresh & Design System**
- **V0.4-E2 – Patient Flow V2**
- **V0.4-E3 – Content Flow Engine (CONTENT_PAGE Integration)**
- **V0.4-E4 – Clinician Dashboard V2**
- **V0.4-E5 – Navigation & Role-Based Routing V2**
- **V0.4-E6 – Technical Cleanup & Stability Layer**

Each Epic below includes a list of suggested issues with short descriptions and acceptance criteria.

---

## 3. Epics and Issues

### 3.1 Epic V0.4-E1 – Global UI Refresh & Design System

**Epic Goal**

Establish a modern, consistent UI and a small design system (tokens + components) used across
Clinician, Admin, and Patient areas. The app should feel like a cohesive product, not a collection
of prototypes.

**Why**

- Current UI is functional but feels “90s/early 2000s”
- Inconsistent components and styling make iterating harder
- We need a base to build future funnels and features on top of

**Key Outcomes**

- Shared layout structure (header, sidebar, content area)
- Reusable UI components (buttons, cards, tables, forms)
- Design tokens (colors, typography, spacing) defined in one place

#### Suggested Issues for this Epic

1. **Issue: Define v0.4 Design Tokens (Colors, Typography, Spacing)**  
   Labels: `v0.4`, `design`, `frontend`, `V0.4-E1`

   **Description (for GitHub):**
   - Define a minimal set of design tokens for v0.4:
     - Color palette (primary, secondary, background, surface, success, warning, danger)
     - Typography scale (H1–H4, body, small)
     - Spacing scale (XS–XL)
   - Implement tokens in a central place (e.g., Tailwind config + optional tokens file).
   - Document the tokens briefly for Copilot and future contributors.

   **Acceptance Criteria**
   - [ ] A documented color palette exists and is used at least in the main layout and buttons.
   - [ ] Typography scale is defined and applied to headings and body text.
   - [ ] Spacing scale is visible in layout components (consistent paddings/margins).
   - [ ] Tokens are defined in one central file/location and not duplicated across components.

2. **Issue: Implement Global App Layout (Header, Sidebar, Content Shell)**  
   Labels: `v0.4`, `frontend`, `layout`, `V0.4-E1`

   **Description**
   - Implement a global layout component used by clinician/admin routes.
   - Layout should include:
     - App header with product name/logo placeholder and user menu (future).
     - Left sidebar (navigation items for Clinician/Admin).
     - Main content area with responsive padding.
   - Use design tokens for colors, typography, spacing.

   **Acceptance Criteria**
   - [ ] Clinician/Admin pages share a common layout shell.
   - [ ] Navigation is clearly visible and consistent.
   - [ ] Layout behaves well on common screen sizes (desktop + tablet).
   - [ ] No route uses an old, ad-hoc layout wrapper.

3. **Issue: Create Core UI Components (Button, Card, Table, Form Controls)**  
   Labels: `v0.4`, `frontend`, `components`, `V0.4-E1`

   **Description**
   - Create a small UI component library in `components/ui`:
     - Button variants (primary, secondary, subtle)
     - Card component (with header + body slots)
     - Table component (or shared styles)
     - Form controls (Input, Textarea, Select, Label, HelperText, ErrorText)
   - Replace most direct HTML elements in clinician/admin with these components.

   **Acceptance Criteria**
   - [ ] There is a documented set of UI components in `components/ui`.
   - [ ] Clinician/Admin pages use the shared Button and Card components.
   - [ ] Default form controls are visually consistent and easy to read.
   - [ ] No “random” styles override the base components without clear reason.

4. **Issue: Harmonize Dark/Light Mode Behavior (Minimal Version)**  
   Labels: `v0.4`, `frontend`, `design`, `V0.4-E1`

   **Description**
   - Decide on a primary mode for v0.4 (likely light with good contrast).
   - Ensure field backgrounds are white and text is black unless specifically designed otherwise.
   - Avoid half-implemented dark mode that hurts readability.

   **Acceptance Criteria**
   - [ ] All core forms are readable with white backgrounds and black text.
   - [ ] No view shows unreadable combinations (e.g. dark blue background + dark text).
   - [ ] Mode behavior is consistent across clinician/admin/patient.

---

### 3.2 Epic V0.4-E2 – Patient Flow V2

**Epic Goal**

Replace the “gruselig” prototype patient experience with a single, clean, modern, mobile-friendly
flow for the Stress & Resilience assessment.

**Key Outcomes**

- Unified flow renderer
- Clear introduction, question steps, optional content steps, result screen
- Good copy defaults, but still evolving

#### Suggested Issues

1. **Issue: Design Patient Flow V2 Structure (Screens & States)**  
   Labels: `v0.4`, `patient`, `UX`, `V0.4-E2`

   **Description**
   - Define the full Stress & Resilience journey:
     - Welcome / explanation screen
     - Question pages (grouping questions if needed)
     - Optional content segments (education)
     - Result page with AMY summary and next steps
   - Document screens, transitions, and minimal copy in a simple flow diagram / markdown.

   **Acceptance Criteria**
   - [x] A simple flow description (screens, transitions) is documented.
   - [x] Every screen has a clear purpose and “next step”.
   - [x] Mobile behavior is considered from the start (no desktop-only layout tricks).

   **Documentation:**
   - [PATIENT_FLOW_V2_STRUCTURE.md](PATIENT_FLOW_V2_STRUCTURE.md) - Complete flow description
   - [PATIENT_FLOW_V2_DIAGRAM.md](PATIENT_FLOW_V2_DIAGRAM.md) - Visual flow diagrams

2. **Issue: Implement Patient Flow Renderer Component**  
   Labels: `v0.4`, `patient`, `frontend`, `V0.4-E2`

   **Description**
   - Implement a `PatientFlowRenderer` that:
     - Takes a funnel/assessment configuration.
     - Chooses the correct screen type (Question, Content, Result).
     - Manages navigation (Next/Back) and progress display.
   - Ensure this renderer is the entry path for the Stress funnel.

   **Acceptance Criteria**
   - [ ] Single entry point for the Stress & Resilience flow.
   - [ ] Next/back navigation works as expected.
   - [ ] Flow can be completed end-to-end without dead-ends.

3. **Issue: Build Responsive Patient Screens (Welcome, Question, Result)**  
   Labels: `v0.4`, `patient`, `frontend`, `UX`, `V0.4-E2`

   **Description**
   - Implement modern screen layouts for:
     - Welcome screen
     - Question step (scale, descriptions, error states)
     - Result screen (visual hierarchy, AMY text, highlights)
   - Use design-system components and tokens.

   **Acceptance Criteria**
   - [ ] All screens are mobile-friendly and tested on small viewport sizes.
   - [ ] Typography hierarchy is clear (H1/H2/body).
   - [ ] Result screen clearly shows outcome + next steps.

4. **Issue: Clean Up Legacy Patient Demo Pages**  
   Labels: `v0.4`, `cleanup`, `patient`, `V0.4-E2`

   **Description**
   - Identify old patient demo routes and flows.
   - Move them to a dedicated `_legacy` area or remove them if no longer needed.
   - Ensure no one stumbles into legacy flows by accident.

   **Acceptance Criteria**
   - [ ] No legacy demo route is reachable via navigation.
   - [ ] Only the new Patient Flow V2 is visible for real usage.
   - [ ] Legacy code (if kept) is clearly marked as such.

---

### 3.3 Epic V0.4-E3 – Content Flow Engine (CONTENT_PAGE Integration)

**Epic Goal**

Integrate editorial content pages into funnel flows, so that content can appear before, between,
or after question blocks.

**Key Outcomes**

- New node type: `CONTENT_PAGE`
- Mapping between content pages and funnel/flow steps
- Simple admin UI to attach content to flow

#### Suggested Issues

1. **Issue: Extend DB Schema for Content Flow Mapping**  
   Labels: `v0.4`, `backend`, `db`, `V0.4-E3`

   **Description**
   - Add columns to `content_pages`:
     - `funnel_id TEXT NULL`
     - `flow_step TEXT NULL`
     - optional: `order_index INT NULL`
   - Add minimal indices if necessary.
   - Update docs to reflect the new relationship.

   **Acceptance Criteria**
   - [ ] DB migration script exists and runs successfully against Supabase.
   - [ ] `content_pages` can be associated with a funnel and a flow step.
   - [ ] Changes are documented in `docs/v0_4/ARCHITECTURE.md` (or similar).

2. **Issue: Add CONTENT_PAGE Node Type to Funnel Engine**  
   Labels: `v0.4`, `backend`, `patient`, `V0.4-E3`

   **Description**
   - Extend the funnel/flow engine types:
     - Add `CONTENT_PAGE` node type.
   - For each such node:
     - Resolve the `content_page` by slug or ID.
     - Serve it through the patient flow renderer.

   **Acceptance Criteria**
   - [ ] Node type `CONTENT_PAGE` is defined and supported.
   - [ ] Engine can return appropriate data to the frontend.
   - [ ] No breaking changes for existing QUESTION/RESULT nodes.

3. **Issue: Implement Patient Content Screen Renderer**  
   Labels: `v0.4`, `patient`, `frontend`, `V0.4-E3`

   **Description**
   - Implement a screen component that:
     - Renders a content page within the patient layout.
     - Offers a clear “Continue” button to move to the next step.
   - Re-use the global markdown/content renderer for consistent styling.

   **Acceptance Criteria**
   - [ ] Content pages render nicely in the patient flow.
   - [ ] “Continue” behaves the same as in questions.
   - [ ] No visual glitches between content and question/result screens.

4. **Issue: Admin UI to Attach Content Pages to Funnel Steps**  
   Labels: `v0.4`, `admin`, `frontend`, `V0.4-E3`

   **Description**
   - Extend the content admin editor:
     - Add dropdown/select for `funnel_id`.
     - Add text/select for `flow_step`.
     - Optional: numeric field for `order_index`.
   - It should be easy to see if a content page is part of a user flow.

   **Acceptance Criteria**
   - [ ] Admin can define to which funnel a content page belongs.
   - [ ] Admin can define at which step the content should appear.
   - [ ] Validation prevents obviously invalid configurations.

---

### 3.4 Epic V0.4-E4 – Clinician Dashboard V2

**Epic Goal**

Provide a modern, informative clinician landing page that helps understand patient status and
active funnels at a glance.

#### Suggested Issues

1. **Issue: Design Clinician Dashboard Layout & KPIs**  
   Labels: `v0.4`, `clinician`, `UX`, `V0.4-E4`

   **Description**
   - Define which metrics and lists a clinician sees on login:
     - Recent assessments
     - Patients with active stress funnel
     - Quick actions (start new assessment, view reports)
   - Document these as a small dashboard concept.

   **Acceptance Criteria**
   - [ ] Dashboard content plan is documented.
   - [ ] Each widget has a clear purpose.

2. **Issue: Implement Clinician Dashboard Components**  
   Labels: `v0.4`, `clinician`, `frontend`, `V0.4-E4`

   **Description**
   - Build dashboard with cards, tables, and quick action buttons.
   - Use core UI components from the design system.

   **Acceptance Criteria**
   - [ ] Clinician landing page replaces any old “table-only” view.
   - [ ] Dashboard is readable, responsive, and visually aligned with the rest of v0.4.

---

### 3.5 Epic V0.4-E5 – Navigation & Role-Based Routing V2

**Epic Goal**

Make navigation and routing predictable and role-aware.

#### Suggested Issues

1. **Issue: Implement Role-Based Entry Routing (Patient/Clinician/Admin)**  
   Labels: `v0.4`, `auth`, `routing`, `V0.4-E5`

   **Description**
   - After login, route users according to their role to:
     - Patient → Patient Flow or patient home
     - Clinician → Clinician dashboard
     - Admin → Content admin
   - Implement in middleware or route handlers as appropriate.

   **Acceptance Criteria**
   - [ ] Role is detected and routing is automatic.
   - [ ] No role sees the wrong landing page.

2. **Issue: Unify Navigation Menus per Role**  
   Labels: `v0.4`, `frontend`, `routing`, `V0.4-E5`

   **Description**
   - Define navigation items for each role.
   - Implement them in sidebar/header consistently.

   **Acceptance Criteria**
   - [ ] Each role has a logical, minimal navigation tree.
   - [ ] Navigation text is clear and non-technical.

---

### 3.6 Epic V0.4-E6 – Technical Cleanup & Stability Layer

**Epic Goal**

Ensure v0.4 is stable enough for external test patients.

#### Suggested Issues

1. **Issue: Consolidate Form Controls and Remove Duplicates**  
   Labels: `v0.4`, `frontend`, `cleanup`, `V0.4-E6`

2. **Issue: Implement Basic Error Pages and Loading States**  
   Labels: `v0.4`, `frontend`, `DX`, `V0.4-E6`

3. **Issue: Add Minimal Logging / Monitoring Hooks (e.g. console + TODOs)**  
   Labels: `v0.4`, `backend`, `DX`, `V0.4-E6`

---

## 4. Time & Effort (for a single developer with AI assist)

Rough estimate based on current working style:

- E1 – UI & Design System: 2–3h
- E2 – Patient Flow V2: 3–4h
- E3 – Content Flow: 2h
- E4 – Clinician Dashboard: 1–2h
- E5 – Navigation: 1h
- E6 – Cleanup: 1–2h

**Total:** ~10–14 focused hours.

---

## 5. How to Use This Document

- Create one Epic issue per `V0.4-E*`.
- For each Epic, create the suggested child issues with the provided descriptions.
- Use labels `v0.4` and `V0.4-E*` to keep everything grouped.
- Work top-down: E1/E2 first, then E3–E5, finally E6 for polish.

---
