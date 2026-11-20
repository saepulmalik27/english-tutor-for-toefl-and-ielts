# Penilaian pronunciation berbiaya nol (riset per 2026-11-20)

Pertanyaan (ticket `02-penilaian-pronunciation`): Pronunciation (P) adalah 25% band Speaking, jadi tanpa penilaiannya band Speaking 7 tidak bisa diklaim. Opsi apa yang memberi skor per kata/fonem **tanpa biaya** dan **tanpa rekaman dipakai untuk training/human review**? Yang dibandingkan: layanan cloud (free tier), model open-source yang jalan di VPS ARM Oracle, dan proxy dari Whisper. Seberapa dekat hasilnya dengan descriptor Pronunciation IELTS?

Konteks: satu learner (L1 Indonesia), target IELTS GT Speaking 7, ujian sekitar Mei 2027. Latihan speaking ~15 menit/hari, rekaman `webm/opus` dari MediaRecorder, audio dibuang setelah dinilai. Pipeline sekarang: browser → server → Groq `whisper-large-v3` (word timestamps) → `gpt-oss-120b`, fallback Cloudflare Workers AI.

Legenda: **[terverifikasi]** = dibaca langsung dari sumber primer pada 2026-11-20. **[belum terverifikasi]** = sumber sekunder, angka tidak dipublikasikan, atau penilaian/perkiraan penulis.

## TL;DR

- **Primary: Azure AI Speech Pronunciation Assessment (PA), resource Free F0.** Ini satu-satunya opsi gratis yang memberi skor **per fonem, suku kata, dan kata** plus skor prosody (stress, intonation, rhythm) dan error `Mispronunciation` / `UnexpectedBreak` / `MissingBreak` / `Monotone`. Kuota F0 adalah **5 jam audio/bulan** (≈10 menit/hari). Untuk real-time STT dan PA, Microsoft menyatakan **tidak menyimpan data**. Pada speechocean762, Azure PA mencapai PCC 0,78 (utterance total) dan 0,84 (prosody), sedangkan GPT-4o zero-shot hanya 0,50.
- **Syarat yang harus diterima user:** akun Azure butuh **kartu kredit/debit** untuk verifikasi. Setelah 30 hari, akun harus di-upgrade ke pay-as-you-go supaya tidak dinonaktifkan. F0 sendiri tetap gratis, tetapi ini bergantung pada perilaku F0 saat kuota habis [belum terverifikasi, lihat §2.1].
- **Prosody hanya untuk `en-US`.** Akurasi fonem tersedia juga untuk `en-GB` dan `en-AU`. Azure membandingkan dengan "native speakers", jadi aksen Indonesia yang tetap jelas bisa ikut dihukum, padahal IELTS hanya menilai **efek aksen pada intelligibility**.
- **Fallback: open-source di Oracle.** Pakai `facebook/wav2vec2-lv-60-espeak-cv-ft` (Apache-2.0, output fonem IPA), bandingkan dengan fonem yang diharapkan dari transcript Whisper (G2P espeak-ng, GPL-3.0), lalu hitung **phoneme mismatch per kata**. Hasilnya hanya flag "kata yang mungkin salah ucap" tanpa prosody, dan dijalankan async. VPS Always Free sekarang **2 OCPU / 12 GB**, bukan 4/24, jadi latensinya perlu diukur dulu.
- **Proxy Whisper lemah.** Groq hanya mengembalikan `word, start, end` per kata, **tanpa probabilitas per kata**. Yang ada hanya `avg_logprob` per segment. Literatur yang menghubungkan probabilitas Whisper dengan mispronunciation masih tahap awal. Pakai hanya sebagai sinyal "bagian ini kurang jelas".
- **Pemetaan ke band IELTS harus diberi label "estimasi".** Tidak ada mapping resmi dari skor otomatis ke band P. Chunking, connected speech (elision/linking), contrastive stress, dan efek aksen pada intelligibility hanya bisa didekati. Tampilkan P sebagai **rentang** (misalnya "6–7, estimasi") dan jangan klaim band 7.

