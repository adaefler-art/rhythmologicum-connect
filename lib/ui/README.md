# Rhythmologicum Connect UI Component Library

This is the core UI component library for the Rhythmologicum Connect application, implementing the V0.4 Design System.

## Overview

The component library provides a set of reusable, accessible, and consistent UI components that follow the established design tokens and patterns. All components are built with TypeScript, React 19, and TailwindCSS 4.

## Design Tokens

All components use design tokens from `@/lib/design-tokens` for consistent spacing, typography, colors, shadows, and motion. This ensures visual consistency across the application and makes theme changes easy.

## Components

### Badge

A small, colored label component for displaying status, categories, or tags.

**Variants:** `default`, `success`, `warning`, `danger`, `info`, `secondary`
**Sizes:** `sm`, `md`

**Usage:**
```tsx
import { Badge } from '@/lib/ui'

// Status indicators
<Badge variant="success">Aktiv</Badge>
<Badge variant="danger">Hohes Risiko</Badge>
<Badge variant="warning">Erhöht</Badge>
<Badge variant="info">Neu</Badge>
<Badge variant="secondary">Ausstehend</Badge>

// Sizes
<Badge size="sm">Small Badge</Badge>
<Badge size="md">Medium Badge</Badge>
```

---

### Button

A versatile, accessible button component with multiple variants and sizes.

**Variants:**
- `primary` - Main call-to-action button (sky-600 background)
- `secondary` - Secondary action button (slate-100 background)
- `outline` - Transparent button with border (sky-600 border)
- `ghost` - Minimal button with no border (transparent background)
- `danger` - Destructive action button (red-600 background)

**Sizes:** `sm`, `md`, `lg`

**Features:**
- Loading state with spinner
- Optional icon support
- Touch-optimized (44px+ minimum height)
- Smooth animations
- Full accessibility support

**Usage:**
```tsx
import { Button } from '@/lib/ui'

// Primary button
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Button with loading state
<Button variant="primary" loading disabled>
  Processing...
</Button>

// Button with icon
<Button variant="secondary" icon={<PlusIcon />}>
  Add Item
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>
```

---

### Card

A flexible container component for grouping related content.

**Props:**
- `header` - Optional header content
- `footer` - Optional footer content
- `padding` - Padding variant: `none`, `sm`, `md`, `lg`
- `radius` - Border radius: `md`, `lg`, `xl`, `2xl`
- `shadow` - Shadow depth: `none`, `sm`, `md`, `lg`
- `interactive` - Enable hover effects for clickable cards
- `border` - Show border (default: true)

**Usage:**
```tsx
import { Card } from '@/lib/ui'

// Basic card
<Card>
  <p>Card content goes here</p>
</Card>

// Card with header and footer
<Card
  header={<h3 className="font-bold">Card Title</h3>}
  footer={<Button variant="primary">Action</Button>}
>
  <p>Card body content</p>
</Card>

// Interactive card
<Card interactive onClick={() => navigate('/details')}>
  <p>Click me to navigate!</p>
</Card>
```

---

### Table

A flexible, accessible table component with sorting and interaction support.

**Features:**
- Configurable columns with custom accessors
- Row click handlers
- Hover and striped variants
- Loading and empty states
- Responsive with horizontal scroll
- Accessible with proper ARIA attributes

**Usage:**
```tsx
import { Table } from '@/lib/ui'

const columns = [
  { header: 'Name', accessor: (row) => row.name },
  { header: 'Email', accessor: (row) => row.email },
  { 
    header: 'Status', 
    accessor: (row) => <Badge>{row.status}</Badge>,
    align: 'center'
  },
]

<Table
  columns={columns}
  data={users}
  hoverable
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  emptyMessage="No users found"
/>
```

---

### Input

A styled text input component with error states and helper text.

**Sizes:** `sm`, `md`, `lg`

**Features:**
- Error state with custom styling
- Helper text support
- Accessible with proper ARIA attributes
- Consistent with form field styling

**Usage:**
```tsx
import { Input } from '@/lib/ui'

<Input
  type="email"
  placeholder="Enter your email"
  error={hasError}
  errorMessage="Invalid email address"
  helperText="We'll never share your email"
/>
```

---

### Textarea

A styled textarea component with error states and helper text.

**Sizes:** `sm`, `md`, `lg`

**Features:**
- Auto-resizing capable
- Error state with custom styling
- Helper text support
- Accessible with proper ARIA attributes

**Usage:**
```tsx
import { Textarea } from '@/lib/ui'

<Textarea
  placeholder="Enter description"
  rows={4}
  error={hasError}
  errorMessage="Description is required"
/>
```

---

### Select

A styled select dropdown component with error states and helper text.

**Sizes:** `sm`, `md`, `lg`

**Features:**
- Custom dropdown arrow
- Error state with custom styling
- Helper text support
- Accessible with proper ARIA attributes

