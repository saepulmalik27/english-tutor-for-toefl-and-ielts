# Rujukan sistem penilaian speaking dan personalisasi

Type: research
Status: resolved
Blocked by: 

> **Sebagian digantikan (2026-11-15):** bagian format dan rubrik Speaking TOEFL 2026 tidak berlaku lagi karena Target Exam pindah ke IELTS General Training (lihat [Target skor dan tenggat Learner](07-target-skor-tenggat.md)). Penilaian per aspek, metrik fluency, risiko STT, dan FSRS-6 tetap berlaku; pemetaannya ke Speaking IELTS ada di [Format IELTS General Training dan rubriknya](14-format-ielts-gt.md).

## Question

Bagaimana proyek open-source dan riset yang ada menilai jawaban speaking TOEFL dengan STT + LLM (prompt rubrik, metrik fluency seperti WPM dan filler words, keandalan skor dibanding penilai manusia)? Dan algoritma spaced repetition gratis apa yang cocok (FSRS, SM-2) untuk mengulang item yang salah per Error Pattern? Kumpulkan sistem rujukan yang bisa ditiru (repo, paper), plus UX publik yang layak diamati dengan REA.

## Answer

Detail: branch lokal `research/rujukan-speaking-scoring` (commit 790a3db, **belum di-push** karena tidak ada kredensial), file `research/rujukan-speaking-scoring.md`.

- **Format Speaking 2026 berubah:** 2 tipe tugas, yaitu Listen and Repeat (7 item) dan Take an Interview (4 item). Tiap item dinilai 0–5 oleh AI ETS, dan skor section memakai band 1–6. Aspek Take an Interview: topic & elaboration, pace & pauses (filler disebut eksplisit), pronunciation, grammar & vocabulary. Rubrik lama 0–4 hanya berguna sebagai bahasa deskriptor.
- **Pronunciation tidak bisa dinilai dari transkrip.** Di MVP ditandai "tidak dinilai".
- **Prompting:** nilai per aspek terpisah dengan deskriptor penguji, acak urutan deskriptor, lalu rata-ratakan (Bannò et al., SLaTE 2025; korelasi zero-shot ±0.76 dengan manusia). Kalibrasi pakai sampel jawaban resmi ETS yang sudah dinilai, dan tampilkan skor sebagai estimasi ±1 level.
- **Metrik fluency** dihitung di kode dari word timestamps, lalu diberikan ke LLM sebagai fakta: WPM, jeda ≥0.5 detik, mean length of run, dan filler rate.
- **Risiko STT:** Whisper membuang filler (filler rate cenderung terlalu rendah) dan bisa berhalusinasi saat jeda panjang. Auto-koreksi grammar mungkin terjadi tapi belum terverifikasi. Groq `whisper-large-v3` memberi word timestamps di free tier.
- **Spaced repetition:** FSRS-6 dengan parameter default. Probabilitas recall-nya juga bisa dipakai untuk meranking Error Pattern. `ts-fsrs` v5.4.2 (Node ≥20); v6 butuh Node ≥24 dan default ke FSRS-7, jadi pin FSRS-6.
- **Rujukan:** 7 paper, korpus Speak & Improve, repo ts-fsrs, srs-benchmark, WhisperX, dustland/talk (Next.js + Whisper, paling mirip stack ini). UX publik yang layak diamati: sampel jawaban ETS, scoring guide ETS, Cambridge Speak & Improve, setelan FSRS di Anki.
