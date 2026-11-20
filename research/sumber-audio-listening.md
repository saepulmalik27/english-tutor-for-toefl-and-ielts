# Sumber audio dan soal Listening (riset per 2026-11-20)

Pertanyaan: dari mana audio Listening IELTS GT berasal dengan biaya **0 rupiah/bulan**? Pilihannya TTS multi-speaker gratis (aksen Australia, Inggris, Amerika; dialog dua orang dan monolog), audio berlisensi terbuka (VOA, LibriVox), atau gabungan keduanya. Riset ini juga membahas cara membuat soal Part 1–4 dari script/transkrip, dan apakah audio perlu disimpan (R2?) supaya bisa diputar ulang.

Legenda: **[terverifikasi]** = dibaca langsung dari sumber primer pada 2026-11-20. **[belum terverifikasi]** = sumber sekunder, angka yang tidak dipublikasikan, atau penilaian/estimasi penulis.

Fakta yang sudah ditetapkan riset sebelumnya dirujuk, tidak diulang: `research/stack-ai-gratis.md` (limit Groq/Cloudflare, data policy), `research/hosting-db-gratis.md` (Oracle A1, R2), `research/format-ielts-gt.md` (format dan lisensi materi ielts.org), `research/sumber-materi-crawler.md` (VOA/LibriVox).

## TL;DR

- **Primary: script ditulis LLM, lalu dibacakan TTS self-hosted di VPS Oracle.** Pakai **Kokoro-82M** (Apache-2.0, ONNX, punya wheel ARM64) untuk suara Amerika dan Inggris, dan **MeloTTS `EN-AU`** (MIT) untuk aksen Australia. Biaya API nol, data tidak keluar dari VPS, dan tidak ada kuota. Kecepatan di CPU Ampere **belum diukur**: lakukan benchmark dulu sebelum memutuskan.
- **Fallback: Cloudflare `@cf/myshell-ai/melotts`** (18.63 neuron/menit; satu full test ±560 neuron). Kelemahannya, di Cloudflare tidak ada parameter speaker, jadi dialog dua orang tidak bisa dibedakan dari suaranya saja. Fallback darurat: `speechSynthesis` di browser (tanpa file, voice tergantung perangkat).
- **Tidak layak sebagai sumber utama:** Deepgram Aura-2 di Cloudflare (satu Part ±16K neuron, melebihi kuota harian 10K), Groq Orpheus (3.6K token/hari, 200 karakter/request), ElevenLabs Free (10K kredit/bulan, non-komersial), Google Cloud dan Azure (kuotanya besar tetapi wajib billing/kartu, jadi ada risiko tagihan).
- **Audio berlisensi terbuka hanya pelengkap.** VOA Learning English (public domain, masih terbit per 2026-11-20) dan LibriVox (public domain AS) bertempo lambat atau bergaya sastra, aksennya kebanyakan Amerika, dan tidak ada yang mirip Part 1/3 (percakapan dua orang yang berisi informasi spesifik). Cocok untuk latihan tambahan atau dikte, bukan untuk simulasi tes.
- **Penyimpanan: R2 tidak diperlukan.** Satu full test (±30 menit) dalam Opus 32 kbps ≈ 7 MB. Sampai Mei 2027 totalnya < 1 GB, cukup di disk VPS (docker volume), dilayani Next.js di belakang Cloudflare Access. Simpan script + konfigurasi voice di Postgres: kalau file hilang, audio bisa di-generate ulang.
- **Beban token tambahan:** ±5K token per Part (script + 10 soal). Dengan 2 Part per malam, tambahannya ±10–15K token dari 200K TPD Groq. Batasan nyatanya TPM 8K: satu request per Part, dijalankan berurutan.

## 1. Format Listening yang harus ditiru [terverifikasi]

Sumber: https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-listening (dibuka ulang hari ini; sama dengan `format-ielts-gt.md`).

