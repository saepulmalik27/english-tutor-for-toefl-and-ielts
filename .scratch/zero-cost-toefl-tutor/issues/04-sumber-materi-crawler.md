# Sumber materi soal dan cara crawling-nya

Type: research
Status: resolved
Blocked by: 

## Question

Sumber materi latihan TOEFL iBT gratis mana yang boleh diambil untuk pemakaian pribadi (contoh resmi ETS, situs latihan gratis, artikel akademik berlisensi terbuka untuk passage Reading)? Per sumber: ToS/robots.txt, format, volume. Lalu bandingkan opsi crawler + scheduler: n8n self-host, GitHub Actions cron, Upstash QStash, Cloudflare Cron Triggers, termasuk biaya, keandalan, dan kemudahan.

## Answer

Detail: branch lokal `research/sumber-materi-crawler` (commit a53ff66, **belum di-push**), file `research/sumber-materi-crawler.md`.

- **Materi resmi ETS tidak boleh di-crawl.** ToS-nya hanya mengizinkan maksimal 3 salinan untuk pemakaian pribadi nonkomersial, dan melarang penyimpanan elektronik serta karya turunan. Jadi materi ini tidak boleh masuk DB, vector store, atau jadi bahan generate AI. Learner boleh berlatih memakainya secara manual. robots.txt yang longgar tidak mengalahkan ToS.
- **Situs latihan pihak ketiga** (mis. Magoosh, TOEFL Resources): ada yang melarang scraping secara eksplisit atau memblokir bot AI, dan tidak ada yang berlisensi terbuka. Jangan di-crawl.
- **Aman di-crawl:** Wikipedia/Simple English Wikipedia (CC BY-SA 4.0, lewat API/dump, User-Agent deskriptif; XML dump lama berhenti Januari 2027); VOA Learning English (konten produksi VOA public domain, kecuali bahan AP/Reuters; anggap arsip statis); LibriVox (public domain AS); Project Gutenberg (lewat mirror/katalog); karya pemerintah federal AS; OpenStax (sekarang CC BY-NC-SA, tetap boleh untuk pemakaian pribadi).
- **Prompt speaking:** tidak ada dataset prompt TOEFL berlisensi terbuka. Generate dengan AI dari *deskripsi tugas* ETS. Speak & Improve 2025 perlu registrasi, nonkomersial, dan hanya boleh dipakai dengan API LLM tanpa retensi data untuk training.
- **Scheduler:** rekomendasi GitHub Actions schedule → Neon Postgres (pgvector). Free di repo publik; di repo privat ada kuota bulanan. Workflow terjadwal di repo publik nonaktif setelah 60 hari tanpa aktivitas. Cloudflare Cron terlalu terbatas (CPU 10 ms). QStash tetap butuh endpoint. n8n di Oracle paling fleksibel tapi perawatannya paling berat dan ada risiko reclaim.
- **Koreksi:** subagent membaca schema di commit terakhir (SQLite). Working tree sudah `postgresql` tapi belum di-commit.
