# Pilihan hosting, database, dan storage gratis

Type: research
Status: resolved
Blocked by: 

## Question

Untuk Next.js 16 + Prisma single-user: bandingkan Oracle Cloud Always Free (VPS ARM), Vercel Hobby, Cloudflare Pages/Workers; database Postgres gratis (Neon, Supabase, Oracle self-host) atau D1/Turso; Upstash (Redis, Vector, QStash) dan Cloudflare R2 untuk audio. Per opsi: batas free tier, syarat kartu kredit dan risiko tagihan, kecocokan dengan Prisma dan Next 16, cold start, dan apakah bisa menjalankan n8n atau cron.

## Answer

Detail: branch lokal `research/hosting-db-gratis` (commit 9cc2386), file `research/hosting-db-gratis.md`. Branch ini **belum di-push** karena sesi tidak punya kredensial GitHub.

- **Rekomendasi A (utama):** satu VM Oracle Always Free A1 (2 OCPU/12 GB) menjalankan Next.js `next start`, Postgres + pgvector, dan n8n (Docker arm64). Audio disimpan di Cloudflare R2 (10 GB) atau Oracle Object Storage (20 GB). Tidak ada cold start, tidak ada pause, dan cron/n8n bebas.
- **Risiko A:** Oracle mengambil kembali VM yang idle (CPU p95, jaringan, dan memori semuanya <20% selama 7 hari). Mitigasinya: jaga beban dan `pg_dump` harian. Kartu kredit "tidak ditagih kecuali upgrade" menurut Oracle.
- **Rekomendasi B (serverless):** Vercel Hobby + Neon Free (pgvector, tanpa kartu, suspend setelah 5 menit idle) + R2 + Upstash QStash untuk jadwal. Kelemahannya: cron Vercel hanya 1x/hari dan n8n tidak bisa jalan.
- **Tidak direkomendasikan:** Supabase Free (pause setelah ±1 minggu, 500 MB DB). Juga Cloudflare Workers/D1/Turso (CPU 10 ms, D1 tanpa vector, Prisma masih preview).
- **Prisma 6 + pgvector:** butuh kolom `Unsupported("vector")` + raw SQL/TypedSQL. Schema sekarang sudah `postgresql`. Laporan subagent yang menyebut SQLite keliru.
- **Upstash:** jangan pasang kartu kredit karena akan otomatis pindah ke pay-as-you-go.
- **Belum terverifikasi:** apakah aktivasi R2 butuh kartu, dan batas ukuran Worker di Free.
