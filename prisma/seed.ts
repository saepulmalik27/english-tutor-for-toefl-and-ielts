import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing data
  await prisma.lesson.deleteMany({});
  await prisma.dailyMetric.deleteMany({});
  await prisma.journal.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleaned old records.");

  // 2. Create Lessons (10% Formal Learning)
  await prisma.lesson.createMany({
    data: [
      {
        title: "Perbedaan Present Simple vs Present Continuous",
        category: "Grammar",
        difficulty: "Basic",
        summary: "Kuasai perbedaan antara kebiasaan sehari-hari dan aksi yang sedang berlangsung.",
        content: `### Present Simple vs Present Continuous

Banyak pembelajar Indonesia bingung membedakan kedua tenses dasar ini. Mari kita bahas secara sederhana.

#### 1. Present Simple Tense
Digunakan untuk **fakta, kebiasaan, atau kebenaran umum** (rutinitas).
*   **Pola:** \`S + V1 (s/es)\` atau \`S + to be (is/am/are) + Adjective/Noun\`
*   **Kata Kunci Waktu:** *Every day, usually, always, often, sometimes.*
*   **Contoh:**
    *   *I study English every day.* (Saya belajar bahasa Inggris setiap hari - Rutinitas)
    *   *The sun rises in the east.* (Matahari terbit di timur - Fakta umum)
    *   *She is a diligent student.* (Dia adalah murid rajin - Kondisi/Sifat)

#### 2. Present Continuous Tense
Digunakan untuk **aksi yang sedang berlangsung saat ini** (sekarang juga).
*   **Pola:** \`S + to be (is/am/are) + V-ing\`
*   **Kata Kunci Waktu:** *Now, right now, at the moment, look!, listen!*
*   **Contoh:**
    *   *I am studying English right now.* (Saya sedang belajar bahasa Inggris sekarang - Aksi berlangsung)
    *   *Listen! The baby is crying.* (Dengar! Bayinya sedang menangis)

#### ⚠️ Kesalahan Umum Pembelajar Indonesia (Common Mistakes)
Orang Indonesia sering kali menerjemahkan kata "sedang" secara harfiah dengan menambahkan "cooking" tanpa "to be" atau sebaliknya.
*   ❌ *Salah:* I cooking dinner now.
*   ✔️ *Benar:* I **am** cooking dinner now.
*   ❌ *Salah:* She is go to school every day. (Mencampur *to be* dengan kata kerja dasar)
*   ✔️ *Benar:* She **goes** to school every day.`,
      },
      {
        title: "Menghindari Kesalahan Umum 'English-Indo' (Common Mistakes)",
        category: "Vocabulary",
        difficulty: "Basic",
        summary: "Pelajari kesalahan terjemahan literal bahasa Indonesia ke bahasa Inggris yang sering terjadi.",
        content: `### Menghindari Kesalahan Umum Terjemahan Literal (Indo-English)

Saat belajar bahasa Inggris, otak kita sering menerjemahkan langsung kata demi kata dari bahasa Indonesia. Hal ini menghasilkan kalimat yang terdengar tidak alami atau salah secara tata bahasa. Berikut adalah kesalahan paling populer dan cara memperbaikinya:

#### 1. Menggunakan "Thanks before"
Ketika ingin berterima kasih di awal sebelum orang lain melakukan sesuatu, orang Indonesia sering berkata *"Thanks before"*. Ini salah dan tidak dikenal dalam bahasa Inggris.
*   ❌ *Jangan gunakan:* Thanks before.
*   ✔️ *Gunakan:* **Thanks in advance** atau **Thank you beforehand**.

#### 2. "Boring" vs "Bored"
Kata sifat berakhiran **-ing** berarti *menyebabkan perasaan* (membosankan), sedangkan berakhiran **-ed** berarti *merasakan perasaan* (bosan).
*   ❌ *Salah:* I am boring in this class. (Artinya: Saya orang yang membosankan di kelas ini)
*   ✔️ *Benar:* I am **bored** in this class. (Artinya: Saya merasa bosan di kelas ini)
*   *Catatan:* *This movie is boring.* (Film ini membosankan - Benar)

#### 3. "Join with us"
Kata "join" sudah memiliki arti bergabung/ikut serta, sehingga tidak memerlukan preposisi "with".
*   ❌ *Jangan gunakan:* Please join with us!
*   ✔️ *Gunakan:* Please **join us**!

#### 4. Menggunakan "Your welcome"
Ini adalah kesalahan ejaan (homofon) yang sangat umum bahkan bagi penutur asli, namun krusial di TOEFL/IELTS.
*   ❌ *Salah:* Your welcome. (*Your* menunjukkan kepemilikan)
*   ✔️ *Benar:* **You're welcome** (singkatan dari *You are welcome*).`,
      },
      {
        title: "Strategi Menjawab Soal Reading TOEFL & IELTS",
        category: "Reading Tips",
        difficulty: "Intermediate",
        summary: "Teknik skimming, scanning, dan mencari gagasan utama untuk efisiensi waktu ujian.",
        content: `### Strategi Menjawab Soal Reading TOEFL & IELTS

Ujian Reading TOEFL atau IELTS tidak menuntut Anda membaca setiap baris kata secara mendetail. Waktu Anda terbatas! Gunakan strategi-strategi efisien berikut:

#### 1. Teknik Skimming (Membaca Cepat Sekilas)
Skimming adalah membaca cepat seluruh teks untuk mendapatkan **ide pokok atau gambaran umum** tentang topik teks.
*   **Cara melakukan:** Baca paragraf pertama secara penuh. Untuk paragraf berikutnya, baca kalimat pertama (topik) dan kalimat terakhir saja. Abaikan detail kecil seperti angka atau nama spesifik.
*   **Guna:** Sangat efektif untuk menjawab soal tipe: *"What is the main topic of this passage?"* atau *"Which of the following would be the best title?"*

#### 2. Teknik Scanning (Mencari Informasi Spesifik)
Scanning adalah teknik membaca cepat dengan menggerakkan mata ke seluruh teks untuk menemukan **kata kunci spesifik** (seperti nama orang, tahun, lokasi, atau istilah khusus).
*   **Cara melakukan:** Cari kata kunci yang ditanyakan di soal, lalu gerakkan mata Anda secara acak pada teks sampai kata tersebut "menonjol". Setelah ketemu, baca 1 kalimat sebelum dan sesudahnya.
*   **Guna:** Membantu menjawab soal tipe informasi rinci (faktual): *"According to paragraph 2, when did the event occur?"*

#### 3. Menghadapi Soal Kosakata (Vocabulary-in-Context Questions)
Jika Anda tidak mengetahui arti suatu kata di soal ujian:
1.  Jangan panik! Kembalilah ke paragraf tempat kata itu berada.
2.  Baca kalimat di sekitar kata tersebut.
3.  Tebak maknanya menggunakan **konteks kalimat** (apakah bernada positif, negatif, menunjukkan sebab-akibat, atau kontras).
4.  Ganti kata tersebut dengan pilihan jawaban di lembar soal dan lihat mana yang paling masuk akal.`,
      },
    ],
  });

  console.log("Seeded lessons.");
  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
