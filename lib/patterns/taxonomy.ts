// Fixed Error Pattern taxonomy (PRD v2, ticket 09/06). The LLM may only return these IDs;
// anything else becomes "other" with its note kept, so frequent notes can be promoted later.
// Names and hints are Indonesian because they are shown to the Learner in Feedback.

export type Skill = "reading" | "writing" | "speaking" | "writing_speaking";
export type Criterion = "GRA" | "LR" | "CC" | "TA_TR" | "FC" | "READING";

export interface ErrorPattern {
  id: string;
  skill: Skill;
  criterion: Criterion;
  name: string;
  hint: string;
}

const p = (id: string, skill: Skill, criterion: Criterion, name: string, hint: string): ErrorPattern =>
  ({ id, skill, criterion, name, hint });

export const PATTERNS: ErrorPattern[] = [
  // Grammatical Range & Accuracy
  p("GRA.subject-verb", "writing_speaking", "GRA", "Subject-verb agreement", "Kata kerja harus cocok dengan subjeknya: she goes, they go."),
  p("GRA.tense-choice", "writing_speaking", "GRA", "Pilihan tense", "Pilih tense sesuai waktu kejadian: kemarin → past, kebiasaan → present."),
  p("GRA.tense-form", "writing_speaking", "GRA", "Bentuk tense", "Bentuk kata kerja salah untuk tense-nya: go → went, have went → have gone."),
  p("GRA.articles", "writing_speaking", "GRA", "Artikel a/an/the", "Benda tunggal yang bisa dihitung butuh artikel; the untuk yang sudah jelas."),
  p("GRA.countability", "writing_speaking", "GRA", "Countable/uncountable & plural", "Information, advice, equipment tidak memakai -s; many/much sesuai jenisnya."),
  p("GRA.prepositions", "writing_speaking", "GRA", "Preposisi", "Preposisi mengikuti kebiasaan bahasa Inggris: interested in, depend on."),
  p("GRA.word-order", "writing_speaking", "GRA", "Urutan kata", "Urutan subjek-kata kerja-objek, posisi adverb, dan pertanyaan tidak langsung."),
  p("GRA.run-on-fragment", "writing", "GRA", "Kalimat run-on/fragmen", "Satu kalimat butuh satu klausa utama lengkap; pisahkan atau hubungkan dengan konjungsi."),
  p("GRA.conditionals", "writing_speaking", "GRA", "Conditional", "If + present → will; if + past → would; if + past perfect → would have."),
  p("GRA.passive", "writing_speaking", "GRA", "Bentuk pasif", "Pasif = be + past participle: is made, was built."),
  p("GRA.limited-complex", "writing_speaking", "GRA", "Kalimat kompleks terbatas", "Band 7 butuh variasi: relative clause, conditional, klausa subordinat."),
  p("GRA.verb-patterns", "writing_speaking", "GRA", "Pola kata kerja (to/-ing)", "Enjoy doing, decide to do, suggest doing."),
  // Lexical Resource
  p("LR.word-choice", "writing_speaking", "LR", "Pilihan kata/collocation", "Pakai pasangan kata yang lazim: make a decision, heavy traffic."),
  p("LR.word-form", "writing_speaking", "LR", "Bentuk kata", "Noun/verb/adjective/adverb tertukar: success/succeed/successful."),
  p("LR.register-informal", "writing", "LR", "Register terlalu informal", "Surat formal dan esai menghindari singkatan dan kata santai (gonna, stuff)."),
  p("LR.repetition", "writing_speaking", "LR", "Pengulangan/kosakata sempit", "Ganti kata yang diulang dengan sinonim atau parafrase."),
  p("LR.spelling", "writing", "LR", "Ejaan", "Ejaan salah menurunkan skor LR dan membuat jawaban Reading/Listening salah."),
  // Coherence & Cohesion
  p("CC.linkers", "writing_speaking", "CC", "Kata penghubung", "Linker hilang, salah arti, atau terlalu mekanis (Firstly, Secondly...)."),
  p("CC.paragraphing", "writing", "CC", "Paragraf", "Satu paragraf satu ide utama, dengan kalimat topik yang jelas."),
  p("CC.referencing", "writing_speaking", "CC", "Referensi (it/this/they)", "Kata ganti harus jelas merujuk ke apa."),
  // Task Achievement / Task Response (Writing)
  p("TA.bullet-missing", "writing", "TA_TR", "Poin Task 1 tidak dibahas", "Surat Task 1 harus membahas ketiga poin yang diminta."),
  p("TA.tone", "writing", "TA_TR", "Nada surat tidak sesuai", "Sesuaikan nada dengan penerima: formal ke instansi, santai ke teman."),
  p("TR.position-unclear", "writing", "TA_TR", "Posisi Task 2 tidak jelas", "Nyatakan pendapat dengan jelas di pendahuluan dan konsisten sampai akhir."),
  p("TR.underdeveloped", "writing", "TA_TR", "Ide kurang berkembang", "Setiap ide utama butuh penjelasan dan contoh."),
  p("TR.under-length", "writing", "TA_TR", "Kurang dari batas kata", "Task 1 minimal 150 kata, Task 2 minimal 250 kata."),
  // Fluency & Coherence (Speaking)
  p("FC.long-pauses", "speaking", "FC", "Jeda panjang", "Jeda lebih dari 2 detik di tengah kalimat menurunkan kelancaran."),
  p("FC.fillers", "speaking", "FC", "Filler berlebihan", "Um, uh, like terlalu sering; ganti dengan frasa pengisi alami (Well, Let me think)."),
  p("FC.self-correction", "speaking", "FC", "Self-correction berlebihan", "Terlalu sering mengulang/membetulkan kalimat memutus alur bicara."),
  p("FC.short-answers", "speaking", "FC", "Jawaban terlalu pendek", "Kembangkan jawaban: alasan, contoh, pengalaman pribadi."),
  // Reading
  p("R.false-vs-not-given", "reading", "READING", "False vs Not Given tertukar", "FALSE = teks menyatakan kebalikannya. NOT GIVEN = teks tidak membahasnya."),
  p("R.paraphrase", "reading", "READING", "Parafrase tidak dikenali", "Soal jarang memakai kata yang sama dengan teks; cari sinonim dan parafrase."),
  p("R.word-limit", "reading", "READING", "Batas kata dilanggar", "Jawaban completion harus diambil dari teks dan tidak melebihi batas kata."),
  p("R.heading-detail", "reading", "READING", "Heading dicocokkan ke detail", "Heading mewakili ide utama paragraf, bukan satu detail di dalamnya."),
  p("R.matching-scan", "reading", "READING", "Matching informasi/fitur", "Pindai nama, angka, dan kata kunci, lalu baca kalimat di sekitarnya dengan teliti."),
  p("R.detail", "reading", "READING", "Detail fakta terlewat", "Baca ulang kalimat yang memuat kata kunci; jawaban sering ada di detail kecil."),
];

export const OTHER = "other";
const BY_ID = new Map(PATTERNS.map(x => [x.id, x]));

export const patternById = (id: string) => BY_ID.get(id);
export const isKnownPattern = (id: string) => BY_ID.has(id);
