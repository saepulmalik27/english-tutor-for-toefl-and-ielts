# PRD v3: Zero-cost IELTS General Training Tutor

Status: written 2026-11-20 from the resolved phase-2 tickets 01–09, waiting for the Learner's approval (ticket 10). Replaces PRD v2 (approved 2026-11-18), which is in git history.

Every decision comes from the wayfinder maps `.scratch/zero-cost-toefl-tutor/map.md` (v2) and `.scratch/ielts-tutor-phase2/map.md` (phase 2); the ticket behind each one is linked. Terms follow `GLOSSARY.md` (Learner, Target Exam, Skill, Error Pattern, Weakness Profile, Practice Session, Speaking Task, Feedback) plus the phase-2 terms Checkpoint, Material, Quick Quiz, Listening Part and Word limit.

## Problem Statement

The Learner, an Indonesian software engineer applying for jobs in Singapore and Australia, needs an IELTS General Training (computer-delivered) score of **7 in every section** (6 as the safe floor) for an Australian work visa, with the test around **May 2027**. Courses cost money, generic apps don't adapt to the Learner's own recurring mistakes, and speaking practice with feedback is the hardest part to get alone. The budget for infrastructure is **zero rupiah per month**.

The MVP (live at `tutor.saepulmalik.my.id` since 2026-11-19) covers Speaking, Reading Section 3, Writing and Error Pattern review. Phase 2 closes the gaps that stop the app from measuring and training all four sections: no Listening, no Pronunciation score (25% of the Speaking band), no exam-condition measurement of progress, no readable explanations beyond one-line hints, no Reading Section 1–2, and no way to practise in a five-minute gap.

## Solution

A private, single-Learner tutor (a PWA on phone and laptop) built around a **daily Practice Session of about 30 minutes**: Speaking first, then Reading, Listening or Writing, then a review of the Learner's own weakest Error Patterns. On the weekend a **Checkpoint** measures every section under exam conditions and drives the dashboard band and the weekly trend. A **Quick Quiz** of ten one-tap questions fills spare minutes. Every answer gets Feedback in Indonesian, linked to a **Material** that explains the Error Pattern or task structure. Mistakes are tagged with a fixed set of Error Patterns; each pattern is an FSRS-6 card that comes back as fresh drills. Content comes from an original question bank generated nightly by an LLM (Listening audio read by self-hosted TTS), with Reading Section 3 passages crawled from open-licence Wikipedia articles. Everything runs on the Learner's existing Oracle VPS and free AI tiers.

## User Stories

1. As the Learner, I open the app and see today's session, my lowest section, and why the session focuses on it.
2. As the Learner, I go through a fixed order (Speaking → middle block → Review), one item per screen, with a progress bar.
3. As the Learner, I get an IELTS Speaking Part 1, 2 or 3 task (rotating), prepare a Part 2 cue card for one minute with notes, then record with a visible timer and can play it back.
4. As the Learner, right after speaking I see my estimated Speaking band as a range, a card per criterion (FC, LR, GRA, and Pronunciation as a labelled estimate), fluency facts, my transcript with mistakes highlighted, and words that may be mispronounced; tapping a mistake shows the Error Pattern, the correction, an Indonesian explanation and a "Baca materi" link.
5. As the Learner, I answer Reading questions in IELTS GT formats (Section 1 everyday texts, Section 2 work texts, Section 3 long passages; TFNG, matching headings, completion with a word limit and others) and see right/wrong plus an Indonesian explanation after each one.
6. As the Learner, I listen once to an IELTS-style Listening Part (dialogue or monologue, British, Australian or American voices) and answer its ten questions while it plays.
7. As the Learner, I get up to two of my due Error Patterns as fresh drills (three each) in the review block, with the pattern's Material summary folded above them.
8. As the Learner, I write a Writing Task 1 letter every Friday and a Task 2 essay in the Sunday Checkpoint, and get Feedback per IELTS criterion with tagged Error Patterns; Task 1 Feedback names the register the recipient called for.
9. As the Learner, on the weekend I take a timed Checkpoint without Feedback until each part ends, then see results per section and my weekly trend.
10. As the Learner, I open a Quick Quiz of ten one-tap questions any time, see right/wrong with a short Indonesian explanation after each, and a score at the end.
11. As the Learner, I browse a library of Materials per Skill, most frequent patterns first, with unread ones marked, each showing three of my own recent mistakes.
12. As the Learner, I see a dashboard with my band range per section (from the Checkpoint, practice band beside it), a weekly trend chart, my lowest section, frequent Error Patterns, streak, Quick Quiz stock, and today's remaining Groq and Azure quota.
13. As the Learner, I can report a bad question or a Material; a question is retired immediately, a Material is marked "Dilaporkan, menunggu perbaikan".
14. As the Learner, I install the app on my phone, take a Quick Quiz offline, and get a Telegram reminder in the evening if today's session isn't done.
15. As the Learner, I reach the app at `tutor.saepulmalik.my.id` after an email one-time code, and stay signed in for 30 days.

