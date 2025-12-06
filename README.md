This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Rhythmologicum Connect

A patient stress and resilience assessment platform with role-based access control.

### Features

- **Patient Portal** (`/patient`): Stress assessment questionnaire and history
- **Clinician Dashboard** (`/clinician`): Protected dashboard for healthcare providers
- **Role-Based Authentication**: Automatic routing based on user roles
- **Session Persistence**: Secure cookie-based authentication via Supabase
- **Responsive Design**: Works on desktop and mobile devices

### User Roles

- **Patient**: Access to personal stress assessment and history
- **Clinician**: Access to all patient reports and detailed assessments

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication & Access Control

This application uses Supabase for authentication with role-based access control.

### Setting Up Clinician Access

After creating a user account, assign the clinician role:

```sql
-- Using the helper function
SELECT set_user_role('doctor@example.com', 'clinician');

-- Or directly update the user
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"clinician"'
)
WHERE email = 'doctor@example.com';
```

**📚 Detailed documentation:**
- [Clinician Authentication Setup](docs/CLINICIAN_AUTH.md) - Complete setup guide
- [Authentication Flow](docs/AUTH_FLOW.md) - Detailed flow diagrams
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Technical overview

### Protected Routes

- `/clinician/*` - Requires authentication + clinician role
- `/patient/*` - Requires authentication

Unauthorized access attempts are logged and users are redirected with clear error messages.

## Environment Variables

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
