# Pilihan AI gratis: LLM, STT, TTS, embedding

Type: research
Status: resolved
Blocked by: 

## Question

Bandingkan free tier Groq (LLM + Whisper STT), Cloudflare Workers AI (LLM, Whisper, embedding, TTS, Vectorize), dan Google Gemini (sebagai pembanding) per 2026: batas request/token/menit audio per hari, kualitas model untuk menilai jawaban bahasa Inggris, kebijakan data (apakah input dipakai untuk training), dan dukungan SDK dari Next.js server. Hitung apakah ±30 menit latihan/hari (±10 Speaking Task + kuis + Feedback) muat di free tier.

## Answer

Detail: branch `research/stack-ai-gratis` (commit 2e5b484, sudah di-push ke GitHub lewat SSH), file `research/stack-ai-gratis.md`.

- **Utama: Groq.** Free tier: `whisper-large-v3` 2K request dan 28.8K detik audio per hari; `openai/gpt-oss-120b` 200K token/hari dan 8K TPM. Llama sekarang tier Enterprise. Perjanjian Groq melarang training atas input/output, dan Zero Data Retention bisa diaktifkan (apakah tersedia di akun free: belum terverifikasi).
- **Cadangan: Cloudflare Workers AI.** 10K Neurons/hari, reset 00:00 UTC, dan langsung error saat habis (tanpa tagihan). Tidak training atas data pelanggan. Endpoint-nya OpenAI-compatible sehingga cocok dengan `ChatOpenAI` + `baseUrl` di `lib/ai.ts`. Vectorize free lebih dari cukup.
- **Gemini free tidak cocok untuk rekaman suara:** input dipakai Google dan bisa dibaca reviewer (pengecualian hanya untuk EEA/UK/CH). Default `gemini-2.5-flash` di `lib/ai.ts` akan di-route ulang mulai 2026-12-01.
- **Beban harian:** ±600 detik audio + ±50K token dalam ±15 request. Di Groq itu 2% kuota audio dan 25–50% kuota token. Penilaian harus berurutan agar tidak kena 429 TPM. Di Cloudflare dengan gpt-oss-120b pemakaiannya ±2.9K Neurons. Llama 70B atau Aura TTS akan menghabiskan kuota.
- **TTS:** `speechSynthesis` browser dulu; MeloTTS Cloudflare kalau perlu file audio.
- **Next.js:** body server action default 1 MB. Opus 60 detik (±0.5 MB) muat; bitrate lebih tinggi perlu menaikkan `serverActions.bodySizeLimit`.
- **Belum terverifikasi:** gpt-oss-120b di plan free Cloudflare, format audio untuk Cloudflare Whisper, dan kualitas feedback berbahasa Indonesia (belum diuji).
