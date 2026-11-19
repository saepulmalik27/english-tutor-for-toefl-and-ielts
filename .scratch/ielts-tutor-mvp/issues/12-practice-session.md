# 12: Daily Practice Session (prototype variant A)

**What to build:** One tap starts today's 30-minute session in a fixed order: a short intro naming the lowest section, Speaking (15 min, one Part rotating P1 -> P2 -> P3), Reading (9 min, a Section 1-2 text or half a Section 3 passage), Review (6 min), then a summary with results per block, streak +1 and tomorrow's focus. A three-part progress bar sits on top. When Writing is the lowest section, Task 1 replaces Reading on 2 days a week. The first 7 days rotate evenly through every Skill, including one Task 1 and one Task 2. Onboarding is a welcome screen plus microphone permission.

**Blocked by:** 07, 10, 11

**Status:** done (2026-11-18, not committed yet)

- [x] Session order, screens and progress bar follow prototype variant A (kept on the prototype branch)
- [x] Composer applies the lowest-section rule, the twice-weekly Writing swap and the first-week rotation
- [x] Empty review slot becomes extra practice for the lowest section
- [x] Completing the session updates the streak in WIB
- [x] Old diagnostic onboarding is replaced by welcome + mic permission
- [x] Composer rules are unit-tested
- [x] Long Section 3 passages are checked on a phone; adjust the folded-text pattern if it doesn't work

Source: `prd.md` v2 (approved 2026-11-18).
