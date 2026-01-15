# Operational Runbooks

This directory contains operational runbooks for deployment, testing, and troubleshooting.

## Available Runbooks

### [DB_SEED.md](./DB_SEED.md)

**Purpose:** Database seeding for pilot deployment

**Covers:**
- One-command database setup
- Deterministic test data (org, users, funnels)
- Test account credentials
- Verification and troubleshooting

**Quick Start:**
```bash
npm run db:reset
# Creates pilot org, test users (admin/clinician/patients), and 2 funnels
```

### [PILOT_SMOKE_TESTS.md](./PILOT_SMOKE_TESTS.md)

**Purpose:** Copy-paste-ready smoke tests for pilot deployment

**Covers:**
- Dashboard loads (auth + eligibility)
- AMY submit routes (triage/workup)
- Start/Resume funnel functionality
- Workup needs_more_data follow-ups
- Dashboard next step updates

**Quick Start:**
```powershell
# See root directory for the automated script
.\verify-pilot-smoke.ps1 -BaseUrl "http://localhost:3000" -Cookie "sb-localhost-auth-token=..."
```

---

## When to Use These Runbooks

- **Pre-deployment:** Verify core functionality before releasing to production
- **Post-deployment:** Smoke test to ensure deployment was successful
- **Troubleshooting:** Diagnose issues in pilot environment
- **Onboarding:** Help new team members understand the system flow

## Contributing

When adding a new runbook:
1. Use the same format and structure as existing runbooks
2. Include copy-paste-ready commands
3. Document expected outcomes
4. Add troubleshooting section
5. Include prerequisites
6. Update this README with a link

## Support

For issues or questions about runbooks, see the main project documentation or contact the ops team.
