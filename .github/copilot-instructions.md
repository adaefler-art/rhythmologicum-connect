# Rhythmologicum Connect - Copilot Instructions

## Project Overview

Rhythmologicum Connect is a patient stress and resilience assessment platform built with Next.js 16, React 19, TypeScript, and Supabase. The application provides role-based access control with two primary user types:

- **Patients**: Can access stress assessment questionnaires and view their assessment history
- **Clinicians**: Can access all patient reports and detailed assessments through a protected dashboard

### Key Technologies
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Authentication**: Supabase Auth with cookie-based sessions
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Anthropic Claude API for assessment analysis
- **Language**: TypeScript (strict mode enabled)
- **Styling**: TailwindCSS with Prettier formatting

## Project Structure

```
/app                    - Next.js App Router pages and layouts
  /api                  - API routes for backend functionality
  /clinician            - Protected clinician dashboard routes
  /patient              - Patient portal routes
/lib                    - Shared utilities and helpers
  supabaseClient.ts     - Client-side Supabase client
  supabaseServer.ts     - Server-side Supabase utilities
  amyFallbacks.ts       - AI assessment fallback responses
/middleware.ts          - Route protection middleware for /clinician routes
/docs                   - Comprehensive project documentation
/schema                 - Database schema (schema.sql)
/supabase               - Supabase configuration and migrations
  /migrations           - Database migration files
/scripts                - Utility scripts (e.g., version generation)
/tools                  - Development and maintenance tools
```

## Development Workflow

### Setup and Installation
```bash
npm install              # Install dependencies
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build (runs version script first)
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Environment Variables
Required variables (create `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Build Process
- **Pre-build**: `scripts/generate-version.js` automatically generates version information
- **Build**: Next.js production build with TypeScript compilation
- **No explicit test suite**: Manual testing is primary validation method

## Code Style and Conventions

### TypeScript
- **Strict mode enabled** - All TypeScript strict checks are enforced
- Use explicit types over `any` whenever possible
- Prefer interfaces for object shapes
- Use `type` for unions, intersections, and mapped types

### Code Formatting
- **Prettier configuration** (`.prettierrc`):
  - Single quotes: `true`
  - Semicolons: `false` (omit semicolons)
  - Tab width: `2` spaces
  - Trailing commas: `all`
  - Print width: `100` characters
- Run Prettier before committing code
- ESLint extends Next.js and Prettier configurations

