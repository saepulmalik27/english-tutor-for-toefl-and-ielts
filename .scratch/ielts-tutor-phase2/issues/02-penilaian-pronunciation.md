# Penilaian pronunciation berbiaya nol

Type: research
Status: resolved
Blocked by: 

## Question

Pronunciation = 25% band Speaking; tanpa penilaiannya band Speaking 7 tidak bisa diklaim. Opsi apa yang memberi skor per kata/fonem tanpa biaya dan sesuai syarat privasi (rekaman tidak dipakai untuk training, seperti alasan Gemini ditolak)? Bandingkan layanan cloud (free tier), model open-source yang bisa jalan di VPS ARM Oracle, dan proxy dari Whisper (confidence per kata). Sertakan seberapa dekat hasilnya dengan descriptor Pronunciation IELTS.

## Answer

Diputuskan 2026-11-20 dari riset `research/penilaian-pronunciation.md` (branch `research/penilaian-pronunciation`, belum di-commit).

- **Primary:** Azure AI Speech Pronunciation Assessment pada resource Free F0 (5 jam audio/bulan). Learner setuju membuat akun Azure dengan kartu, upgrade ke pay-as-you-go setelah 30 hari, dan memasang budget alert $0 di Cost Management. Microsoft menyatakan data real-time PA tidak disimpan.
- **Rujukan aksen:** `en-US` dengan prosody (prosody hanya tersedia di en-US). IELTS tidak mensyaratkan aksen; skor Azure terhadap "native speaker" tidak langsung dibaca sebagai band.
- **Cara pakai:** scripted assessment dengan transkrip Whisper sebagai reference text; audio dipotong di jeda kata Whisper menjadi ≤30 detik per request REST; `webm/opus` di-remux ke ogg. Audio hanya dipegang di memori/temp sampai penilaian selesai, lalu dibuang.
- **Anggaran:** maksimal ±10 menit audio jawaban per hari, dicatat di `AiQuota`; audio Checkpoint ([ticket 04](04-checkpoint-mingguan.md)) mendapat kuota lebih dulu. Lewat anggaran → hanya fallback, tanpa estimasi P hari itu.
- **Fallback:** `facebook/wav2vec2-lv-60-espeak-cv-ft` + G2P espeak-ng di container VPS, dijalankan di latar belakang, hanya memberi flag "kata mungkin salah ucap" (fonem diharapkan vs terdengar), tanpa band dan tanpa prosody. Tidak pernah menahan layar Feedback Speaking.
- **Tampilan:** P sebagai rentang berlabel "estimasi" dari sinyal Azure (akurasi fonem/kata, prosody, break, monotone) yang ditautkan ke kalimat descriptor; band 7 hanya diklaim bila fitur band 6 konsisten dan minimal satu sinyal band 8 muncul di beberapa sesi berturut-turut. Connected speech dan intonasi untuk makna tetap "tidak dinilai". Tanpa estimasi P, band Speaking tetap bercatatan "P belum dinilai".
- **Kalibrasi:** tanpa penilai manusia berbayar; ambang P tetap heuristik sampai ada skor tes asli Learner, yang dicatat manual ([ticket 03](03-kalibrasi-skor.md)).
- **Kapasitas:** fallback berbagi 2 OCPU dengan app, Postgres, n8n, dan TTS; dijalankan dalam antrean serial di luar jalur interaktif.
- **Spike sebelum implementasi:** (a) latensi Azure REST per potongan di F0; (b) prosody add-on jalan di F0 tanpa biaya; (c) perilaku F0 saat kuota habis (menolak, bukan menagih) dengan budget alert; (d) benchmark wav2vec2-large di 2 OCPU.
