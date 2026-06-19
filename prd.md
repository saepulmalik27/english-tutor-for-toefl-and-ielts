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
9. As a user, I want to optionally save my own Gemini API Key in the settings, so that I can utilize live, advanced AI tutoring feedback.
10. As a user, I want a local grammar checker fallback to run if no API key is configured, so that the application remains fully functional offline.
11. As a learner, I want to study structured grammar and vocabulary lessons focused on Indonesian-English common mistakes, so that I can avoid typical literal translation errors.
12. As a user, I want to track my active learning streak in days, so that I am motivated to keep learning consecutively.
13. As a user, I want to see my XP level and progress on a dashboard, so that I can feel a sense of gamified achievement.
14. As a user, I want to view interactive charts displaying my estimated TOEFL, IELTS, and skill scores over the last 7 active days, so that I can see my progress over time.
15. As a user, I want a secure registration and login system, so that my personal progress, metrics history, and settings are securely stored.
16. As a user, I want to see a log of my past writing submissions and click on them to review past tutor corrections, so that I can track my improvement.

## Implementation Decisions

### 1. Database Schema
To support users, progress tracking, and lessons, the database is built using Prisma and SQLite. The schema structure developed during the prototype:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                String         @id @default(uuid())
  username          String         @unique
  email             String         @unique
  password          String         
  xp                Int            @default(0)
  streak            Int            @default(0)
  lastActive        DateTime?
  currentIeltsBand  Float          @default(4.0) 
  currentToeflScore Int            @default(30)  
  createdAt         DateTime       @default(now())
  
  journals          Journal[]
  progress          UserProgress[]
  dailyMetrics      DailyMetric[]
}

model DailyMetric {
  id          String   @id @default(uuid())
  userId      String
  date        String   
  ieltsBand   Float
  toeflScore  Int
  readingScore Float    
  writingScore Float    
  xpGained    Int      @default(0)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
}

model Article {
  id          String         @id @default(uuid())
  title       String
  content     String         
  difficulty  String         
  description String         
  translation String         
  vocabJson   String         
  createdAt   DateTime       @default(now())
  
  questions   Question[]
  progress    UserProgress[]
}

model Question {
  id          String   @id @default(uuid())
  articleId   String
  question    String   
  optionsJson String   
  answer      String   
  explanation String   
  
  article     Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
}

model Journal {
  id          String   @id @default(uuid())
  userId      String
  prompt      String   
  userText    String   
  feedback    String   
  score       Int      
  ieltsBand   Float    
  toeflScore  Int      
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserProgress {
  id          String   @id @default(uuid())
  userId      String
  articleId   String
  completed   Boolean  @default(false)
  quizScore   Int?     
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article     Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
}

model Lesson {
  id          String   @id @default(uuid())
  title       String   
  category    String   
  difficulty  String   
  content     String   
  summary     String   
  createdAt   DateTime @default(now())
}
```

### 2. Architecture Decisions
- **Next.js App Router & BFF Pattern**: The frontend utilizes Next.js Server Components and client-side Radix primitives (shadcn). Backend endpoints and actions are implemented as Server Actions, eliminating client-side API routing keys leakage and ensuring built-in CSRF safety.
- **Stateless Session Management**: Authentication is handled via stateless JWT session tokens issued by the server and transferred inside HTTP-Only, Secure, and SameSite cookies.
- **Double Submit & Local Fallbacks**: The writing tutor module integrates with the external Google Gemini API. If the API key is not supplied, it falls back to a rule-based parser analyzing word count, third-person singular errors, article choices, and conjunctions.

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
- **Database Backup**: Since it utilizes SQLite, the `dev.db` file is fully portable, allowing developers to reset the database state by clearing and re-running the seed script.
