# Map: Zero-cost TOEFL Tutor

Label: wayfinder:map

## Destination

`prd.md` v2 yang terkunci untuk tutor IELTS General Training pribadi berbiaya nol (target 7 di setiap section, tes ±Mei 2027): Speaking Task dan kuis sebagai inti, Weakness-driven Personalization, stack/hosting gratis, dan pipeline bank soal sudah diputuskan. Map selesai saat tidak ada keputusan yang tersisa sebelum `/to-tickets` implementasi.

## Notes

- Domain: belajar bahasa Inggris untuk IELTS General Training (computer-delivered). Skornya dipakai untuk visa kerja Australia; Learner melamar kerja sebagai software engineer di Singapura dan Australia. **Target Exam pindah dari TOEFL iBT pada 2026-11-15** (lihat Target skor dan tenggat Learner). Business English/wawancara kerja adalah fase berikutnya.
- Map ini masih bernama `zero-cost-toefl-tutor` karena alasan historis; isinya sudah IELTS.
- Satu Learner saja (pemilik repo); tidak dikomersilkan. Lihat `GLOSSARY.md` untuk istilah.
- Melanjutkan aplikasi Next.js 16 + Prisma yang sudah ada (baca `node_modules/next/dist/docs/` sebelum menyentuh kode Next).
- Batasan biaya: 0 rupiah per bulan. Free tier yang minta kartu kredit boleh asal tidak ada tagihan otomatis. Rekaman suara sebaiknya tidak dipakai provider untuk training.
- Preferensi Learner: ±30 menit/hari (±50% speaking, 30% kuis, 20% review kesalahan); dipakai di HP dan laptop sebagai PWA.
- Fitur lama: pertahankan reading, writing, dashboard skor, streak; buang XP, signup/multi-user; lessons dilebur ke Feedback (dikonfirmasi lewat audit).
- Bank soal: crawler + scheduler (n8n/cron) boleh, patuh ToS/robots.txt, pemakaian pribadi. **Revisi setelah research sumber materi:** materi resmi ETS tidak boleh disimpan atau dipakai untuk RAG/generate, jadi jangkar gaya soal diambil dari *deskripsi tugas* resmi + passage berlisensi terbuka. Materi resmi ielts.org boleh disimpan privat untuk pemakaian pribadi tanpa diubah; materi IDP dilarang masuk retrieval system; soal aplikasi tetap orisinal (lihat Format IELTS General Training dan rubriknya). Perlu dikonfirmasi Learner di ticket pipeline bank soal.
- Learner sedang menyiapkan n8n self-host di VPS Oracle (cocok dengan research hosting). Sementara ini workflow dibuat di instance Sumopod (vault: `resources/n8n/instance n8n sumopod.md`). n8n jadi kandidat utama scheduler/crawler di ticket pipeline bank soal.
- REA MCP hanya untuk mengamati UX publik, tidak untuk menyalin aplikasi komersial. Pakai Context7 untuk dokumentasi library.
- Skill per sesi: `grilling` + `domain-modeling` untuk grilling; `research` untuk research; `prototype` untuk prototype.
- Catatan progres di vault: `projects/english-tutor/english-tutor.md`.

## Decisions so far

<!-- satu baris per ticket yang sudah resolved -->

