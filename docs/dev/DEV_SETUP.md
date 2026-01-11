# Dev Setup

## Prereqs

- Node.js 20+
- npm
- Supabase CLI (optional, for local DB workflows)

## Install

```bash
npm install
```

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Optional: Git hooks

```bash
npm run -s hooks:install
```
