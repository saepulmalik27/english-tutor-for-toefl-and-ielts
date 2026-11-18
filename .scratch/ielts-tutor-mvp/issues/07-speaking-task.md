# 07: Speaking Task end to end

**What to build:** The Learner gets a generated IELTS Speaking Part 1, 2 or 3 set, prepares (Part 2 cue card with optional notes), records an answer with a visible timer, and plays it back. The audio is transcribed with word timestamps, fluency metrics are computed in code, and the LLM scores FC, LR and GRA on 0-9 against the public descriptors (Pronunciation shown as 'not scored yet'). The Feedback screen from prototype variant A shows the band range and one card per criterion, written in Indonesian. Audio is not stored.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] Speaking sets for P1/P2/P3 are generated and kept in stock like other kinds
- [ ] Recording works on phone over HTTPS and on laptop; playback before submit
- [ ] Fluency metrics (WPM, pauses >= 0.5 s, mean length of run, filler rate) computed from word timestamps and passed to the LLM as facts; unit-tested with a fixture
- [ ] Scores per criterion are produced before the Indonesian Feedback text, in a separate step
- [ ] Feedback shows a band range (+-1) and criterion cards; Pronunciation shows 'not scored yet'
- [ ] Only transcript, timestamps and metrics are saved; the audio is discarded
- [ ] Upload size stays within the server action body limit or the limit is raised deliberately

Source: `prd.md` v2 (approved 2026-11-18).
