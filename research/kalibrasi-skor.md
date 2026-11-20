# Kalibrasi skor LLM dan tabel band Reading/Listening (riset per 2026-11-20)

Pertanyaan: (1) adakah tabel raw→band resmi yang persis untuk Listening dan Reading GT, untuk menggantikan interpolasi sementara di `lib/bands.ts`? (2) Sampel Writing/Speaking berskor apa yang disediakan ielts.org, dan apa lisensinya? (3) Bagaimana mengukur dan mengoreksi selisih skor LLM terhadap skor penguji (offset per kriteria vs contoh berskor di prompt)? (4) Apa bukti terbitan tentang akurasi LLM menilai IELTS? Hasilnya dipakai ticket 04 (Checkpoint mingguan) agar angka band bisa dipercaya.

Legenda: **[terverifikasi]** = dibaca langsung dari sumber primer pada 2026-11-20. **[belum terverifikasi]** = sumber sekunder, abstrak tanpa angka, atau penilaian/estimasi penulis.

Fakta yang sudah ada di `research/format-ielts-gt.md` (format, descriptor, lisensi ielts.org/IDP) dirujuk, tidak diulang.

## TL;DR

- **Tabel raw→band lengkap resmi tidak ada.** ielts.org hanya menerbitkan **rata-rata** skor mentah untuk beberapa band, dan menyatakan angkanya "will vary slightly from test version to test version". Titik resmi: Listening 5=16, 6=23, 7=30, 8=35; Reading GT 4=15, 5=23, 6=30, 7=35; Reading Academic 5=15, 6=23, 7=30, 8=35. Tidak ada titik resmi Reading GT di atas band 7. Tabel 0–40 yang beredar adalah buatan pihak ketiga. Jadi "tabel persis" tidak bisa didapat; yang bisa: interpolasi antar titik resmi + rentang ±0.5.
- **Sampel berskor ielts.org sangat sedikit dan hanya Writing.** GT: Task 1 band 5.5, Task 2 band 5. Academic: Task 1 band 6 dan 4 (grafik, tidak relevan untuk GT), Task 2 band 5.5 dan **7.5**. Semuanya **hanya skor keseluruhan**, tanpa skor per kriteria. Speaking: tidak ada sampel berskor di ielts.org (PDF sample tasks tanpa band). Total sampel yang relevan untuk GT: **4 skrip** (1 surat Task 1 + 3 esai Task 2).
- **Offset per kriteria tidak bisa diestimasi** dari sampel resmi: tidak ada skor per kriteria, dan 4 sampel terlalu sedikit untuk offset yang stabil. Yang bisa: cek bias rata-rata kasar dan konsistensi (skor ulang yang sama 5×).
- **Rekomendasi:** (1) masukkan teks descriptor resmi band 5–8 per kriteria (tanpa diubah) ke prompt penilai, bukan ringkasan buatan sendiri seperti sekarang; (2) tanpa few-shot skrip di setiap panggilan (mahal di 8K TPM), kecuali mungkin 1 sampel Task 2 band 7.5 sebagai jangkar atas bila uji menunjukkan bias; (3) jalankan "kalibrasi kecil" offline: 4 skrip resmi × 5 kali, catat selisih rata-rata dan sebaran; kalau |bias| ≥ 0.5 band konsisten, koreksi lewat prompt dulu, offset global hanya sebagai jalan terakhir; (4) pertahankan rentang ±1 untuk Writing/Speaking; (5) skor ujian asli Learner (Mei 2027) dan, bila ada, mock test berpenguji manusia adalah satu-satunya data kalibrasi yang benar-benar per Learner.
- **Bukti terbitan:** LLM (GPT-4 dan sejenisnya) umumnya mencapai korelasi/kesepakatan sedang-tinggi dengan penilai manusia untuk IELTS Writing Task 2 rata-rata, tetapi dengan selisih besar di skrip tertentu dan bias sistematis pada model kecil. Tidak ditemukan studi besar dengan penguji IELTS bersertifikat dan angka per kriteria yang bisa dipakai langsung. Untuk Speaking berbasis transkrip tidak ditemukan bukti setara.

## 1. Tabel raw→band Listening dan Reading [terverifikasi]

Sumber: https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail (dibuka 2026-11-20).

| Band | Listening (/40) | Reading Academic (/40) | Reading GT (/40) |
|---|---|---|---|
| 4 | – | – | 15 |
| 5 | 16 | 15 | 23 |
| 6 | 23 | 23 | 30 |
| 7 | 30 | 30 | 35 |
| 8 | 35 | 35 | – |

