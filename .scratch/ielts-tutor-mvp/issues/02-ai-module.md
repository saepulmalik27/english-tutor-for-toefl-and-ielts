# 02: AI module with Groq and Cloudflare fallback

**What to build:** All LLM and speech-to-text calls go through one AI module configured from env. Chat uses LangChain's initChatModel with Groq gpt-oss-120b and switches automatically to Cloudflare Workers AI gpt-oss-120b on 429 or 5xx. Speech-to-text calls Groq whisper-large-v3 with word timestamps via plain fetch (no fallback; a failure means 'try again'). Groq's remaining-quota headers are saved so the dashboard can show them later. The three duplicate AI configurations and the Gemini dependency are removed.

**Blocked by:** None (can start immediately)

**Status:** done (2026-11-18, not committed yet)

- [x] Only the AI module imports LangChain; provider, model and keys come from env
- [x] A Groq 429/5xx on chat transparently retries on Cloudflare; covered by a test with stubbed providers
- [x] STT returns text plus word-level timestamps from Groq
- [x] Latest x-ratelimit-remaining-* values from Groq are persisted
- [x] Scoring-style calls can be run one at a time to stay under the 8K TPM limit
- [x] @langchain/google-genai and the multi-provider picker are removed; existing callers use the new module

Source: `prd.md` v2 (approved 2026-11-18).
