# V05-I08.2 UI Structure - Pre-screening Call Script

## Page Structure

### URL
`/clinician/pre-screening`

### Layout
The page uses the standard clinician desktop layout with navigation sidebar.

---

## Visual Components

### 1. Page Header
```
┌─────────────────────────────────────────────────┐
│ Pre-Screening Call Script                       │
│ Strukturierter Erstkontakt zur Eignung,        │
│ Red Flags und Tier-Empfehlung                  │
└─────────────────────────────────────────────────┘
```

### 2. Success/Error Messages (Conditional)
```
┌─────────────────────────────────────────────────┐
│ ✓ Pre-Screening erfolgreich gespeichert        │ [Green]
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ⚠ [Error message]                               │ [Red]
└─────────────────────────────────────────────────┘
```

### 3. Patient Selection Card
```
┌─────────────────────────────────────────────────┐
│ 👤 Patient:in                                   │
│                                                  │
│ Patient:in auswählen *                          │
│ ┌─────────────────────────────────────────┐    │
│ │ -- Bitte wählen --                  ▼   │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4. Suitability Assessment Card
```
┌─────────────────────────────────────────────────┐
│ 📄 Eignung                                      │
│                                                  │
│ Ist der/die Patient:in für das Programm        │
│ geeignet? *                                     │
│                                                  │
│ ○ Ja, geeignet     ○ Nein, nicht geeignet      │
│                                                  │
│ Notizen zur Eignung                             │
│ ┌─────────────────────────────────────────┐    │
│ │ Zusätzliche Informationen zur Eignung...│    │
│ │                                          │    │
│ │                                          │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 5. Red Flags Card
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Red Flags                [2 markiert]        │
│                                                  │
│ ☐ Suizidgedanken oder akute Selbstgefährdung   │
│ ☑ Psychotische Symptome                        │
│ ☐ Schwere Substanzmissbrauchsproblematik       │
│ ☑ Schwere depressive Episode                   │
│ ☐ Kognitive Beeinträchtigung                   │
│ ☐ Sprachbarriere                               │
│ ☐ Kein Zugang zu digitalen Geräten            │
│ ☐ Akuter medizinischer Notfall                │
│ ☐ Sonstiges                                    │
│                                                  │
│ Zusätzliche Notizen zu Red Flags               │
│ ┌─────────────────────────────────────────┐    │
│ │ Details zu identifizierten Red Flags... │    │
│ │                                          │    │
│ │                                          │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 6. Tier Recommendation Card
```
┌─────────────────────────────────────────────────┐
│ 📄 Tier-Empfehlung                              │
│                                                  │
│ Empfohlenes Programm-Tier                       │
│ ┌─────────────────────────────────────────┐    │
│ │ Tier 2 - Standardversorgung         ▼   │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ Regelmäßige Begleitung durch Pflegekräfte      │
│ und digitale Tools                              │
│                                                  │
│ Notizen zur Tier-Empfehlung                    │
│ ┌─────────────────────────────────────────┐    │
│ │ Begründung für die Tier-Empfehlung...   │    │
│ │                                          │    │
│ │                                          │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 7. General Notes Card
```
┌─────────────────────────────────────────────────┐
│ Allgemeine Notizen                              │
│ ┌─────────────────────────────────────────┐    │
│ │ Weitere wichtige Informationen aus dem  │    │
│ │ Gespräch...                              │    │
│ │                                          │    │
│ │                                          │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8. Action Buttons
```
┌─────────────────────────────────────────────────┐
│                    [Abbrechen]  [Pre-Screening  │
│                                  speichern]      │
└─────────────────────────────────────────────────┘
```

---

## Form Fields Summary

| Field | Type | Required | Options |
|-------|------|----------|---------|
| Patient Selection | Dropdown | Yes | All patient profiles |
| Is Suitable | Radio | Yes | Ja/Nein |
| Suitability Notes | Textarea | No | Free text |
| Red Flags | Checkboxes | No | 9 pre-defined flags |
| Red Flags Notes | Textarea | No | Free text |
| Recommended Tier | Dropdown | No | Tier 1, 2, 3, or None |
| Tier Notes | Textarea | No | Free text |
| General Notes | Textarea | No | Free text |

---

## Red Flags List

1. **Suizidgedanken oder akute Selbstgefährdung**
   - ID: `suicidal_ideation`
   - Criticality: High

2. **Psychotische Symptome**
   - ID: `psychosis`
   - Criticality: High

3. **Schwere Substanzmissbrauchsproblematik**
   - ID: `substance_abuse`
   - Criticality: High

4. **Schwere depressive Episode**
   - ID: `severe_depression`
   - Criticality: High

5. **Kognitive Beeinträchtigung**
   - ID: `cognitive_impairment`
   - Criticality: Medium

6. **Sprachbarriere**
   - ID: `language_barrier`
   - Criticality: Medium