## Implementation Decisions

### Target Exam and scoring (v2 [07](.scratch/zero-cost-toefl-tutor/issues/07-target-skor-tenggat.md), [14](.scratch/zero-cost-toefl-tutor/issues/14-format-ielts-gt.md); phase 2 [02](.scratch/ielts-tutor-phase2/issues/02-penilaian-pronunciation.md), [03](.scratch/ielts-tutor-phase2/issues/03-kalibrasi-skor.md))

- Target Exam: IELTS General Training, computer-delivered. No TOEFL or IELTS Academic scales.
- Speaking and Writing are scored per IELTS criterion on 0–9 by the LLM; fluency metrics come from Whisper word timestamps in code (unchanged).
- **Scorer prompts use the official ielts.org descriptor text for bands 5–8 per criterion, unchanged, kept privately** instead of the current hand-written criterion summaries. ([03](.scratch/ielts-tutor-phase2/issues/03-kalibrasi-skor.md))
- **Calibration check:** the four relevant ielts.org scored Writing scripts are kept privately and unchanged in `content/private/` (gitignored). A local script scores them (GT Task 1 band 5.5, GT Task 2 band 5, Academic Task 2 bands 5.5 and 7.5; overall bands only, no per-criterion scores) five times each and reports bias, MAE and spread. Prompts are fixed first; a global offset only if a consistent bias remains. No per-criterion offset, because no official per-criterion data exists. Rerun whenever the scorer prompt or model changes. Speaking has no official scored samples; only consistency is checked.
- **Pronunciation** ([02](.scratch/ielts-tutor-phase2/issues/02-penilaian-pronunciation.md)): primary Azure AI Speech Pronunciation Assessment on a Free F0 resource, `en-US` with prosody, (5 audio hours/month ≈ 10 minutes of answer audio a day, so a daily audio budget is enforced and Checkpoint audio has priority). Scripted assessment with the Whisper transcript as reference text, audio chunked at Whisper word gaps to ≤30 s per REST request, webm/opus remuxed to ogg. Microsoft states real-time PA data is not stored. Prosody exists only for en-US; IELTS requires no accent, so Azure's native-speaker scores are not read as bands directly. Band 7 is claimed only when band-6 features are consistent and at least one band-8 signal appears over several sessions; thresholds stay heuristic (no paid human rater). Fallback: `wav2vec2-lv-60-espeak-cv-ft` phoneme model on the VPS, run in the background, flags only "kata mungkin salah ucap", no band. Pronunciation is shown as a range labelled "estimasi"; connected speech and intonation for meaning stay "tidak dinilai". A Speaking band without a Pronunciation estimate keeps the "P belum dinilai" note.
- Feedback in Indonesian is written in a separate step after the scores are final (unchanged).

### Band estimates (v2 [09](.scratch/zero-cost-toefl-tutor/issues/09-model-personalisasi.md); phase 2 [03](.scratch/ielts-tutor-phase2/issues/03-kalibrasi-skor.md), [04](.scratch/ielts-tutor-phase2/issues/04-checkpoint-mingguan.md))