## 1. Descriptor Pronunciation IELTS dan apa yang bisa diukur mesin

Sumber: Speaking band descriptors, https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf , dan key assessment criteria, https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf [terverifikasi, PDF dibaca dengan `pdftotext`].

| Band | Isi descriptor P (diringkas, istilah asli dipertahankan) |
|---|---|
| 8 | "Uses a wide range of phonological features to convey precise and/or subtle meaning." "Can sustain appropriate rhythm. Flexible use of stress and intonation across long utterances, despite occasional lapses." "Can be easily understood throughout." "Accent has minimal effect on intelligibility." |
| 7 | "Displays all the positive features of band 6, and some, but not all, of the positive features of band 8." |
| 6 | "Uses a range of phonological features, but control is variable." "Chunking is generally appropriate, but rhythm may be affected by a lack of stress-timing and/or a rapid speech rate." "Some effective use of intonation and stress, but this is not sustained." "Individual words or phonemes may be mispronounced but this causes only occasional lack of clarity." "Can generally be understood throughout without much effort." |
| 5 | "Displays all the positive features of band 4, and some, but not all, of the positive features of band 6." |
| 4 | Range terbatas; "frequent lapses in overall rhythm"; kontrol intonation/stress terbatas; "Individual words or phonemes are frequently mispronounced, causing lack of clarity"; "Understanding requires some effort". |

Key indicators resmi untuk P ada lima [terverifikasi]: (1) membagi ujaran menjadi *chunks* yang bermakna; (2) rhythm dan stress timing, serta *linking/elision* untuk connected speech; (3) stress (emphatic/contrastive) dan intonation untuk memperkuat makna; (4) produksi bunyi di level kata dan fonem (word stress, vokal, konsonan) dan usaha yang dibutuhkan pendengar; (5) efek keseluruhan aksen pada intelligibility.

**Apa yang bisa diukur alat otomatis** (penilaian penulis [belum terverifikasi], dasarnya fitur yang terdokumentasi di §2–§4):

| Indikator IELTS | Bisa diukur? | Dengan apa |
|---|---|---|
| (4) fonem/kata, word stress | **Ya, paling kuat** | Azure `AccuracyScore` per fonem/suku kata/kata. Open-source: phoneme mismatch atau GOP. Word stress di speechocean762 paling sulit diprediksi (PCC 0,15–0,36, §5). |
| (2) rhythm, stress-timing | Sebagian | Azure `ProsodyScore` (en-US). Durasi suku kata dan rasio vokal bisa dihitung sendiri tetapi belum tervalidasi. |
| (1) chunking | Sebagian | Azure `UnexpectedBreak`/`MissingBreak`. Gap antar kata dari Whisper timestamps (sudah dipakai untuk FC). |
| (3) intonation dan contrastive stress untuk makna | **Lemah** | Azure hanya mendeteksi `Monotone`. Penggunaan intonasi "untuk makna" butuh pemahaman konteks dan tidak ada alat yang mengukurnya. |
| (2) connected speech (linking, elision) | **Tidak** | Tidak ada output khusus. Elision malah bisa dihitung sebagai "salah ucap" oleh skor berbasis fonem kanonik. |
| (5) aksen vs intelligibility | Proxy | Kesepakatan dua ASR (Whisper vs Azure), `avg_logprob`. Ini bukan ukuran persepsi manusia. |

## 2. Layanan cloud

### 2.1 Azure AI Speech: Pronunciation Assessment

