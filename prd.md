# PRD v2: Zero-cost IELTS General Training Tutor

Status: approved by the Learner (2026-11-18). Replaces PRD v1 (TOEFL/IELTS Academic, multi-user, 10-20-70 lessons), which is in git history.

Every decision here comes from the wayfinder map `.scratch/zero-cost-toefl-tutor/map.md`; the ticket behind each one is linked so the reasoning can be traced. Terms follow `GLOSSARY.md` (Learner, Target Exam, Skill, Error Pattern, Weakness Profile, Practice Session, Speaking Task, Feedback).

## Problem Statement

The Learner, an Indonesian software engineer applying for jobs in Singapore and Australia, needs an IELTS General Training (computer-delivered) score of **7 in every section** (6 as the safe floor) for an Australian work visa, with the test around **May 2027** ([07](.scratch/zero-cost-toefl-tutor/issues/07-target-skor-tenggat.md)). Courses cost money, generic apps don't adapt to the Learner's own recurring mistakes, and speaking practice with feedback is the hardest part to get alone. The budget for infrastructure is **zero rupiah per month**.

## Solution

A private, single-Learner tutor (a PWA on phone and laptop) built around one **30-minute daily Practice Session**: Speaking first, then Reading, then a review of the Learner's own weakest Error Patterns. Every answer gets immediate Feedback in Indonesian. Mistakes are tagged with a fixed set of Error Patterns; each pattern becomes a spaced-repetition card (FSRS-6) that comes back as fresh drills until it sticks. Content comes from an original question bank generated nightly by an LLM, with Reading Section 3 passages crawled from open-licence Wikipedia articles. Everything runs on the Learner's existing Oracle VPS and free AI tiers.

## User Stories

1. As the Learner, I open the app and see today's session, which section is my lowest right now, and why the session focuses on it.
2. As the Learner, I go through a fixed order (Speaking → Reading → Review), one item per screen, with a three-part progress bar.
3. As the Learner, I get an IELTS Speaking Part 1, 2 or 3 task (rotating), prepare with a cue card and optional notes, then record my answer with a visible timer and can play it back.
4. As the Learner, right after speaking I see my estimated Speaking band as a range, a card per criterion (FC, LR, GRA; Pronunciation "not scored yet"), fluency facts (words per minute, long pauses, fillers), and my transcript with mistakes highlighted; tapping one shows the Error Pattern, the correction and an explanation in Indonesian.
5. As the Learner, I answer Reading questions in IELTS GT formats (TFNG, completion with a word limit, matching headings and others) and see right/wrong plus an Indonesian explanation after each one.
6. As the Learner, I get up to two of my due Error Patterns as fresh drills (three each) in the review block, so old mistakes come back before I forget them.
7. As the Learner, when Writing is my lowest section, Writing Task 1 replaces the Reading block twice a week; otherwise I can do Writing Task 1 or 2 as an optional extra.
8. As the Learner, I get Writing Feedback per IELTS criterion (TA/TR, CC, LR, GRA) with tagged Error Patterns, the same way as Speaking.
9. As the Learner, I see an end-of-session summary: results per block, streak +1, and tomorrow's focus.
10. As the Learner, I see a dashboard with my estimated band range per section, my lowest section, my most frequent Error Patterns, my streak, and how much of today's Groq quota is left.
11. As the Learner, I can report a bad question; it is retired immediately.
12. As the Learner, my first week rotates through every Skill so the app has data for every section; there is no separate diagnostic test.
13. As the Learner, I reach the app at `tutor.saepulmalik.my.id` after an email one-time code, and stay signed in for 30 days.

## Implementation Decisions

### Target Exam and scoring ([07](.scratch/zero-cost-toefl-tutor/issues/07-target-skor-tenggat.md), [14](.scratch/zero-cost-toefl-tutor/issues/14-format-ielts-gt.md))

- Target Exam: IELTS General Training, computer-delivered. TOEFL and IELTS Academic are removed from the app, including every 0–120 and 0–30 score field.
- Speaking and Writing are scored per IELTS criterion on 0–9 by the LLM against the public ielts.org band descriptors. Fluency metrics (WPM, pauses ≥0.5 s, mean length of run, filler rate) are computed in code from Whisper word timestamps and handed to the LLM as facts ([05](.scratch/zero-cost-toefl-tutor/issues/05-rujukan-speaking-scoring.md)).
- Pronunciation is shown as "not scored yet" in the MVP.
- Feedback in Indonesian is written in a separate step after the scores are final.

### Band estimates ([09](.scratch/zero-cost-toefl-tutor/issues/09-model-personalisasi.md))

Always shown as a range, never a single number.
- Reading: % correct over the last 80 questions, mapped through IELTS GT raw→band points (35/40 ≈ 7, 30/40 ≈ 6, interpolated), ±0.5.
- Writing and Speaking: average of per-criterion scores over the last 5 tasks, Writing Task 2 weighted 2×, ±1.
- Listening: "no data yet".
- Lowest section = the lowest midpoint; it drives the session focus.

### Personalisation ([09](.scratch/zero-cost-toefl-tutor/issues/09-model-personalisasi.md))