Always a range, never a single number. ielts.org publishes only **average** raw→band points that "vary slightly from test version to test version"; no complete official 0–40 table exists, and questions written by the LLM are not difficulty-calibrated.
- Reading GT: official points 15→4, 23→5, 30→6, 35→7, interpolated; 0 and 40 are extrapolated (comment in `lib/bands.ts` says so). ±0.5.
- Listening: official points 16→5, 23→6, 30→7, 35→8, interpolated, extrapolated to 0 and 40. ±0.5.
- Writing and Speaking: per-criterion averages as in v2, ±1; Writing may narrow to ±0.5 once the calibration check shows MAE ≤ 0.5.
- **Headline band per section = the Checkpoint** (mean of the last two Checkpoints for that section), labelled with its date; the practice band is shown smaller beside it.
- Lowest section = lowest midpoint, from Checkpoint bands when a Checkpoint exists in the last 3 weeks, otherwise practice bands.
- Weekly trend chart per section with target 7 and floor 6 lines, and a marker where the scorer prompt or model changed.
- The official result of the real test is entered by hand as a calibration point; no paid mock or human rater.

### Personalisation (v2 [09](.scratch/zero-cost-toefl-tutor/issues/09-model-personalisasi.md), unchanged)

- Fixed taxonomy of about 35 Error Patterns tagged with Skill and IELTS criterion; unknown IDs fall to `other`.
- One FSRS-6 card per pattern (`ts-fsrs` v6, default parameters, retention 0.9). Drills 0–1 → Again, 2 → Hard, 3 → Good. A pattern appearing again in practice or a Checkpoint → Again. Quick Quiz and reading a Material never rate a card.
- Weakness Profile computed from data on each request.

### Practice Session and weekly schedule (v2 [10](.scratch/zero-cost-toefl-tutor/issues/10-alur-practice-session.md); phase 2 [08](.scratch/ielts-tutor-phase2/issues/08-jadwal-mingguan.md))

Default week (Writing not the lowest section); Quick Quiz is outside the table. Weekend sessions run over 30 minutes by the Learner's choice:

| Day | Blocks | Minutes |
|---|---|---|
| Mon | Speaking 15 · Reading 9 · Review 6 | 30 |
| Tue | Speaking 15 · Listening 9 (one Part) · Review 6 | 30 |
| Wed | Speaking 15 · Reading 9 · Review 6 | 30 |
| Thu | Speaking 15 · Listening 9 (one Part) · Review 6 | 30 |
| Fri | Speaking 10 (Part 1) · Writing Task 1 20 | 30 |
| Sat | Checkpoint A: Listening 2 Parts 16 + Reading one section 20 · Review 6 (max 3 patterns) | ±42 |
| Sun | Checkpoint B: Speaking mini-test 9 + Writing Task 2 40 | ±49 |

- The Reading block rotates Section 1 → Section 2 → half a Section 3 passage. ([07](.scratch/ielts-tutor-phase2/issues/07-tipe-soal-gt.md))
- Lowest-section rule: the four Mon–Thu middle slots default to 2 Reading / 2 Listening; the lower of the two gets 3. If Writing is lowest, one Mon–Thu slot becomes Writing Task 1 (Review skipped that day). If Speaking is lowest, an empty Review slot becomes extra Speaking and Friday keeps Speaking at 15.
- Review: at most 2 due patterns per day, lowest retrievability first, 3 drills each; Saturday 3. Backlog drains as in v2.
- If a Listening Part isn't ready (TTS failed), the Listening block falls back to Reading.
- First 7 days: v2 rotation plus two Listening blocks; the first Checkpoint after it is the baseline.
- Streak counts a completed session or Checkpoint day in WIB; Quick Quiz does not count.
- Materials have no slot of their own: they appear in Feedback, folded above Review drills, before Writing and Speaking Part 2, and in the library.
- UI: prototype variant A. No separate prototype before implementation; during implementation check the composer fixtures, the Listening block and the Checkpoint on a phone, the two-band dashboard, and real minutes per block over one week of use. If Friday without Review or Sunday's ±49 minutes proves too heavy, Writing Task 1 and Task 2 alternate weekly.

