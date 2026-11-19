# Quiz cepat 5 menit

Type: grilling
Status: resolved
Blocked by: 05

## Question

Learner ingin quiz cepat tambahan 5 menit, terpisah dari Practice Session 30 menit. Putuskan: isinya (grammar/kosakata pilihan ganda, collocation, paraphrase, dari Error Pattern dan Materi), bedanya dengan blok Review, apakah hasilnya memberi rating ke kartu FSRS dan ikut Weakness Profile, apakah kartu kosakata per kata (ditunda dari MVP) masuk di sini, jenis konten baru di bank soal dan stoknya per malam, dihitung untuk streak atau tidak, dan bentuknya di HP (satu soal per layar, satu ketuk).

## Answer

Diputuskan lewat grilling 2026-11-19.

**Bedanya dengan Review:** Review mengikuti jadwal FSRS (pattern jatuh tempo, 3 drill, memberi rating). Quiz adalah latihan bebas jadwal untuk waktu sela di HP.

- **Isi:** 10 soal per quiz: 6 soal Error Pattern dari pattern tersering Learner dalam 30 hari (termasuk yang belum jatuh tempo) + 4 soal kosakata IELTS (collocation, parafrase, word form).
- **Bentuk:** semua bisa diketuk (pilihan ganda atau TFNG, tanpa mengetik), satu soal per layar, ±30 detik per soal; Feedback langsung benar/salah + penjelasan 1–2 kalimat bahasa Indonesia + tautan "Baca materi" ([ticket 05](05-materi-struktural.md)) untuk soal Error Pattern; skor x/10 di akhir. Memakai komponen `QuestionFlow` yang sudah ada.
- **FSRS dan Weakness Profile:** jawaban salah pada soal Error Pattern dicatat sebagai kejadian pattern (menambah frekuensi di Weakness Profile), tetapi **tidak** memberi rating ke kartu FSRS dan tidak membuat kartu baru: rating di luar jadwal mengacaukan interval, dan pattern-nya sudah dikenal.
- **Kartu kosakata per kata:** tetap ditunda. Soal kosakata diambil dari bank tanpa pelacakan per kata; kalau sering salah di topik yang sama, itu bukti untuk membuatnya nanti.
- **Akses:** tombol "Quiz 5 menit" di dashboard, kapan saja, boleh berkali-kali selama stok ada. **Tidak** dihitung untuk streak (streak tetap = Practice Session selesai).
- **Pembuatan soal:** jenis konten baru `quiz` di bank soal, `patternId` boleh kosong (= kosakata). Nightly job menjaga stok: minimal 5 soal belum terpakai untuk masing-masing 6 pattern tersering (minggu pertama: pattern GRA/LR umum dari taksonomi) dan minimal 20 soal kosakata; ±10 soal per panggilan LLM; quality check yang sama (LLM kedua menjawab ulang). Cukup untuk ±3 quiz per hari.
- **Tidak diulang:** setiap soal dipakai sekali lalu ditandai terpakai; pattern yang sering salah kembali lewat soal baru.
- **Stok habis:** tanpa pembuatan mendadak (lambat, memakan kuota Speaking/Writing). Tombol menampilkan sisa ("2 quiz tersedia"); kalau habis: "Stok habis, terisi lagi besok pagi".
- **Kosakata:** topik berputar dari daftar topik IELTS (pendidikan, pekerjaan, kesehatan, lingkungan, teknologi, kota, budaya, media, dll., termasuk kerja/tech); level B2–C1; hindari kata terlalu mudah atau sangat langka.
- **Persiapan offline:** satu quiz dimuat sekaligus (10 soal + kunci + penjelasan); jawaban disimpan sekaligus di akhir. Keputusan offline-nya di ticket 09.
- Istilah `Quick Quiz` masuk `GLOSSARY.md` di ticket 10.
