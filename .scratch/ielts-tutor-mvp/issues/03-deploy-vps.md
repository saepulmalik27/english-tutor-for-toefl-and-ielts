# 03: Deploy to the Oracle VPS behind Cloudflare Access

**What to build:** The Learner opens tutor.saepulmalik.my.id, passes Cloudflare Access (email OTP, 30-day session) and sees the app running on the existing Oracle VPS. The image is built for arm64 on the laptop, shipped with docker save | ssh docker load, and started as an app service in the n8n-automation-infra compose stack, bound to 127.0.0.1, using its own english_tutor database in the shared Postgres. Migrations run on container start.

**Blocked by:** 01

**Status:** done (2026-11-18, not committed yet)

- [x] Node 24 LTS image builds for linux/arm64 locally with buildx
- [x] A deploy script in this repo ships the image to oracle-n8n and runs compose up for the app service only
- [x] The app service is defined in n8n-automation-infra's compose file, bound to 127.0.0.1, reachable by n8n on the internal network
- [x] english_tutor database exists in the VPS Postgres; prisma migrate deploy runs on start
- [x] Tunnel route (`http://app:3000`) and Access app (OTP, 1-month session) for tutor.saepulmalik.my.id exist; done manually 2026-11-18 and documented in the n8n-automation-infra README (no wizard: zone and tunnel already existed)
- [x] Visiting the domain without OTP is refused; with OTP the app loads
- [x] The local and VPS POSTGRES_PASSWORD mismatch is fixed before the first deploy (deploy must not overwrite the VPS .env password)

Source: `prd.md` v2 (approved 2026-11-18).