- ±30 menit, 4 Part × 10 soal, rekaman diputar **sekali**. Aksen: *"British, Australian, New Zealand and North American"*.
- Part 1: percakapan dua orang, situasi sosial sehari-hari. Part 2: satu pembicara utama, situasi sehari-hari. Part 3: percakapan dua pembicara utama, konteks pendidikan/pelatihan. Part 4: satu orang berbicara tentang topik akademik.
- Tipe soal: multiple choice, matching, plan/map/diagram labelling, form/note/table/flow-chart completion, sentence completion, short answer.
- Batas kata, misalnya "NO MORE THAN TWO WORDS AND/OR A NUMBER". Melebihi batas berarti salah. Kata bertanda hubung ("check-in") dihitung satu kata. Bentuk kontraksi tidak diujikan.
- Raw → band (rata-rata, *"will vary slightly from test version to test version"*): band 5 = 16, 6 = 23, **7 = 30**, 8 = 35 dari 40. https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail

Implikasinya untuk TTS: dibutuhkan **dua suara yang jelas berbeda** (idealnya laki-laki dan perempuan) untuk Part 1 dan 3, dan rotasi aksen GB/AU/US antar Part. Aksen NZ tidak tersedia di opsi gratis mana pun yang ditemukan; anggap cukup tertutup oleh AU.

## 2. Opsi TTS

Panjang teks sebagai acuan (estimasi penulis): satu Part ±7 menit × ±150 kata/menit ≈ 1,000–1,200 kata ≈ **6K karakter**. Satu full test ≈ **25K karakter / 30 menit audio**.

### 2.1 Cloudflare Workers AI [terverifikasi]

Katalog TTS saat ini berisi empat model: `melotts`, `aura-1`, `aura-2-en`, `aura-2-es`. https://developers.cloudflare.com/workers-ai/models/

| Model | Biaya (pricing page) | Voice/aksen | 1 Part (6K karakter / 7 menit) |
|---|---|---|---|
| `@cf/myshell-ai/melotts` | 18.63 neuron/menit audio | Parameter hanya `prompt` dan `lang` (default `en`). **Tidak ada parameter speaker**, output MP3. https://developers.cloudflare.com/workers-ai/models/melotts/ | ±130 neuron |
| `@cf/deepgram/aura-1` | 1,363.64 neuron/1K karakter | 12 speaker. Menurut Deepgram: **British** = `athena` (F), `helios` (M); Irish = `angus`; sisanya American. Tidak ada aksen Australia. | ±8.2K neuron (82% kuota harian) |
| `@cf/deepgram/aura-2-en` | 2,727.27 neuron/1K karakter | 40 speaker, termasuk **Australia** `hyperion` (M) dan `theia` (F), **British** `draco` (M) dan `pandora` (F) | ±16.4K neuron (**melebihi** 10K/hari) |

- Kuota gratis 10,000 neuron/hari, reset 00:00 UTC. https://developers.cloudflare.com/workers-ai/platform/pricing/
- Aksen per voice Deepgram: https://developers.deepgram.com/docs/tts-models. Cloudflare menandai Aura-1 dan Aura-2 dengan "Zero data retention: Yes". https://developers.cloudflare.com/workers-ai/models/aura-2-en/
- Data policy Cloudflare (tidak dipakai untuk training): lihat `stack-ai-gratis.md` §2.
- Apakah `lang` di MeloTTS Cloudflare menerima `EN-AU`/`EN-BR` seperti library aslinya tidak didokumentasikan. **Perlu dites** [belum terverifikasi]. Kalau bisa, Cloudflare MeloTTS langsung menjadi fallback multi-aksen yang murah.
- Aura-2 masih bisa dipakai untuk potongan pendek, misalnya 1–2 menit suara Australia per hari (±2K karakter ≈ 5.5K neuron), tetapi akan berebut kuota dengan fallback LLM. Tidak disarankan.

### 2.2 Groq [terverifikasi]

