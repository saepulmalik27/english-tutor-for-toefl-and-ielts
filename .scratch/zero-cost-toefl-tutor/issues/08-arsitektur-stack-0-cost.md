# Arsitektur dan stack 0-cost

Type: grilling
Status: resolved
Blocked by: 02, 03, 06

## Question

Kombinasi hosting, database, AI provider (LLM/STT/TTS/embedding), storage audio, dan cache yang dipakai, termasuk fallback saat kuota habis dan apa yang dibuang dari stack lama (mis. LangChain multi-provider).

## Answer

Diputuskan lewat grilling 2026-11-18. Fakta baru sejak research hosting: VPS Oracle (PAYG, jadi tidak kena reclaim idle) sudah jalan dengan Postgres/pgvector, n8n, dan Cloudflare Tunnel + Access di `saepulmalik.my.id` (repo `n8n-automation-infra`).

- **Hosting:** Next.js di VPS Oracle, sebagai service `app` di `stack/docker-compose.yml` repo `n8n-automation-infra`, host `tutor.saepulmalik.my.id` lewat tunnel yang sama. Vercel + Neon ditolak (DB suspend, dua akun baru).
- **Auth:** hanya Cloudflare Access (OTP email, sesi 30 hari). Login JWT, bcrypt, dan halaman login di aplikasi dibuang; container bind ke `127.0.0.1`. Risiko yang diterima: Access satu-satunya gerbang.
- **Database:** DB sendiri `english_tutor` di Postgres yang sama, terpisah dari `knowledge` (data privat lamaran). Tabel `passages` dari crawler pindah ke sini.
- **Migrasi:** migration awal baru (`prisma migrate dev --name init`); container menjalankan `prisma migrate deploy` saat start. DB production masih kosong.
- **Dev lokal:** Postgres container di laptop, image diganti ke `pgvector/pgvector:0.8.1-pg17` (sama dengan VPS). Dev tidak menyentuh DB VPS.
- **Deploy:** `scripts/deploy.sh` di repo ini: buildx arm64 di laptop → `docker save | ssh oracle-n8n docker load` → `compose up -d app`. Tanpa registry/CI. Syarat: WSL integration Docker Desktop aktif. Cadangan: build di VPS kalau emulasi terlalu lambat.
- **LLM:** Groq `openai/gpt-oss-120b`, otomatis pindah ke Cloudflare `@cf/openai/gpt-oss-120b` saat 429/5xx. Model Cloudflare terverifikasi ada dan tidak deprecated (2026-11-18).
- **STT:** Groq `whisper-large-v3` lewat `fetch` + `FormData`. Tanpa fallback; gagal = "coba lagi" (format audio Cloudflare Whisper belum terverifikasi).
- **Library AI:** LangChain dipertahankan **hanya** di `lib/ai.ts` untuk chat (`initChatModel`, provider/model dari env) agar bisa ganti ke provider yang tidak OpenAI-compatible. LangChain tidak punya antarmuka STT, jadi STT tidak lewat LangChain. `@langchain/google-genai` dibuang.
- **TTS:** `speechSynthesis` browser. Audio Listening diputuskan terpisah.
- **Embedding:** modelnya diputuskan di ticket pipeline bank soal; penyimpanannya pgvector.
- **Audio:** tidak disimpan di MVP. Yang disimpan hanya transkrip, word timestamps, dan metrik fluency.
- **Cache:** tidak ada (tanpa Redis/Upstash).
- **Backup:** `pg_dumpall` harian yang sudah ada (mencakup DB baru) + salinan harian ke R2 lewat rclone (perubahan di repo `n8n-automation-infra`).
- **Kuota:** simpan header `x-ratelimit-remaining-*` dari Groq; dashboard menampilkan sisa kuota hari ini. Tanpa alert eksternal.
- **Privasi:** menurut docs Groq, semua customer bisa mengaktifkan Zero Data Retention di console (Data Controls). Learner perlu mengaktifkannya sendiri.