**Usage:**
```tsx
import { Select } from '@/lib/ui'

<Select 
  error={hasError} 
  errorMessage="Please select an option"
  helperText="Choose the option that best applies"
>
  <option value="">Choose...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

---

### Label

A styled label component for form fields with optional required indicator.

**Sizes:** `sm`, `md`, `lg`

**Usage:**
```tsx
import { Label } from '@/lib/ui'

<Label htmlFor="email" required>
  Email Address
</Label>
<Input id="email" type="email" />
```

---

### FormField

A wrapper component that combines a label with a form control.

**Features:**
- Consistent label and control spacing
- Optional description text
- Required field indicator
- Accessible structure

**Usage:**
```tsx
import { FormField, Input } from '@/lib/ui'

<FormField 
  label="Email Address" 
  required 
  htmlFor="email"
  description="We'll use this to send you updates"
>
  <Input id="email" type="email" />
</FormField>
```

---

### HelperText

A styled helper text component for providing additional context to form fields.

**Sizes:** `sm`, `md`

**Usage:**
```tsx
import { HelperText } from '@/lib/ui'

<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" aria-describedby="email-helper" />
<HelperText id="email-helper">
  We'll never share your email with anyone else.
</HelperText>
```

---

### ErrorText

A styled error message component for displaying validation errors.

**Sizes:** `sm`, `md`

**Features:**
- Consistent error styling
- Red color for clear error indication
- Accessible with role="alert"

**Usage:**
```tsx
import { ErrorText } from '@/lib/ui'

<Label htmlFor="password" required>Password</Label>
<Input
  id="password"
  type="password"
  error
  aria-invalid="true"
  aria-describedby="password-error"
/>
<ErrorText id="password-error">
  Password must be at least 8 characters long.
</ErrorText>
```

---

### AppShell

A global layout component for clinician/admin routes with header and sidebar.

**Usage:**
```tsx
import { AppShell } from '@/lib/ui'

export default function ClinicianLayout({ children }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  )
}
```

---

## Complete Form Example

Here's a complete example of a form using the UI components:

```tsx
import { 
  Button, 
  Card, 
  FormField, 
  Input, 
  Textarea, 
  Select,
  ErrorText,
  HelperText 
} from '@/lib/ui'

export default function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    bio: '',
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validation and submission logic
  }

  return (
    <Card
      header={<h2 className="text-xl font-bold">Create User</h2>}
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save User
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Full Name" required htmlFor="name">
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            errorMessage={errors.name}
          />
        </FormField>

        <FormField 
          label="Email Address" 
          required 
          htmlFor="email"
          description="We'll use this for account notifications"
        >
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            errorMessage={errors.email}
          />
        </FormField>

        <FormField label="Role" required htmlFor="role">
          <Select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            error={!!errors.role}
            errorMessage={errors.role}
          >
            <option value="">Choose a role...</option>
            <option value="patient">Patient</option>
            <option value="clinician">Clinician</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>

        <FormField label="Bio" htmlFor="bio">
          <Textarea
            id="bio"
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            helperText="Brief description about the user"
          />
        </FormField>
      </form>
    </Card>
  )
}
```

---

## Design Principles

1. **Accessibility First**: All components follow WCAG 2.1 AA guidelines with proper ARIA attributes, keyboard navigation, and screen reader support.

2. **Touch-Optimized**: Interactive elements have minimum touch targets of 44px for mobile usability.

3. **Consistent Styling**: All components use design tokens for spacing, typography, colors, and animations.

4. **Responsive**: Components work seamlessly across mobile, tablet, and desktop viewports.

5. **Composable**: Components are designed to work together and can be easily composed into complex UIs.

6. **Type-Safe**: Full TypeScript support with exported types for all component props.

---

## Showcase

Visit `/admin/design-system` to see all components in action with interactive examples.

---

## Migration Guide

When migrating existing pages to use these components:

1. Replace raw `<button>` elements with `<Button>` components
2. Replace styled `<div>` containers with `<Card>` components
3. Replace raw `<table>` elements with `<Table>` component
4. Replace raw `<input>`, `<textarea>`, `<select>` with their component equivalents
5. Use `<FormField>` to wrap form controls for consistent spacing
6. Remove inline styles that duplicate component functionality

**Before:**
```tsx
<button className="px-6 py-3 rounded bg-sky-600 text-white hover:bg-sky-700">
  Save
</button>
```

**After:**
```tsx
<Button variant="primary">Save</Button>
```

---

## Contributing

When adding new components:

1. Use design tokens from `@/lib/design-tokens`
2. Follow TypeScript strict mode
3. Include comprehensive JSDoc comments
4. Export component and types from `index.ts`
5. Add examples to the design system showcase
6. Update this README with usage examples

---

## Support

For questions or issues with the component library, please refer to:
- Design system showcase: `/admin/design-system`
- Design tokens documentation: `/lib/design-tokens.ts`
- Project documentation: `/docs`
