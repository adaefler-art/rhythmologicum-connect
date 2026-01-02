# Design Mockup Briefing – Rhythmologicum Connect v0.4

## Goal

Provide a clear design briefing for a designer or a UI-focused Copilot/AI agent to create
mockups (Figma, image, or code) of the new Rhythmologicum Connect UI.

The focus is on:

- Modern clinician/admin interface
- Clean patient flow screens
- Consistent design language across the app

## Style Direction

- Hybrid of:
  - GitHub (clean, minimal, developer-friendly)
  - Linear.app (modern, fluid, product-UI)
  - Notion (calm surfaces, clear typography)
- Overall mood:
  - Professional medical digital product
  - Calm, trustworthy, but not sterile
  - "High-end SaaS" rather than "hospital UI"

## Color & Mood

- Base background: light neutral tones (off-white or very light gray)
- Surface cards: white or slightly tinted panels with subtle shadows
- Primary accent: one strong, calm color (e.g. a desaturated teal or blue)
- Support colors:
  - Success: green
  - Warning: amber
  - Danger: red
- Use color sparingly for:
  - Buttons
  - Status badges
  - Highlights (e.g. key scores)

## Typography

- Sans-serif, modern, readable (e.g. Inter, SF Pro, Roboto)
- Clear hierarchy:
  - H1: Page titles
  - H2: Section titles
  - H3: Card titles
  - Body: main copy, patient explanations
  - Small: meta-information, labels, hints
- Line spacing comfortable for longer medical explanations.

## Layout Principles

- Responsive grid layout with a max content width for patient screens to avoid very wide text.
- Clinician/Admin:
  - Left sidebar navigation
  - Top header with app name and user menu
  - Main content as cards and tables
- Patient:
  - Centered flow, one main column
  - Minimal chrome, focus on content/questions

## Key Screens to Mock

1. **Clinician Dashboard**
   - Header with product name (e.g. "Rhythmologicum Connect")
   - Sidebar:
     - Dashboard
     - Patients
     - Funnels
     - Content
   - Main content:
     - Top row: summary cards (e.g. “Active patients”, “Recent assessments”)
     - Table: list of recent assessments or patients
     - Quick actions: "Start new stress assessment", "Open reports"

2. **Patient Flow – Welcome Screen**
   - Calm hero section: short explanation of the stress and resilience assessment
   - Key points:
     - Duration (e.g. 5–10 minutes)
     - What happens with the data
     - Next step: “Start assessment” button
   - Optional small illustration or iconography (non-stock, simple shapes)

3. **Patient Flow – Question Screen**
   - Single question or small group of questions per screen
   - Clear question text, optional helper text
   - Scale selection (e.g. 1–5, 1–10) rendered as:
     - Either discrete buttons
     - Or sliders (only if clear and accessible)
   - Progress indicator (e.g. "Step 3 of 10" or progress bar)
   - Buttons:
     - Primary: Next
     - Secondary: Back
   - Error state: highlight missing answers with subtle red and helper text

4. **Patient Flow – Result Screen**
   - Main score/summary at the top
   - Key insight sections:
     - "Your current stress level"
     - "Resilience indicators"
     - "Short summary from AMY"
   - Visual highlight (e.g. simple distribution bar or gauge)
   - Suggested next actions:
     - "Schedule a follow-up"
     - "Read more about coping strategies" (content links)

5. **Content Page in Patient Flow**
   - Same layout shell as question screens
   - Content area: markdown-styled text
   - Clear "Continue" button at the bottom
   - Typography focused on readability

6. **Admin Content Editor**
   - Two-column layout:
     - Left: metadata fields (title, slug, funnel, flow_step, order)
     - Right: markdown editor with preview or single large editor with clean styling
   - All form controls visually consistent with rest of design.

## UX Considerations

- Accessibility:
  - Sufficient contrast
  - Clear focus states
  - Keyboard-friendly navigation
- Reduced cognitive load:
  - No cluttered pages
  - Use whitespace strategically
  - Group related elements (e.g. patient info + actions)

## Deliverables

For a designer or AI-driven mockup generator, requested deliverables are:

- 4–6 key screen mockups (as listed above)
- A small "UI Kit" page showing:
  - Color palette
  - Typography styles
  - Buttons
  - Cards
  - Tables
  - Form controls
- Optional: simple clickable prototype for the patient flow.

## Notes for Copilot/AI Usage

- When generating code from these mockups:
  - Use Tailwind utility classes based on design tokens.
  - Keep components modular (Button, Card, Layout).
  - Mirror the spacing and hierarchy from the mockups as closely as possible.