- **Error Pattern taxonomy:** a fixed, hand-curated list of about 35 patterns, each tagged with a Skill and an IELTS criterion (GRA, LR, CC, TA/TR, FC, Reading). The LLM may only return IDs from the list; anything else is `other` with a note, which can be promoted to a new pattern.
- **FSRS cards:** one card per Error Pattern, not per question. `ts-fsrs` v6 with `version: 'FSRS-6'`, default parameters, desired retention 0.9.
- **Ratings:** card created on the first occurrence. Drills (3 items): 0–1 correct → Again, 2 → Hard, 3 → Good; Easy is never automatic. The pattern appearing again in regular practice → Again. Not appearing → nothing recorded.
- **Weakness Profile** is computed from the data on each request (band per Skill, pattern frequency over 30 days, FSRS retrievability). Nothing is stored or summarised by an LLM; `UserMemory` is removed.

### Practice Session ([09](.scratch/zero-cost-toefl-tutor/issues/09-model-personalisasi.md), [10](.scratch/zero-cost-toefl-tutor/issues/10-alur-practice-session.md))

- Daily: Speaking 15 min (one Part, rotating P1 → P2 → P3) + Reading 9 min (a Section 1–2 text or half a Section 3 passage) + Review 6 min.
- If Writing is the lowest section, Task 1 (20 min) replaces Reading on 2 days a week. Otherwise Writing is an optional extra twice a week (Task 1 one day, Task 2 another).
- Review: at most 2 due Error Patterns per day, lowest retrievability first, 3 drills each. If none are due, the slot becomes extra practice for the lowest section. A backlog after missed days is drained 2 a day.
- First 7 days: sessions rotate evenly through every Skill (including one Task 1 and one Task 2). Onboarding is a welcome screen plus microphone permission.
- Streak counts a day with a completed session, in WIB (Asia/Jakarta), not a login (approved with this PRD; v1 counted logins in UTC).
- UI: prototype variant A "step by step" (fixed order, one item per screen, immediate Feedback, band-range card, criterion cards, tappable transcript). The prototype code is kept on a throwaway branch, not in `main`.

### Question bank ([11](.scratch/zero-cost-toefl-tutor/issues/11-pipeline-bank-soal.md), [04](.scratch/zero-cost-toefl-tutor/issues/04-sumber-materi-crawler.md), [14](.scratch/zero-cost-toefl-tutor/issues/14-format-ielts-gt.md))

- **Crawled:** only Reading Section 3 passages, from English Wikipedia Good articles via `list=search&srsort=random` with `incategory:Good_articles -incategory:Living_people articletopic:stem|environment|society|history|education|psychology`. At least 700 words, cut at whole paragraphs to about 900. Text is kept unchanged; title, URL and CC BY-SA 4.0 licence are shown with it.
- **Generated by the LLM** from the official IELTS task descriptions: Reading Section 1–2 texts, Writing Task 1/2 prompts, Speaking Part 1/2/3 sets, Section 3 question sets (13 questions in 3 types), and Error Pattern drills (format matched to the pattern type).
- **No RAG, no embeddings.** Each prompt includes 1–2 official ielts.org examples per question type from a small hand-curated table.
- **Licence:** ielts.org samples are kept privately, unchanged, only as prompt examples. IDP, British Council and ETS material is never stored or crawled. Every question in the app is original.
- **Nightly job** in the app (`POST /api/jobs/generate`, secret header, called by n8n over the internal Docker network): crawl, top up every content kind to at least 5 unused items, generate 3 drills for each card due in the next 2 days.
- **Quality:** a second LLM call answers each question from the passage alone; mismatches and ambiguous questions are rejected. "Report bad question" retires a question.
- **Data model:** one `Passage` and one `Question` (`kind`, `status` active/retired, `source` attribution) replace `Article/Question` and `GeneratedArticle/GeneratedQuestion/GeneratedProgress`.
- Interim: the n8n workflow `english-tutor/crawler-wikipedia` (repo `n8n-automation-infra`) writes to `knowledge.english_tutor.passages` until the app is deployed. Then crawling moves into the app job, n8n only triggers it, nothing is imported, and that schema is dropped.

### Stack and hosting ([08](.scratch/zero-cost-toefl-tutor/issues/08-arsitektur-stack-0-cost.md), [02](.scratch/zero-cost-toefl-tutor/issues/02-stack-ai-gratis.md), [03](.scratch/zero-cost-toefl-tutor/issues/03-hosting-db-gratis.md))

