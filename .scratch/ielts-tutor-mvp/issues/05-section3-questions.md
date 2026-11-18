# 05: Generate and answer Reading Section 3 questions

**What to build:** The nightly job turns each new passage into 13 questions across 3 IELTS GT question types chosen by the LLM, using 1-2 official ielts.org examples per type from a small hand-curated table (no RAG). A second LLM call answers each question from the passage alone and rejects mismatches or ambiguity. The job keeps at least 5 unused items per content kind. The Learner answers questions in the variant A flow (one per screen, immediate right/wrong with an Indonesian explanation) and can report a bad question, which retires it.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] Example table holds only ielts.org samples, stored unchanged; no IDP/British Council/ETS material
- [ ] Each accepted passage has 13 questions in 3 types with answer keys
- [ ] Quality check rejects questions the second call cannot answer to the key; rejected questions are never shown
- [ ] Stock top-up generates only what is below 5 unused per kind and spends no quota when full
- [ ] Answer flow follows prototype variant A: one question per screen, TFNG as three buttons, completion as input + check, Feedback immediately
- [ ] Report bad question sets the question to retired
- [ ] Quality check and top-up logic are unit-tested with the LLM stubbed

Source: `prd.md` v2 (approved 2026-11-18).
