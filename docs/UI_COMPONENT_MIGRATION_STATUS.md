# UI Component Migration Status

This document tracks the migration of clinician and admin pages to use the shared UI component library from `lib/ui`.

## Migration Goal

Replace raw HTML elements and inline styles with shared UI components for:
- Better consistency across the application
- Easier maintenance and updates
- Compliance with v0.4 design system
- Reduced code duplication

## Component Library

Location: `lib/ui/`

Available components:
- **Button** - All button variants (primary, secondary, outline, ghost, danger)
- **Card** - Container with header/footer support
- **Table** - Data tables with sorting
- **Input** - Text inputs with error states
- **Textarea** - Multi-line text inputs
- **Select** - Dropdown selects
- **Label** - Form field labels
- **FormField** - Label + control wrapper
- **HelperText** - Helper text for form fields
- **ErrorText** - Error messages
- **AppShell** - Global layout wrapper

Documentation: `lib/ui/README.md`

## Migration Status

### ✅ Completed

1. **app/clinician/page.tsx** 
   - Migrated: Button, Badge, Card components
   - Added: 4 statistical cards with icons
   - Status: Complete ✅
   
2. **app/clinician/funnels/page.tsx**
   - Migrated: Button, Badge, and Card components
   - Replaced: Raw button elements and inline styled divs
   - Status: Complete ✅

3. **app/clinician/patient/[id]/page.tsx**
   - Migrated: Badge, Card, Button components
   - Replaced: All raw HTML containers with Card components
   - Status: Complete ✅

4. **app/admin/content/page.tsx**
   - Migrated: Button and Badge components for all actions
   - Replaced: Status badges with Badge component
   - Status: Complete ✅

5. **app/clinician/layout.tsx**
   - Already using: AppShell component
   - Status: Already migrated ✅

6. **app/admin/layout.tsx**
   - Already using: AppShell component
   - Status: Already migrated ✅

7. **app/admin/design-system/page.tsx**
   - Already using: All UI components (showcase page)
   - Status: Already migrated ✅

8. **lib/ui/Badge.tsx**
   - New component created and integrated
   - Status: Complete ✅

### 🔄 Pending Migration (Optional)

1. **app/clinician/funnels/[id]/page.tsx** (Medium Priority)
   - Current: ~12+ raw button elements with inline styles
   - Could migrate to Button components if needed
   - Impact: Medium - used for funnel management
   - Status: Functional but could be improved

2. **app/clinician/report/[id]/page.tsx**
   - Could benefit from Card and Badge components
   - Status: Functional, lower priority

3. **app/admin/content/[id]/page.tsx**
   - Already uses Button component
   - Could add Card components for better structure
   - Status: Mostly migrated

4. **app/admin/content/new/page.tsx**
   - Already uses Button and FormField components
   - Status: Mostly migrated

## Migration Checklist

When migrating a page, ensure:

- [ ] Replace `<button>` with `<Button variant="...">` 
- [ ] Replace styled `<div>` containers with `<Card>` where appropriate
- [ ] Replace raw `<input>` with `<Input>` or `<FormField>`
- [ ] Replace raw `<select>` with `<Select>` or `<FormField>`
- [ ] Replace raw `<textarea>` with `<Textarea>` or `<FormField>`
- [ ] Replace raw `<table>` with `<Table>` where possible
- [ ] Remove inline styles that duplicate component functionality
- [ ] Test the page after migration
- [ ] Run linter to check for issues
- [ ] Build project to verify no errors

## Button Variant Mapping

When replacing raw buttons, use these variant mappings:

| Old Pattern | New Component |
|------------|---------------|
| `bg-sky-600 hover:bg-sky-700` | `<Button variant="primary">` |
| `bg-slate-100 hover:bg-slate-200` | `<Button variant="secondary">` |
| `border-2 border-sky-600` | `<Button variant="outline">` |
| `bg-transparent hover:bg-slate-100` | `<Button variant="ghost">` |
| `bg-red-600 hover:bg-red-700` | `<Button variant="danger">` |

## Common Patterns

### Before: Raw Button
```tsx
<button
  onClick={handleClick}
  className="px-6 py-3 rounded bg-sky-600 text-white hover:bg-sky-700"
>
  Save
</button>
```

### After: Button Component
```tsx
<Button variant="primary" onClick={handleClick}>
  Save
</Button>
```

### Before: Raw Card Container
```tsx
<div className="bg-white border border-slate-200 rounded-lg p-6">
  <h3 className="font-bold mb-4">Title</h3>
  <p>Content</p>
</div>
```

### After: Card Component
```tsx
<Card header={<h3 className="font-bold">Title</h3>}>
  <p>Content</p>
</Card>
```

## Testing After Migration

1. Visual inspection - Check that styling matches the original
2. Interaction testing - Test all buttons and forms work correctly
3. Responsive testing - Verify layout on mobile and desktop
4. Accessibility testing - Ensure keyboard navigation works
5. Build test - Run `npm run build` to check for TypeScript errors
6. Lint test - Run `npm run lint` to check for code quality issues

## Benefits Achieved

After migration, pages will have:
- ✅ Consistent styling across the application
- ✅ Automatic accessibility support (ARIA attributes, keyboard navigation)
- ✅ Touch-optimized interactive elements (44px minimum)
- ✅ Loading states and disabled states handled automatically
- ✅ Consistent spacing using design tokens
- ✅ Easy theming support for future updates
- ✅ Reduced code duplication
- ✅ Easier maintenance

## Next Steps

1. Prioritize migration of `app/clinician/funnels/[id]/page.tsx` (high-traffic page)
2. Review and migrate remaining clinician pages
3. Review and migrate remaining admin pages
4. Update this document as pages are migrated
5. Consider creating a linting rule to prevent new raw buttons/cards

## Resources

- Component Library: `/lib/ui/`
- Documentation: `/lib/ui/README.md`
- Design Tokens: `/lib/design-tokens.ts`
- Showcase: Visit `/admin/design-system` to see all components
- Design System Epic: Issue #198 (V0.4-E1)
