# Sumber audio dan soal Listening

Type: research
Status: resolved
Blocked by: 

## Question

Dari mana audio Listening berasal dengan biaya nol: TTS multi-speaker gratis (aksen Australia, Inggris, Amerika; dialog dua orang dan monolog), audio berlisensi terbuka (VOA, LibriVox), atau gabungan? Yang dibutuhkan: kualitas suara, kuota gratis, lisensi, kebijakan data provider, dan cara membuat soal IELTS GT Part 1–4 dari transkripnya. Audio tidak disimpan di MVP; putuskan apakah Listening butuh penyimpanan audio (R2?) karena audio TTS harus bisa diputar ulang dan dipakai lagi.

## Answer

Diputuskan 2026-11-20 dari riset `research/sumber-audio-listening.md` (branch `research/sumber-audio-listening`, belum di-commit).

- **Sumber:** script orisinal ditulis LLM, dibacakan TTS. Tidak ada sumber audio terbuka yang memberi dialog dua orang berisi informasi spesifik seperti Part 1/3. Google Cloud (Chirp), Azure TTS, ElevenLabs, Deepgram Aura, dan Groq Orpheus tidak dipakai (wajib billing, kuota kecil, atau lisensi).
- **Script dan soal:** kode memilih Part, tipe soal, topik, dan pasangan voice/aksen (rotasi GB/AU/US); satu panggilan LLM (`serial`) mengembalikan `segments[] {speaker, text}` + 10 soal dengan kunci dan penjelasan bahasa Indonesia, urut sesuai script, dengan distraktor khas IELTS (koreksi diri, angka diubah, ejaan nama). Quality check di kode tanpa LLM: jawaban completion muncul verbatim di script dan dalam batas kata, posisi jawaban naik sesuai nomor soal, jawaban pilihan ganda ada di opsi, panjang script dalam rentang. Map/plan labelling ditunda ke iterasi kedua. Soal/transkrip resmi ielts.org tidak pernah dijadikan bahan.
- **TTS:** container `tts` self-hosted di VPS: Kokoro-82M (Apache-2.0) untuk GB/US, MeloTTS `EN-AU` (MIT) untuk AU; Part 1 dan 3 memakai dua suara yang jelas berbeda. Fallback Cloudflare `@cf/myshell-ai/melotts`. Kalau keduanya gagal, Part ditunda ke malam berikutnya (tanpa `speechSynthesis`), dan blok Listening jatuh ke Reading.
- **Aksen AU:** MeloTTS `EN-AU` dipakai kalau saat prototype masih jelas dimengerti; kalau tidak, porsi Part beraksen AU dikurangi sampai ada opsi lain.
- **Penyimpanan:** membalik keputusan PRD v2 "audio tidak disimpan" **hanya untuk audio TTS buatan sistem**: Opus 32 kbps di volume Docker VPS (±0.6 GB sampai Mei 2027), dilayani app di belakang Cloudflare Access; tidak memakai R2 dan tidak ikut backup. Script + konfigurasi voice di Postgres adalah sumber kebenaran; file dihapus 30 hari setelah Part dikerjakan. Rekaman Learner tetap tidak disimpan.
- **Volume:** ±4 Part/minggu (1 Part Selasa dan Kamis di sesi harian + 2 Part di Checkpoint A, [ticket 04](04-checkpoint-mingguan.md), [ticket 08](08-jadwal-mingguan.md)), jadi ±0.6 Part/malam, ±5K token Groq per Part, dijalankan berurutan.
- **Band Listening:** titik resmi rata-rata 16→5, 23→6, 30→7, 35→8 ([ticket 03](03-kalibrasi-skor.md)), ±0.5.
- **VOA/LibriVox (dikte):** ditunda.
- **Kapasitas:** VPS A1 2 OCPU / 12 GB dipakai bersama Next.js, Postgres, n8n, TTS, dan fallback pronunciation; TTS berjalan serial di antrean malam dengan batas waktu dan batas `cpus` container.
- **Spike sebelum implementasi (±1 jam di VPS):** benchmark RTF Kokoro (int8) dan MeloTTS untuk satu Part 7 menit (kalau > 15 menit CPU per Part, pakai Piper untuk GB/US atau kurangi Part); dengarkan 1 Part per aksen untuk menilai AU; uji nilai `lang` Cloudflare MeloTTS.
- Panduan struktur Listening ([ticket 05](05-materi-struktural.md)) menyusul setelah Listening jalan.
