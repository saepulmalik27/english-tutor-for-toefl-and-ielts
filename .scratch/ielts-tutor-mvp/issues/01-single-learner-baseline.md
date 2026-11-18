# 01: Single-Learner baseline (prefactor)

**What to build:** The app runs locally for the one Learner with no account system: opening it lands straight on the dashboard. Local development uses the pgvector Postgres image (same version as the VPS) and a fresh initial Prisma migration. Signup, login, JWT, bcrypt, XP and the browser API-key form are gone, and API keys live only in server env. This clears the ground every later slice builds on.

**Blocked by:** None (can start immediately)

**Status:** done (2026-11-18, not committed yet)

- [x] App starts locally against a pgvector/pgvector:0.8.1-pg17 container; dev never points at the VPS database
- [x] A fresh initial migration exists and applies cleanly to an empty database
- [x] Signup, login pages, JWT session, bcrypt and remember-me are removed; there is exactly one Learner
- [x] XP is removed from schema and UI; the provider/API-key form is removed from onboarding and writing
- [x] Pages that still depend on removed pieces either keep working or are clearly stubbed for later slices
- [x] PRD v2 is the reference; terms follow GLOSSARY.md

Source: `prd.md` v2 (approved 2026-11-18).
