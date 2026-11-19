# 13: n8n trigger and crawler cutover

**What to build:** After the app is live on the VPS, n8n only triggers the nightly job: at 03:00 it calls the app's job endpoint over the internal Docker network with the secret header. The interim crawler workflow is retired, nothing is imported from it, and the english_tutor schema in the knowledge database is dropped.

**Blocked by:** 03, 05

**Status:** done (2026-11-18, not committed yet)

- [x] n8n workflow `english-tutor/nightly-job` calls the job endpoint internally with the secret header at 03:00 and is published
- [x] The old english-tutor/crawler-wikipedia workflow is deactivated
- [x] knowledge.english_tutor schema is dropped after the first successful app-side crawl
- [x] Workflow JSON is exported to n8n-automation-infra

Source: `prd.md` v2 (approved 2026-11-18).
