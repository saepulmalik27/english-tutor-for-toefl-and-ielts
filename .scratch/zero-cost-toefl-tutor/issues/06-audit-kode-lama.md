# Audit aplikasi lama: pertahankan, ubah, atau buang

Type: task
Status: resolved
Blocked by: 

## Question

(AFK) Petakan kode yang ada (app/, lib/, prisma/schema.prisma, server actions, onboarding, integrasi LangChain multi-provider, auth) terhadap keputusan di map: mana yang dipertahankan, diubah, atau dibuang. Termasuk perubahan yang belum di-commit (generatorActions, halaman generated). Hasilnya daftar per modul sebagai fakta untuk ticket arsitektur.

## Answer

Audit dilakukan 2026-11-15 terhadap working tree (termasuk perubahan yang belum di-commit). Total ±5.900 baris, tanpa test sama sekali.

### Temuan lintas modul (fakta untuk ticket arsitektur)

1. **Skala skor salah untuk format 2026.** Semua skor memakai IELTS band + TOEFL lama (0–120 total, 0–30 per section). Ada bug: `submitJournalAction` menimpa `currentToeflScore` (total 0–120) dengan skor Writing 8–30. `submitQuizAction` juga merata-ratakan skor section 0–30 dengan total 0–120. Semua harus diganti ke band 1–6. IELTS dibuang karena Target Exam hanya TOEFL iBT.
2. **API key ada di browser.** `OnboardingTest` dan `WritingEditor` menyimpan provider/key/model di `localStorage` lalu mengirimnya lewat form ke server. Untuk single-user ini tidak perlu; key cukup di env server.
3. **Konfigurasi AI terduplikasi di 3 tempat** (`lib/ai.ts`, `generatorActions.ts`, `tutorActions.ts`), masing-masing membangun model LangChain sendiri. Default-nya `gemini-2.5-flash`, yang ditolak oleh research AI gratis.
4. **Model konten terduplikasi:** `Article/Question/UserProgress` (statis, dari seed) dan `GeneratedArticle/GeneratedQuestion/GeneratedProgress` (dari AI) punya bentuk yang sama, dan `submitQuizAction` bercabang untuk keduanya.
5. **Personalisasi sudah ada embrionya, tapi berupa teks bebas.** `UserMemory` (weakGrammarRules, weakVocabWords, interestTopics) diringkas LLM dari 5 jurnal + 5 kuis terakhir, dan dipanggil secara sinkron (`await`) di setiap submit kuis. Tidak ada tag Error Pattern yang terstruktur dan tidak ada pengulangan item yang salah.
6. **Streak hanya bertambah saat login** (`loginAction`), bukan saat latihan. Penanda hari memakai jam server/UTC (`toISOString`), bukan WIB.
7. **Speaking: nol.** Tidak ada perekaman, upload audio, atau STT.
8. **Auth:** JWT di cookie + bcrypt, signup multi-user. Di production tanpa `JWT_SECRET`, secret dibuat acak per proses sehingga sesi hilang setiap restart.
9. **Env yang ada:** `JWT_SECRET`, `DATABASE_URL`, `GENERATION_AI_PROVIDER/MODEL/API_KEY/BASE_URL` (`.env` di-ignore git).
10. **Status git:** commit terakhir memakai SQLite; working tree sudah Postgres + model `UserMemory`/`Generated*`, tapi belum di-commit dan belum ada folder migrasi.

### Per modul

| Modul | Isi sekarang | Rekomendasi |
|---|---|---|
| `app/signup`, `signUpAction` | registrasi multi-user | **Buang** (single-user) |
| `app/login`, `lib/auth.ts` | login JWT, remember me | **Ubah**: satu Learner, secret wajib dari env; bentuk final ikut ticket arsitektur |
| `app/onboarding`, `OnboardingTest`, `onboardingAction` | 3 soal pilihan ganda + esai, form API key, target IELTS/TOEFL | **Ubah**: jadi diagnostic format 2026 (termasuk Speaking) yang mengisi Weakness Profile awal; buang form API key dan IELTS |
| `app/dashboard/reading`, `InteractiveArticle` | artikel, click-to-translate dari `vocabJson`, TTS `speechSynthesis`, kuis | **Pertahankan** komponen baca + TTS; tipe soal disesuaikan ke Read an Academic Passage / Read in Daily Life / Complete the Words |
| `app/dashboard/writing`, `WritingEditor`, `tutorActions` | jurnal bebas, feedback LLM, fallback heuristik lokal | **Ubah**: tugas jadi Write an Email / Academic Discussion / Build a Sentence dengan rubrik 0–5; feedback harus menghasilkan tag Error Pattern. Fallback heuristik: kandidat dibuang (diputuskan di ticket arsitektur) |
| `app/dashboard/lessons`, `Lesson`, `GeneratedLesson` | materi grammar statis + hasil AI | **Lebur ke Feedback** (sesuai keputusan awal): penjelasan muncul di Feedback per Error Pattern, bukan halaman terpisah |
| `generatorActions`, `GenerateSessionButton`, halaman `generated/` | generate lesson + artikel + soal sekali klik | **Ubah** jadi penyusun Practice Session dari Weakness Profile; ide dasarnya dipertahankan |
| `progressActions` | penilaian kuis, `DailyMetric`, statistik dashboard | **Ubah**: satukan dua jalur kuis; metrik per Skill dalam band 1–6 |
| `app/dashboard/page.tsx`, `DashboardCharts` | chart 7 hari IELTS/TOEFL, XP, streak | **Pertahankan** chart + streak dengan skala baru; **buang** XP |
| `UserMemory` | profil kelemahan teks bebas | **Ganti** dengan Weakness Profile terstruktur (ticket model personalisasi) |
| `lib/ai.ts` + LangChain multi-provider | 5 provider, pemilih di UI | **Ubah**: satu klien OpenAI-compatible (Groq utama, Cloudflare cadangan) dari env. Perlu tidaknya LangChain diputuskan di ticket arsitektur |
| `prisma/seed.ts` | 3 artikel + 3 lesson + soal | **Buang/ganti** dengan bank soal dari pipeline |
| `components/ui/*`, theme, layout | shadcn | **Pertahankan** |
| Belum ada | — | **Tambah**: Speaking Task (rekam, upload, STT, nilai), penyimpanan audio, PWA, test |