- [Audit aplikasi lama: pertahankan, ubah, atau buang](issues/06-audit-kode-lama.md): pertahankan reading+TTS, dashboard, streak, shadcn; ubah onboarding, writing, generator, AI config ke band 1–6 dan Groq dari env; buang signup, XP, IELTS, API key di browser, model konten ganda; speaking belum ada sama sekali.
- [Format TOEFL iBT terbaru dan rubriknya](issues/01-format-toefl-ibt-terbaru.md): format 21 Jan 2026, band 1–6 (4=B2, 5=C1) dengan konversi minimum ke 0–120; semua rubrik 0–5; soal aplikasi harus orisinal karena ToS ETS. **Digantikan** oleh pindah ke IELTS GT.
- [Sumber materi soal dan cara crawling-nya](issues/04-sumber-materi-crawler.md): materi ETS dilarang disimpan atau dijadikan bahan AI; crawl hanya sumber terbuka (Wikipedia, VOA, LibriVox, Gutenberg, OpenStax); scheduler GitHub Actions atau n8n.
- [Rujukan sistem penilaian speaking dan personalisasi](issues/05-rujukan-speaking-scoring.md): nilai per aspek rubrik 2026 dengan metrik fluency dari kode, pronunciation "tidak dinilai" di MVP; FSRS-6 via ts-fsrs untuk pengulangan.
- [Pilihan AI gratis: LLM, STT, TTS, embedding](issues/02-stack-ai-gratis.md): Groq (Whisper + gpt-oss-120b) sebagai utama, Cloudflare Workers AI cadangan; Gemini free dibuang karena kebijakan data.
- [Pilihan hosting, database, dan storage gratis](issues/03-hosting-db-gratis.md): Oracle A1 all-in-one (Next + Postgres/pgvector + n8n) + R2 untuk audio; cadangan serverless Vercel + Neon + QStash.
- [Target skor dan tenggat Learner](issues/07-target-skor-tenggat.md): Target Exam pindah ke IELTS General Training (computer) untuk visa kerja Australia; target 7 per section (batas aman 6), dipantau dari section terendah; tes ±Mei 2027; baseline dari diagnostic. Menggantikan [Format TOEFL iBT terbaru dan rubriknya](issues/01-format-toefl-ibt-terbaru.md) dan sebagian rujukan speaking.
- [Format IELTS General Training dan rubriknya](issues/14-format-ielts-gt.md): format 2026 tidak berubah (paper dihapus; One Skill Retake diterima Home Affairs); 4 kriteria berbobot sama, Writing Task 2 berbobot 2×; band 7 ≈ 30/40 Listening dan ≈ 35/40 Reading GT; penilaian per kriteria + fluency + FSRS-6 tetap, tetapi skor Speaking per sesi; pronunciation = 25% band Speaking.
- [Arsitektur dan stack 0-cost](issues/08-arsitektur-stack-0-cost.md): Next.js di VPS Oracle yang sudah ada (compose `n8n-automation-infra`, Cloudflare Access sebagai satu-satunya login), DB `english_tutor` di Postgres/pgvector yang sama, deploy image arm64 dari laptop; Groq (gpt-oss-120b + Whisper via fetch) dengan fallback LLM ke Cloudflare; LangChain hanya di `lib/ai.ts`; audio tidak disimpan; tanpa cache; backup ke R2; sisa kuota dari header Groq. Membuka ticket pipeline bank soal dan MCP dev tooling.
- [Pipeline bank soal: crawler, RAG, scheduler](issues/11-pipeline-bank-soal.md): crawl hanya passage Reading Section 3 dari Good articles English Wikipedia (filter topik, ±900 kata, tanpa ditulis ulang); sisanya dibuat LLM; tanpa RAG/embedding, contoh ielts.org langsung di prompt; generate di muka tiap malam di aplikasi (n8n hanya trigger), stok minimal 5 per jenis, cek ulang oleh LLM kedua + tombol lapor; satu model `Passage`/`Question`. Crawler n8n sementara, pindah ke aplikasi tanpa import.
- [Model Weakness Profile dan pengulangan](issues/09-model-personalisasi.md): taksonomi tetap ±35 Error Pattern bertag kriteria IELTS; satu kartu FSRS-6 (ts-fsrs v6) per pattern dengan drill baru; Weakness Profile dihitung dari data (UserMemory dibuang); band per section berupa rentang; sesi harian Speaking 15 + Reading 9 + review 6 menit, Writing menggantikan Reading 2×/minggu kalau terendah; tanpa diagnostic, 7 hari pertama berotasi. Membuka ticket alur Practice Session.
- [MCP dan tooling untuk pengembangan](issues/12-mcp-dev-tooling.md): tanpa MCP level proyek; Context7 tetap; n8n MCP lewat tunnel SSH saja; database lewat psql/ssh, tanpa MCP; Cloudflare lewat `setup-domain.sh`; cek UI lewat built-in browser/Chrome; REA hanya mengamati UI familiarisation test IELTS computer-delivered dan Speak & Improve untuk prototype; Upstash tidak dipakai.
- [Alur Practice Session dan Speaking Task](issues/10-alur-practice-session.md): prototype 3 variant, dipilih A "langkah demi langkah": urutan tetap Speaking → Reading → Review, satu item per layar, Feedback bahasa Indonesia langsung setelah setiap jawaban (rentang band, kartu per kriteria, transkrip dengan kesalahan yang bisa diketuk). Mode ujian dan hub bebas urutan tidak dipilih.
- [Susun prd.md v2](issues/13-susun-prd-v2.md): `prd.md` v2 disetujui Learner; ikut diputuskan strategi unit test di seam murni, streak per sesi selesai dalam WIB, dan fallback grammar heuristik dibuang. **Map selesai**; berikutnya `/to-tickets`.

## Not yet specified

- Estimasi band: aturan dasarnya sudah diputuskan di [Model Weakness Profile dan pengulangan](issues/09-model-personalisasi.md); yang tersisa tabel interpolasi raw→band Reading GT yang persis dan kalibrasi skor LLM terhadap sampel berskor.
- Listening: perlu audio dialog dua orang dan monolog dengan aksen beragam (termasuk Australia), jadi butuh TTS multi-speaker atau audio LibriVox/VOA; dan apakah masuk MVP.
- Tipe tugas IELTS GT yang belum punya tempat di aplikasi: Writing Task 1 surat (register sesuai penerima), Reading GT Section 1–2 (teks praktis/pekerjaan), TFNG, matching headings, completion berbatas kata, dan Speaking Part 2 (1 menit persiapan, bicara 2 menit).
- Skor pronunciation per kata/fonem dan voice chat real-time dengan AI (ditunda dari MVP speaking). **Prioritas naik:** pronunciation = 25% band Speaking, jadi tanpa penilaiannya band Speaking 7 tidak bisa diklaim.
- Observabilitas di luar kuota (log error, uptime). Backup dan sisa kuota sudah diputuskan di [Arsitektur dan stack 0-cost](issues/08-arsitektur-stack-0-cost.md).
- Bentuk PWA: offline, notifikasi pengingat latihan harian.

## Out of scope

- Business English level: fase berikutnya, map terpisah setelah MVP IELTS.
- Latihan wawancara kerja (behavioral/teknis): map terpisah; di map ini cukup topik pekerjaan/teknologi sebagai topik soal Speaking ([Target skor dan tenggat Learner](issues/07-target-skor-tenggat.md)).
- TOEFL iBT sebagai Target Exam: diganti IELTS GT karena keraguan penerimaan format 2026 oleh Home Affairs ([Format TOEFL iBT terbaru dan rubriknya](issues/01-format-toefl-ibt-terbaru.md)).
- Multi-user, signup, komersialisasi: tutor hanya untuk satu Learner.
- Aplikasi native mobile: cukup PWA.
