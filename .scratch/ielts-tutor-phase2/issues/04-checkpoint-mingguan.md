# Checkpoint mingguan untuk profiling

Type: grilling
Status: resolved
Blocked by: 03

## Question

Usulan Learner: tes profil seminggu sekali. Putuskan: hari dan durasinya (menggantikan sesi harian atau tambahan), isinya (mis. Reading berwaktu, Speaking Part 2, Writing Task 2, nanti Listening), apakah berwaktu dan tanpa Feedback sampai selesai seperti ujian, bagaimana hasilnya dipakai (band utama di dashboard vs latihan harian, campuran?), grafik tren mingguan, checkpoint pertama sebagai baseline, dan apakah soal checkpoint disisihkan dari stok harian. PRD v2 menolak diagnostic terpisah; catat kenapa keputusan itu berubah.

## Answer

Diputuskan 2026-11-20 (usulan worker, dikonfirmasi Learner). Dasar angka: [ticket 03](03-kalibrasi-skor.md).

**Kenapa membalik PRD v2 (tanpa diagnostic terpisah):** v2 menolak diagnostic karena minggu pertama yang berotasi sudah memberi data band. Tetapi band latihan harian diukur dalam kondisi yang bukan ujian: Feedback setelah setiap soal, separuh passage, tanpa batas waktu. Angka itu bagus untuk mengarahkan latihan, tetapi bukan ukuran kemajuan menuju tes Mei 2027. Checkpoint bukan diagnostic sekali di awal; ia pengukuran berulang dalam kondisi mirip ujian yang menghasilkan tren mingguan.

**Batas kepercayaan (ticket 03):** tabel raw→band resmi hanya rata-rata dan soal buatan LLM tidak dikalibrasi tingkat kesulitannya; sampel Writing berskor hanya 4, Speaking tidak ada. Angka absolut tetap rentang; tren lebih bisa dipercaya selama prompt dan model penilai tidak berubah.

- **Hari dan durasi:** dua bagian di akhir pekan, masing-masing **menggantikan** sesi hari itu dan dihitung untuk streak.
  - **Checkpoint A, Sabtu (±42 menit):** Listening 2 Part (±16 menit, bergiliran Part 1+2 / 3+4) + Reading satu section penuh (20 menit, bergiliran S1 → S2 → S3) + Review 6 menit (maks 3 pattern) sesudahnya. Sebelum Listening tersedia: Reading saja + Review.
  - **Checkpoint B, Minggu (±49 menit):** Speaking mini-test (3 pertanyaan Part 1, satu Part 2 dengan persiapan 1 menit, 2 pertanyaan Part 3; ±9 menit) + Writing Task 2 penuh 40 menit (Task 2 berbobot 2×). Task 1 diukur dari latihan Jumat.
- **Kondisi ujian:** berwaktu per bagian (habis = kirim otomatis), tanpa Feedback sampai bagian selesai, tidak bisa kembali ke bagian sebelumnya, audio Listening diputar sekali; jeda hanya antarbagian. Feedback lengkap di layar hasil.
- **Pemakaian hasil:** band utama per section di dashboard = rata-rata 2 Checkpoint terakhir untuk section itu, berlabel tanggal; band latihan tampil kecil di bawahnya. Aturan section terendah memakai band Checkpoint bila ada Checkpoint dalam 3 minggu terakhir, kalau tidak band latihan.
- **Rentang:** Reading/Listening: raw → /40 → titik resmi, ±0.5. Writing/Speaking: ±1 sampai cek kalibrasi ticket 03 (Writing boleh ±0.5 bila MAE ≤ 0.5). Speaking memakai estimasi P dari [ticket 02](02-penilaian-pronunciation.md) bila ada, kalau tidak bercatatan "P belum dinilai".
- **Tren:** grafik garis mingguan per section (titik tengah + pita rentang), garis target 7 dan batas 6, penanda saat prompt/model penilai berubah.
- **Baseline:** Checkpoint pertama = akhir pekan pertama setelah 7 hari rotasi, ditandai "baseline".
- **Kalibrasi Learner:** skor resmi (tes asli) dicatat manual sebagai titik kalibrasi dan selisihnya ke estimasi aplikasi ditampilkan. Tanpa mock berbayar.
- **Stok soal:** tanpa bank terpisah; Checkpoint mengambil item belum terpakai dari bank yang sama, dan nightly job Jumat malam memastikan stoknya cukup (1 section Reading sesuai giliran, 2 Part Listening, 1 set Speaking mini-test, 1 Task 2). Jawaban/attempt Checkpoint memakai `checkpointId` agar band Checkpoint dan latihan terpisah.
- **Error Pattern:** kesalahan di Checkpoint dicatat seperti latihan biasa: kejadian pattern masuk Weakness Profile, pattern yang muncul lagi → Again di FSRS.
- **Penilaian Speaking:** satu skor per kriteria dari transkrip gabungan mini-test (IELTS menilai keseluruhan); STT per rekaman; audio Checkpoint mendapat kuota Azure lebih dulu.
- **Data:** tabel `Checkpoint` (tanggal, bagian A/B, band per section, versi prompt penilai, durasi).
- **Terlewat:** boleh dikerjakan Senin; setelah itu dilewati sampai akhir pekan berikutnya.
- **Beban AI:** Speaking ±5 rekaman STT + 2 panggilan skor/Feedback, Writing 2 panggilan, di siang hari; tambahan malam hanya stok Jumat.
- Istilah `Checkpoint` masuk `GLOSSARY.md` di ticket 10.
