# Format IELTS General Training dan rubriknya

Type: research
Status: resolved
Blocked by: 

## Question

Seperti apa format IELTS General Training computer-delivered yang berlaku per 2026? Yang dibutuhkan:
- tipe tugas per section (Listening, Reading GT, Writing GT Task 1 surat dan Task 2 esai, Speaking Part 1–3) beserta durasi dan jumlah soal;
- band descriptor publik Writing dan Speaking (empat kriteria per section) serta tabel konversi raw score → band untuk Listening dan Reading GT;
- materi latihan resmi gratis (IELTS.org, British Council, IDP; misalnya sampel soal dan jawaban berskor) beserta lisensinya, yaitu apakah boleh disimpan atau dipakai sebagai bahan RAG/generate, mengikuti preseden ticket Sumber materi soal dan cara crawling-nya.

Juga petakan bagian mana dari ticket Rujukan sistem penilaian speaking dan personalisasi (penilaian per aspek, metrik fluency, FSRS) yang tetap berlaku untuk Speaking IELTS. Sumber utama: situs resmi IELTS.

## Answer

Detail: branch lokal `research/format-ielts-gt` (commit 3df29a5, **belum di-push** karena tidak ada kredensial), file `research/format-ielts-gt.md`.

- **Format (per 2026-11-15, tidak ada perubahan tugas/rubrik sejak descriptor Writing Mei 2023):** Listening ±30 menit, 4 part, 40 soal, audio sekali, aksen termasuk Australia; di komputer hanya 2 menit cek di akhir. Reading GT 60 menit, 3 section, 40 soal (Section 1 teks sehari-hari, Section 2 dua teks pekerjaan, Section 3 satu teks panjang), 8 tipe soal termasuk TFNG, matching headings, dan completion berbatas kata. Writing GT 60 menit: Task 1 surat ≥150 kata dengan 3 bullet dan register sesuai penerima, Task 2 esai ≥250 kata; Task 2 berbobot 2×. Speaking 11–14 menit tatap muka: Part 1 (4–5 menit), Part 2 (1 menit persiapan, bicara 2 menit), Part 3 diskusi abstrak.
- **Rubrik:** Writing = TA/TR, CC, LR, GRA; Speaking = FC, LR, GRA, P. Bobot sama, skala 0–9, deskriptor publik di ielts.org. Penguji Speaking menilai keseluruhan tes, bukan per pertanyaan.
- **Raw → band (rata-rata resmi, bervariasi per versi):** Listening band 7 ≈ 30/40, band 6 ≈ 23. **Reading GT band 7 ≈ 35/40**, band 6 ≈ 30 (lebih ketat dari Academic). Tidak ada tabel 0–40 resmi.
- **Perubahan 2026:** tes kertas dihapus mulai pertengahan 2026, diganti opsi Writing on Paper. Hasil on computer biasanya 1–2 hari. **One Skill Retake** (sekali, dalam 60 hari, hanya tes on computer) diterima Home Affairs untuk IELTS GT "for eligible visas". IELTS Online tidak diterima untuk visa.
- **Lisensi:** ielts.org mengizinkan salin/unduh/cetak untuk pemakaian pribadi nonkomersial dengan kredit; dilarang modifikasi, republish, komersial. Tidak ada klausul AI. IDP melarang "store in retrieval system", jadi jangan di-crawl atau masuk RAG. Ketentuan British Council belum terverifikasi (situs tidak bisa diakses). Descriptor dan sampel ielts.org boleh disimpan privat dan dipakai sebagai konteks prompt penilai. Soal di bank soal tetap orisinal. Crawler tidak diperlukan.
- **Materi gratis resmi:** sampel per tipe soal Listening/Reading GT (audio, transcript, answer key), dua sampel Writing GT berskor (band 5.5 dan 5 saja), sampel Speaking tanpa skor.
- **Pemetaan ticket 05:** penilaian per kriteria oleh LLM, metrik fluency dari word timestamps (tambah repetisi dan self-correction untuk FC), dan FSRS-6 tetap berlaku. Yang berubah: skor dihitung per sesi, bukan per item. Kalibrasi sampel ETS diganti descriptor IELTS, karena sampel berskor sangat sedikit. Pronunciation "tidak dinilai" lebih berisiko karena bobotnya 25% band Speaking. Part 2 adalah sumber metrik fluency terbaik. Part 3 bisa giliran demi giliran dengan pertanyaan lanjutan dari LLM.