- Kutipan: "The precise number of marks needed to achieve these band scores will vary slightly from test version to test version." Angkanya rata-rata, bukan konversi tetap.
- Reading GT butuh lebih banyak jawaban benar daripada Academic untuk band yang sama (lihat `format-ielts-gt.md` §3).
- **Tidak ada titik resmi Reading GT band 8–9.** `lib/bands.ts` sekarang memakai `[0,2.5],[15,4],[23,5],[30,6],[35,7],[40,9]`: titik 15/23/30/35 cocok dengan resmi; titik `0→2.5` dan `40→9` adalah ekstrapolasi buatan sendiri [belum terverifikasi]. Untuk target Learner (6–7) bagian itu tidak menentukan.
- Tabel lengkap 0–40 di situs pihak ketiga (mis. "39–40 = 9") tidak resmi; jangan dipakai sebagai sumber kebenaran. [belum terverifikasi]

Usulan untuk kode (penilaian penulis):
- Reading GT: pertahankan kurva sekarang, ubah komentar menjadi "titik resmi rata-rata + ekstrapolasi di luar 15–35".
- Listening: kurva baru dengan titik resmi `[16,5],[23,6],[30,7],[35,8]`, ekstrapolasi `[0,2.5]` dan `[40,9]` [belum terverifikasi], bulatkan ke half band, tampilkan ±0.5.
- Checkpoint yang berisi satu section lengkap (40 soal) bisa memakai tabel ini langsung. Untuk latihan harian (jumlah soal tidak 40) skala ke /40 seperti sekarang; rentang ±0.5 tetap, karena variasi antarversi tes resmi sendiri sekitar itu.
- Soal buatan LLM bukan soal yang dikalibrasi tingkat kesulitannya. Band dari bank soal sendiri bisa lebih tinggi atau lebih rendah dari tes asli; ini sumber error terbesar untuk Reading/Listening, lebih besar dari pilihan tabel. [belum terverifikasi, penilaian penulis]

## 2. Sampel Writing/Speaking berskor dari ielts.org [terverifikasi]

Halaman sampel GT: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test
Halaman sampel Academic: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test

| Dokumen | Isi berskor | Skor per kriteria? |
|---|---|---|
| GT Writing example responses (PDF 3 hlm) https://ielts.org/cdn/computer-delivered-sample-tests-general-training-writing/ielts-general-training-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf | Task 1 surat: **band 5.5**; Task 2 esai: **band 5**; masing-masing dengan "Examiner comment" | Tidak, hanya band task |
| Academic Writing example responses (PDF 5 hlm) https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf | Task 1 (grafik): band 6 dan 4; Task 2 esai: **band 5.5** dan **band 7.5** | Tidak |
| Speaking sample tasks (PDF 7 hlm) https://ielts.org/cdn/ielts-downloadable-assets/ielts-sample-tests/ielts-speaking-sample-tasks-2023.pdf | Hanya frame penguji dan soal Part 1–3 | Tidak ada band sama sekali |

- PDF Academic menulis: descriptor "apply to both the Academic and General Training Modules", dan "candidates' answers that follow should not be regarded as definitive examples of any particular band score".
- Task 2 Academic dan GT memakai descriptor yang sama dan bentuk esai yang sama, jadi 2 esai Academic ikut berguna untuk Task 2 GT. Task 1 Academic (deskripsi grafik) tidak relevan.
- **Jumlah yang relevan: 4 skrip** (1 surat GT band 5.5, 3 esai: 5, 5.5, 7.5). Tidak ada surat GT di band 6–7.
- **Speaking:** tidak ada sampel berskor di ielts.org. Video "band X dengan komentar penguji" yang beredar berasal dari situs prep pihak ketiga (mis. ielts-blog.com), dinilai oleh "assessor" situs itu, bukan penguji tes resmi, dan berhak cipta. [belum terverifikasi] https://www.ielts-blog.com/ielts-speaking-video-samples/
- **Speak & Improve Corpus 2025** (Cambridge University Press & Assessment): ±315 jam rekaman, >7000 tes, ±55 jam ditranskrip; setiap rekaman diberi "indicative CEFR level of holistic speaking proficiency" oleh "non-operational examiners". Lisensi: "non-commercial research and educational purposes only", wajib registrasi dengan afiliasi akademik dan rencana pemakaian, tidak boleh disebarkan ulang. Skornya CEFR holistik, bukan band IELTS per kriteria. https://researchdatasets.cambridge.org/datasets/speak-and-improve-corpus-2025 [terverifikasi]. Apakah pemakaian pribadi tanpa afiliasi akademik akan disetujui: [belum terverifikasi].

Lisensi ielts.org (lihat `format-ielts-gt.md` §5.2): pemakaian pribadi nonkomersial, tidak diubah, kredit IELTS Partners. Menyimpan 4 skrip ini privat di `content/private/` (seperti contoh Reading) dan memakainya di prompt atau skrip uji masih masuk pola yang sudah disetujui di PRD v2.