**Fitur** [terverifikasi] (https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment):
- **Scripted** (`ReferenceText` diisi, skenario "reading") dan **unscripted** (`ReferenceText` kosong, skenario "speaking"). Untuk unscripted, model STT-nya "different from Azure STT". Microsoft menyarankan: *"If you need assessment based on highly accurate recognized text, we recommend first calling Azure STT to obtain the reference text, and then performing scripted assessment."* Di pipeline ini, peran itu bisa diisi oleh transcript Whisper.
- Granularity `Phoneme` memberi skor full text, kata, suku kata, dan fonem. Suku kata hanya untuk en-US. Alfabet fonem IPA, dengan `NBestPhonemes` (fonem alternatif yang terdengar).
- Skor: `AccuracyScore` ("how closely the phonemes match a native speaker's pronunciation"), `FluencyScore` (silent breaks), `CompletenessScore` (scripted saja), `ProsodyScore` ("stress, intonation, speaking speed, and rhythm"), `PronScore` (gabungan berbobot). `ErrorType` per kata: `Mispronunciation` (word accuracy < 60), `Omission`, `Insertion`, `UnexpectedBreak`, `MissingBreak`, `Monotone`.
- *"Prosody assessment is only available in the en-US locale."* Audio > 30 detik harus memakai **continuous mode** di SDK, dan di mode itu `EnableMiscue` tidak didukung.
- REST short audio: *"For pronunciation assessment, the audio duration should be no more than 30 seconds."* Format yang diterima WAV PCM 16 kHz mono atau **OGG OPUS**. `webm/opus` dari browser perlu di-remux ke ogg (tanpa re-encode) atau dikonversi ke WAV. Header `Pronunciation-Assessment` (Base64 JSON) mendukung `EnableProsodyAssessment`. https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short
- Locale PA: 33 locale, termasuk `en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`. https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment
- Pricing: accuracy, fluency, completeness, dan miscue termasuk harga dasar STT. **Prosody adalah add-on** ("Included in baseline speech to text price? No"). https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool

