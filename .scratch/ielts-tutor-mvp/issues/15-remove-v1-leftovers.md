# 15: Remove v1 leftovers (contract)

**What to build:** Once the Practice Session is the main flow, everything v1 that nothing uses any more is deleted: standalone lessons, the free journal, the old onboarding, the generated lesson/article pages and button, UserMemory remnants, seed content and any dead routes or actions.

**Blocked by:** 12

**Status:** done (2026-11-18, not committed yet)

- [x] No route, action or model from v1 remains without a caller
- [x] The app builds, lints and passes tests after removal
- [x] Prisma migration drops the removed tables

Source: `prd.md` v2 (approved 2026-11-18).