## 3. Cara mengukur selisih LLM vs penguji

### 3.1 Metrik [belum terverifikasi: praktik umum AES, penilaian penulis]

- **Bias** = rata-rata (skor LLM − skor penguji). Menjawab "LLM terlalu murah/pelit?".
- **MAE** = rata-rata |selisih|. Menjawab "seberapa jauh biasanya?".
- **Kesepakatan tepat / dalam ±0.5 band.** Penguji manusia sendiri tidak selalu sama; selisih 0.5 di Writing lazim dianggap wajar.
- **QWK** (quadratic weighted kappa) dan korelasi hanya bermakna dengan puluhan sampel; dengan 4 skrip tidak ada gunanya.
- **Konsistensi**: skor skrip yang sama 5× (temperatur sekarang 0.2 di `lib/ai.ts`). Sebaran > 0.5 band berarti prompt kurang menjangkar.

### 3.2 Berapa sampel yang dibutuhkan [belum terverifikasi, estimasi penulis]

- Untuk mendeteksi bias 0.5 band dengan sebaran selisih per skrip ±0.75 band, dibutuhkan kira-kira 10–20 skrip berskor. Dengan 4 skrip resmi, hanya bias besar (≥1 band) yang terlihat andal.
- Offset **per kriteria** butuh skor per kriteria dari penguji; sampel resmi tidak memilikinya. Jadi offset per kriteria **tidak bisa** dihitung dari data resmi. Mengestimasinya dari komentar penguji = tebakan.
- Speaking: tanpa sampel berskor sama sekali, kalibrasi hanya dari descriptor dan konsistensi.

### 3.3 Offset per kriteria vs contoh berskor di prompt

| Pendekatan | Kelebihan | Kekurangan |
|---|---|---|
| Offset global/per kriteria setelah skor | Murah (0 token), mudah | Butuh data yang tidak ada; offset dari 4 skrip bisa memperburuk; menyembunyikan masalah prompt |
| Teks descriptor resmi band 5–8 di prompt | Menjangkar ke bahasa penguji; tidak bergantung jumlah sampel | +±1.5–2K token per panggilan [belum terverifikasi, estimasi]; lisensi: harus tidak diubah |
| Few-shot skrip berskor di prompt | Menjangkar skala absolut | +±600–900 token per skrip; hanya skor keseluruhan; sampel yang ada band rendah (5–5.5) kecuali satu esai 7.5; risiko LLM meniru topik |
| Rata-rata beberapa panggilan (mis. 3×) | Mengurangi sebaran | 3× kuota; berat di 8K TPM |

Kondisi kode sekarang: `lib/writing/score.ts` dan `lib/speaking/score.ts` memakai **ringkasan kriteria buatan sendiri** (beberapa baris), bukan teks descriptor resmi, dan meminta skor per kriteria dalam langkah 0.5. [terverifikasi dari kode] Penguji IELTS memberi skor per kriteria dalam band bulat; descriptor juga ditulis per band bulat. [belum terverifikasi dari sumber primer di riset ini]

### 3.4 Protokol kalibrasi kecil yang diusulkan [penilaian penulis]

1. Simpan 4 skrip resmi + band + komentar penguji di `content/private/ielts-writing-scored.json` (gitignored, tidak diubah).
2. Skrip lokal `scripts/calibrate-writing.ts`: nilai setiap skrip 5× dengan prompt produksi; catat per skrip rata-rata, min–max, dan selisih ke band penguji. Biaya ±20 panggilan × ±3K token ≈ 60K token, sekali jalan, di luar jam nightly job.
3. Ulangi untuk varian prompt: (a) sekarang, (b) + descriptor resmi band 5–8, (c) (b) + 1 esai band 7.5 sebagai few-shot. Pilih yang MAE-nya terkecil dan sebarannya ≤0.5.
4. Ambang: kalau |bias| ≥ 1 band atau sebaran > 0.5, perbaiki prompt dulu. Offset global hanya bila bias tetap konsisten searah di semua skrip setelah perbaikan prompt, dan ditulis eksplisit di kode dengan sumbernya.
5. Simpan hasil sebagai fixture; jalankan ulang setiap kali prompt penilai atau model berubah (regresi kalibrasi).
6. Speaking: belum ada sampel; uji konsistensi saja (transkrip yang sama 5×). Opsi data: rekaman Learner yang dinilai manusia (guru/mock berbayar) bila suatu saat ada.

## 4. Bukti terbitan tentang akurasi LLM menilai IELTS [belum terverifikasi: sebagian besar dari abstrak/sekunder]

