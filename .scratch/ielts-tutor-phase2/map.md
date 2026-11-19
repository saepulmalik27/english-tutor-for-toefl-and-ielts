# Map: IELTS Tutor Fase 2

Label: wayfinder:map

## Destination

`prd.md` v3 yang terkunci untuk fase setelah MVP: Listening, penilaian pronunciation, Checkpoint mingguan untuk profiling, Materi struktural di database, Quiz cepat 5 menit, dan tipe soal IELTS GT yang belum ada, dalam jadwal mingguan yang muat di ±30 menit/hari. Map selesai saat tidak ada keputusan yang tersisa sebelum `/to-tickets` implementasi.

## Notes

- Lanjutan dari map `.scratch/zero-cost-toefl-tutor/map.md` dan MVP `.scratch/ielts-tutor-mvp/` (15 ticket selesai, live di `tutor.saepulmalik.my.id` sejak 2026-11-19). Semua batasan PRD v2 tetap berlaku: satu Learner, biaya 0 rupiah, Groq + fallback Cloudflare, Cloudflare Access, tanpa RAG, soal orisinal, audio tidak disimpan kecuali diputuskan lain di ticket Listening.
- Target tetap: IELTS GT computer-delivered, 7 per section (batas aman 6), tes ±Mei 2027. Prioritas diurutkan dari dampaknya ke skor.
- Permintaan Learner 2026-11-19: (1) tes profil seminggu sekali, (2) quiz cepat tambahan 5 menit dari bank soal, (3) materi struktural di DB, berisi grammar **dan** struktur jawaban IELTS. Ini membalik dua keputusan PRD v2 (tanpa diagnostic terpisah, lesson dilebur ke Feedback); alasan pembalikannya harus dicatat di ticket masing-masing.
- Kuota Groq 8K TPM sudah sering penuh saat nightly job (fallback ke Cloudflare bekerja). Setiap jenis konten baru menambah beban job malam; perhitungkan di setiap ticket.
- **Fase 0, dikerjakan sebelum atau paralel dengan map ini (bukan keputusan):** pastikan run 03:00 pertama pada image baru sukses; uji rekam Speaking di HP sungguhan; pakai aplikasi setiap hari 1–2 minggu supaya Checkpoint dan jadwal mingguan diputuskan dari data nyata. Notifikasi job gagal dan tingkat gagal quality check Reading masuk ticket 09 dan 07.
- Skill per sesi: `grilling` + `domain-modeling` untuk grilling; `research` untuk research; `prototype` untuk prototype. Istilah mengikuti `GLOSSARY.md`.
- Catatan progres di vault: `projects/english-tutor/english-tutor.md`.

## Tickets

| # | Ticket | Type | Blocked by |
|---|---|---|---|
| 01 | [Sumber audio dan soal Listening](issues/01-sumber-audio-listening.md) | research | |
| 02 | [Penilaian pronunciation berbiaya nol](issues/02-penilaian-pronunciation.md) | research | |
| 03 | [Kalibrasi skor LLM dan tabel band Reading/Listening](issues/03-kalibrasi-skor.md) | research | |
| 04 | [Checkpoint mingguan untuk profiling](issues/04-checkpoint-mingguan.md) | grilling | 03 |
| 05 | [Materi struktural di database](issues/05-materi-struktural.md) | grilling | |
| 06 | [Quiz cepat 5 menit](issues/06-quiz-cepat.md) | grilling | 05 |
| 07 | [Tipe soal IELTS GT yang belum ada](issues/07-tipe-soal-gt.md) | grilling | |
| 08 | [Jadwal mingguan baru](issues/08-jadwal-mingguan.md) | prototype | 01, 04, 06, 07 |
| 09 | [PWA, pengingat harian, dan observabilitas](issues/09-pwa-observabilitas.md) | grilling | |
| 10 | [Susun prd.md v3](issues/10-susun-prd-v3.md) | grilling | semua |

Bisa mulai paralel: 01, 02, 03 (research), 05, 07, 09.

## Decisions so far

<!-- satu baris per ticket yang sudah resolved -->

- [Materi struktural di database](issues/05-materi-struktural.md): 35 materi per Error Pattern + ±20 panduan struktur per tipe tugas, penjelasan bahasa Indonesia; ditulis Claude saat development, diperiksa otomatis oleh gpt-oss (Learner hanya mereview bahasa Indonesia), Markdown di repo disinkronkan ke tabel `Material`; muncul di Feedback, Review, pustaka, dan sebelum Writing/Speaking; memuat 3 kesalahan Learner sendiri; membaca tidak memberi rating FSRS. Membuka ticket 06.
- [Quiz cepat 5 menit](issues/06-quiz-cepat.md): 10 soal sekali ketuk (6 Error Pattern tersering + 4 kosakata IELTS B2–C1), Feedback langsung + tautan materi; salah dicatat ke Weakness Profile tanpa rating FSRS; tidak dihitung streak; jenis konten `quiz` diisi nightly job (±3 quiz/hari), soal tidak diulang, tanpa pembuatan mendadak; kartu kosakata per kata tetap ditunda.

## Not yet specified

- Voice chat real-time dengan AI untuk latihan Speaking.
- Apakah Listening butuh penyimpanan audio dan batas kapasitas R2 gratis (diputuskan di ticket 01).

## Out of scope

- Business English dan latihan wawancara kerja: map terpisah setelah fase ini.
- Multi-user, signup, komersialisasi; aplikasi native mobile.
- TOEFL iBT dan IELTS Academic.
