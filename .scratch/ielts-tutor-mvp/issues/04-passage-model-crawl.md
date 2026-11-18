# 04: Passage/Question model and crawling inside the app

**What to build:** Content lives in one Passage and one Question model (kind, status active/retired, source attribution), replacing the v1 Article/Question and Generated* models. A secret-header job endpoint crawls Reading Section 3 passages from English Wikipedia Good articles, and the Reading page can show a passage with its title, link and CC BY-SA 4.0 attribution.

**Blocked by:** 01

**Status:** done (2026-11-18, not committed yet)

- [x] Passage and Question replace Article, Question, GeneratedArticle, GeneratedQuestion and GeneratedProgress; kinds cover reading_s1/s2/s3, writing_t1/t2, speaking_p1/p2/p3
- [x] POST /api/jobs/generate rejects requests without the secret header
- [x] Crawl uses list=search with srsort=random and the query incategory:Good_articles -incategory:Living_people articletopic:stem|environment|society|history|education|psychology
- [x] Articles under 700 words are skipped; kept text is cut at whole paragraphs to about 900 words with trailing References/See also/etc. removed; text is never rewritten
- [x] Requests carry a Wikimedia-compliant User-Agent with contact details, are paced, and retry on 429 honouring Retry-After
- [x] Duplicate pages are not stored twice
- [x] Reading page renders a stored passage with attribution
- [x] Crawl cleanup and length cutting are unit-tested with a fixture

Source: `prd.md` v2 (approved 2026-11-18).
