# Materi struktural di database

Type: grilling
Status: resolved
Blocked by: 

## Question

Learner ingin materi yang bisa dibaca, dua jenis: (a) grammar per Error Pattern (±35, mis. tenses, conditional, articles) dan (b) struktur jawaban IELTS (esai Task 2, surat Task 1 dengan register, Speaking Part 2, strategi per tipe soal Reading/Listening). Putuskan: siapa menulisnya (LLM sekali lalu direview Learner, atau tulis tangan), lisensi (tidak boleh menyalin British Council/IDP), model data (`Material` terkait Error Pattern/tipe soal, versi), di mana muncul (ketuk kesalahan di Feedback, sebelum drill Review, halaman pustaka), dan bahasa (Indonesia dengan contoh Inggris?). Lesson v1 dibuang karena berupa kurikulum umum; jelaskan bedanya.

## Answer

Diputuskan lewat grilling 2026-11-19.

**Kenapa membalik PRD v2 (lesson dilebur ke Feedback):** lesson v1 adalah kurikulum umum yang dibaca berurutan. Materi di sini terikat ke Error Pattern dan tipe tugas, muncul tepat saat kelemahan atau tugasnya muncul, dan memuat kesalahan Learner sendiri. Hint satu kalimat di Feedback terlalu pendek untuk memahami aturannya.

- **Satuan:** (a) 35 materi, tepat satu per Error Pattern di `lib/patterns/taxonomy.ts` (termasuk FC dan Reading); (b) ±20 panduan struktur: Writing Task 1 per register (formal, semi-formal, informal), Task 2 per tipe esai (opinion, discussion, advantages/disadvantages, problem/solution, two-part), Speaking Part 1/2/3, strategi per tipe soal Reading. Listening menyusul setelah ticket 01.
- **Bahasa:** penjelasan bahasa Indonesia; istilah, contoh, dan template dalam bahasa Inggris.
- **Lisensi:** semua orisinal; boleh merujuk band descriptor ielts.org dengan kata-kata sendiri; tidak menyalin British Council, IDP, atau buku prep. `content/private` tidak dipakai.
- **Penulis dan kualitas:** Learner tidak bisa mereview teks bahasa Inggris, jadi kualitas dijaga berlapis: (1) ditulis Claude di sesi Claude Code saat development (tanpa kuota Groq); (2) skrip pemeriksa lokal dengan gpt-oss (model berbeda dari penulis) mengecek setiap contoh "benar" gramatikal, setiap contoh "salah" benar-benar menunjukkan pattern-nya, dan penjelasan tidak bertentangan dengan contoh; yang gagal tidak di-commit; dicicil agar tidak bentrok dengan kuota nightly job; (3) Learner hanya mereview kejelasan bahasa Indonesia; (4) tombol "Laporkan materi" di aplikasi.
- **Sumber kebenaran:** file Markdown di repo, `content/materials/patterns/<pattern-id>.md` dan `content/materials/guides/<slug>.md`. Saat container start di-upsert ke tabel `Material` per slug (seperti migrasi); file yang dihapus → `retired`, tidak dihapus, agar `lastReadAt` dan laporan tetap ada. Ubah materi = deploy ulang; tanpa halaman admin.
- **Taksonomi:** tetap di kode; ID stabil karena dipakai prompt. `hint` tetap menjadi ringkasan satu kalimat; materi tidak menduplikasinya. Test gagal kalau ada pattern tanpa materi. Materi tidak dimasukkan ke prompt drill (hemat token).
- **Bentuk materi per pattern (≤ ±300 kata):** ringkasan (= `hint`), penjelasan, contoh salah → benar, tips IELTS (kaitan ke kriteria/band), dan "Kesalahan Anda sendiri": 3 kemunculan terakhir pattern itu dari data Learner.
- **Bentuk panduan struktur (≤ ±600 kata):** kerangka paragraf, frasa pembuka, dan satu contoh jawaban orisinal beranotasi di level band 7 (Task 2 ±260 kata, Task 1 ±160 kata).
- **Tempat muncul:** tautan "Baca materi" saat mengetuk kesalahan di Feedback; ringkasan terlipat sebelum 3 drill di Review; halaman pustaka `/dashboard/materi` per Skill dengan pattern tersering di atas; tautan panduan struktur sebelum Writing Task 1/2 dan Speaking Part 2.
- **Status baca:** `lastReadAt` per materi; pustaka menandai yang belum dibaca, terutama pattern dengan kartu aktif. Membaca **tidak** memberi rating FSRS.
- **Laporan:** materi yang dilaporkan tetap tampil dengan catatan "Dilaporkan, menunggu perbaikan"; saat sinkronisasi menemukan hash isi berubah, laporan terbuka otomatis selesai. Laporan dicek lewat `psql` saat sesi development.
- **Urutan implementasi:** batch 1 = 35 materi pattern + model data, sinkronisasi, pustaka, tautan Feedback/Review, tombol lapor; batch 2 = ±20 panduan struktur + tautan dari layar Writing/Speaking.
- Istilah `Material` masuk `GLOSSARY.md` di ticket 10.
