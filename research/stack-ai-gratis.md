# Stack AI gratis untuk english-tutor (riset per 2026-11-15)

Pertanyaan: provider AI mana yang bisa menjalankan latihan TOEFL iBT speaking + quiz untuk satu learner dengan biaya **$0/bulan**? Yang dibandingkan: Groq, Cloudflare Workers AI, dan Google Gemini API (sebagai pembanding), plus opsi TTS gratis.

Legenda: **[terverifikasi]** = dibaca langsung dari sumber primer pada 2026-11-15. **[belum terverifikasi]** = sumber sekunder, angka tidak dipublikasikan, atau penilaian penulis.

## TL;DR

- **Primary: Groq.** Pakai `whisper-large-v3` untuk STT (gratis 28.8K detik audio/hari) dan `openai/gpt-oss-120b` untuk grading dan feedback (gratis 200K token/hari). Kontraknya melarang training atas input/output. Aktifkan Zero Data Retention.
- **Fallback: Cloudflare Workers AI.** Pakai `@cf/openai/whisper-large-v3-turbo` dan `@cf/openai/gpt-oss-120b` (atau `gpt-oss-20b` yang lebih hemat). Beban harian diperkirakan ~2.9K dari 10K neuron gratis per hari. Cloudflare juga menyatakan tidak melatih model dengan data pelanggan.
- **TTS:** Web Speech API di browser (`speechSynthesis`, nol biaya, tanpa server). Kalau butuh file audio: Cloudflare `@cf/myshell-ai/melotts` (sangat murah dalam neuron).
- **Gemini free tier: jangan dipakai untuk rekaman suara.** Di free tier, prompt dan respons dipakai untuk memperbaiki produk Google dan bisa dibaca reviewer manusia (Indonesia tidak termasuk pengecualian EEA/UK/Swiss). Batas per-model juga tidak dipublikasikan di docs.

## 1. Groq

### Limit free plan [terverifikasi]

Sumber: https://console.groq.com/docs/rate-limits. Angka diambil dari tabel `freeRows` di source halaman, karena tampilan halamannya tidak menunjukkan dengan jelas tabel mana yang untuk plan apa.

| Model | RPM | RPD | TPM | TPD | ASH (detik audio/jam) | ASD (detik audio/hari) |
|---|---|---|---|---|---|---|
| `openai/gpt-oss-120b` | 30 | 1K | 8K | 200K | - | - |
| `openai/gpt-oss-20b` | 30 | 1K | 8K | 200K | - | - |
| `qwen/qwen3.8-27b` (preview) | 30 | 1K | 8K | 200K | - | - |
| `whisper-large-v3` | 20 | 2K | - | - | 7.2K | 28.8K |
| `whisper-large-v3-turbo` | 20 | 2K | - | - | 7.2K | 28.8K |
| `canopylabs/orpheus-v1-english` (TTS, preview) | 10 | 100 | 1.2K | 3.6K | - | - |

Catatan:

- `llama-3.3-70b-versatile` dan `llama-3.1-8b-instant` sekarang diberi label "Enterprise tier" di https://console.groq.com/docs/models dan tidak ada di tabel free plan. Jadi LLM yang realistis tersedia gratis adalah gpt-oss-120b/20b dan qwen3.8-27b. Qwen berstatus preview, dan menurut halaman models "should not be used in production".
- STT ([docs](https://console.groq.com/docs/speech-to-text)): batas file 25 MB di free tier, durasi minimum yang ditagih/dihitung 10 detik, format webm/ogg/m4a/wav dan lainnya. `verbose_json` memberi timestamp per kata dan segmen plus `avg_logprob` dan `no_speech_prob`. WER yang dikutip Groq: v3 10.3%, v3-turbo 12%. Karena di free plan keduanya punya limit yang sama, **pakai `whisper-large-v3`** yang lebih akurat.
- Limit RPD reset harian. Groq tidak menyebut jam reset di halaman tersebut [belum terverifikasi].

### Data policy [terverifikasi]

- Services Agreement §4.2: *"Groq is not permitted to use Inputs or Outputs for training or fine-tuning any AI Model Services or other models"* kecuali ada izin eksplisit dari customer. Juga: *"Groq does not access, use, store, or retain Inputs or Outputs except as necessary to provide the Cloud Services."* https://console.groq.com/docs/legal/services-agreement
- https://console.groq.com/docs/your-data menyebut data inference tidak di-retain secara default, tetapi bisa di-log sementara hingga 30 hari untuk reliability atau abuse. Log ini bisa dimatikan lewat **Zero Data Retention (ZDR)** di Data Controls ("All customers may enable ZDR").
- Ada ketidakkonsistenan kecil: Services Agreement menulis "Eligible Customers may enable ... zero data retention", sedangkan halaman docs menulis "All customers". Apakah akun free bisa mengaktifkan ZDR perlu dicek langsung di console [belum terverifikasi].

### Pemakaian dari Next.js [terverifikasi]

- SDK resmi `groq-sdk` (Context7 `/groq/groq-typescript`). `client.audio.transcriptions.create({ model, file, language: 'en', response_format: 'verbose_json', timestamp_granularities: ['word'] })` menerima `File` web secara langsung. Artinya `File` dari `FormData` di server action bisa diteruskan tanpa diubah.
- Endpoint juga OpenAI-compatible (`https://api.groq.com/openai/v1`), jadi `ChatOpenAI` dengan `baseUrl` yang sudah ada di `lib/ai.ts` bisa dipakai untuk chat. Base URL ini diambil dari pengetahuan umum docs Groq dan tidak dibuka ulang saat riset ini [belum terverifikasi].

## 2. Cloudflare Workers AI

### Limit free [terverifikasi]

Sumber: https://developers.cloudflare.com/workers-ai/platform/pricing/

- **10,000 Neurons per hari**, reset pukul 00:00 UTC (07:00 WIB). Di Workers Free, kalau kuota terlampaui maka *"further operations will fail with an error"*. Tidak ada tagihan kejutan.
- Biaya neuron per model yang relevan:

| Model | Input | Output / unit lain |
|---|---|---|
| `@cf/openai/gpt-oss-120b` | 31,818 / M token | 68,182 / M token |
| `@cf/openai/gpt-oss-20b` | 18,182 / M token | 27,273 / M token |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 26,668 / M token | 204,805 / M token |
| `@cf/google/gemma-4-26b-a4b-it` | 9,091 / M token | 27,273 / M token |
| `@cf/qwen/qwen3-30b-a3b-fp8` | 4,625 / M token | 30,475 / M token |
| `@cf/openai/whisper-large-v3-turbo` | 46.63 / menit audio | |
| `@cf/openai/whisper` | 41.14 / menit audio | |
| `@cf/baai/bge-m3` (embeddings) | 1,075 / M token | |
| `@cf/myshell-ai/melotts` (TTS) | 18.63 / menit audio | |
| `@cf/deepgram/aura-1` (TTS) | 1,363.64 / 1K karakter | |
| `@cf/deepgram/aura-2-en` (TTS) | 2,727.27 / 1K karakter | |

- Rate limit (https://developers.cloudflare.com/workers-ai/platform/limits/): text generation 300 RPM, ASR 720 RPM, embeddings 3,000 RPM. Beberapa model mewajibkan Workers Paid. Halaman gpt-oss-120b tidak menyebut apakah model itu termasuk, jadi ketersediaannya di akun free perlu dites [belum terverifikasi].
- Vectorize di Workers Free: 30 juta queried vector dimensions per bulan, 5 juta stored dimensions, 100 index (https://developers.cloudflare.com/vectorize/platform/pricing/). Untuk satu learner ini jauh lebih dari cukup. Contoh: 5 juta dimensi setara ~4,800 vektor 1024-dim dari bge-m3.

### Data policy [terverifikasi]

*"Cloudflare does not use Customer Content processed by Workers AI to train AI models."* Input dan output tidak di-retain setelah respons dikirim, kecuali saat memakai fitur yang memang menyimpan data (AI Gateway logging/caching, R2, Vectorize, dll.). https://developers.cloudflare.com/workers-ai/platform/data-usage/

### Pemakaian dari Next.js [terverifikasi]

- REST: `POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{model}` dengan header `Authorization: Bearer {API_TOKEN}`. Token perlu permission Workers AI Read + Edit. https://developers.cloudflare.com/workers-ai/get-started/rest-api/
- OpenAI-compatible: base URL `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1`, mendukung `/chat/completions` dan `/embeddings`. Artinya `ChatOpenAI` di `lib/ai.ts` cukup diberi `baseUrl` ini. https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- Whisper via REST tidak tersedia lewat jalur OpenAI-compatible. Kirim `audio` lewat `/ai/run/@cf/openai/whisper-large-v3-turbo`. Parameternya `language`, `vad_filter`, `initial_prompt`, dan outputnya `transcription_info.text`, `segments`, `vtt`. Format persis input `audio` (base64 atau bukan) dan batas ukurannya tidak dijelaskan di halaman model [belum terverifikasi].

## 3. Google Gemini API (pembanding)

### Limit free [sebagian belum terverifikasi]

- Pricing page (https://aistudio.google.com/docs/pricing) [terverifikasi] menandai "Free of charge" untuk antara lain `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`, TTS (`gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`), embeddings (`gemini-embedding-2`), dan `gemini-3.5-transcribe`. `gemini-3.1-pro-preview` tidak tersedia di free tier.
- **Penting untuk `lib/ai.ts`:** `gemini-2.5-flash` dan `gemini-2.5-pro` ditandai deprecated, dengan request di-route ke model lain mulai **1 Desember 2026**. Default `gemini-2.5-flash` di `lib/ai.ts` perlu diganti.
- Angka RPM/TPM/RPD per model **tidak dipublikasikan** di docs. Docs hanya mengarahkan ke https://aistudio.google.com/rate-limit, yang harus dilihat per project (https://aistudio.google.com/docs/rate-limits). Limit berlaku per project, RPD reset tengah malam waktu Pacific, dan *"not guaranteed"*.
- Blog pihak ketiga melaporkan angka yang saling bertentangan, misalnya Flash 250 RPD, lalu 100, lalu 20 RPD setelah pemangkasan. Anggap **tidak bisa diandalkan** [belum terverifikasi].

### Data policy [terverifikasi]

Gemini API Additional Terms (https://aistudio.google.com/docs/terms), untuk Unpaid Services:

- Google *"uses the content you submit ... and any generated responses to provide, improve, and develop"* produk dan teknologi ML-nya.
- *"human reviewers may read, annotate, and process your API input and output"*, dan *"Do not submit sensitive, confidential, or personal information to the Unpaid Services."*
- Pengecualian hanya berlaku untuk EEA/Swiss/UK, tempat data-use terms versi paid berlaku. **Indonesia tidak termasuk.** Pricing page juga menulis "Used to improve our products: Yes" untuk semua model di free tier.

Kesimpulannya, rekaman suara learner **tidak boleh** dikirim ke Gemini free tier. Mengirim teks transkrip juga sebaiknya dihindari kalau isinya bersifat pribadi.

### Pemakaian dari Next.js

`@langchain/google-genai` sudah ada di repo. SDK resmi Google (`@google/genai`) tidak dicek ulang dalam riset ini.

## 4. Opsi TTS gratis

| Opsi | Biaya | Catatan |
|---|---|---|
| Web Speech API `speechSynthesis` (browser) | $0, tanpa API | Suara bergantung OS/browser. Tidak ada file yang tersimpan. Cocok untuk membacakan prompt soal. Ini API standar browser [belum terverifikasi terhadap MDN dalam riset ini]. |
| Cloudflare `melotts` | 18.63 neuron/menit | Output MP3, parameter `lang` (default `en`). Daftar bahasa tidak tercantum. https://developers.cloudflare.com/workers-ai/models/melotts/ |
| Cloudflare `aura-1` / `aura-2-en` | 1.36K / 2.73K neuron per 1K karakter | Kualitas lebih tinggi, tetapi 5K karakter aura-2 ≈ 13.6K neuron, **melebihi kuota harian**. Hindari. |
| Groq `canopylabs/orpheus-v1-english` | Free: 100 RPD, 3.6K TPD | Preview. Output WAV. Kuota token kecil, hanya cukup untuk beberapa kalimat sample answer per hari. https://console.groq.com/docs/text-to-speech |
| Gemini TTS (`gemini-3.8-flash-tts`) | Free tier | Masalah data policy dan limit yang tidak jelas sama seperti model Gemini lain. Aman kalau hanya untuk teks soal yang tidak pribadi. |

## 5. Kualitas model untuk grading rubric + feedback Bahasa Indonesia [belum terverifikasi: penilaian penulis]

Riset ini tidak menjalankan benchmark. Penilaian di bawah adalah ekspektasi umum dan perlu dites dengan 5–10 jawaban nyata sebelum dipakai.

- **gpt-oss-120b** (Groq/Cloudflare): model reasoning yang kuat untuk mengikuti rubric dan output JSON terstruktur. Bahasa Indonesianya cukup, kadang kaku. Reasoning token ikut terhitung di kuota, jadi set `reasoning_effort: "low"` atau `"medium"`.
- **gpt-oss-20b**: lebih hemat. Konsistensi skor kemungkinan lebih rendah. Cocok untuk quiz generation atau feedback ringan.
- **Gemini Flash**: Bahasa Indonesianya paling natural di antara opsi ini, tetapi terganjal data policy.
- **Llama 3.3 70B** di Cloudflare: kualitasnya oke, tetapi output token-nya sangat mahal dalam neuron (204,805/M) sehingga cepat menghabiskan kuota.
- **Batas STT untuk TOEFL "delivery":** Whisper cenderung merapikan disfluency, jadi transkrip saja tidak cukup untuk menilai pelafalan. Pakai `verbose_json` dengan timestamp per kata untuk menghitung WPM dan jeda panjang, serta `avg_logprob` sebagai sinyal kasar kejelasan. Hasilnya sinyal yang kasar, bukan penilaian pronunciation yang sebenarnya.

## 6. Estimasi beban harian

Asumsi untuk ~30 menit latihan per hari (estimasi penulis):

- Speaking: 10 jawaban × 60 detik = **600 detik audio**, 10 request STT.
- Grading: 10 request × (~2,000 token input rubric + transkrip, ~1,200 output termasuk reasoning dan feedback JSON berbahasa Indonesia) = 20K in / 12K out.
- Quiz generation: 3 request × (1K in / 2.5K out) = 3K in / 7.5K out.
- Feedback quiz: 2 request × (2K in / 1.5K out) = 4K in / 3K out.
- **Total LLM ≈ 27K input + 22.5K output ≈ 50K token, ~15 request per hari.** Untuk jaga-jaga dikali 2 (retry, prompt yang lebih panjang): ~100K token.

| Provider | Audio | LLM | Muat? |
|---|---|---|---|
| Groq | 600 dari 28,800 ASD (2%), 10 dari 2K RPD | 50K–100K dari 200K TPD, ~15 dari 1K RPD | **Ya.** Batasan nyatanya TPM 8K: satu request grading ~3.2K token, jadi grading paralel 10 jawaban sekaligus akan kena 429. Jalankan berurutan atau dengan jeda (~2 per menit). |
| Cloudflare (gpt-oss-120b) | 10 menit × 46.63 = ~466 neuron | 27K × 31,818/M + 22.5K × 68,182/M ≈ 859 + 1,534 = ~2,393 neuron | **Ya.** ~2.9K dari 10K neuron (~5.7K kalau dikali 2). Dengan gpt-oss-20b: LLM ~1.1K neuron. Dengan Llama 3.3 70B: LLM ~5.3K neuron, total mepet kalau dikali 2. |
| Cloudflare + TTS | | MeloTTS 10 menit ≈ 186 neuron | Ya. Aura-2 tidak muat. |
| Gemini free | Ada model transcribe | Tergantung RPD project yang tidak dipublikasikan. Kalau benar hanya ~20 RPD (klaim pihak ketiga), 15 request/hari sangat mepet | **Tidak pasti**, dan secara data policy tidak layak untuk rekaman suara. |

## 7. Rekomendasi

1. **Primary = Groq**
   - STT: `whisper-large-v3`, `language: 'en'`, `response_format: 'verbose_json'`, `timestamp_granularities: ['word']`.
   - Grading dan feedback: `openai/gpt-oss-120b` dalam JSON mode.
   - Aktifkan ZDR di console.
   - Jalankan grading secara berurutan supaya tidak kena TPM 8K.
2. **Fallback = Cloudflare Workers AI**, dipakai otomatis saat Groq mengembalikan 429/5xx.
   - STT: `@cf/openai/whisper-large-v3-turbo` via `/ai/run`.
   - LLM: `@cf/openai/gpt-oss-120b` lewat base URL OpenAI-compatible. Turun ke `gpt-oss-20b` kalau neuron menipis.
   - Kuota tidak berbagi dengan Groq, jadi kegagalan di satu provider tidak menghabiskan provider lain.
3. **TTS:** `speechSynthesis` di browser. MeloTTS hanya kalau perlu file audio.
4. **Embeddings/Vectorize** (kalau nanti perlu RAG bank soal): `@cf/baai/bge-m3` + Vectorize free.
5. **Gemini:** opsional sebagai tersier khusus teks non-pribadi (mis. generate soal). Jangan kirim audio atau jawaban learner. Ganti default `gemini-2.5-flash` sebelum 2026-12-01.

Implementasi di Next.js 16:

- Upload audio lewat server action terkena batas body **1 MB default**. Rekaman 60 detik webm/opus ~64 kbps ≈ 0.5 MB, jadi masih aman. Kalau bitrate lebih tinggi, set `experimental.serverActions.bodySizeLimit` di `next.config.ts` (sumber: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`).
- API key Groq dan Cloudflare disimpan di env server, jangan di client.

## Yang perlu dicek manual

- Apakah akun free Groq bisa mengaktifkan ZDR (Console → Data Controls).
- Limit Gemini per project di https://aistudio.google.com/rate-limit.
- Apakah `@cf/openai/gpt-oss-120b` bisa dipanggil dari akun Workers Free.
- Format input `audio` untuk Whisper di Cloudflare via REST.
- Kualitas feedback Bahasa Indonesia: uji gpt-oss-120b dan gpt-oss-20b dengan 5–10 jawaban nyata.
