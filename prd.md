## Problem Statement

Indonesian native speakers learning English often struggle to apply grammatical rules in practical scenarios, specifically when reading and writing. Standard tutoring options can be expensive, and self-study tools rarely provide contextual vocabulary assistance (e.g., in-sentence translation lookup) or detailed feedback on written composition. Furthermore, learners preparing for standardized examinations (TOEFL/IELTS) lack accessible ways to gauge their scores and visualize their day-to-day progress.

## Solution

A full-stack personalized learning application built around the **10-20-70 learning concept**:
- **10% Formal Learning**: High-yield structured lessons (focusing on tenses and common translation mistakes).
- **20% Social/Feedback**: AI-tutor essay corrections and grammar reviews written in Indonesian.
- **70% Practical Practice**: Interactive articles with click-to-translate vocabulary lookup, TTS audio pronunciation guides, comprehension quizzes, and daily writing prompt journals.
Daily progress metrics are calculated based on quiz correctness and writing grammar, mapping user performance directly to estimated **TOEFL iBT** and **IELTS Academic** score bands.

## User Stories

1. As an Indonesian native speaker, I want to read English articles with a paragraph-by-paragraph translation helper, so that I can verify my reading comprehension in my native language.
2. As a learner, I want to click on any word in an article, so that I can see its direct Indonesian meaning and part of speech without leaving the page.
3. As a learner, I want to play the native audio pronunciation of any word I click, so that I can practice how to speak it.
4. As a student, I want to take a multiple-choice reading quiz after completing an article, so that I can test my understanding of the material.
5. As an exam candidate, I want my reading quiz scores to update my estimated TOEFL and IELTS Reading bands, so that I know where I stand compared to exam criteria.
6. As a writer, I want to select writing prompts based on difficulty, so that I can practice writing about subjects aligned with my proficiency.
7. As a writer, I want a real-time word counter while drafting essays, so that I can ensure my responses meet the target length for standardized tests.
8. As a learner, I want to receive detailed spelling, grammar, and vocabulary feedback in Indonesian for my essays, so that I can easily understand my errors and learn how to improve.
9. As a new user signing up, I want to take a diagnostic pre-test (combining multiple-choice grammar questions and a short essay writing task) during onboarding, so that the tutor AI can measure my baseline proficiency level and automatically customize lessons on my dashboard.
10. As a user logging in, I want to toggle a "Remember Me" checkbox, so that my login session stays valid for 30 days across browser sessions.
11. As a user with cost concerns, I want to easily select and configure different AI providers (Google Gemini, OpenAI, DeepSeek, Qwen, or Custom compatible endpoints) along with custom model names, API keys, and custom Base URLs, so that I can manage my API costs effectively.
12. As a user, I want a local grammar checker fallback to run if no API key is configured, so that the application remains fully functional offline.
13. As a learner, I want to study structured grammar and vocabulary lessons focused on Indonesian-English common mistakes, so that I can avoid typical literal translation errors.
14. As a user, I want to track my active learning streak in days, so that I am motivated to keep learning consecutively.
15. As a user, I want to see my XP level and progress on a dashboard, so that I can feel a sense of gamified achievement.
16. As a user, I want to view interactive charts displaying my estimated TOEFL, IELTS, and skill scores over the last 7 active days, so that I can see my progress over time.
17. As a user, I want a secure registration and login system, so that my personal progress, metrics history, and settings are securely stored.
18. As a user, I want to see a log of my past writing submissions and click on them to review past tutor corrections, so that I can track my improvement.

## Implementation Decisions

### 1. Database Schema
To support users, progress tracking, and lessons, the database is built using Prisma and supports both SQLite and PostgreSQL. The schema structure:

