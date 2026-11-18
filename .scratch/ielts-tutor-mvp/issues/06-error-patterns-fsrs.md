# 06: Error Patterns and FSRS cards from Reading

**What to build:** Wrong Reading answers are tagged with Error Patterns from a fixed taxonomy of about 35 patterns (each tagged with a Skill and an IELTS criterion). Each pattern gets one FSRS card. The Weakness Profile is computed from the data on request and the dashboard shows the most frequent patterns.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Taxonomy is a fixed list covering GRA, LR, CC, TA/TR, FC and Reading; unknown IDs from the LLM fall to 'other' with the note kept
- [ ] First occurrence of a pattern creates a card; any later occurrence in practice records Again
- [ ] ts-fsrs v6 with version FSRS-6, default parameters, desired retention 0.9
- [ ] Weakness Profile (pattern frequency over 30 days plus retrievability) is computed by query, not stored; UserMemory and its per-submit LLM summary are removed
- [ ] Dashboard lists the top Error Patterns
- [ ] Rating rules and LLM output parsing (unknown ID -> other, malformed JSON rejected) are unit-tested

Source: `prd.md` v2 (approved 2026-11-18).