- **Koraishi (2024), Language Teaching Research Quarterly 43:22–42**, GPT-4 menilai IELTS Writing Task 2 dibandingkan "official human raters" dengan weighted kappa dan ICC: "high agreement in means" dan "substantial reliability" untuk sebagian besar teks, tetapi ada selisih dan outlier per skrip; disimpulkan tidak bisa menggantikan penilai manusia. Angka tidak ada di abstrak. https://eurokd.com/doi/10.32038/ltrq.2024.43.02
- **Uyar & Büyükahiska (2025), IJATE**, GPT-4o mini: perbedaan signifikan, penilai manusia memberi skor lebih tinggi dari ChatGPT (bias ke bawah pada model kecil). Dari ringkasan hasil pencarian. https://dergipark.org.tr/en/download/article-file/4078457
- **PACLIC 2024**: GPT-4o mencapai korelasi manusia–mesin > 0.7. Dari ringkasan hasil pencarian. https://preview.aclanthology.org/moar-dois/2024.paclic-1.36.pdf
- **Nguyen dkk. (arXiv 2603.06424, Maret 2026)**: membandingkan prompting zero/few-shot, instruction tuning + RAG, dan SFT + DPO + RAG pada IELTS Writing Task 2; konfigurasi terbaik (k-SFT + RAG) "F1-Score 93%". Abstrak tidak memberi angka prompting saja, sumber skor dataset, atau QWK. https://arxiv.org/abs/2603.06424
- Studi penyedia aplikasi (mis. ielts.international, 55 esai) memakai skor rujukan yang bukan dari penguji bersertifikat; bukti lemah. https://www.ielts.international/am/research/ai-scoring-accuracy

Kesimpulan untuk aplikasi (penilaian penulis): bukti mendukung LLM besar sebagai penilai formatif dengan rentang ±0.5–1 band, bukan sebagai skor pasti. Model yang dipakai aplikasi (gpt-oss-120b) tidak muncul di studi mana pun; perilakunya harus diukur sendiri (§3.4). Fine-tuning tidak tersedia di stack biaya nol.

## 5. Implikasi untuk ticket 04 (Checkpoint mingguan)

- Reading/Listening di Checkpoint: kalau berisi 40 soal (atau skala ke /40), band bisa memakai titik resmi; tampilkan rentang ±0.5 dan catatan "soal buatan aplikasi, belum dikalibrasi ke tes asli".
- Writing/Speaking: band dari LLM tetap rentang ±1 sampai protokol §3.4 dijalankan; setelahnya bisa ±0.5 untuk Writing bila MAE ≤ 0.5. Speaking tetap ±1 (tanpa sampel berskor, tanpa Pronunciation sampai ticket 02).
- Tren mingguan lebih bisa dipercaya daripada angka absolut: bias LLM yang konstan tidak mengubah arah tren, asalkan prompt dan model tidak berubah. Perubahan prompt/model harus ditandai di grafik.
- Skor resmi Learner nanti (tes asli atau mock berpenguji) dicatat manual sebagai titik kalibrasi; selisihnya ke estimasi aplikasi ditampilkan.

## Pertanyaan terbuka untuk Learner

- Boleh menyimpan 4 skrip Writing berskor ielts.org di `content/private/` dan memakainya untuk uji kalibrasi (dan mungkin satu sebagai few-shot)? Default: ya, sama dengan contoh Reading.
- Perlu mendaftar Speak & Improve Corpus (butuh afiliasi akademik, nonkomersial)? Default: tidak sekarang; nilainya CEFR, bukan band per kriteria.
- Mau sekali-sekali membayar mock test berpenguji manusia sebagai titik kalibrasi? Default: tidak (biaya nol); pakai hasil tes asli.

## Sumber

- IELTS scoring in detail: https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail
- GT sample tests: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test
- Academic sample tests: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test
- GT Writing scored responses: https://ielts.org/cdn/computer-delivered-sample-tests-general-training-writing/ielts-general-training-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf
- Academic Writing scored responses: https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf
- Speaking sample tasks: https://ielts.org/cdn/ielts-downloadable-assets/ielts-sample-tests/ielts-speaking-sample-tasks-2023.pdf
- Speak & Improve Corpus 2025: https://researchdatasets.cambridge.org/datasets/speak-and-improve-corpus-2025
- Koraishi 2024: https://eurokd.com/doi/10.32038/ltrq.2024.43.02
- Uyar & Büyükahiska 2025: https://dergipark.org.tr/en/download/article-file/4078457
- PACLIC 2024: https://preview.aclanthology.org/moar-dois/2024.paclic-1.36.pdf
- Nguyen dkk. 2026: https://arxiv.org/abs/2603.06424
- ielts.international: https://www.ielts.international/am/research/ai-scoring-accuracy
- Kode: `lib/bands.ts`, `lib/writing/score.ts`, `lib/speaking/score.ts`