### Checkpoint ([04](.scratch/ielts-tutor-phase2/issues/04-checkpoint-mingguan.md))

Reverses v2's "no separate diagnostic": daily-practice bands are measured with immediate Feedback, half passages and no timer, which steers practice but doesn't measure progress towards the test. A Checkpoint is a repeated weekly measurement, not a one-off diagnostic.
- Two parts on the weekend, each replacing that day's session (table above). Before Listening exists, Checkpoint A is Reading only.
- Timed per part, auto-submit at time-out, no Feedback until the part ends, no going back to an earlier part, Listening audio played once. Pausing is allowed only between parts. Full Feedback on the results screen.
- Speaking mini-test: three Part 1 questions, one Part 2 card with one-minute preparation, two Part 3 questions; one score per criterion from the combined transcript.
- No separate question bank: Checkpoint takes unused items from the same bank; Friday's nightly run makes sure the needed stock exists. Answers carry a `checkpointId` so Checkpoint and practice bands stay separate.
- New `Checkpoint` record: date, part A/B, band per section, scorer prompt version, duration.
- Missed: can be taken on Monday, then skipped until the next weekend.

### Listening ([01](.scratch/ielts-tutor-phase2/issues/01-sumber-audio-listening.md))

- **Script and questions:** the LLM writes the Part script (speaker segments with voice and accent) and ten questions in one JSON call, following the official Part 1–4 descriptions and question types (form/note/table completion with word limits, multiple choice, matching, short answer; plan/map labelling deferred to a second iteration). Code picks the Part, question types, topic and voices. Distractors follow IELTS habits (self-corrections, changed numbers, spelled names). Quality check in code, no second LLM call: completion answers appear verbatim in the script within the word limit, answer positions follow question order, choice answers are among the options, script length in range; retried like Reading.
- **Audio:** self-hosted TTS on the VPS: Kokoro-82M (Apache-2.0) for British and American voices, MeloTTS `EN-AU` (MIT) for Australian; two clearly different voices for Parts 1 and 3. Fallback Cloudflare `@cf/myshell-ai/melotts`; if both fail, the Part waits for the next night (no browser `speechSynthesis`). New `tts` container.
- **Storage:** reverses v2's "audio not stored" **only for system-generated TTS audio**: Opus 32 kbps files on a VPS Docker volume (≈0.6 GB until May 2027), served by the app behind Cloudflare Access. The script and voice settings in Postgres are the source of truth; files are a rebuildable cache, are not backed up, and are deleted 30 days after the Part is done. Not R2. The Learner's own recordings are still never stored.
- **Volume:** about 4 Parts a week (2 daily blocks + 2 in Checkpoint A), so ≈0.6 Part per night; ≈5K Groq tokens per Part, run serially.
- **Capacity risk:** the VPS is Oracle A1 **2 OCPU / 12 GB**, shared by Next.js, Postgres, n8n, the TTS container and the pronunciation fallback. TTS speed on 2 Ampere cores is **not measured yet** (see Open Questions). The MeloTTS AU voice is used if it is clearly understandable in that spike; otherwise fewer Parts use the AU accent. TTS runs after text generation in the same serial nightly queue, with a time limit.
- VOA/LibriVox dictation: deferred.

### Pronunciation pipeline ([02](.scratch/ielts-tutor-phase2/issues/02-penilaian-pronunciation.md))

- Runs after STT in the Speaking flow; the audio is held in memory only for the Azure call, then discarded (as in v2).
- Daily Azure audio budget tracked in `AiQuota`; over budget → the fallback flags only, no Pronunciation estimate that day.
- The wav2vec2 fallback runs in the background on the VPS (2 OCPU) and must be benchmarked before it is enabled; it never blocks the Speaking Feedback screen.
- The Learner accepted a card-backed Azure account upgraded to pay-as-you-go after 30 days; the F0 tier plus a $0 budget alert in Cost Management keep the cost at zero.
- For the background fallback the audio is held in a temporary file only until the fallback has run, then deleted; it is never kept as a recording.

