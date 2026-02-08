// create_v0_4_issues_full.js
//
// One-shot Script: Erzeugt alle v0.4-Epics (E1–E6) und Child-Issues mit ausführlichen Beschreibungen.
// - Erkennt bereits existierende Issues per Titel und erzeugt keine Duplikate.
// - Verlinkt Child-Issues automatisch mit ihrem Epic (Parent Epic: #<nummer> + Kommentar).
//
// Nutzung lokal:
//   npm install @octokit/rest
//   export GITHUB_TOKEN=ghp_....
//   node create_v0_4_issues_full.js
//
// Nutzung in GitHub Actions:
//   GITHUB_TOKEN wird von Actions bereitgestellt, wenn permissions.issues: write gesetzt ist.

const { Octokit } = require("@octokit/rest");

// TODO ggf. anpassen:
const OWNER = "adaefler-art";
const REPO = "rhythmologicum-connect";

// -----------------------
// 1. Epics + Issues Modell
// -----------------------

/**
 * Jede Beschreibung ist bewusst ausführlich mit Kontext + AC,
 * so dass du sie 1:1 als GitHub-Issue verwenden kannst.
 */
const epics = [
  {
    key: "V0.4-E1",
    title: "V0.4-E1 — Global UI Refresh & Design System",
    body: `
Epic Goal:
Establish a modern, consistent UI and a small design system (tokens + components) used across
Clinician, Admin, and Patient areas.

Why:
- Current UI feels outdated and inconsistent.
- There are multiple ad-hoc layouts and form styles.
- A shared design language makes future funnels and screens much faster to implement.

Scope:
- Design tokens (colors, typography, spacing)
- Global layout (header, sidebar, content shell)
- Core UI components (Buttons, Cards, Tables, Form controls)
- Minimal dark/light mode decision for v0.4 (focus on readability)

Out of Scope:
- Full brand design, logo work, complex theming engine beyond v0.4 needs.
    `.trim(),
    labels: ["v0.4", "epic"],
    issues: [
      {
        title: "Define v0.4 Design Tokens (Colors, Typography, Spacing)",
        labels: ["v0.4", "frontend", "design", "V0.4-E1"],
        body: `
Define a minimal but solid design token set for v0.4:

- Color palette (primary, secondary, background, surface, success, warning, danger)
- Typography scale (H1–H4, body, small)
- Spacing scale (XS–XL)

Implementation:
- Define tokens centrally (Tailwind config + optional tokens file).
- Document how tokens should be used (short guideline for Copilot / future contributors).

Acceptance Criteria:
- [ ] A documented color palette exists and is used at least in layout and buttons.
- [ ] Typography scale is defined and applied to headings and body text.
- [ ] Spacing scale is visible in layout components (consistent paddings/margins).
- [ ] Tokens are defined in one central place and not duplicated across components.
        `.trim()
      },
      {
        title: "Implement Global App Layout (Header, Sidebar, Content Shell)",
        labels: ["v0.4", "frontend", "layout", "V0.4-E1"],
        body: `
Implement a global layout component used by clinician/admin routes.

Layout requirements:
- App header with product name/logo placeholder and future user menu area
- Left sidebar (navigation items for Clinician/Admin)
- Main content area with responsive padding and max-width container if needed
- Use v0.4 design tokens for spacing, colors, typography

Technical notes:
- Centralize the layout in a top-level layout component (e.g. /app/clinician/layout.tsx or shared layout)
- Make it easy to extend navigation in v0.5 without touching all pages again

Acceptance Criteria:
- [ ] Clinician/Admin pages share a common layout shell (header + sidebar + content).
- [ ] Navigation is clearly visible and consistent across clinician/admin routes.
- [ ] Layout behaves well on common screen sizes (desktop + tablet).
- [ ] No route uses an old ad-hoc layout wrapper anymore (unless clearly marked as legacy).
        `.trim()
      },
      {
        title: "Create Core UI Components (Button, Card, Table, Form Controls)",
        labels: ["v0.4", "frontend", "components", "V0.4-E1"],
        body: `
Create a small but robust UI component library under \`components/ui\`:

Components:
- Button (variants: primary, secondary, subtle, destructive)
- Card (with header + body slots, optional footer)
- Table (or shared table styles for clinician/admin list views)
- Form controls: Input, Textarea, Select, Label, HelperText, ErrorText

Implementation notes:
- Use v0.4 design tokens for spacing, colors, typography.
- Avoid over-engineering; focus on covering 80% of current needs.
- Gradually replace existing ad-hoc HTML in clinician/admin pages with these components.

Acceptance Criteria:
- [ ] A documented set of UI components exists under \`components/ui\`.
- [ ] Clinician/Admin pages use shared Button and Card components instead of raw HTML buttons/divs.
- [ ] Default form controls are visually consistent and easy to read.
- [ ] No random inline styles override the base components without a clear reason.
        `.trim()
      },
      {
        title: "Harmonize Color/Theme Behavior Across Forms",
        labels: ["v0.4", "frontend", "design", "V0.4-E1"],
        body: `
Decide on the primary appearance for v0.4 (likely light mode with strong readability)
and fix all form-related styles.

Requirements:
- Ensure form backgrounds are white (or very light) and text is black or very dark.
- Avoid partially implemented dark backgrounds with low contrast text.
- Make sure placeholders and helper texts are readable.

Acceptance Criteria:
- [ ] Core forms (Clinician, Admin, Patient) use white or very light backgrounds by default.
- [ ] Text and labels are dark enough for good contrast.
- [ ] No view shows unreadable combinations (e.g. dark blue background + dark text).
- [ ] If any dark sections exist, they are intentional and still readable.
        `.trim()
      }
    ]
  },

  {
    key: "V0.4-E2",
    title: "V0.4-E2 — Patient Flow V2",
    body: `
Epic Goal:
Replace the prototype patient experience (“gruselig”) with a single, clean, modern,
mobile-friendly flow for the Stress & Resilience assessment.

Scope:
- Unified flow renderer for the Stress funnel
- Welcome, question, optional content, and result screens
- Removal or archiving of legacy patient demo flows

Non-goals:
- Implementing additional funnels (Sleep/Recovery) in v0.4 – they can reuse the engine later.
    `.trim(),
    labels: ["v0.4", "epic"],
    issues: [
      {
        title: "Design Patient Flow V2 Structure (Screens & States)",
        labels: ["v0.4", "patient", "UX", "V0.4-E2"],
        body: `
Define the full Stress & Resilience journey from the patient perspective:

Screens (minimum):
- Welcome / explanation screen
- Question screens (possibly grouped by theme)
- Optional content screens (education, explanations)
- Result screen (summary, AI assistant text, next steps)

Deliverable:
- A simple flow description in markdown or diagram form (screens, transitions, purpose of each step).

Acceptance Criteria:
- [ ] Flow description (screens + transitions) is documented in the repo.
- [ ] Each screen has a clear purpose and a clear "next step".
- [ ] Mobile behavior is considered from the start (short text, no super-wide forms).
        `.trim()
      },
      {
        title: "Implement PatientFlowRenderer Component",
        labels: ["v0.4", "patient", "frontend", "V0.4-E2"],
        body: `
Implement a \`PatientFlowRenderer\` component that acts as the central entrypoint
for the Stress & Resilience assessment.

Responsibilities:
- Take a funnel/assessment configuration as input.
- Decide whether the current node is a Question, Content, or Result screen.
- Manage navigation (Next, Back) and show progress (e.g. step x of y).
- Integrate with existing backend/funnel data model.

Acceptance Criteria:
- [ ] There is a single entrypoint for the Stress & Resilience flow (no duplicate flows).
- [ ] Next/Back navigation works from welcome to result without dead-ends.
- [ ] Progress is visible and understandable to the patient.
        `.trim()
      },
      {
        title: "Build Responsive Patient Screens (Welcome, Question, Result)",
        labels: ["v0.4", "patient", "frontend", "UX", "V0.4-E2"],
        body: `
Implement modern, mobile-friendly screens for the patient flow:

Screens:
- Welcome: short explanation, duration, what happens with data, start button.
- Question: clear questions, scale controls, helper text, validation state.
- Result: main outcome, AI assistant summary, short recommendations, optional content links.

Design:
- Use design-system components (Buttons, Cards, Typography).
- Optimize for readability and emotional safety (calm, non-alarming UI).

Acceptance Criteria:
- [ ] All screens render well on small viewports (phone-size).
- [ ] Typography hierarchy is clear and consistent with v0.4 design tokens.
- [ ] Result screen clearly communicates the assessment outcome and suggested next steps.
        `.trim()
      },
      {
        title: "Clean Up Legacy Patient Demo Pages",
        labels: ["v0.4", "cleanup", "patient", "V0.4-E2"],
        body: `
Identify old patient demo routes and flows that are no longer part of the intended journey.

Tasks:
- Move legacy demos to a dedicated \`/_legacy\` area or remove them if not needed.
- Adjust navigation so no legacy flows are reachable by accident.
- Update docs to reference only the new Patient Flow V2.

Acceptance Criteria:
- [ ] No legacy patient demo route is reachable via the normal navigation.
- [ ] Only Patient Flow V2 is visible and used for the Stress funnel.
- [ ] Legacy flows (if kept) are clearly marked as such for internal reference.
        `.trim()
      }
    ]
  },

  {
    key: "V0.4-E3",
    title: "V0.4-E3 — Content Flow Engine (CONTENT_PAGE Integration)",
    body: `
Epic Goal:
Integrate editorial content pages into funnel flows so that content can appear before,
between, or after question blocks.

Scope:
- DB extensions to map content pages to funnels and steps
- New CONTENT_PAGE node type in the funnel engine
- Patient content screen renderer
- Admin UI to attach content pages to funnel steps
    `.trim(),
    labels: ["v0.4", "epic"],
    issues: [
      {
        title: "Extend DB Schema for Content Flow Mapping",
        labels: ["v0.4", "backend", "db", "V0.4-E3"],
        body: `
Extend \`content_pages\` schema to support mapping into funnels:

Add columns:
- \`funnel_id TEXT NULL\`
- \`flow_step TEXT NULL\`
- Optional: \`order_index INT NULL\` for ordering content within a step.

Tasks:
- Write migration script (Supabase-compatible).
- Update schema docs.

Acceptance Criteria:
- [ ] DB migration script exists and runs successfully (locally and in Supabase).
- [ ] \`content_pages\` can be associated with a funnel and a flow step.
- [ ] The schema changes are documented in the v0.4 architecture docs.
        `.trim()
      },
      {
        title: "Add CONTENT_PAGE Node Type to Funnel Engine",
        labels: ["v0.4", "backend", "patient", "V0.4-E3"],
        body: `
Extend the funnel/flow engine to support a new node type \`CONTENT_PAGE\`.

Requirements:
- Node type constant or enum value (e.g. "CONTENT_PAGE").
- For each such node, resolve the referenced content page (slug or ID).
- Surface enough data for the frontend to render the content properly.

Acceptance Criteria:
- [ ] Node type \`CONTENT_PAGE\` is defined alongside other node types.
- [ ] The engine can return content-node definitions to the frontend.
- [ ] Existing QUESTION/RESULT handling keeps working without breaking changes.
        `.trim()
      },
      {
        title: "Implement Patient Content Screen Renderer",
        labels: ["v0.4", "patient", "frontend", "V0.4-E3"],
        body: `
Implement a dedicated screen for content pages in the patient flow.

Requirements:
- Render markdown/content in the same visual style as the rest of the app.
- Provide a clear "Continue" button to move to the next step in the flow.
- Support longer text with good readability.

Acceptance Criteria:
- [ ] Content pages can be displayed as part of the patient flow.
- [ ] Continue behaves consistently with question screens.
- [ ] No visual glitches when moving from content to question or result screens.
        `.trim()
      },
      {
        title: "Add Content→Funnel Mapping UI in Admin",
        labels: ["v0.4", "admin", "frontend", "V0.4-E3"],
        body: `
Extend the content admin editor to attach pages to funnels and steps.

UI fields:
- Funnel: dropdown or select for known funnels (e.g. "stress")
- Flow step: text/select for step identifier (e.g. "intro-1", "between-questions-2")
- Optional: order_index for multiple content nodes at the same stage.

Acceptance Criteria:
- [ ] Admin can define to which funnel a content page belongs.
- [ ] Admin can define at which flow step the content should appear.
- [ ] Basic validation prevents obviously invalid configurations.
        `.trim()
      }
    ]
  },

  {
    key: "V0.4-E4",
    title: "V0.4-E4 — Clinician Dashboard V2",
    body: `
Epic Goal:
Provide a modern, informative clinician landing page that helps understand patient status
and active funnels at a glance.

Scope:
- Define dashboard layout and key widgets (KPIs, lists, quick actions)
- Implement responsive dashboard using the v0.4 design system.
    `.trim(),
    labels: ["v0.4", "epic"],
    issues: [
      {
        title: "Design Clinician Dashboard Layout & KPIs",
        labels: ["v0.4", "clinician", "UX", "V0.4-E4"],
        body: `
Define what a clinician should see immediately after login:

Candidates:
- Summary cards (e.g. "Active patients", "Recent assessments", "Assessments this week")
- List of recent assessments with timestamps and statuses
- Quick actions (start new stress assessment, view patient list, open content library)

Deliverable:
- A short dashboard concept (markdown) describing layout and widgets.

Acceptance Criteria:
- [ ] Dashboard content plan is documented.
- [ ] Each widget has a clear purpose and target user question it answers.
        `.trim()
      },
      {
        title: "Implement ClinicianDashboard Component",
        labels: ["v0.4", "clinician", "frontend", "V0.4-E4"],
        body: `
Implement the Clinician Dashboard screen using v0.4 UI components.

Requirements:
- Use Cards for KPI tiles.
- Use Table or List for recent assessments.
- Include at least 1–2 clear call-to-action buttons.

Acceptance Criteria:
- [ ] Clinician landing page uses the new dashboard layout instead of table-only views.
- [ ] Dashboard is readable and responsive on common screen sizes.
- [ ] Visual style is consistent with the rest of v0.4.
        `.trim()
      }
    ]
  },

  {
    key: "V0.4-E5",
    title: "V0.4-E5 — Navigation & Role-Based Routing V2",
    body: `
Epic Goal:
Make navigation and routing predictable and role-aware for Patient, Clinician and Admin.

Scope:
- Role-based entry routing after login
- Navigation menus per role (sidebar/header)
    `.trim(),
    labels: ["v0.4", "epic"],
    issues: [
      {
        title: "Implement Role-Based Entry Routing (Patient/Clinician/Admin)",
        labels: ["v0.4", "auth", "routing", "V0.4-E5"],
        body: `
Implement role-based routing so that logged-in users are sent to the right start page.

Requirements:
- Patient → patient home / flow entry
- Clinician → clinician dashboard
- Admin → content admin or admin home

Acceptance Criteria:
- [ ] Role is detected and routing is automatic after login.
- [ ] No role sees the wrong landing page.
        `.trim()
      },
      {
        title: "Create Unified Navigation Menus per Role",
        labels: ["v0.4", "frontend", "routing", "V0.4-E5"],
        body: `
Define and implement navigation menus for each role (patient, clinician, admin).

Requirements:
- Sidebar and/or header navigation with clear, non-technical labels.
- Use v0.4 design system components.
- Avoid duplicate or confusing entries.

Acceptance Criteria:
- [ ] Each role has a logical, minimal navigation tree.
- [ ] Navigation text is clear and aligned with user vocabulary.
- [ ] Navigation is implemented via shared components where possible.
        `.trim()
      }
    ]
  },

  {
    key: "V0.4-E6",
    title: "V0.4-E6 — Technical Cleanup & Stability Layer",
    body: `
Epic Goal:
Ensure v0.4 is stable enough for external test patients with minimal surprises.

Scope:
- Consolidate form controls
- Add loading and error states
- Add minimal logging/monitoring hooks for key events
    `.trim(),
    labels: ["v0.4", "epic"],
    issues: [
      {
        title: "Consolidate Form Controls Across the App",
        labels: ["v0.4", "frontend", "cleanup", "V0.4-E6"],
        body: `
Identify all custom form controls (inputs, textareas, selects) across patient/clinician/admin.

Tasks:
- Migrate them to shared components from the v0.4 design system.
- Remove or deprecate duplicate implementations.

Acceptance Criteria:
- [ ] Most forms use shared Input/Textarea/Select components.
- [ ] Duplicate or legacy form components are removed or clearly marked as deprecated.
        `.trim()
      },
      {
        title: "Add Error Pages (404/500) and Loading States",
        labels: ["v0.4", "frontend", "DX", "V0.4-E6"],
        body: `
Add basic error and loading handling:

- Custom 404 page for unknown routes.
- Custom 500/error page for unhandled server errors.
- Loading indicators for views that fetch data from Supabase / APIs.

Acceptance Criteria:
- [ ] 404 and 500 pages exist and are styled in line with v0.4.
- [ ] Long-running views show loading feedback instead of blank screens.
        `.trim()
      },
      {
        title: "Add Minimal Logging / Monitoring Hooks",
        labels: ["v0.4", "backend", "DX", "V0.4-E6"],
        body: `
Add minimal logging hooks for key events:

- Assessment start/end
- Major errors in patient and clinician flows
- TODO comments/placeholders for future monitoring integration

Acceptance Criteria:
- [ ] Important events are logged in a structured way (even if only console for now).
- [ ] There is a documented place to integrate real monitoring later (e.g. Sentry).
        `.trim()
      }
    ]
  }
];

