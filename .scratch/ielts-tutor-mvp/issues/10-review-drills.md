# 10: Review drills for due Error Patterns

**What to build:** The nightly job prepares 3 fresh drills for every card due in the next 2 days, in a format matched to the pattern (fix-the-sentence or gap fill for GRA/LR, short text with TFNG/completion for Reading, a short speaking prompt for FC, a register rewrite for TA). The review block shows at most 2 due patterns per day, lowest retrievability first, and rates each card from the drill result.

**Blocked by:** 06

**Status:** done (2026-11-18, not committed yet)

- [x] Drills go through the same quality check as other generated questions
- [x] Review block picks at most 2 due patterns, lowest retrievability first; backlog drains 2 per day
- [x] If nothing is due the block reports that (session composer later fills the slot)
- [x] Drill results map 0-1 correct -> Again, 2 -> Hard, 3 -> Good; Easy is never automatic
- [x] Selection and rating mapping are unit-tested

Source: `prd.md` v2 (approved 2026-11-18).
