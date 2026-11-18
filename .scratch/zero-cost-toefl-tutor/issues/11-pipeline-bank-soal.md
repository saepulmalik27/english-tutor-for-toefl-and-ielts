# Pipeline bank soal: crawler, RAG, scheduler

Type: grilling
Status: resolved
Blocked by: 04, 08

## Question

Sumber mana yang di-crawl, di mana crawler dan scheduler berjalan (n8n atau cron), bagaimana soal disimpan dan di-embed, dan bagaimana RAG dipakai untuk membuat soal baru yang mirip contoh resmi serta menjaga kualitasnya?

## Answer

Diputuskan lewat grilling 2026-11-18. Query Wikipedia di bawah diuji langsung ke API pada tanggal yang sama.

- **Cakupan crawl:** hanya passage Reading Section 3. Teks Section 1–2, prompt Writing Task 1/2, dan Speaking Part 1/2/3 dibuat LLM dari deskripsi tugas resmi IELTS. Listening di luar ticket ini (masih "Not yet specified").
- **Sumber:** English Wikipedia (bukan Simple English, yang setara A2–B1; VOA juga terlalu mudah). Pemilihan lewat `list=search`, `srsort=random`, query `incategory:Good_articles -incategory:Living_people articletopic:stem|environment|society|history|education|psychology` (±8.4K artikel; tanpa filter topik hasilnya didominasi lagu, game, TV, jalan). Minimal 700 kata, dipotong di paragraf utuh ±900 kata. Baris `simplewiki` yang sudah tersimpan dihapus.
- **Teks:** disimpan apa adanya, tanpa ditulis ulang LLM. Judul, URL, dan lisensi CC BY-SA ditampilkan bersama passage.
- **Tanpa RAG/embedding:** passage utuh muat di satu prompt, dan pemilihan passage cukup SQL. Prompt memuat 1–2 contoh ielts.org per tipe soal dari tabel kecil yang dikurasi manual. Ini juga menjawab embedding yang ditunda ticket 08: tidak ada.
- **Lisensi (dikonfirmasi Learner):** sampel ielts.org disimpan privat tanpa diubah, hanya sebagai contoh di prompt. Materi IDP, British Council, dan ETS tidak pernah disimpan atau di-crawl. Semua soal aplikasi orisinal.
- **Generate:** di muka, setiap malam, di dalam aplikasi (`POST /api/jobs/generate`, header secret, lewat jaringan Docker internal `http://app:3000`, tidak lewat Access). n8n hanya memicu. Prompt, format JSON, fallback, dan pemeriksaan kualitas memakai `lib/ai.ts` dan bisa diuji.
- **Stok:** job mengisi sampai minimal 5 item belum terpakai per jenis (reading S1/S2/S3, writing T1/T2, speaking P1/P2/P3); tidak memakai kuota kalau stok penuh.
- **Section 3:** 13 soal per passage dari 3 tipe soal yang dipilih LLM sesuai passage.
- **Kualitas:** setiap soal dijawab ulang oleh panggilan LLM kedua hanya dari passage; ditolak kalau tidak cocok dengan kunci atau ambigu. Tombol "laporkan soal jelek" di aplikasi me-retire soal.
- **Model data:** satu `Passage` + satu `Question` (`kind`, `status` active/retired, atribusi `source`) menggantikan `Article/Question` dan `GeneratedArticle/GeneratedQuestion`. Kaitan ke Error Pattern dan FSRS diputuskan di ticket model personalisasi.
- **Crawler:** workflow n8n `english-tutor/crawler-wikipedia` (repo `n8n-automation-infra`) tetap jalan sampai aplikasi deploy, dengan sumber diganti ke query di atas, menulis ke `knowledge.english_tutor.passages`. Setelah aplikasi deploy, crawling pindah ke job aplikasi, n8n hanya trigger, **tanpa import**, dan schema `english_tutor` di DB `knowledge` di-drop.
