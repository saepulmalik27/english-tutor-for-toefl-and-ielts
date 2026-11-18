# Model Weakness Profile dan pengulangan

Type: grilling
Status: resolved
Blocked by: 05, 14

## Question

Seperti apa taksonomi Error Pattern, bagaimana Weakness Profile dihitung dan diperbarui dari Feedback kuis/writing/speaking, algoritma pengulangan apa yang dipakai, dan bagaimana Practice Session harian disusun darinya?

## Answer

Diputuskan lewat grilling 2026-11-18.

- **Taksonomi Error Pattern:** daftar tetap ±35 pattern yang dikurasi manual, masing-masing bertag Skill + kriteria IELTS. Draf: GRA (subject-verb agreement, tense choice, tense form, articles, countability/plural, prepositions, word order, run-on/fragment, conditionals, passive form, kalimat kompleks terbatas); LR (word choice/collocation, word form, register terlalu informal, repetisi/range sempit, spelling); CC (linker hilang/salah, paragraphing, referencing); TA/TR (bullet Task 1 tidak tercakup, nada surat salah untuk penerima, posisi Task 2 tidak jelas, ide kurang berkembang, kurang dari batas kata); FC (jeda panjang, filler, self-correction berlebihan, jawaban terlalu pendek); Reading (False vs Not Given tertukar, parafrase tidak dikenali, batas kata completion dilanggar, heading dicocokkan ke detail bukan ide utama). LLM hanya boleh memilih ID; sisanya `other` + catatan, yang bisa dinaikkan jadi pattern baru. Daftar final disusun saat implementasi dari descriptor IELTS.
- **Kartu FSRS = Error Pattern,** bukan soal. Review memakai drill **baru** yang menyasar pattern itu; soal yang sama tidak diulang (hanya menguji ingatan kunci). Kartu kosakata per kata ditunda setelah MVP.
- **Library:** `ts-fsrs` v6 dengan `version: 'FSRS-6'` (akurasinya ter-benchmark; default v6 adalah FSRS-7), parameter default, `desiredRetention` 0.9, image Docker Node 24 LTS. Optimizer dicoba setelah beberapa ratus review.
- **Rating:** kartu dibuat saat pattern pertama kali ditemukan. Drill pattern jatuh tempo (3 item): 0–1 benar → Again, 2 → Hard, 3 → Good; Easy tidak pernah otomatis. Pattern muncul lagi di latihan biasa (Feedback Speaking/Writing atau jawaban Reading salah yang bertag pattern) → Again, walau belum jatuh tempo. Pattern tidak muncul → tidak dicatat (tidak bisa dibedakan antara menghindari kesalahan dan tidak memakai strukturnya).
- **Weakness Profile dihitung dari data** setiap kali diminta: estimasi band per Skill, frekuensi tiap pattern 30 hari terakhir, dan retrievability FSRS. `UserMemory` dan ringkasan LLM yang di-`await` di setiap submit kuis dibuang.
- **Estimasi band (selalu rentang):** Reading = % benar 80 soal terakhir dipetakan lewat titik raw→band IELTS GT (35/40 ≈ 7, 30/40 ≈ 6, interpolasi), ±0.5. Writing/Speaking = rata-rata skor per kriteria (0–9) dari 5 tugas terakhir, Task 2 berbobot 2×, ±1 (korelasi LLM vs penguji ±0.76). Listening = "belum ada data". Section terendah = titik tengah terendah, dan inilah yang menentukan fokus sesi.
- **Practice Session harian:** Speaking 15 menit (satu Part, rotasi P1→P2→P3) + Reading 9 menit (teks Section 1–2 atau setengah passage Section 3) + review 6 menit. Kalau Writing section terendah, Task 1 (20 menit) menggantikan slot Reading 2 hari per minggu (sesi ±40 menit). Selain itu Writing jadi tambahan opsional 2×/minggu (Task 1 satu hari, Task 2 hari lain).
- **Slot review:** maksimal 2 Error Pattern jatuh tempo per hari (retrievability terendah dulu), 3 drill per pattern. Kalau tidak ada yang jatuh tempo, slot dipakai latihan tambahan section terendah. Tumpukan setelah bolos dicicil 2 per hari; FSRS menangani kartu terlambat.
- **Drill:** dibuat di muka oleh job malam (ticket pipeline bank soal) untuk kartu yang jatuh tempo dalam 2 hari ke depan, 3 per pattern. Format sesuai jenis pattern: GRA/LR = perbaiki kalimat atau isi rumpang; Reading = teks pendek + 3 pernyataan TFNG/completion; FC = pertanyaan speaking pendek yang memancing struktur itu; TA (nada surat) = tulis ulang 1–2 kalimat dengan register yang benar. Lewat pemeriksaan kualitas yang sama dengan soal lain.
- **Titik awal tanpa diagnostic:** 7 hari pertama sesi berotasi rata ke semua Skill (termasuk satu Task 1 dan satu Task 2), sehingga setiap section punya data band; setelah itu aturan di atas berlaku. Onboarding hanya sambutan + izin mikrofon; onboarding lama (3 soal pilihan ganda + esai) dibuang.
