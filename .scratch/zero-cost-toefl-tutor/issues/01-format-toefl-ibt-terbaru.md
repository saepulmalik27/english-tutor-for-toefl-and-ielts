# Format TOEFL iBT terbaru dan rubriknya

Type: research
Status: resolved
Blocked by: 

> **Digantikan (2026-11-15):** Target Exam pindah ke IELTS General Training (lihat [Target skor dan tenggat Learner](07-target-skor-tenggat.md)). Format TOEFL di bawah tidak lagi dipakai; penggantinya [Format IELTS General Training dan rubriknya](14-format-ielts-gt.md). Prinsip "soal harus orisinal karena ToS penerbit" tetap berlaku.

## Question

Seperti apa format TOEFL iBT yang berlaku per 2026 (sejak perombakan Januari 2026)? Butuh: daftar section dan jenis tugas (terutama Speaking dan tipe soal kuis Reading/Listening/Writing), durasi, skala skor baru dan konversinya ke skala lama 0–120, rubrik penilaian Speaking & Writing resmi, serta materi latihan resmi gratis dari ETS (URL dan lisensinya). Sumber utama: situs resmi ETS.

## Answer

Detail: branch lokal `research/format-toefl-ibt-terbaru` (commit b5f94c6, **belum di-push**), file `research/format-toefl-ibt-terbaru.md`.

- **Berlaku sejak 21 Jan 2026.** Urutan section: Reading → Listening → Writing → Speaking, ±2 jam tanpa istirahat. Reading dan Listening adaptif dua tahap; Writing dan Speaking sama untuk semua peserta.
- **Tipe tugas:**
  - Reading (50 item, ±30 menit): Complete the Words, Read in Daily Life, Read an Academic Passage.
  - Listening (47 item, ±29 menit): Listen and Choose a Response, Conversation, Announcement, Academic Talk.
  - Writing (12 item, 23 menit): Build a Sentence ×10, Write an Email (7 menit), Academic Discussion (10 menit).
  - Speaking (11 item, 8 menit): Listen and Repeat ×7 (8–12 detik), Take an Interview ×4 (45 detik).
- **Skor:** band 1–6 dengan langkah 0.5. Overall = rata-rata 4 section, dibulatkan ke 0.5. Selaras CEFR (4 = B2, 5 = C1, 6 = C2). Selama transisi 2 tahun, laporan skor juga menampilkan padanan 0–120.
- **Konversi minimum band → total lama:** 6 = 114+, 5.5 = 107+, 5 = 95+, 4.5 = 86+, 4 = 72+, 3.5 = 58+, 3 = 44+. Tabel per section 0–30 ada di file.
- **Rubrik:** Email, Academic Discussion, Listen and Repeat, Interview semuanya 0–5 (diringkas di file). Tidak ada tabel resmi poin → band, jadi estimasi band di aplikasi harus diberi label "perkiraan".
- **Materi resmi gratis:** Test Overview PDF (sampel tugas, jawaban bernilai, rubrik), Practice Test 1 PDF (format 2026), akun TestReady gratis dengan satu tes penuh yang dinilai AI. Halaman latihan lama ETS masih format pra-2026.
- **Lisensi:** pemakaian pribadi saja, maksimal 3 salinan, tanpa perubahan atau karya turunan. Aplikasi harus membuat soal orisinal berformat sama dan memparafrasekan rubrik. Ini lebih penting lagi kalau repo GitHub publik. (Konsisten dengan ticket Sumber materi soal dan cara crawling-nya.)
- **Belum terverifikasi:** selisih jumlah item/durasi antar sumber, apakah Interview punya waktu persiapan, porsi waktu Build a Sentence, apakah ada penilai manusia, lokasi audio Practice Test, dan tabel konversi berbeda di halaman ETS China.