```prisma
datasource db {
  provider = "postgresql" // Or "sqlite" for lightweight local development
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                String         @id @default(uuid())
  username          String         @unique
  email             String         @unique
  password          String         // Hashed password
  xp                Int            @default(0)
  streak            Int            @default(0)
  lastActive        DateTime?
  currentIeltsBand  Float          @default(4.0) // Estimated IELTS band (4.0 to 9.0)
  currentToeflScore Int            @default(30)  // Estimated TOEFL score (30 to 120)
  isOnboarded       Boolean        @default(false) // Onboarding completion tracker
  createdAt         DateTime       @default(now())
  
  // Relations
  journals          Journal[]
  progress          UserProgress[]
  dailyMetrics      DailyMetric[]
}

model DailyMetric {
  id          String   @id @default(uuid())
  userId      String
  date        String   // YYYY-MM-DD format for easy daily snapshots
  ieltsBand   Float
  toeflScore  Int
  readingScore Float    // Component reading metric
  writingScore Float    // Component writing metric
  xpGained    Int      @default(0)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
}

model Article {
  id          String         @id @default(uuid())
  title       String
  content     String         // Full English article text
  difficulty  String         // 'Basic', 'Intermediate', 'Advanced'
  description String         // Indonesian description/introduction
  translation String         // Full Indonesian translation
  vocabJson   String         // JSON dictionary mappings of English words to Indonesian meanings
  createdAt   DateTime       @default(now())
  
  questions   Question[]
  progress    UserProgress[]
}

model Question {
  id          String   @id @default(uuid())
  articleId   String
  question    String   // The English comprehension question
  optionsJson String   // JSON string array of options
  answer      String   // The correct option (exact text)
  explanation String   // Explanation of correct answer in Indonesian
  
  article     Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
}

model Journal {
  id          String   @id @default(uuid())
  userId      String
  prompt      String   // Writing prompt in English & Indonesian
  userText    String   // User's submitted English text
  feedback    String   // Markdown feedback from the AI/Tutor in Indonesian
  score       Int      // Writing score (0-100)
  ieltsBand   Float    // Estimated IELTS Writing Band (e.g., 5.5)
  toeflScore  Int      // Estimated TOEFL Writing Score (e.g., 20)
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserProgress {
  id          String   @id @default(uuid())
  userId      String
  articleId   String
  completed   Boolean  @default(false)
  quizScore   Int?     // Score in % (0-100)
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article     Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
}

model Lesson {
  id          String   @id @default(uuid())
  title       String   // Title in Indonesian (e.g., "Memahami Present Simple")
  category    String   // "Grammar", "Vocabulary", "Reading Tips"
  difficulty  String   // "Basic", "Intermediate", "Advanced"
  content     String   // Markdown content of the lesson in Indonesian
  summary     String   // Short summary
  createdAt   DateTime @default(now())
}
```

### 2. Architecture Decisions
- **Next.js App Router & BFF Pattern**: The frontend utilizes Next.js Server Components and client-side Radix primitives (shadcn). Backend endpoints and actions are implemented as Server Actions, eliminating client-side API routing keys leakage and ensuring built-in CSRF safety.
- **Stable JWT Session Management**: Authentication is handled via stateless JWT session tokens issued by the server and transferred inside HTTP-Only, Lax, and SameSite cookies (`english_tutor_session`). Development instances utilize a stable environment configurations key to avoid drops during process worker/hot-reloads.
- **Double Submit & Local Fallbacks**: The writing tutor module integrates with the external Google Gemini, OpenAI, DeepSeek, and Qwen APIs using LangChain.js. If the API key is not supplied, it falls back to a rule-based parser analyzing word count, third-person singular errors, article choices, and conjunctions.
- **Local Dev PostgreSQL Option**: Docker Compose configurations are included for launching a local PostgreSQL instance (`docker-compose.yml`) to support seamless SQLite-to-PostgreSQL migrations.

## Testing Decisions

### 1. Seams for Testing
Testing will occur at the **Server Action Boundary (Service Seam)**:
- **Authentication Action Tests**: Verifying password requirements (>= 8 characters), email formats, and successful token generation/cookie emission.
- **Quiz Score Mapping Tests**: Verifying that correct answers map to estimated IELTS/TOEFL scores appropriately.
- **Writing Tutor Fallback Tests**: Verifying that the local grammatical heuristics parser detects basic syntax mistakes (e.g. subject-verb agreement) and provides corrections.

### 2. What makes a good test
- Focus exclusively on external behavior (e.g., submitting correct quiz answers yields expected IELTS Band values) rather than private implementation details.
- Ensure SQL query isolation so tests run against separate memory database contexts or transactional rollbacks.

## Out of Scope

- **Real-Time Speaking Pronunciation Evaluation**: Scoring vocal pronunciation via microphone recordings is deferred to a future phase.
- **Social Features**: Live discussion boards, peer-to-peer essay grading, and user messaging are out of scope for the MVP.
- **Direct PDF/DOCX Export**: Printing progress reports or exporting compositions.

## Further Notes

- **Offline Mode**: When running without internet access, the application will notify the user via a warning banner that it is running in local heuristic fallback mode.
- **Database Backup & Seeds**: Automatically compiled and executed database seeds are configured inside `package.json` under `"prisma": { "seed": "npx tsx prisma/seed.ts" }`, facilitating rapid database resets.
