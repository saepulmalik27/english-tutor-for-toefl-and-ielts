# Susun prd.md v2

Type: task
Status: resolved
Blocked by: 07, 08, 09, 10, 11, 12, 14

## Question

(HITL) Gabungkan semua keputusan di map menjadi prd.md v2 yang menggantikan versi lama, lalu Learner meninjau dan menyetujuinya. Ini menutup map.

## Answer

Selesai 2026-11-18. `prd.md` v2 (bahasa Inggris, seperti v1) menggantikan v1 dan disetujui Learner. Isinya merangkum ticket 02–14 dengan tautan ke ticket sumber tiap keputusan.

Disetujui bersama PRD (sebelumnya belum diputuskan di ticket mana pun):
- **Strategi test:** unit test di seam murni tanpa LLM/jaringan: estimasi band, pemetaan rating FSRS, penyusun Practice Session, metrik fluency dari fixture timestamp Whisper, parsing output LLM (ID tak dikenal → `other`, JSON rusak ditolak), dan logika pemeriksaan kualitas + isi stok job malam dengan LLM di-stub. Tanpa e2e di MVP.
- **Streak:** dihitung dari hari dengan sesi selesai, dalam WIB, bukan dari login (v1 menghitung login dalam UTC).
- **Fallback grammar heuristik lokal:** dibuang; fallback Groq → Cloudflare sudah menangani gangguan.
- **Open Questions** (Listening, skor pronunciation, layar tipe tugas IELTS GT yang belum punya tempat, tabel band persis, observabilitas, bentuk PWA, passage panjang di HP) tidak memblokir implementasi.

Map selesai. Langkah berikutnya: `/to-tickets` atas `prd.md` v2.