### Material ([05](.scratch/ielts-tutor-phase2/issues/05-materi-struktural.md), resolved)

Reverses v2's "lessons folded into Feedback": a one-line hint is too short to learn the rule, but Material is tied to Error Patterns and task types, appears when the weakness or task appears, and shows the Learner's own mistakes, unlike the v1 general curriculum.
- 35 pattern Materials (one per taxonomy pattern, test fails if one is missing) + about 20 structure guides (Task 1 per register, Task 2 per essay type, Speaking Parts 1–3, Reading strategy per question type; Listening guides after Listening exists).
- Indonesian explanations; terms, examples and templates in English. All original; may paraphrase ielts.org descriptors; nothing copied from British Council, IDP or prep books.
- Written by Claude during development, checked by a local gpt-oss script (correct examples grammatical, wrong examples show the pattern, explanation matches examples); the Learner reviews only the Indonesian. Report button in the app.
- Source of truth: Markdown in `content/materials/patterns/<pattern-id>.md` and `content/materials/guides/<slug>.md`, upserted into a `Material` table by slug on container start; removed files → `retired`. Change = redeploy; no admin page.
- Pattern Material ≤ ±300 words (summary = `hint`, explanation, wrong → right examples, IELTS tips, three latest own mistakes). Guide ≤ ±600 words with an original annotated band-7 answer.
- Shown in Feedback ("Baca materi"), folded above Review drills, in the library `/dashboard/materi`, and before Writing Task 1/2 and Speaking Part 2. `lastReadAt` per Material; reading never rates FSRS. Not included in drill prompts.
- Batch 1: pattern Materials + data model, sync, library, Feedback/Review links, report. Batch 2: guides + links from Writing/Speaking.

### Quick Quiz ([06](.scratch/ielts-tutor-phase2/issues/06-quiz-cepat.md), resolved)

- 10 one-tap questions: 6 on the Learner's most frequent Error Patterns over 30 days + 4 IELTS vocabulary (collocation, paraphrase, word form; B2–C1, rotating IELTS topics). One per screen, ±30 s each, immediate right/wrong + 1–2 Indonesian sentences + Material link; score x/10. Reuses `QuestionFlow`.
- Wrong pattern answers add a pattern occurrence to the Weakness Profile but never rate or create FSRS cards. Not counted for the streak.
- New content kind `quiz` (`patternId` empty = vocabulary). Nightly stock: ≥5 unused per top-6 pattern, ≥20 vocabulary, ~10 per LLM call, same quality check. Each question is used once. No on-demand generation; the button shows remaining quizzes or "Stok habis, terisi lagi besok pagi".
- Per-word vocabulary cards stay deferred.

### Question bank (v2 [11](.scratch/zero-cost-toefl-tutor/issues/11-pipeline-bank-soal.md); phase 2 [07](.scratch/ielts-tutor-phase2/issues/07-tipe-soal-gt.md))

Unchanged from v2: Wikipedia Good-article crawl for Section 3 only, LLM-generated everything else, no RAG, 1–2 ielts.org examples per question type in prompts, ielts.org samples kept private and unchanged, every app question original, nightly job in the app triggered by n8n, second-LLM quality check, report retires a question, one `Passage`/`Question` model.

