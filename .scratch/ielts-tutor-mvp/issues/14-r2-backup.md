# 14: Off-VPS backup to Cloudflare R2 (infra repo)

**What to build:** The daily pg_dumpall dumps on the VPS (which cover n8n, knowledge and english_tutor) are also copied to Cloudflare R2 every day, so losing the VM does not lose the backups. Work happens in the n8n-automation-infra repo.

**Blocked by:** None (can start immediately)

**Status:** done (2026-11-18, not committed yet)

- [x] rclone configured on the VPS with an R2 bucket and a scoped token; secrets not in git
- [x] Daily copy runs after the dump and keeps a sensible retention
- [x] A restore from an R2 copy is tried once and documented in the infra README
- [x] R2 stays within the free tier (no card-triggered billing surprises noted)

Source: `prd.md` v2 (approved 2026-11-18).