// -----------------------
// 2. Helper-Funktionen
// -----------------------

async function fetchExistingIssues(octokit) {
  const all = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner: OWNER,
    repo: REPO,
    state: "all",
    per_page: 100
  });

  const byTitle = new Map();
  for (const issue of all) {
    if (!byTitle.has(issue.title)) {
      byTitle.set(issue.title, issue);
    }
  }
  return byTitle;
}

async function ensureEpic(octokit, epic, existingByTitle) {
  if (existingByTitle.has(epic.title)) {
    const existing = existingByTitle.get(epic.title);
    console.log(`Epic exists: #${existing.number} – ${epic.title}`);
    return existing;
  }

  console.log(`Creating epic: ${epic.title}`);
  const res = await octokit.rest.issues.create({
    owner: OWNER,
    repo: REPO,
    title: epic.title,
    body: epic.body,
    labels: epic.labels
  });
  return res.data;
}

async function ensureChildIssue(octokit, epicIssue, childDef, existingByTitle) {
  const existing = existingByTitle.get(childDef.title);
  let issue;
  const epicNumber = epicIssue.number;
  const parentRef = `Parent Epic: #${epicNumber}`;

  if (existing) {
    console.log(`  Child exists: #${existing.number} – ${childDef.title}`);
    // Body ggf. erweitern, falls Parent-Ref fehlt
    const body = existing.body || "";
    if (!body.includes(parentRef)) {
      const updatedBody = `${body}\n\n${parentRef}`;
      await octokit.rest.issues.update({
        owner: OWNER,
        repo: REPO,
        issue_number: existing.number,
        body: updatedBody
      });
    }
    issue = existing;
  } else {
    console.log(`  Creating child issue: ${childDef.title}`);
    const bodyWithParent = `${childDef.body}\n\n${parentRef}`;
    const res = await octokit.rest.issues.create({
      owner: OWNER,
      repo: REPO,
      title: childDef.title,
      body: bodyWithParent,
      labels: childDef.labels || []
    });
    issue = res.data;

    // Label "child" ergänzen
    await octokit.rest.issues.addLabels({
      owner: OWNER,
      repo: REPO,
      issue_number: issue.number,
      labels: ["child"]
    });

    // In Map aufnehmen, damit später nicht nochmal erzeugt wird
    existingByTitle.set(issue.title, issue);
  }

  // Kommentar am Epic anlegen, um Cross-Reference zu forcieren
  const linkComment = `Linked child: #${issue.number}`;
  // Nur rudimentär gegen Duplikate absichern: Kommentare nicht prüfen, einfach zulassen
  await octokit.rest.issues.createComment({
    owner: OWNER,
    repo: REPO,
    issue_number: epicNumber,
    body: linkComment
  });

  return issue;
}

// -----------------------
// 3. Main
// -----------------------

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN is not set.");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  console.log("Fetching existing issues...");
  const existingByTitle = await fetchExistingIssues(octokit);
  console.log(`Found ${existingByTitle.size} existing issues (all states).`);

  for (const epic of epics) {
    const epicIssue = await ensureEpic(octokit, epic, existingByTitle);

    if (epic.issues && epic.issues.length > 0) {
      for (const child of epic.issues) {
        await ensureChildIssue(octokit, epicIssue, child, existingByTitle);
      }
    }
  }

  console.log("Done creating/updating v0.4 epics and issues.");
}

main().catch((err) => {
  console.error("Error creating v0.4 issues:", err);
  process.exit(1);
});
