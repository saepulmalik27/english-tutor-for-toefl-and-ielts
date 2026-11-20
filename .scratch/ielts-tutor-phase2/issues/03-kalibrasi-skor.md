# Kalibrasi skor LLM dan tabel band Reading/Listening

Type: research
Status: resolved
Blocked by: 

## Question

Seberapa jauh skor Writing/Speaking dari LLM menyimpang dari skor penguji pada sampel ielts.org yang sudah dinilai, dan bagaimana mengoreksinya (offset per kriteria, contoh berskor di prompt)? Juga tabel raw→band resmi Reading GT dan Listening yang persis untuk menggantikan interpolasi sementara. Dibutuhkan agar Checkpoint mingguan menghasilkan angka yang bisa dipercaya.

## Answer

Diputuskan 2026-11-20 dari riset `research/kalibrasi-skor.md` (branch `research/kalibrasi-skor`, belum di-commit).

- **Tabel raw→band:** tidak ada tabel 0–40 resmi; ielts.org hanya menerbitkan rata-rata yang "vary slightly from test version to test version". Dipakai titik resmi + interpolasi, ±0.5: Reading GT 15→4, 23→5, 30→6, 35→7 (kurva `lib/bands.ts` sudah cocok; titik 0 dan 40 ditulis sebagai ekstrapolasi); Listening 16→5, 23→6, 30→7, 35→8, ekstrapolasi ke 0 dan 40.
- **Sampel berskor:** hanya 4 skrip Writing ielts.org yang relevan (GT Task 1 band 5.5, GT Task 2 band 5, Academic Task 2 band 5.5 dan 7.5), skor keseluruhan saja. Disimpan privat dan tidak diubah di `content/private/` (gitignored), seperti contoh Reading. Speaking tidak punya sampel berskor resmi; Speak & Improve Corpus tidak dipakai.
- **Tanpa offset per kriteria:** tidak ada data per kriteria resmi, dan 4 skrip terlalu sedikit.
- **Prompt penilai:** teks descriptor resmi band 5–8 per kriteria (tidak diubah, privat) menggantikan ringkasan kriteria buatan sendiri di `lib/writing/score.ts` dan `lib/speaking/score.ts`.
- **Cek kalibrasi kecil:** skrip lokal menilai 4 skrip × 5 kali dengan prompt produksi; laporkan bias, MAE, dan sebaran; bandingkan varian prompt (sekarang, + descriptor, + 1 esai band 7.5 sebagai few-shot). Prompt diperbaiki dulu; offset global hanya kalau bias konsisten searah tetap ada, ditulis eksplisit dengan sumbernya. Dijalankan ulang setiap prompt/model penilai berubah, di luar jam nightly job. Speaking: hanya uji konsistensi (transkrip sama 5×).
- **Rentang:** Writing/Speaking tetap ±1; Writing boleh ±0.5 bila MAE ≤ 0.5. Tren mingguan diberi penanda saat prompt/model penilai berubah.
- **Kalibrasi Learner:** tanpa penilai manusia berbayar; skor resmi tes asli dicatat manual sebagai titik kalibrasi.
- Bukti terbitan: LLM besar sepakat sedang–tinggi dengan penilai manusia rata-rata, tetapi meleset besar di skrip tertentu; gpt-oss belum pernah diuji. Jadi skor tetap estimasi formatif.