- `canopylabs/orpheus-v1-english`: free plan 10 RPM, **100 RPD, 1.2K TPM, 3.6K TPD** (tabel `freeRows` di source https://console.groq.com/docs/rate-limits).
- Voice: `autumn`, `diana`, `hannah` (F), `austin`, `daniel`, `troy` (M). Aksen tidak disebut. Maksimum **200 karakter/request**, output WAV saja. https://console.groq.com/docs/text-to-speech/orpheus
- Satu Part butuh ±30 request dan jauh melampaui 3.6K token/hari. **Tidak layak** untuk Listening.

### 2.3 Self-hosted di Oracle A1 (ARM64, tanpa GPU)

| Model | Lisensi | Voice EN | ARM64 | Catatan |
|---|---|---|---|---|
| **Kokoro-82M** (via `kokoro-onnx`) | Bobot **Apache-2.0**; dilatih *"exclusively on permissive/non-copyrighted audio data"* [terverifikasi] https://huggingface.co/hexgrad/Kokoro-82M. Wrapper `kokoro-onnx` MIT [terverifikasi] https://github.com/thewh1teagle/kokoro-onnx | American: 11 F (terbaik `af_heart` A, `af_bella` A-), 9 M (`am_fenrir`/`am_michael`/`am_puck` C+). British: 4 F (`bf_emma` B-), 4 M (`bm_fable`/`bm_george` C). **Tidak ada Australia.** [terverifikasi] https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md | `kokoro-onnx` 0.6.1 berupa wheel pure-Python, dan `onnxruntime` 1.32.0 punya wheel `manylinux_2_28_aarch64` (PyPI) [terverifikasi] | Model ±300 MB (quantized ±80 MB). Klaim kecepatan hanya "near real-time on macOS M1". Kecepatan di Ampere **belum diukur**. |
| **MeloTTS** (self-hosted) | MIT, *"free for both commercial and non-commercial use"* [terverifikasi] https://huggingface.co/myshell-ai/MeloTTS-English | Speaker `EN-US`, `EN-BR`, `EN_INDIA`, **`EN-AU`**, `EN-Default` [terverifikasi]. Masing-masing satu suara; gendernya tidak didokumentasikan [belum terverifikasi]. | Berbasis PyTorch. Instalasi di aarch64 (termasuk dependensi seperti MeCab untuk bahasa Jepang) **belum dicoba** [belum terverifikasi] | README: *"CPU is sufficient for real-time inference"* [terverifikasi], tanpa angka. Kualitasnya biasanya di bawah Kokoro [belum terverifikasi: penilaian penulis]. |
| **Piper** (`piper-tts` 1.8.0) | Kode **GPL-3.0**. Lisensi voice mengikuti dataset masing-masing; voice turunan Lessac dibatasi untuk *"research and exploration"*, non-komersial [terverifikasi] https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/LICENSING.md | Folder voice hanya `en_GB` dan `en_US`, **tidak ada `en_AU`** [terverifikasi] https://huggingface.co/rhasspy/piper-voices/tree/main/en | Wheel `manylinux aarch64` tersedia (PyPI) [terverifikasi] | Sangat cepat, tetapi kualitasnya paling robotik dan tanpa Australia. Cadangan saja. |

Kesimpulan self-hosted: Kokoro untuk GB/US (dua gender, kualitas terbaik di antara opsi gratis tanpa kuota) dan MeloTTS `EN-AU` untuk Australia. Lisensi keduanya permisif, jadi audio hasilnya bebas dipakai. Karena tidak ada data yang keluar dari VPS, tidak ada isu data policy.

Estimasi beban CPU [belum terverifikasi, harus di-benchmark]: kalau real-time factor (RTF) di 2–4 core Ampere berada di 0.2–0.5, satu Part 7 menit selesai dalam ±1.5–3.5 menit CPU. Ini aman untuk job pukul 03:00, tetapi jangan dijalankan saat Learner sedang memakai aplikasi. Jalankan sebagai container terpisah (FastAPI kecil) di docker compose dengan batas `cpus`. Catatan: `hosting-db-gratis.md` menulis A1 2 OCPU/12 GB, sedangkan brief ini menyebut ±24 GB. Cek spesifikasi VM sebenarnya sebelum benchmark.

### 2.4 Browser Web Speech API (`speechSynthesis`)

- Nol biaya, tanpa file, tanpa server. Voice berasal dari OS/browser: desktop Chrome punya voice jaringan "Google UK/US English", Android Chrome memakai mesin TTS sistem (Google TTS, dengan voice en-AU/en-GB/en-US yang bisa diunduh), dan Edge/Windows punya voice en-AU [belum terverifikasi: tergantung perangkat, tidak dicek per perangkat].
- Kekurangan: daftar voice berbeda tiap perangkat (cek dengan `speechSynthesis.getVoices()`), tidak ada file yang bisa disimpan atau di-seek dengan stabil, dan kualitasnya tidak konsisten. Kalau voice jaringan dipakai, teks script terkirim ke Google; script tidak bersifat pribadi, jadi ini bisa diterima.
- Dipakai hanya sebagai **fallback darurat**, atau untuk membacakan satu kalimat (misalnya di Review).

### 2.5 Cloud lain dengan free tier

| Layanan | Free tier [terverifikasi] | Aksen AU/GB/US | Hambatan |
|---|---|---|---|
| Google Cloud TTS | Chirp 3 HD **1 juta karakter/bulan**, WaveNet 4 juta, Studio 1 juta. *"You must enable billing ... and will be automatically charged if your usage exceeds"* https://cloud.google.com/text-to-speech/pricing | Ada en-AU/en-GB/en-US [belum terverifikasi: daftar voice tidak dibuka] | **Wajib billing account** (kartu). 1 juta karakter ≈ 40 full test/bulan, jadi kuotanya lebih dari cukup, tetapi melanggar prinsip "tanpa risiko tagihan". Cloud data terms (tanpa training) belum dibaca [belum terverifikasi]. |
| Azure AI Speech F0 | Neural **0.5 juta karakter/bulan** https://azure.microsoft.com/en-us/pricing/details/speech/ | Ada voice en-AU neural [belum terverifikasi] | Akun Azure biasanya meminta kartu [belum terverifikasi]. 0.5 juta ≈ 20 full test/bulan. |
| ElevenLabs Free | 10,000 kredit/bulan, tanpa rollover, **tanpa lisensi komersial** https://elevenlabs.io/pricing | Banyak | ±10K karakter ≈ 1.5 Part/bulan. Terlalu kecil. |
| Gemini API TTS (`gemini-3.8-flash-tts`) | Free tier ada, tetapi RPD per model tidak dipublikasikan (`stack-ai-gratis.md` §3) | Aksen diarahkan lewat prompt; mendukung multi-speaker [belum terverifikasi] | Data free tier dipakai Google untuk improvement. Script tidak pribadi, jadi masih bisa diterima, tetapi limitnya tidak bisa diandalkan. Tidak dipilih. |

Kalau suatu saat Learner mau memasang kartu, Google Chirp 3 HD adalah upgrade kualitas paling besar dengan risiko tagihan praktis nol untuk satu pengguna. Ini tetap keputusan Learner (lihat pertanyaan terbuka).

## 3. Audio berlisensi terbuka

| Sumber | Lisensi [terverifikasi] | Aksen | Transkrip | Kecocokan dengan Part IELTS |
|---|---|---|---|---|
| **VOA Learning English** | *"All text, audio and video material produced exclusively by the Voice of America is in the public domain"*, dengan kredit ke VOA. Materi berlisensi (AP, dll.) dikecualikan. https://learningenglish.voanews.com/p/6021.html | Mayoritas Amerika [belum terverifikasi] | Ada di banyak artikel. Halaman episode podcast yang dicek hari ini tidak memuat transkrip [terverifikasi untuk satu halaman] | Tempo sengaja lambat dan kosakata terbatas, jadi jauh lebih mudah daripada IELTS. Lumayan untuk gaya Part 2/4 (monolog), tidak untuk Part 1/3. |
| **LibriVox** | *"public domain in the USA, but not necessarily in other countries"* https://librivox.org/pages/public-domain/ | Campuran sesuai relawan, termasuk GB/AU [belum terverifikasi] | Teks sumber (Gutenberg) | Sastra lama, bukan percakapan atau kuliah. Cocok hanya untuk dikte/shadowing. |
| **Spoken Wikipedia** (Commons) | Teks Wikipedia CC BY-SA 4.0. Lisensi rekamannya tidak tertulis di halaman proyek [belum terverifikasi] https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Spoken_Wikipedia | Campuran | Revisi artikel yang dibaca (kalau dicantumkan) | Mirip Part 4 (monolog informatif), tetapi pembacanya amatir dan kualitasnya tidak rata. |

- Status VOA: `riset sumber-materi-crawler` mengkhawatirkan VOA berhenti produksi. Sitemap berita `learningenglish.voanews.com/sitemap_428_news.xml.gz` hari ini masih mencantumkan "Learning English Podcast" bertanggal 2026-11-19 dan 2026-11-20 [terverifikasi]. robots.txt tidak melarang path artikel `/a/` [terverifikasi]. Volume dan kesinambungan ke depan tetap tidak pasti.
- Menyimpan salinan audio public domain untuk pemakaian pribadi diperbolehkan. Pengecualiannya materi pihak ketiga di VOA: AP hanya boleh disimpan *"for personal and non-commercial use"*.
- Kesimpulan: tidak ada sumber terbuka yang memberi **dialog dua orang dengan informasi faktual (nama, angka, tanggal)** seperti Part 1, atau diskusi tutorial seperti Part 3. Itulah inti soal IELTS, jadi TTS dari script orisinal tetap wajib. Audio terbuka hanya sebagai jenis latihan tambahan (opsional, bukan MVP).

## 4. Membuat soal Part 1–4 dari script

Tipe soal resmi tercantum di §1. Pemetaan tipikal per Part di bawah diambil dari pola sampel resmi dan buku latihan umum, bukan aturan yang dipublikasikan [belum terverifikasi]:

| Part | Script | Tipe soal yang disarankan (10 soal, 1–2 tipe) |
|---|---|---|
| 1 | Dialog 2 orang (mis. staf dan penelepon), ±1,000 kata | Form/note/table completion: nama yang dieja, nomor telepon, tanggal, harga |
| 2 | Monolog (tur, pengumuman fasilitas) | MCQ + matching, atau map/plan labelling |
| 3 | Dialog 2 mahasiswa/tutor tentang tugas | MCQ (satu atau dua jawaban) + matching (pendapat ↔ pembicara) |
| 4 | Kuliah akademik | Note/sentence/flow-chart completion |

Alur yang cocok dengan pipeline yang sudah ada (`lib/questions/pipeline.ts`, `lib/questions/answers.ts`), memakai pendekatan **soal dulu, lalu script**:

1. Kode memilih Part, tipe soal, topik, dan pasangan voice/aksen (rotasi GB/AU/US). Sama seperti `pickTypes`, hanya contoh tipe yang terpilih yang masuk prompt.
2. Satu panggilan LLM (`chat(..., { serial: true })`) mengembalikan JSON: `segments[] {speaker, text}` + `questions[]` dengan `answer` dan `explanation` (bahasa Indonesia), urut sesuai kemunculan di script. Prompt meminta distraktor khas IELTS: pembicara mengoreksi diri ("Tuesday... no, sorry, Thursday"), angka yang disebut lalu diubah, dan ejaan nama.
3. Quality check dengan kode, tanpa LLM: setiap jawaban completion muncul **verbatim** di script dan dalam batas kata (`wordLimit`, `countWords`); posisi jawaban di script naik sesuai nomor soal; jawaban MCQ ada di opsi; jumlah kata per Part masuk rentang. Kalau gagal, ulangi sampai `MAX_ATTEMPTS` seperti Reading.
4. Map/plan labelling butuh gambar: generate denah sebagai JSON grid → SVG. Tunda ke iterasi kedua [penilaian penulis].
5. TTS per segmen (voice per speaker), lalu gabungkan dengan jeda ±0.5–1 detik dan "You now have some time to look at questions 1 to 5" sebagai segmen narator. Encode ke Opus mono.
6. Penilaian: pakai `isCorrect` yang sudah ada (case-insensitive, alternatif `|`). Band Listening: interpolasi raw /40 dari tabel §1, seperti `readingBandFromRaw` (`lib/bands.ts` sudah punya `listening` di `MIN_SAMPLES`).

Larangan: jangan memakai soal atau transcript resmi ielts.org sebagai bahan parafrase. Sampel ielts.org hanya boleh dibuka Learner secara manual (`format-ielts-gt.md` §5.2).

### Estimasi beban token [belum terverifikasi: estimasi penulis]

- Per Part: input ±1.5K (instruksi + contoh tipe), output ±1.6K token script + ±0.8K soal JSON + ±1K reasoning (`reasoning_effort: low/medium`) ≈ **±5K token**.
- Nightly 2 Part/malam (satu sesi Listening ±15 menit/hari) ≈ 10K token, ×1.5 untuk retry ≈ **15K token/hari** dari 200K TPD Groq. Satu request ±5K token sudah lebih dari separuh TPM 8K, jadi jalankan berurutan dengan jeda ±60 detik. Job malam bertambah ±2–4 menit.
- Kalau jatuh ke Cloudflare gpt-oss-120b: 1.5K × 31,818/M + 3.5K × 68,182/M ≈ **±290 neuron/Part** (±870 neuron/malam termasuk retry).
- TTS fallback Cloudflare MeloTTS: 15 menit × 18.63 ≈ **±280 neuron/malam**. Total skenario terburuk ±1.2K neuron, masih muat bersama beban lain (±2.9K, `stack-ai-gratis.md` §6).

## 5. Penyimpanan audio

Estimasi ukuran [belum terverifikasi: aritmetika penulis]: Opus mono 32 kbps ≈ 240 KB/menit (sama dengan asumsi `hosting-db-gratis.md`); MP3 64 kbps ≈ 480 KB/menit.

| | Opus 32 kbps | MP3 64 kbps |
|---|---|---|
| 1 Part (7 menit) | ±1.7 MB | ±3.4 MB |
| 1 full test (30 menit) | ±7 MB | ±14 MB |
| 2 Part/hari × 30 hari | ±100 MB/bulan | ±200 MB/bulan |
| Sampai Mei 2027 (±6 bulan) | **±0.6 GB** | ±1.2 GB |

R2 free tier [terverifikasi] https://developers.cloudflare.com/r2/pricing/: 10 GB-bulan (Standard), 1 juta Class A (PutObject, ListObjects), 10 juta Class B (GetObject), egress gratis. Di atas itu ditagih ($0.015/GB-bulan). Status kartu saat aktivasi masih konflik (`hosting-db-gratis.md`).

Perbandingan:

- **Disk VPS (docker volume):** ±0.6 GB jauh di bawah block storage Oracle (`hosting-db-gratis.md`: 200 GB). Nol akun tambahan dan nol risiko tagihan. Dilayani route handler Next.js di belakang Cloudflare Access. Dukungan Range header membuat `<audio>` bisa di-seek dan diputar ulang.
- **R2:** kapasitasnya lebih dari cukup, tetapi menambah kredensial, SDK, dan pertanyaan kartu tanpa manfaat nyata untuk satu pengguna. Manfaatnya hanya sebagai backup di luar VM.
- **Generate ulang on demand, tanpa simpan:** TTS self-hosted memakan menit CPU per Part, jadi Learner harus menunggu dan bisa terjadi pemutaran ulang yang tidak identik. Tidak cocok.
- **TTS di client:** tanpa penyimpanan, tetapi kualitas dan aksen tergantung perangkat (§2.4).

Keputusan yang disarankan: **simpan audio di disk VPS, bukan R2.** Sumber kebenarannya script (segments + voice + seed) di Postgres, yang sudah ikut `pg_dump`. File audio diperlakukan sebagai cache yang bisa dibangun ulang, jadi tidak perlu ikut backup. Audio Part yang sudah selesai dikerjakan boleh dihapus setelah N hari untuk replay/review. Ini membalik keputusan PRD v2 "audio tidak disimpan" **hanya untuk audio TTS buatan sistem**; rekaman suara Learner tetap tidak disimpan.

## 6. Rekomendasi

1. **Primary:** nightly job meng-generate 2 Part/malam (rotasi Part 1–4 dan aksen) dengan Groq gpt-oss-120b, lalu menjalankan TTS di container `tts` self-hosted: Kokoro (`bf_emma`/`bm_george` untuk GB, `af_heart`/`am_michael` untuk US) dan MeloTTS `EN-AU` untuk AU. Hasilnya Opus 32 kbps di volume `audio/`.
2. **Fallback LLM:** Cloudflare gpt-oss-120b (±290 neuron/Part), sudah ada di `lib/ai-fallback.ts`.
3. **Fallback TTS:** Cloudflare MeloTTS (±130 neuron/Part). Kalau `lang: "EN-AU"` dsb. tidak didukung, bedakan dua pembicara dengan `speed`/narasi saja. Kalau container TTS mati dan Cloudflare juga gagal, Part ditunda ke malam berikutnya, bukan diganti `speechSynthesis`.
4. **Langkah validasi sebelum implementasi** (prototype kecil, ±1 jam):
   - Benchmark RTF Kokoro (int8) dan MeloTTS di VPS untuk satu Part 7 menit. Kalau total > 15 menit CPU per Part, turunkan ke 1 Part/malam atau pakai Piper GB/US.
   - Dengarkan 1 Part per aksen dan putuskan apakah kualitas MeloTTS `EN-AU` bisa diterima. Kalau tidak, Part beraksen AU dikurangi dulu sampai ada opsi lain.
   - Tes `lang` di Cloudflare MeloTTS dengan nilai `EN-AU`/`EN-BR`.
5. **Budget harian:** Groq ±15K token (7.5% TPD); Cloudflare skenario terburuk ±1.2K neuron (12% kuota); disk ±3.5 MB/hari.

## Pertanyaan terbuka untuk Learner

- Mau memasang kartu di Google Cloud demi kualitas Chirp 3 HD (1 juta karakter gratis/bulan, ada en-AU)? Default riset ini: tidak.
- Berapa Part Listening per hari: 1 Part (±7 menit) di sesi harian, atau full test 4 Part hanya di Checkpoint mingguan (ticket 04)?
- Apakah aksen AU dari MeloTTS diterima walau kualitasnya kemungkinan di bawah GB/US, mengingat tes untuk visa Australia?
- Audio yang sudah dikerjakan disimpan berapa lama (misalnya 30 hari) untuk replay di Review?
- Perlukah VOA/LibriVox sebagai jenis latihan tambahan (dikte), atau ditunda?

## Sumber

- IELTS format Listening: https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-listening
- IELTS scoring: https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare model katalog / MeloTTS / Aura: https://developers.cloudflare.com/workers-ai/models/ , https://developers.cloudflare.com/workers-ai/models/melotts/ , https://developers.cloudflare.com/workers-ai/models/aura-1/ , https://developers.cloudflare.com/workers-ai/models/aura-2-en/
- Deepgram voice dan aksen: https://developers.deepgram.com/docs/tts-models
- Groq rate limits dan Orpheus: https://console.groq.com/docs/rate-limits , https://console.groq.com/docs/text-to-speech , https://console.groq.com/docs/text-to-speech/orpheus
- Kokoro: https://huggingface.co/hexgrad/Kokoro-82M , https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md , https://github.com/thewh1teagle/kokoro-onnx
- MeloTTS: https://github.com/myshell-ai/MeloTTS , https://huggingface.co/myshell-ai/MeloTTS-English
- Piper: https://github.com/OHF-Voice/piper1-gpl , https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/LICENSING.md , https://huggingface.co/rhasspy/piper-voices/tree/main/en
- PyPI (wheel ARM64): https://pypi.org/project/piper-tts/ , https://pypi.org/project/kokoro-onnx/ , https://pypi.org/project/onnxruntime/
- Google Cloud TTS pricing: https://cloud.google.com/text-to-speech/pricing
- Azure Speech pricing: https://azure.microsoft.com/en-us/pricing/details/speech/
- ElevenLabs pricing: https://elevenlabs.io/pricing
- VOA copyright dan sitemap: https://learningenglish.voanews.com/p/6021.html , https://learningenglish.voanews.com/sitemap_428_news.xml.gz , https://learningenglish.voanews.com/robots.txt
- LibriVox: https://librivox.org/pages/public-domain/
- Spoken Wikipedia: https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Spoken_Wikipedia
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
