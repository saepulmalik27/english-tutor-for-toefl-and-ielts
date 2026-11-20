# Jadwal mingguan baru

Type: prototype
Status: resolved
Blocked by: 01, 04, 06, 07

## Question

Dengan Listening, Checkpoint, Quiz cepat, dan Materi, bagaimana minggu Learner tersusun di anggaran ±30 menit/hari (+5 menit quiz)? Putuskan tempat Listening di sesi harian, hari Checkpoint, kapan Materi dibaca, aturan section terendah yang baru, dan tampilan dashboard. Prototype di atas variant A.

## Answer

Diputuskan 2026-11-20 (usulan worker, dikonfirmasi Learner). Prototype tidak dibuat sebelum PRD; hal yang harus diuji (di bawah) menjadi pengecekan saat implementasi, di atas variant A. Bergantung pada [01](01-sumber-audio-listening.md), [04](04-checkpoint-mingguan.md), [06](06-quiz-cepat.md), [07](07-tipe-soal-gt.md).

**Jadwal default** (Writing bukan section terendah). Quick Quiz 5 menit tersedia setiap hari di luar sesi. Materi tidak punya slot sendiri: muncul di Feedback, terlipat sebelum drill Review, sebelum Writing/Speaking Part 2, dan di pustaka.

| Hari | Blok 1 | Blok 2 | Blok 3 | Total |
|---|---|---|---|---|
| Senin | Speaking 15 | Reading 9 | Review 6 | 30 |
| Selasa | Speaking 15 | Listening 9 (1 Part) | Review 6 | 30 |
| Rabu | Speaking 15 | Reading 9 | Review 6 | 30 |
| Kamis | Speaking 15 | Listening 9 (1 Part) | Review 6 | 30 |
| Jumat | Speaking 10 (Part 1) | Writing Task 1 20 | – | 30 |
| Sabtu | Checkpoint A: Listening 2 Part 16 + Reading 1 section 20 | Review 6 (maks 3 pattern) | – | ±42 |
| Minggu | Checkpoint B: Speaking mini-test 9 | Writing Task 2 40 | – | ±49 |

Rata-rata ±34 menit/hari (+ quiz); akhir pekan di atas 30 menit diterima Learner.

**Aturan section terendah:**
- Sumber band: Checkpoint bila ada dalam 3 minggu terakhir, kalau tidak band latihan.
- Slot tengah Senin–Kamis: default 2 Reading / 2 Listening; yang lebih rendah di antara keduanya mendapat 3, yang lain 1.
- Writing terendah: satu slot Senin–Kamis menjadi Writing Task 1 (20 menit, Review hari itu dilewati), jadi Writing 2×/minggu seperti v2.
- Speaking terendah: slot Review kosong menjadi extra Speaking; Jumat Speaking 15 + Task 1 20.
- Review: maks 2 pattern/hari, Sabtu maks 3 karena Jumat dan Minggu tanpa Review.
- Part Listening belum siap (TTS gagal) → blok Listening jatuh ke Reading.
- 7 hari pertama: rotasi v2 ditambah 2 blok Listening; Checkpoint pertama sesudahnya = baseline.
- Streak: hari dengan sesi atau Checkpoint selesai (WIB); Quick Quiz tidak dihitung.

**Dashboard:** kartu "Hari ini" (blok + alasan), band per section dari Checkpoint dengan band latihan kecil di bawahnya, grafik tren mingguan, tombol "Quiz 5 menit" + sisa stok, pengingat Checkpoint di akhir pekan, tautan materi belum dibaca untuk pattern dengan kartu aktif, sisa kuota Groq dan Azure.

**Beban malam:** ±0.6 Part Listening/malam; di VPS 2 OCPU TTS berjalan serial setelah generate teks, dengan batas waktu.

**Pengecekan saat implementasi (pengganti prototype):**
1. Composer sebagai fungsi murni: fixture 7 hari untuk setiap kasus section terendah, minggu pertama, hari terlewat, backlog Review Sabtu, fallback Listening → Reading.
2. Blok Listening di HP: audio sekali putar, soal terlihat selama audio, mengetik saat audio jalan, batas kata.
3. Checkpoint di HP: timer, tanpa Feedback, layar hasil panjang, Reading satu section penuh (passage panjang di HP).
4. Dashboard dua band (Checkpoint vs latihan): angka utama jelas.
5. Waktu nyata: satu minggu pemakaian dengan menit per blok dicatat; cukupkah 9 menit untuk 1 Part Listening.
6. Jumat tanpa Review dan Minggu ±49 menit: terasa berat atau tidak; kalau ya, Task 2 dan Task 1 bergantian mingguan.