Phase 2 changes:
- **Section 3 quality check:** today a set is kept only if all 13 questions pass, so at ~95% per question only about half of the sets survive (2 of 5 passed on 2026-11-19; the per-passage reasons were not available when this was decided). Decided: keep a set when ≥11 of 13 pass, drop failed questions and renumber; if one type group loses more than 2, regenerate that group once in the same run. Store the last failure reason per passage (`lastGenerationError`) and per-question reasons in the job result.
- **Reading Section 1–2:** generated by the LLM with their questions in one call. Section 1: 2–3 short everyday texts (adverts, timetables, notices). Section 2: 2 work texts (job descriptions, staff policies, training material). 7 questions each, keep when ≥6 pass. Stock ≥5 per kind.
- **Matching headings screen:** the heading list (roman numerals) shows once, folded above the group, instead of as buttons on every question.
- **Completion:** the word limit from the instructions and a live word counter on the input; over-limit answers are accepted for submission and marked wrong with "melebihi batas kata" (`R.word-limit`).
- **Writing Task 1 register:** code picks the register in rotation (formal, semi-formal, informal) and stores it on the question; not shown before writing; TA Feedback names the expected register.
- **Speaking Part 2:** keeps the existing 1-minute preparation and notes; adds one short follow-up question generated with the cue card (lowest priority).
- **New content kinds:** `quiz`, `listening_p1`–`listening_p4`; `reading_s1`/`reading_s2` get generators.
- **Nightly load:** Groq 8K TPM is already often exhausted; every new kind runs serially, with Cloudflare fallback. Per-night additions: Quick Quiz (~3 quizzes/day), ~1 Section 1–2 text, ~0.6 Listening Part (+TTS), Friday Checkpoint stock. The job logs duration per step.

### PWA, reminders and observability ([09](.scratch/ielts-tutor-phase2/issues/09-pwa-observabilitas.md))

- Installable PWA: manifest, icons, minimal service worker (static assets and app shell). Risk to test first: Cloudflare Access blocks the manifest fetch; try `crossorigin="use-credentials"`, and only if install still fails, an Access bypass for the manifest and icons only.
- Offline: Quick Quiz only (one quiz cached with keys and explanations, answers queued in IndexedDB and sent once online). Everything else needs the server.
- Daily reminder: n8n sends a Telegram message from a private bot at 19:00 WIB only if today's session isn't complete (internal status endpoint with the job secret). No web push, no email.
- Nightly job alerts: n8n checks the job response and sends Telegram when the HTTP status fails, a content kind stays under target, or Section 3 sets fail; silent on full success. n8n Error Trigger for crashed workflows. Alert when the job runs over 60 minutes or is still running at 06:00 WIB (2-OCPU capacity).
- Uptime: n8n pings `http://app:3000/api/health` (app + DB) every 15 minutes over the internal network; two failures in a row → Telegram. External checker (UptimeRobot) only if the tunnel ever fails unnoticed.
- Error log: `docker logs` plus a small `AppError` table (time, place, message), pruned after 30 days; a non-zero 24-hour count goes into the daily Telegram summary. No Sentry or other new account.

### Stack and hosting (v2 [08](.scratch/zero-cost-toefl-tutor/issues/08-arsitektur-stack-0-cost.md), [02](.scratch/zero-cost-toefl-tutor/issues/02-stack-ai-gratis.md), [03](.scratch/zero-cost-toefl-tutor/issues/03-hosting-db-gratis.md); phase 2 changes marked)