**Kuota dan biaya** [terverifikasi kecuali disebut lain]:
- Free (F0): *"Real-time Transcription: 5 audio hours free per month"*, dibagi antara Standard dan Custom. https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/ . Harga add-on prosody tampil "$-" di halaman (tidak terbaca). Apakah PA + prosody di F0 memakai kuota 5 jam yang sama atau ditolak **belum terverifikasi**; FAQ menyebut PA "charged as standard Speech to Text".
- F0: concurrency real-time **1 request**, tidak bisa dinaikkan. https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits
- Akun: *"All you need is a phone number, a credit card or a debit card (non-prepaid)"*. *"We'll never charge you unless you decide to move to pay-as-you-go pricing"*. Kalau setelah 30 hari tidak di-upgrade, *"your account and services will be disabled."* https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account . Jadi pemakaian jangka panjang (sampai Mei 2027) **mewajibkan upgrade ke PAYG**. Setelah itu yang menjaga biaya tetap $0 adalah tier F0 resource. Bahwa F0 menolak request saat kuota habis dan tidak berubah jadi tagihan **belum terverifikasi** di halaman resmi; uji dengan budget alert $1 di Cost Management.
- Azure for Students tanpa kartu kredit hanya untuk email akademik (https://azure.microsoft.com/en-us/pricing/free-services/), jadi kemungkinan tidak relevan.

**Privasi** [terverifikasi]: *"When doing real-time speech to text, fast transcription, pronunciation assessment, and speech translation, Microsoft does not retain or store the data provided by customers."* https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security . Halaman ini tidak menyebut training; karena data tidak disimpan, training atas rekaman praktis tidak mungkin (inferensi penulis). Syarat ini lebih kuat dari Gemini free tier.

**Akurasi** [terverifikasi]: Microsoft hanya menyatakan *">0.5 Pearson correlation with human judges"* dan bahwa PA *"compares the submitted audio to native speakers"*. https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/pronunciation-assessment/characteristics-and-limitations-pronunciation-assessment . Angka independen ada di §5.

### 2.2 Google Cloud, AWS, Cloudflare

- **Google Cloud Speech-to-Text** tidak punya fitur pronunciation assessment. Yang ada `enable_word_confidence` (confidence per kata). https://cloud.google.com/speech-to-text/v2/docs/word-confidence [terverifikasi dari ringkasan pencarian; halaman tidak dibuka penuh: belum terverifikasi]. Free tier 60 menit/bulan untuk V1 API. Free trial butuh kartu, tetapi tidak ditagih otomatis setelah 90 hari. https://docs.cloud.google.com/free/docs/free-cloud-features [terverifikasi]. Data logging opt-in; default *"does not log customer audio data or transcripts"*. https://docs.cloud.google.com/speech-to-text/docs/data-logging [terverifikasi]. Fungsinya paling banyak sebagai proxy confidence, sama seperti Whisper, dengan kuota 2 menit/hari.
- **Amazon Transcribe** tidak punya pronunciation assessment. Secara default, voice input *dapat* disimpan dan dipakai untuk improve layanan Amazon. Opt-out lewat AWS Organizations AI services opt-out policy. https://aws.amazon.com/transcribe/faqs/ [terverifikasi]. **Default-nya melanggar syarat privasi**, jadi tidak direkomendasikan.
- **Cloudflare Workers AI**: dokumentasi `whisper-large-v3-turbo` tidak menunjukkan field `words` dengan probabilitas (https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/ [terverifikasi]). Tidak ditemukan model pronunciation assessment di katalog [belum terverifikasi, katalog tidak ditelusuri penuh].

### 2.3 Vendor khusus (SpeechAce, SpeechSuper, ELSA)

- **SpeechAce**: *"All of our API plans come with a free trial."* Harga per request 15 detik USD 0,008 (Basic/Pro). https://api-docs.speechace.com/other-resources/faqs [terverifikasi]. Ini trial, bukan free tier permanen. Kebijakan data tidak dibaca.
- **SpeechSuper**: punya "English IELTS Speaking" dan spontaneous speech assessment (skor pronunciation, fluency, grammar, vocabulary). Ada tombol free trial, tetapi harga tidak tercantum di beranda. https://www.speechsuper.com/ [terverifikasi untuk fitur]. Harga dari agregator (USD 0,004–0,008/request) [belum terverifikasi].
- **ELSA API**: harga "contact vendor" menurut direktori. https://www.capterra.com/p/246292/ELSA-Speech-Recognition-API/ [belum terverifikasi].
- Kesimpulan: tidak ada yang gratis permanen. Skor "IELTS-like" dari vendor juga tidak dipublikasikan validasinya terhadap band resmi. Tidak memenuhi syarat 0 rupiah.

## 3. Open-source di Oracle A1 (ARM64, tanpa GPU)

Catatan host: Always Free A1 sekarang *"the first 1,500 OCPU hours and 9,000 GB hours per month ... equivalent to 2 OCPUs and 12 GB of memory"*. https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm [terverifikasi]. Ini sama dengan catatan `research/hosting-db-gratis` dan **lebih kecil** dari asumsi brief (4 OCPU / 24 GB). VM ini juga dipakai bersama Next.js, Postgres, dan n8n.

| Opsi | Lisensi | Output | Butuh reference text? | ARM CPU | Kematangan |
|---|---|---|---|---|---|
| `facebook/wav2vec2-lv-60-espeak-cv-ft` | Apache-2.0 (model card) [terverifikasi] https://huggingface.co/facebook/wav2vec2-lv-60-espeak-cv-ft | String fonem IPA (espeak). Tanpa skor; skor dibuat sendiri dari perbandingan dengan fonem yang diharapkan, atau dari posterior CTC (GOP-style). | Ya untuk skor. Pakai transcript Whisper → espeak-ng G2P (GPL-3.0+ [terverifikasi] https://github.com/espeak-ng/espeak-ng) | PyTorch punya wheel `manylinux_2_28_aarch64` (torch 2.15.0, PyPI) [terverifikasi]. Model "large" (wav2vec2-large-lv60). Perkiraan 60 detik audio di 2 core: **±10–40 detik** [belum terverifikasi, hitungan kasar FLOP; wajib di-benchmark] | Model 2021–2023, dipakai luas untuk phoneme recognition. Pipeline skor harus dirakit sendiri. |
| Allosaurus | GPL-3.0 (repo) [terverifikasi] https://github.com/xinjli/allosaurus | Phone sequence universal (~230 phone), timestamp "only an approximation" | Ya (sama seperti di atas) | CPU default, model kecil. Lisensi pretrained model tidak disebut [terverifikasi: tidak ada] | Riset 2020, tanpa release |
| Kaldi GOP (`egs/gop_speechocean762`) + GOPT | Kaldi Apache-2.0 (conda-forge, tersedia `linux-aarch64`) [terverifikasi] https://api.anaconda.org/package/conda-forge/kaldi ; GOPT BSD-3-Clause [terverifikasi] https://github.com/YuanGongND/gopt | GOP per fonem. GOPT: skor fonem, kata (accuracy/stress/total), dan utterance (accuracy, fluency, prosodic, total) | Ya (forced alignment ke fonem kanonik) | Kaldi jalan di ARM. Model GOPT kecil, tetapi butuh acoustic model TDNN LibriSpeech dan pipeline Kaldi | Recipe resmi Kaldi. GOPT 2022; tutorial inference punya bug yang dilaporkan (issue #15) [terverifikasi]. Setup paling berat. |
| Montreal Forced Aligner | MIT; conda-forge platforms `linux-64, noarch, osx-*, win-64` (tanpa `linux-aarch64` eksplisit) [terverifikasi] https://api.anaconda.org/package/conda-forge/montreal-forced-aligner | Alignment kata/fonem dan durasi. **Tidak** memberi skor pronunciation | Ya | Belum pasti di aarch64 [belum terverifikasi] | Matang untuk alignment |
| MultiPA (Chen, Yu, Hirschberg, Interspeech 2024) | Tidak ada rilis kode di paper [terverifikasi] https://arxiv.org/html/2308.12490v2 | Sentence accuracy/fluency/prosody, word accuracy | **Tidak** (open response, transcript dari Whisper) | n/a | Hanya paper |
| faster-whisper self-host | MIT [terverifikasi] https://github.com/SYSTRAN/faster-whisper | `Word.probability` per kata [terverifikasi, `transcribe.py`] | Tidak | ARM tidak disebut di README. Benchmark small int8 pada i7-12700K: 13 menit audio dalam 1m42s [terverifikasi] | Matang, tetapi hanya proxy (§4) |

Ringkasnya: **tidak ada paket open-source siap pakai** yang memberi skor pronunciation free-speech dengan prosody dan jalan di ARM. Pilihan realistis adalah wav2vec2 phoneme recognizer + G2P + alignment sebagai detektor salah ucap, dengan label "indikasi". GOPT memberi skor multi-aspek tetapi setupnya paling mahal (Kaldi + acoustic model + fitur GOP), dan modelnya dilatih pada anak/dewasa ber-L1 Mandarin yang membaca kalimat (§5).

## 4. Proxy dari Whisper

- **Groq** `verbose_json` [terverifikasi] https://console.groq.com/docs/speech-to-text : segment berisi `id, seek, start, end, text, tokens, temperature, avg_logprob, compression_ratio, no_speech_prob`. Untuk granularitas kata, *"`word` returns only word, start, and end timestamps"*, jadi **tidak ada probabilitas per kata**. Docs Groq sendiri menyebut penurunan `avg_logprob` bisa berarti "unclear pronunciation, or strong accents", di samping noise.
- Probabilitas per kata baru ada kalau Whisper di-host sendiri (faster-whisper `Word.probability`). Itu menambah beban CPU di VM 2 OCPU dan menduplikasi Groq.
- **Bukti korelasi** (semua sekunder atau skala kecil):
  - Sohail & Ballier (NLP4CALL 2026) merangkum bahwa "lower subtoken probability scores have been associated with mispronunciation and lower speech proficiency (Ballier et al., 2024a)". Dalam eksperimen mereka sendiri (satu penutur Italia, 14 token), token yang salah justru mendapat skor Whisper lebih tinggi dari rata-rata token benar, dan mereka menyimpulkan output ini "should be interpreted with appropriate caution". https://aclanthology.org/2026.nlp4call-1.8.pdf [terverifikasi, PDF dibaca]
  - Ballier et al. 2024, "Whisper for L2 speech scoring": probabilitas subtoken bisa dipakai untuk klasifikasi level learner (kNN). [belum terverifikasi: ringkasan pencarian; PDF 404] https://statsmaths.github.io/pdf/2024-whisperl2.pdf
  - Won et al. (Journal of Second Language Pronunciation): pada learner SD Korea, ASR "menengah" (Whisper Base, HuBERT) lebih berkorelasi dengan rating comprehensibility/accentedness manusia daripada ASR terbaik (large-v3). [belum terverifikasi: halaman 403] https://www.jbe-platform.com/content/journals/10.1075/jslp.25012.won
  - Zou (tesis VU 2024): threshold confidence Whisper untuk intelligibility per kata "fell short of expectations". [belum terverifikasi] https://home.cltl.labs.vu.nl/static/data/theses/thesis_Furong_Zou_2024.pdf
- Kesimpulan: Whisper yang besar dan robust justru **menutupi** salah ucap karena language model-nya "menebak" kata yang benar. Proxy ini cocok untuk intelligibility kasar (indikator 5), tidak untuk skor fonem.

## 5. Seberapa dekat dengan descriptor IELTS, dan cara memetakan secara jujur

**Data pembanding: speechocean762.** 5.000 ujaran dari 250 penutur non-native (setengahnya anak-anak), dianotasi 5 ahli di level kalimat, kata, dan fonem. Bebas untuk komersial dan non-komersial (https://arxiv.org/abs/2104.01378 [terverifikasi]). Recipe Kaldi menyebut penuturnya **Mandarin** dan materinya membaca kalimat (https://github.com/kaldi-asr/kaldi/tree/master/egs/gop_speechocean762 [terverifikasi]). Lisensi di Hugging Face apache-2.0 (https://huggingface.co/datasets/mispeech/speechocean762 [terverifikasi]). Skalanya bukan skala IELTS.

PCC dengan skor manusia pada test set speechocean762 (Wang et al. 2025, Table 1) [terverifikasi] https://arxiv.org/html/2503.11229v1 :

| Sistem | Word acc. | Utt. accuracy | Utt. fluency | Utt. prosody | Utt. total |
|---|---|---|---|---|---|
| Azure PA | 0,623 | 0,700 | 0,715 | **0,842** | **0,782** |
| GOPT | 0,533 | 0,714 | 0,753 | 0,760 | 0,742 |
| 3MH (riset, terbaik di tabel) | 0,682 | 0,782 | 0,843 | 0,836 | 0,811 |
| GPT-4o zero-shot (audio) | 0,216–0,260 | 0,43–0,47 | 0,42–0,46 | 0,41–0,44 | 0,45–0,50 |

Tambahan: MultiPA tanpa reference text memperoleh sentence total 0,730 dan word accuracy 0,427 (https://arxiv.org/html/2308.12490v2 [terverifikasi]). Model GOPT yang dirilis memperoleh word stress hanya 0,15–0,33 (https://github.com/YuanGongND/gopt [terverifikasi]). **Implikasinya:** menilai pronunciation dengan LLM multimodal (misalnya mengirim audio ke Gemini/GPT-4o) jelas lebih buruk dari Azure PA. Ini alasan tambahan, di luar privasi, untuk tidak memakai LLM sebagai penilai P.

**Batas validitas** [penilaian penulis, belum terverifikasi]:
1. Semua angka berasal dari **reading** (scripted) oleh penutur L1 Mandarin. Free speech oleh L1 Indonesia belum diukur. Skor unscripted Azure untuk learner ini bisa berbeda.
2. Skor Azure diukur terhadap "native speaker" en-US. IELTS tidak meminta aksen native; band 8 cukup "accent has minimal effect on intelligibility". Jadi `AccuracyScore` yang rendah karena aksen belum tentu berarti band P rendah.
3. Tidak ada mapping resmi dari skor 0–100 ke band IELTS. Ambang apa pun adalah heuristik.

**Usulan pemetaan jujur** (heuristik desain):
- Setiap sesi menampilkan **rentang P** dengan label "estimasi", dibentuk dari empat sinyal yang ditautkan ke kalimat descriptor:
  - (a) persentase kata `Mispronunciation` per 100 kata ↔ "occasional" (6) vs "frequently" (4) mispronounced;
  - (b) kesepakatan transcript Whisper vs Azure (WER antar-ASR) ↔ "understood throughout without much effort";
  - (c) `ProsodyScore` + `Monotone` ↔ "stress and intonation ... not sustained" (6) vs "sustain appropriate rhythm" (8);
  - (d) break errors ↔ chunking.
- Aturan band 7 mengikuti descriptor: "semua fitur positif band 6 **dan sebagian** fitur band 8". Klaim 7 hanya kalau (a) dan (b) memenuhi kriteria band 6 secara konsisten **dan** minimal satu sinyal band 8 terpenuhi di beberapa sesi berturut-turut.
- Selalu tampilkan "**tidak dinilai**" untuk connected speech (linking/elision) dan penggunaan intonation/contrastive stress untuk makna. Prosody juga diberi label "terhadap norma en-US".
- Kalibrasi: minta 2–3 rekaman dinilai manusia (guru/mock test resmi) sebelum ambang dipercaya. Simpan hanya skornya, bukan audionya.

## 6. Rekomendasi

**Primary: Azure PA F0, scripted dengan transcript Whisper sebagai reference, `en-US` + prosody.**
- Kuota: 5 jam/bulan = 300 menit, sekitar **10 menit audio jawaban/hari**. Latihan 15 menit/hari kemungkinan menghasilkan 8–10 menit audio jawaban [belum terverifikasi; tergantung porsi mendengar soal dan membaca feedback]. Ini **pas-pasan**, jadi pasang budget harian di DB (misalnya 9 menit). Kalau habis, jawaban berikutnya pakai fallback atau "P tidak dinilai". Prioritaskan Part 2 (long turn), karena paling representatif untuk rhythm dan intonation.
- Integrasi:
  1. Browser `webm/opus` → server action.
  2. `ffmpeg` remux ke OGG/Opus (atau WAV 16 kHz mono) di memori/tmp.
  3. Groq Whisper `verbose_json` + word timestamps (sudah ada).
  4. Potong audio di gap antar kata Whisper menjadi chunk ≤ 30 detik (batas REST). Kirim **berurutan** (F0 concurrency 1) ke REST short audio dengan `Pronunciation-Assessment: {ReferenceText: <teks chunk dari Whisper>, GradingSystem: HundredMark, Granularity: Phoneme, Dimension: Comprehensive, EnableProsodyAssessment: True}`. Alternatifnya, Speech SDK JS dengan continuous mode untuk satu file utuh.
  5. Gabungkan skor per kata/fonem menjadi sinyal (a)–(d) §5.
  6. LLM menerima **angka dan daftar kata bermasalah sebagai fakta**, bukan audio, lalu menulis feedback dalam Bahasa Indonesia (pola yang sama seperti fluency metrics di `research/rujukan-speaking-scoring` §1.2).
  7. Hapus file tmp.
- Latensi: 1–2 menit audio = 3–5 chunk berurutan. Waktu proses per chunk Azure **belum terverifikasi**; jalankan spike pengukuran dulu. Kalau total > 20–30 detik, tampilkan feedback FC/LR/GRA dulu dan P menyusul (streaming UI).
- Catatan: Whisper bisa "merapikan" ucapan (lihat rujukan-speaking-scoring §1.5). Akibatnya reference text kadang berbeda dari yang diucapkan, dan Azure akan menandai kata itu `Mispronunciation`. Tampilkan sebagai "periksa", bukan vonis.

**Fallback: wav2vec2 phoneme recognizer di Oracle (async).** Container Python (torch aarch64, `transformers`, `phonemizer`/espeak-ng). Input audio + transcript Whisper. Output per kata: fonem diharapkan vs terdengar dan mismatch rate. Hanya untuk flag "kata mungkin salah ucap", tanpa skor prosody dan tanpa klaim band. Jalankan di luar jalur interaktif kalau benchmark di 2 OCPU melebihi ±20 detik. Proxy `avg_logprob` Groq tetap dipakai sebagai sinyal intelligibility murah di kedua jalur.

**Tidak direkomendasikan:** LLM audio (PCC ~0,5 dan masalah privasi Gemini), AWS Transcribe (default memakai data), vendor SpeechAce/SpeechSuper/ELSA (trial saja, berbayar), GOPT/Kaldi (setup berat untuk satu learner, kecuali fallback wav2vec2 terbukti terlalu kasar).

## 7. Pertanyaan terbuka untuk user

1. Bersedia membuat akun Azure dengan **kartu kredit/debit** dan meng-upgrade ke **pay-as-you-go** setelah 30 hari, dengan pengaman resource F0 + budget alert? Kalau tidak, primary turun ke fallback open-source dan P hanya menjadi "indikasi".
2. Target aksen: prosody hanya tersedia untuk en-US. Bisa diterima, atau pakai `en-GB`/`en-AU` (akurasi fonem saja, tanpa prosody)? IELTS sendiri tidak mensyaratkan aksen tertentu.
3. Berapa menit **audio jawaban** per hari yang realistis? Ini menentukan apakah 5 jam/bulan cukup atau perlu memilih jawaban mana yang dinilai.
4. Mau satu sesi kalibrasi dengan penilai manusia (berbayar sekali) supaya ambang band P tidak murni heuristik?
5. Spike teknis yang perlu dilakukan sebelum implementasi: (a) latensi Azure REST per chunk di F0; (b) apakah prosody add-on jalan di F0 tanpa biaya; (c) benchmark wav2vec2-large di A1 2 OCPU.

## Sumber

- IELTS Speaking band descriptors: https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf
- IELTS Speaking key assessment criteria: https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf
- Azure PA how-to: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
- Azure PA tool dan pricing per skor: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool
- Azure REST short audio: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short
- Azure language support (PA): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment
- Azure Speech pricing: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/
- Azure Speech quotas: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits
- Azure akun gratis/FAQ: https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
- Azure STT data privacy: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security
- Azure PA characteristics and limitations: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/pronunciation-assessment/characteristics-and-limitations-pronunciation-assessment
- Google free tier: https://docs.cloud.google.com/free/docs/free-cloud-features ; data logging: https://docs.cloud.google.com/speech-to-text/docs/data-logging ; word confidence: https://cloud.google.com/speech-to-text/v2/docs/word-confidence
- AWS Transcribe FAQ: https://aws.amazon.com/transcribe/faqs/
- Cloudflare whisper-large-v3-turbo: https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/
- Groq speech-to-text: https://console.groq.com/docs/speech-to-text
- SpeechAce FAQ: https://api-docs.speechace.com/other-resources/faqs ; SpeechSuper: https://www.speechsuper.com/
- Oracle Always Free: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- wav2vec2 espeak: https://huggingface.co/facebook/wav2vec2-lv-60-espeak-cv-ft ; Allosaurus: https://github.com/xinjli/allosaurus ; espeak-ng: https://github.com/espeak-ng/espeak-ng
- Kaldi GOP recipe: https://github.com/kaldi-asr/kaldi/tree/master/egs/gop_speechocean762 ; GOPT: https://github.com/YuanGongND/gopt , https://arxiv.org/abs/2205.03432
- MFA: https://github.com/MontrealCorpusTools/Montreal-Forced-Aligner ; faster-whisper: https://github.com/SYSTRAN/faster-whisper
- speechocean762: https://arxiv.org/abs/2104.01378 , https://huggingface.co/datasets/mispeech/speechocean762
- Wang et al. 2025, LMM untuk pronunciation assessment: https://arxiv.org/html/2503.11229v1
- MultiPA: https://arxiv.org/html/2308.12490v2
- Sohail & Ballier 2026: https://aclanthology.org/2026.nlp4call-1.8.pdf
- Riset sebelumnya: branch `research/rujukan-speaking-scoring`, `research/stack-ai-gratis`, `research/format-ielts-gt`, `research/hosting-db-gratis`