| Area | Decision |
|---|---|
| App | Next.js 16 + Prisma 6 on the existing Oracle VPS (Pay-As-You-Go, no idle reclaim), as an `app` service in `n8n-automation-infra`'s `stack/docker-compose.yml`, bound to `127.0.0.1`, Node 24 LTS image |
| Access | Cloudflare Tunnel + Access (email OTP, 30-day session) at `tutor.saepulmalik.my.id`; the app's JWT login, bcrypt, signup and login pages are removed |
| Database | Own database `english_tutor` in the VPS's Postgres/pgvector container; fresh initial Prisma migration; `prisma migrate deploy` on container start |
| Local dev | Postgres container with `pgvector/pgvector:0.8.1-pg17`; dev never touches the VPS database |
| Deploy | `scripts/deploy.sh`: buildx arm64 image on the laptop → `docker save \| ssh oracle-n8n docker load` → `compose up -d app` |
| LLM | Groq `openai/gpt-oss-120b`; automatic fallback to Cloudflare Workers AI `@cf/openai/gpt-oss-120b` on 429/5xx; scoring calls run one at a time (8K TPM) |
| STT | Groq `whisper-large-v3` with word timestamps, called with `fetch` + `FormData`; no fallback, a failure means "try again" |
| AI code | LangChain only inside `lib/ai.ts` (`initChatModel`, provider and model from env); `@langchain/google-genai` and the provider picker in the UI are removed; API keys only in server env |
| TTS | Browser `speechSynthesis` |
| Audio | Not stored; only transcript, word timestamps and fluency metrics |
| Cache | None |
| Backups | Existing daily `pg_dumpall` on the VPS + daily rclone copy to Cloudflare R2 |
| Quota | Save Groq `x-ratelimit-remaining-*` headers; show today's remaining quota on the dashboard |
| Privacy | Groq Zero Data Retention turned on in the Groq console; Gemini free tier rejected because its inputs may be used and reviewed |

### Kept, changed and removed from v1 ([06](.scratch/zero-cost-toefl-tutor/issues/06-audit-kode-lama.md))

- **Kept:** the reading component with click-to-translate and TTS, dashboard charts and streak (new scales), shadcn UI components.
- **Changed:** reading question types to IELTS GT; writing to Task 1/Task 2 with IELTS criteria and Error Pattern tags; the generator into the nightly job; progress into band ranges per section.
- **Removed:** signup and multi-user, XP, TOEFL and IELTS Academic scales, API keys in the browser, the local heuristic grammar fallback (the Groq → Cloudflare fallback covers outages), standalone lessons (their explanations live in Feedback per Error Pattern), `UserMemory`, duplicate content models, `prisma/seed.ts` content.

### Dev tooling ([12](.scratch/zero-cost-toefl-tutor/issues/12-mcp-dev-tooling.md))

No project-level MCP. Context7 for library docs; the n8n MCP only while the SSH tunnel is open; `psql` through Bash for databases; Cloudflare setup by extending `setup-domain.sh` in `n8n-automation-infra`; UI checks with the built-in browser or Claude in Chrome.

## Testing Decisions

The v1 code has no tests. Approved with this PRD: test through the pure seams where a wrong answer silently corrupts the Weakness Profile, with no LLM or network in unit tests.

- Band estimate: raw→band interpolation and the ranges, including the Task 2 weighting.
- FSRS rating mapping: drill results and pattern occurrences → Again/Hard/Good, and card creation on first occurrence.
- Practice Session composer: lowest-section rule, the 2-day Writing swap, the 2-due-pattern cap, the first-week rotation.
- Fluency metrics from a fixed Whisper word-timestamp fixture.
- LLM output parsing: unknown Error Pattern IDs fall to `other`; malformed JSON is rejected, not stored.
- Quality check and stock top-up logic in the nightly job, with the LLM stubbed.

A good test checks behaviour through these module interfaces, not implementation details. End-to-end browser tests are out of the MVP.

## Out of Scope

- Business English and job-interview practice (separate maps later; work and tech topics may appear in Speaking prompts).
- TOEFL iBT and IELTS Academic as Target Exam.
- Multi-user, signup, commercial use.
- Native mobile apps (PWA only).
- Vocabulary cards per word (after the MVP).
- Storing audio recordings.

## Open Questions

Carried from the map's "Not yet specified"; none blocks starting implementation.

- **Listening:** needs two-speaker dialogues and monologues with varied accents (including Australian); TTS multi-speaker or LibriVox/VOA audio; whether it enters the MVP. Until then the Listening band shows "no data yet".
- **Pronunciation scoring** (25% of the Speaking band): without it a Speaking 7 can't be claimed. Per-word/phoneme scoring and real-time voice chat are deferred.
- **IELTS GT task types not yet placed:** Writing Task 1 letter register, Reading Section 1–2 practical texts, matching headings, completion word limits, Speaking Part 2 one-minute preparation. The session design reserves slots for them; their screens are designed during implementation.
- **Band estimate details:** the exact Reading raw→band interpolation table and calibrating LLM scores against scored samples.
- **Observability** beyond quota: error logs, uptime.
- **PWA shape:** offline behaviour and a daily practice reminder.
- **Long passages on a phone:** variant A's "text folded above the questions" was only tried with a short Section 1 text.

## Further Notes

- Planning record: `.scratch/zero-cost-toefl-tutor/map.md` and `issues/01–14`. Research details live on local branches `research/*`; several are not pushed yet.
- The infra repo `n8n-automation-infra` owns the compose stack, backups, domain setup and the crawler workflow JSON.
- Next.js 16 has breaking changes from older versions; read `node_modules/next/dist/docs/` before writing Next code (`AGENTS.md`).
- After approval: run `/to-tickets` on this PRD to cut implementation tickets.
