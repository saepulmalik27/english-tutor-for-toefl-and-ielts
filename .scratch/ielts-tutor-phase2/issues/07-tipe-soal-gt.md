# Tipe soal IELTS GT yang belum ada

Type: grilling
Status: resolved
Blocked by: 

## Question

Audit dulu apa yang sudah jalan setelah MVP, lalu putuskan urutan dan bentuk layar untuk: teks praktis Reading Section 1–2, matching headings, completion berbatas kata, register surat Writing Task 1, dan persiapan 1 menit Speaking Part 2. Sertakan perbaikan tingkat gagal quality check Reading Section 3 (3 dari 5 passage gagal pada run 2026-11-19) jika berkaitan dengan format tipe soal.

## Answer

Diputuskan 2026-11-20 (usulan worker, dikonfirmasi Learner).

**Audit setelah MVP (kode di `main`, c595aa4):**

| Tipe | Status | Bukti |
|---|---|---|
| Reading Section 1–2 (teks praktis/pekerjaan) | **Belum ada.** Enum `reading_s1`/`reading_s2` ada dan dihitung di `lib/progress.ts`, tetapi tidak ada generator, stok, atau tempat di sesi; blok Reading harian hanya mengambil passage Section 3. | `lib/jobs/nightly.ts`, `lib/session/reading.ts` |
| Matching headings | **Ada** sebagai tipe Section 3; paragraf berhuruf A, B, C. Daftar heading tampil ulang sebagai tombol di setiap soal. | `lib/questions/pipeline.ts`, `components/QuestionFlow.tsx` |
| Completion berbatas kata | **Ada.** Kunci dicek ≤ batas kata saat generate; jawaban yang melebihi batas ditandai `R.word-limit`. Tanpa penghitung kata di layar. | `lib/questions/answers.ts`, `lib/patterns/cards.ts` |
| Register surat Writing Task 1 | **Sebagian.** Generator menyebut penerima; penilai TA memeriksa register. Tanpa rotasi register dan belum ada panduan struktur. | `lib/questions/prompts.ts`, `lib/writing/score.ts` |
| Speaking Part 2, persiapan 1 menit | **Ada.** Timer 60 detik + catatan, rekam maks 2 menit. Tanpa pertanyaan lanjutan. | `components/SpeakingTask.tsx` |

**Gagal quality check Section 3 (2 dari 5 lolos pada 2026-11-19):** alasan per passage tidak bisa dipastikan (ada di respons JSON job ke n8n, tidak bisa diakses saat audit). Bukti tidak langsung: set hanya disimpan kalau ke-13 soal lolos (`accepted.length === 13`); dengan 95% lolos per soal, peluang satu set ≈ 0.95¹³ ≈ 51%, cocok dengan 2 dari 5. Catatan vault 2026-11-18: sisa kegagalan hampir selalu soal format (label matching, beberapa gap); dua perbaikannya sudah ada di kode. Jadi sebagian terkait format tipe soal, tetapi pengali terbesarnya aturan 13/13.

- **Urutan implementasi:** (1) QC Section 3 + catatan alasan gagal; (2) Reading Section 1–2; (3) register Task 1; (4) layar matching headings; (5) penghitung kata completion; (6) pertanyaan lanjutan Part 2.
- **QC Section 3:** set diterima bila ≥ 11 dari 13 soal lolos; soal gagal dibuang dan nomor diurut ulang; grup matching tetap memakai daftar opsi lengkap. Grup tipe yang kehilangan > 2 soal dibuang dan di-generate ulang sekali di run yang sama (grup itu saja). Retire setelah 3 kali gagal (tetap). Alasan gagal terakhir disimpan per passage (`lastGenerationError`) dan per soal di hasil job, untuk `psql` dan notifikasi [ticket 09](09-pwa-observabilitas.md).
- **Reading Section 1–2:** dibuat LLM, teks + soal dalam satu panggilan. Section 1: 2–3 teks pendek sehari-hari (iklan, jadwal, pengumuman, ±300–400 kata total). Section 2: 2 teks kerja (deskripsi jabatan, kebijakan staf, materi pelatihan, ±400–500 kata total; boleh bertema tech/Australia/Singapura). 7 soal per section, QC yang sama, diterima bila ≥ 6/7. Stok minimal 5 per kind.
- **Blok Reading harian:** berotasi S1 → S2 → separuh S3 (9 menit).
- **Matching headings:** daftar heading (romawi i, ii, iii) tampil sekali, terlipat di atas grup; setiap soal "Paragraph X" memilih nomor.
- **Completion:** batas kata dari instruksi dan penghitung kata live di input; jawaban melebihi batas tetap bisa dikirim dan dinilai salah dengan Feedback "melebihi batas kata" (`R.word-limit`).
- **Register Task 1:** kode memilih register bergiliran (formal, semi-formal, informal) dan menyimpannya di `Question`; **tidak** ditampilkan sebelum menulis; Feedback TA menyebut register yang diharapkan. Tautan panduan struktur per register dari [ticket 05](05-materi-struktural.md) batch 2.
- **Speaking Part 2:** tetap; ditambah 1 pertanyaan lanjutan pendek (≤ 30 detik) yang dibuat bersama cue card di nightly job. Prioritas terakhir.
- **Beban job malam:** Section 1–2 ±1 teks/malam rata-rata (±6–8K token), serial.
