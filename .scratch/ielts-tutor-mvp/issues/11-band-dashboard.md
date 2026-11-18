# 11: Band estimates and dashboard

**What to build:** The dashboard shows an estimated band range per section, the lowest section, the top Error Patterns, the streak and how much of today's Groq quota is left. Reading uses the last 80 questions mapped through IELTS GT raw-to-band points; Writing and Speaking average per-criterion scores over the last 5 tasks with Task 2 weighted double; Listening shows 'no data yet'. The v1 TOEFL/IELTS Academic charts and fields are replaced.

**Blocked by:** 05, 07, 09

**Status:** ready-for-agent

- [ ] Reading band: last 80 questions, interpolated between 35/40 ~ 7 and 30/40 ~ 6, shown +-0.5
- [ ] Writing/Speaking band: last 5 tasks, Task 2 weighted 2x, shown +-1
- [ ] Lowest section = lowest midpoint; Listening excluded until it exists
- [ ] Streak counts days with a completed session in WIB (Asia/Jakarta), not logins
- [ ] Remaining Groq quota from the saved headers is shown
- [ ] Band estimation is unit-tested

Source: `prd.md` v2 (approved 2026-11-18).