### Naming Conventions
- **Files**: Use lowercase with hyphens for route folders, camelCase for utility files
- **Components**: PascalCase (e.g., `StressResultClient.tsx`)
- **Functions**: camelCase (e.g., `getCurrentUser()`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Database**: snake_case for all table and column names

### Import Statements
- Use `@/` path alias for absolute imports from project root
- Group imports: React/Next.js, third-party, local utilities, types
- No semicolons at end of import statements

### Comments
- Add comments for complex business logic or non-obvious code
- Use JSDoc comments for public API functions
- Explain "why" not "what" - code should be self-documenting where possible

## Authentication & Authorization

### Architecture
- **Middleware Protection**: `middleware.ts` intercepts all `/clinician/*` routes
- **Server-Side Utils**: `lib/supabaseServer.ts` provides `getCurrentUser()` and `hasClinicianRole()`
- **Client-Side Layout**: `app/clinician/layout.tsx` provides redundant client-side protection
- **Cookie-Based Sessions**: Uses `@supabase/ssr` for proper SSR/SSG support

### Role Management
- User roles stored in `auth.users.raw_app_meta_data.role`
- Two roles: `patient` (default) and `clinician`
- Use helper function in migrations: `set_user_role('email@example.com', 'clinician')`
- Check roles with: `has_role('clinician')` in SQL or `hasClinicianRole()` in TypeScript

### Protected Routes
- `/clinician/*` - Requires authentication AND clinician role
- `/patient/*` - Requires authentication only
- Unauthorized access logs warning and redirects to `/?error=access_denied` or `/?error=authentication_required`

### Best Practices
- Always use server-side auth checks for API routes
- Never trust client-side role checks for authorization
- Log all unauthorized access attempts with details
- Provide clear error messages to users

## Database Guidelines

### Supabase Schema
- Schema file: `schema/schema.sql` (single source of truth)
- Migrations: `supabase/migrations/` (timestamped SQL files)
- Use Row Level Security (RLS) policies for all tables
- Follow PostgreSQL naming conventions (snake_case)

### Common Tables
- `assessments` - Patient stress assessments
- `reports` - AI-generated assessment reports (includes `sleep_score`)
- `users` - Extended user profile information

### Migration Workflow
1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write SQL with proper `CREATE`, `ALTER`, or helper functions
3. Test migration locally before deployment
4. Document breaking changes in migration comments

### Data Access Patterns
- Use Supabase client methods (`.from()`, `.select()`, `.insert()`, etc.)
- Handle nullable fields explicitly
- Use TypeScript types that match database schema
- Always check for errors in Supabase responses

## API Routes

### Structure
- API routes in `/app/api/` directory
- Follow RESTful conventions where applicable
- Return consistent JSON response format

### Error Handling
- Use appropriate HTTP status codes
- Return descriptive error messages
- Log errors with context for debugging
- Don't expose sensitive information in error responses

### Authentication in API Routes
- Use `createServerClient()` from `@supabase/ssr` for auth in API routes
- Always verify user authentication before processing requests
- Check user roles for protected operations

## AI Integration (Anthropic Claude)

### Assessment Analysis
- AMY (Assessment Management Yielder) uses Claude API
- Fallback responses available in `lib/amyFallbacks.ts`
- API route: `/app/api/amy/stress-report/`
- Handles stress scoring, risk levels, and report generation

### Best Practices
- Always have fallback responses for API failures
- Rate limit API calls appropriately
- Store API keys in environment variables only
- Handle timeout and error scenarios gracefully

## Documentation

### Key Documentation Files
- `docs/IMPLEMENTATION_SUMMARY.md` - Feature implementation details
- `docs/AUTH_FLOW.md` - Authentication flow diagrams
- `docs/CLINICIAN_AUTH.md` - Clinician setup guide
- `docs/B2_IMPLEMENTATION.md` - B2 feature details
- `docs/JSON_EXPORT.md` - Data export functionality
- `CHANGES.md` - Change log (German language summary)

### Documentation Standards
- Update relevant docs when adding/changing features
- Use Markdown formatting
- Include code examples for complex features
- Add diagrams for architectural changes
- Keep README.md in sync with major changes

## Security Considerations

### General Security
- Never commit secrets or API keys to repository
- Use environment variables for all sensitive configuration
- Validate all user inputs on server side
- Implement proper CORS policies for API routes

### Authentication Security
- Cookie-based sessions with httpOnly flag
- Server-side session validation
- Automatic token refresh handling
- Logout clears all client-side state

### Database Security
- Use Row Level Security (RLS) policies
- Parameterize all SQL queries (Supabase client does this)
- Validate data before database operations
- Limit exposed database functions

## Common Tasks

### Adding a New Protected Route
1. Add route under `/app/clinician/` or `/app/patient/`
2. Middleware automatically protects `/clinician/*` routes
3. For patient routes, add auth check in page component if needed
4. Test with both authenticated and unauthenticated users

### Adding a New API Endpoint
1. Create file in `/app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` as needed
3. Add authentication check using Supabase server client
4. Return `NextResponse.json()` with appropriate status
5. Add error handling and logging

### Adding a Database Migration
1. Create timestamped file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write migration SQL (CREATE, ALTER, etc.)
3. Update `schema/schema.sql` to reflect changes
4. Test migration with `supabase db reset` locally
5. Document any breaking changes

### Updating Documentation
1. Identify affected documentation files
2. Update with clear, concise information
3. Add code examples if helpful
4. Update diagrams if architecture changes
5. Keep README.md and relevant docs in sync

## Testing Guidelines

### Manual Testing
- Test all user flows manually after changes
- Test with different user roles (patient, clinician, unauthenticated)
- Verify error handling and edge cases
- Test on multiple browsers if UI changes

### Areas to Test
- Authentication flows (login, logout, token refresh)
- Role-based access control
- API endpoints with various inputs
- Database operations and constraints
- Error scenarios and fallbacks

## Troubleshooting

### Common Issues
- **ESLint not found**: Run `npm install` to install dependencies
- **Supabase connection errors**: Check environment variables
- **Auth issues**: Verify Supabase session cookies are set
- **Build errors**: Check for TypeScript errors and missing dependencies

### Debugging Tips
- Check Next.js development console for errors
- Review Supabase logs for database/auth issues
- Use browser DevTools Network tab for API debugging
- Check middleware logs for auth flow issues

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- Project-specific docs in `/docs` directory

## Notes for Copilot Agents

- This project uses **German language** in some documentation files (e.g., `CHANGES.md`)
- Focus on **minimal, surgical changes** - don't refactor working code unnecessarily
- Always maintain **TypeScript strict mode** compliance
- Preserve existing **Prettier formatting** style
- **Test authentication flows** thoroughly when making auth-related changes
- **Update relevant documentation** when adding features
- Follow the **existing patterns** in the codebase for consistency
- Be mindful of **Supabase schema** when making database changes

## Funnel Architecture & Runtime (Epic B)

### Datenmodell

Die Stress- und Resilienz-Assessment-Funnels sind vollständig datengetrieben und liegen in folgenden Tabellen:

- `funnels`
- `funnel_steps`
- `funnel_step_questions`
- `questions`
- `assessments`
- `assessment_answers`

Grundsatz:  
**Funnel-Definition gehört in die Datenbank, nicht ins Frontend.**  
Forms werden aus der FunnelDefinition geladen, nicht hart codiert.

### Funnel Runtime Backend

Es gibt eine eigene Funnel Runtime, die den Lebenszyklus einer Assessment-Session steuert:

- **Assessment starten**  
  `POST /api/funnels/{slug}/assessments`
- **Assessment-Status + aktueller Step holen**  
  `GET /api/funnels/{slug}/assessments/{assessmentId}`
- **Step validieren**  
  `POST /api/funnels/{slug}/assessments/{assessmentId}/steps/{stepId}/validate`
- **Antworten speichern**  
  `POST /api/assessment-answers/save`
- **Assessment abschließen**  
  `POST /api/funnels/{slug}/assessments/{assessmentId}/complete`

Wichtige Invarianten:

- Nur authentifizierte Nutzer:innen mit passender Ownership dürfen ein Assessment lesen/schreiben.
- Steps dürfen nicht übersprungen werden (Step-Skipping-Prevention).
- Completed-Assessments sind read-only.
- Required-Validierung basiert ausschließlich auf `funnel_step_questions.is_required` + vorhandener Validation-Logik.

### Frontend-Integration der Funnel Runtime

Bei allen Funnel-Flows (insbesondere Stress-Funnel):

- **currentStep** immer aus der Runtime holen, nicht als „Quelle der Wahrheit“ im lokalen React-State halten.
- Nach einem Reload:
  - `GET /assessments/{id}` verwenden, um den aktuellen Step wiederherzustellen.
- Navigation:
  - `validate` vor „Weiter“ aufrufen.
  - Nur `nextStep` aus der API verwenden, keine eigene Berechnung im Client.
- Antworten:
  - Über den Save-Endpoint schreiben (oder zentralen Server-Handler), nicht direkt per Supabase-Client ins DB-Table, außer ein Issue verlangt explizit etwas anderes.

### Clinician Funnel Management (B7)

Es existiert (oder wird aufgebaut) eine Pflegeseite unter `/clinician/funnels`:

- Funnel-Übersicht:
  - Name, Slug, Aktiv-Status, Anzahl Steps
- Funnel-Details:
  - Steps inkl. `order_index`
  - Fragen je Step inkl. `is_required`

Bearbeitungsfunktionen:

- `is_active` pro Funnel toggeln
- `is_required` pro Frage toggeln
- Step-Reihenfolge ändern (order_index)

Regeln für Copilot:

- Zugriff nur für Rollen `clinician` oder `admin` (Server-seitig prüfen).
- Schreiboperationen immer über sichere Server-Handler/Server Actions durchführen.
- Änderungen an Funnel-Konfiguration wirken sich auf aktive/potentielle Assessments aus → vorsichtig sein, keine „magischen“ Auto-Mutationen an Schema/Definition bauen.

### API Response-Konvention für Funnel-Endpunkte

Wenn neue Endpunkte rund um Funnels/Runtime angelegt oder bestehende angepasst werden:

- Möglichst einheitliches Schema verwenden, z. B.:
  ```ts
  type ApiResponse<T> = {
    success: boolean
    data?: T
    error?: { code: string; message: string }
  }
