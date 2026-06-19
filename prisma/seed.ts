import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing data
  await prisma.lesson.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.userProgress.deleteMany({});
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

  // 3. Create Articles (70% Practical Learning)
  const basicArticle = await prisma.article.create({
    data: {
      title: "The Importance of Breakfast",
      difficulty: "Basic",
      description: "Belajar memahami pentingnya sarapan bagi kesehatan tubuh dengan kosakata sehari-hari.",
      content: "Eating a healthy breakfast is very important for your body. When you wake up in the morning, your body has no energy because you did not eat during the night. A good breakfast gives you the energy to start your day. It helps you focus and learn better at school or work. Eating breakfast also prevents you from feeling tired. Healthy breakfast options include eggs, whole grain bread, fruits, and milk. People who skip breakfast often feel hungry later and eat unhealthy snacks.",
      translation: "Menyantap sarapan yang sehat sangat penting bagi tubuh Anda. Ketika Anda bangun di pagi hari, tubuh Anda tidak memiliki energi karena Anda tidak makan sepanjang malam. Sarapan yang baik memberi Anda energi untuk memulai hari Anda. Ini membantu Anda fokus dan belajar lebih baik di sekolah atau tempat kerja. Sarapan juga mencegah Anda dari merasa lelah. Pilihan sarapan sehat meliputi telur, roti gandum, buah-buahan, dan susu. Orang yang melewatkan sarapan sering kali merasa lapar di siang hari dan memakan camilan yang tidak sehat.",
      vocabJson: JSON.stringify({
        energy: "energi / tenaga",
        focus: "fokus / konsentrasi",
        prevents: "mencegah",
        tired: "lelah / capek",
        options: "pilihan",
        skip: "melewatkan / tidak melakukan",
        snacks: "camilan / makanan ringan",
        healthy: "sehat",
      }),
    },
  });

  const intermediateArticle = await prisma.article.create({
    data: {
      title: "The Shift to Remote Work",
      difficulty: "Intermediate",
      description: "Analisis tentang tren bekerja dari rumah (WFH) dan dampaknya terhadap produktivitas dan keseimbangan hidup.",
      content: "In recent years, remote work has transitioned from a rare perk to a global standard for many industries. Advancements in technology, such as cloud computing and video conferencing software, have enabled employees to collaborate effectively from anywhere in the world. Proponents of remote work argue that it increases productivity by eliminating daily commutes and reducing office distractions. Additionally, it offers employees greater flexibility, leading to a better work-life balance. However, critics point out challenges such as feelings of isolation, difficulty in separating personal life from professional duties, and potential communication breakdowns. Companies are now adopting hybrid models to combine the benefits of both worlds.",
      translation: "Dalam beberapa tahun terakhir, pekerjaan jarak jauh telah beralih dari fasilitas yang langka menjadi standar global bagi banyak industri. Kemajuan teknologi, seperti komputasi awan dan perangkat lunak konferensi video, telah memungkinkan karyawan untuk berkolaborasi secara efektif dari mana saja di seluruh dunia. Pendukung kerja jarak jauh berpendapat bahwa hal ini meningkatkan produktivitas dengan menghilangkan perjalanan harian dan mengurangi gangguan kantor. Selain itu, ini menawarkan fleksibilitas yang lebih besar bagi karyawan, yang mengarah pada keseimbangan kehidupan kerja yang lebih baik. Namun, para kritikus menunjukkan tantangan seperti perasaan terisolasi, kesulitan dalam memisahkan kehidupan pribadi dari tugas profesional, dan potensi hambatan komunikasi. Perusahaan-perusahaan sekarang mengadopsi model hibrida untuk menggabungkan keunggulan dari kedua lingkungan tersebut.",
      vocabJson: JSON.stringify({
        transitioned: "beralih / bertransisi",
        perk: "tunjangan / fasilitas tambahan",
        enabled: "memungkinkan",
        collaborate: "bekerja sama / berkolaborasi",
        proponents: "pendukung / penganjur",
        eliminating: "menghilangkan / mengeliminasi",
        commutes: "perjalanan pulang-pergi kerja",
        isolation: "keadaan terisolasi / kesepian",
        breakdowns: "kegagalan / kemacetan (komunikasi)",
        adopting: "mengadopsi / menerapkan",
      }),
    },
  });

  const advancedArticle = await prisma.article.create({
    data: {
      title: "The Dilemma of Artificial Intelligence Ethics",
      difficulty: "Advanced",
      description: "Eksplorasi mendalam mengenai dilema etika kecerdasan buatan (AI) di era modern.",
      content: "As artificial intelligence (AI) systems rapidly permeate various sectors of modern society, the ethical considerations governing their deployment have become paramount. From autonomous vehicles making split-second decisions to algorithms determining loan approvals, AI systems wield unprecedented influence over human lives. A primary concern is algorithmic bias; since AI models are trained on historical data, they risk perpetuating and magnifying societal prejudices. Furthermore, the lack of transparency in 'black-box' deep learning models raises issues of accountability when errors occur. Safeguarding privacy is another major challenge, as large-scale data collection is essential for training sophisticated networks. Mitigating these risks requires multidisciplinary collaboration among engineers, policymakers, and ethicists to construct robust frameworks that align AI advancement with human values.",
      translation: "Seiring sistem kecerdasan buatan (AI) merambah berbagai sektor masyarakat modern dengan cepat, pertimbangan etis yang mengatur penerapannya menjadi sangat penting. Mulai dari kendaraan otonom yang membuat keputusan dalam hitungan sepersekian detik hingga algoritma yang menentukan persetujuan pinjaman, sistem AI memegang pengaruh yang belum pernah terjadi sebelumnya terhadap kehidupan manusia. Kekhawatiran utama adalah bias algoritmik; karena model AI dilatih pada data historis, mereka berisiko melanggengkan dan memperbesar prasangka sosial. Terlebih lagi, kurangnya transparansi dalam model pembelajaran mendalam 'kotak hitam' menimbulkan masalah akuntabilitas ketika kesalahan terjadi. Menjaga privasi adalah tantangan besar lainnya, karena pengumpulan data skala besar sangat penting untuk melatih jaringan yang canggih. Meminimalkan risiko ini memerlukan kolaborasi multidisipliner antara insinyur, pembuat kebijakan, dan etisi untuk membangun kerangka kerja kokoh yang menyelaraskan kemajuan AI dengan nilai-nilai kemanusiaan.",
      vocabJson: JSON.stringify({
        permeate: "merembes / merambah",
        deployment: "penerapan / penyebaran",
        paramount: "sangat penting / terutama",
        unprecedented: "belum pernah terjadi sebelumnya",
        perpetuating: "melanggengkan",
        magnifying: "memperbesar / memperkuat",
        prejudices: "prasangka / bias",
        accountability: "akuntabilitas / pertanggungjawaban",
        safeguarding: "melindungi / menjaga",
        mitigating: "meminimalkan / memitigasi",
        multidisciplinary: "berbagai disiplin ilmu",
      }),
    },
  });

  console.log("Seeded articles.");

  // 4. Create Questions for Articles
  await prisma.question.createMany({
    data: [
      // Questions for Basic Article ("The Importance of Breakfast")
      {
        articleId: basicArticle.id,
        question: "Why does your body have no energy when you wake up in the morning?",
        optionsJson: JSON.stringify([
          "Because you exercised during the night.",
          "Because you did not eat during the night.",
          "Because you woke up too early.",
          "Because you drank too much milk."
        ]),
        answer: "Because you did not eat during the night.",
        explanation: "Sesuai kalimat kedua di teks: 'When you wake up in the morning, your body has no energy because you did not eat during the night.' (Tubuh tidak punya energi karena tidak makan di malam hari).",
      },
      {
        articleId: basicArticle.id,
        question: "According to the text, what does breakfast help you with at school or work?",
        optionsJson: JSON.stringify([
          "It helps you sleep faster.",
          "It helps you focus and learn better.",
          "It makes you feel tired.",
          "It helps you make friends."
        ]),
        answer: "It helps you focus and learn better.",
        explanation: "Sesuai kutipan teks: 'It helps you focus and learn better at school or work.' (Membantu Anda fokus dan belajar dengan lebih baik).",
      },
      {
        articleId: basicArticle.id,
        question: "Which of the following is NOT mentioned as a healthy breakfast option?",
        optionsJson: JSON.stringify([
          "Eggs",
          "Fruits",
          "Unhealthy snacks",
          "Milk"
        ]),
        answer: "Unhealthy snacks",
        explanation: "Teks menyebutkan 'Healthy breakfast options include eggs, whole grain bread, fruits, and milk.' Camilan tidak sehat (unhealthy snacks) adalah sesuatu yang dimakan orang jika mereka melewatkan sarapan, bukan pilihan sarapan sehat.",
      },

      // Questions for Intermediate Article ("The Shift to Remote Work")
      {
        articleId: intermediateArticle.id,
        question: "What technology has enabled employees to collaborate from anywhere?",
        optionsJson: JSON.stringify([
          "Social media and mobile games.",
          "Cloud computing and video conferencing.",
          "Office buildings and desktop computers.",
          "Television and radio broadcasts."
        ]),
        answer: "Cloud computing and video conferencing.",
        explanation: "Sesuai kalimat kedua teks: 'Advancements in technology, such as cloud computing and video conferencing software, have enabled employees to collaborate effectively from anywhere...'",
      },
      {
        articleId: intermediateArticle.id,
        question: "Why do proponents believe remote work increases productivity?",
        optionsJson: JSON.stringify([
          "By increasing the number of office meetings.",
          "By giving employees free food.",
          "By eliminating daily commutes and reducing distractions.",
          "By forcing employees to work longer hours."
        ]),
        answer: "By eliminating daily commutes and reducing distractions.",
        explanation: "Sesuai teks: 'Proponents of remote work argue that it increases productivity by eliminating daily commutes and reducing office distractions.'",
      },
      {
        articleId: intermediateArticle.id,
        question: "What is one challenge of remote work mentioned by critics?",
        optionsJson: JSON.stringify([
          "Higher internet speeds.",
          "Feelings of isolation.",
          "Too much physical movement.",
          "Lack of software applications."
        ]),
        answer: "Feelings of isolation.",
        explanation: "Teks menyebutkan kritik seperti: 'feelings of isolation, difficulty in separating personal life from professional duties...'",
      },

      // Questions for Advanced Article ("The Dilemma of Artificial Intelligence Ethics")
      {
        articleId: advancedArticle.id,
        question: "What is a primary concern regarding AI algorithmic models?",
        optionsJson: JSON.stringify([
          "They cannot process numbers fast enough.",
          "They are too expensive to deploy.",
          "They risk perpetuating and magnifying societal prejudices.",
          "They will replace all human workers immediately."
        ]),
        answer: "They risk perpetuating and magnifying societal prejudices.",
        explanation: "Teks menyebutkan: 'A primary concern is algorithmic bias; since AI models are trained on historical data, they risk perpetuating and magnifying societal prejudices.'",
      },
      {
        articleId: advancedArticle.id,
        question: "What ethical issue is raised by the 'black-box' nature of deep learning models?",
        optionsJson: JSON.stringify([
          "A lack of computational power.",
          "A lack of accountability when errors occur.",
          "High energy consumption.",
          "Excessive transparency."
        ]),
        answer: "A lack of accountability when errors occur.",
        explanation: "Teks menyebutkan: 'the lack of transparency in \"black-box\" deep learning models raises issues of accountability when errors occur.'",
      },
      {
        articleId: advancedArticle.id,
        question: "What is required to mitigate the ethical risks of AI development?",
        optionsJson: JSON.stringify([
          "Letting AI write its own ethical laws.",
          "Ignoring historical training data.",
          "Multidisciplinary collaboration among engineers, policymakers, and ethicists.",
          "Stopping all computer science research."
        ]),
        answer: "Multidisciplinary collaboration among engineers, policymakers, and ethicists.",
        explanation: "Teks menyebutkan: 'Mitigating these risks requires multidisciplinary collaboration among engineers, policymakers, and ethicists to construct robust frameworks...'",
      },
    ],
  });

  console.log("Seeded questions.");
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