| Area | Decision |
|---|---|
| App | Next.js 16 + Prisma 6 on the existing Oracle VPS (A1, **2 OCPU / 12 GB**, Pay-As-You-Go), as an `app` service in `n8n-automation-infra`'s compose stack, bound to `127.0.0.1`, Node 24 LTS |
| Access | Cloudflare Tunnel + Access (email OTP, 30-day session) at `tutor.saepulmalik.my.id` |
| Database | `english_tutor` in the VPS Postgres/pgvector container; `prisma migrate deploy` on start; Material sync on start |
| Local dev | `pgvector/pgvector:0.8.1-pg17` container |
| Deploy | `scripts/deploy.sh` (buildx arm64 → `docker save \| ssh` → `compose up -d app`) |
| LLM | Groq `openai/gpt-oss-120b`, fallback Cloudflare `@cf/openai/gpt-oss-120b` on 429/5xx; scoring and nightly calls serial (8K TPM) |
| STT | Groq `whisper-large-v3` with word timestamps; no fallback |
| Pronunciation | Azure AI Speech PA (F0, daily audio budget); fallback wav2vec2 espeak phoneme model on the VPS |
| AI code | LangChain only in `lib/ai.ts`; keys only in server env |
| TTS | Browser `speechSynthesis` for reading aloud (unchanged); Listening audio from a self-hosted `tts` container (Kokoro-82M, MeloTTS EN-AU), fallback Cloudflare MeloTTS |
| Audio | Learner recordings never stored. Generated Listening audio stored on a VPS volume as a rebuildable cache |
| Cache | None |
| Backups | Daily `pg_dumpall` + rclone to Cloudflare R2 (Listening audio excluded) |
| Quota | Groq rate-limit headers; Azure daily audio seconds; both on the dashboard |
| Notifications | n8n → Telegram bot (reminder, job alerts, uptime) |
| Privacy | Groq Zero Data Retention on; Gemini rejected. Azure real-time PA (Microsoft states data not stored); Listening TTS stays on the VPS |

### Kept, changed and removed

- **Kept from v2:** everything in the MVP (variant A flow, Error Patterns + FSRS, nightly job, band ranges, Section 3 crawl).
- **Changed in v3:** headline band from the Checkpoint; Speaking band can include a Pronunciation estimate; Section 3 quality check threshold; Reading block rotation; scorer prompts with official descriptor text.
- **Reversed v2 decisions:** no separate diagnostic → weekly Checkpoint; lessons folded into Feedback → Material; no audio stored → generated Listening audio stored.

### Dev tooling (unchanged)

No project-level MCP. Context7 for library docs; n8n MCP only through the SSH tunnel; `psql` for databases; UI checks with the built-in browser or Claude in Chrome.

## Testing Decisions

v2's pure-seam strategy stays: no LLM or network in unit tests. New seams:
- Band estimate: Listening curve from the official points; Checkpoint vs practice band choice; lowest section from Checkpoint when recent.
- Weekly composer: fixtures for each lowest-section case, first week, missed days, Saturday Review backlog, Listening fallback to Reading.
- Section 3 acceptance: ≥11/13 rule, group regeneration, renumbering.
- Section 1–2 and Listening generation parsing and quality check with the LLM stubbed.
- Quick Quiz: stock top-up, used-once marking, pattern events without FSRS ratings.
- Material sync: upsert by slug, retire on removal, report auto-close on hash change; every taxonomy pattern has a Material.
- Pronunciation: chunking Whisper words into ≤30 s requests; daily audio budget.
- Calibration check: a local script, not a unit test, rerun on scorer changes.

## Out of Scope

- Business English and job-interview practice (separate map).
- TOEFL iBT and IELTS Academic; multi-user, signup, commercial use; native apps.
- Storing the Learner's recordings.
- Per-word vocabulary cards (until Quick Quiz results show a need).
- Real-time voice chat with an AI.
- VOA/LibriVox dictation (later).

## Open Questions

All phase-2 decisions are made. What remains are pre-implementation spikes whose results can change parameters, not decisions:
- ~1 h TTS prototype on the 2-OCPU VPS: Kokoro and MeloTTS speed for one 7-minute Part, AU voice quality, Cloudflare MeloTTS `lang` values.
- Azure F0: latency per chunk, prosody on F0 without charge, behaviour when the quota runs out.
- wav2vec2 fallback speed on 2 OCPU.
- PWA install behind Cloudflare Access.
- Real minutes per block over one week (Fase 0 data).

## Further Notes

- Planning record: `.scratch/zero-cost-toefl-tutor/` (v2) and `.scratch/ielts-tutor-phase2/` (phase 2). Research notes live on local branches `research/*`; `research/sumber-audio-listening`, `research/penilaian-pronunciation` and `research/kalibrasi-skor` are not committed yet.
- Next.js 16 has breaking changes; read `node_modules/next/dist/docs/` before writing Next code (`AGENTS.md`).
- After approval: run `/to-tickets` on this PRD.