7. **Kein Zugang zu digitalen Geräten**
   - ID: `no_device`
   - Criticality: Medium

8. **Akuter medizinischer Notfall**
   - ID: `medical_emergency`
   - Criticality: High

9. **Sonstiges**
   - ID: `other`
   - Criticality: Variable

---

## Tier Descriptions

### Tier 1 - Basisversorgung
**Description:** Selbstgesteuerte digitale Intervention mit minimalem Support

**Characteristics:**
- Self-guided digital tools
- Minimal clinician support
- Suitable for low-risk patients
- Focus on prevention and education

### Tier 2 - Standardversorgung
**Description:** Regelmäßige Begleitung durch Pflegekräfte und digitale Tools

**Characteristics:**
- Regular nurse support
- Digital tools integrated
- Suitable for moderate-risk patients
- Balanced human and digital intervention

### Tier 3 - Intensivversorgung
**Description:** Intensive ärztliche Betreuung mit engmaschigem Monitoring

**Characteristics:**
- Intensive physician care
- Close monitoring
- Suitable for high-risk patients
- Comprehensive support structure

---

## User Interactions

### 1. Form Fill Flow
1. Load page → See empty form
2. Select patient from dropdown
3. Choose suitability (Ja/Nein)
4. Add suitability notes (optional)
5. Check applicable red flags
6. Add red flag notes (optional)
7. Select recommended tier (optional)
8. Add tier notes (optional)
9. Add general notes (optional)
10. Click "Pre-Screening speichern"

### 2. Success Flow
1. Submit form
2. See success message (green)
3. Form automatically resets after 2 seconds
4. Ready for next screening

### 3. Error Flow
1. Submit invalid form
2. See error message (red)
3. Fix errors
4. Resubmit

### 4. Cancel Flow
1. Click "Abbrechen"
2. Navigate back to previous page
3. Form data is lost (not saved)

---

## Responsive Behavior

### Desktop (>768px)
- Full width cards with comfortable padding
- Side-by-side radio buttons
- Expanded textarea heights
- Clear visual hierarchy

### Tablet (768px - 1024px)
- Slightly narrower cards
- Maintained layout structure
- Adjusted spacing

### Mobile (<768px)
- Stacked layout
- Full-width form controls
- Optimized touch targets
- Smaller padding

---

## Accessibility Features

- **Semantic HTML**: Proper form structure with labels
- **Keyboard Navigation**: All controls accessible via keyboard
- **Focus Indicators**: Clear focus states on all interactive elements
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Meets WCAG AA standards
- **Required Field Indicators**: Asterisks (*) and validation

---

## Color Coding

| Element | Color | Purpose |
|---------|-------|---------|
| Success Message | Green (bg-green-50) | Positive feedback |
| Error Message | Red (bg-red-50) | Error feedback |
| Red Flags Icon | Red (text-red-600) | Warning indicator |
| Red Flags Badge | Red (variant="danger") | Count of checked flags |
| Primary Button | Blue | Main action |
| Secondary Button | Gray | Cancel action |
| Card Background | White/Slate-50 (dark mode aware) | Container |

---

## Dark Mode Support

All components support dark mode:
- Background: `dark:bg-slate-900`
- Text: `dark:text-slate-50`
- Cards: `dark:bg-slate-800`
- Borders: `dark:border-slate-700`
- Inputs: `dark:bg-slate-800`

---

## Loading States

### Initial Load
```
┌─────────────────────────────────────────────────┐
│ Patient:in auswählen *                          │
│ ┌─────────────────────────────────────────┐    │
│ │ ⏳ Patienten werden geladen...          │    │
│ └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Form Submission
```
┌─────────────────────────────────────────────────┐
│              [Abbrechen]  [⏳ Speichern...]     │
└─────────────────────────────────────────────────┘
```

---

## Navigation Integration

The page appears in the clinician navigation menu:

```
Rhythmologicum Connect

Angemeldet als: Clinician

► Übersicht
► Triage
▼ Pre-Screening  ← Current page
  Fragebögen
  Inhalte
```

---

## Data Flow

```
User Input → Form State → Validation → API Call → Database → Audit Log
                                          ↓
                                    Success/Error
                                          ↓
                                    User Feedback
                                          ↓
                                     Form Reset
```

---

## Security Considerations

- **Authentication Required**: Page only accessible to authenticated users
- **Role-Based Access**: Only clinician and admin roles can access
- **Server-Side Validation**: All data validated on server
- **Organization ID**: Set server-side (never trusted from client)
- **Audit Trail**: All creations logged with metadata
- **RLS Policies**: Database-level access control
- **Input Sanitization**: User input properly escaped
- **CSRF Protection**: Next.js built-in protection

---

This UI structure document serves as a reference for developers, testers, and stakeholders to understand the pre-screening call script interface without needing to run the application.
