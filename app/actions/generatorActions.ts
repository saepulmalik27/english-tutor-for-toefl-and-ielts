"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export interface GenerationResponse {
  success: boolean;
  error?: string;
  articleId?: string;
  lessonId?: string;
}

/**
 * Periodically compresses user learning history into a UserMemory profile.
 * Summarizes weaknesses in grammar and vocabulary based on past journals and quiz scores.
 */
export async function compressUserLearningProgress(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  try {
    // 1. Fetch latest journals (last 5 entries)
    const latestJournals = await db.journal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 2. Fetch latest quiz completions (last 5 entries)
    const latestProgress = await db.userProgress.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (latestJournals.length === 0 && latestProgress.length === 0) {
      return; // Not enough data to compress yet
    }

    // Combine logs into a text payload for LLM to summarize
    let journalSummaries = "";
    latestJournals.forEach((j, i) => {
      journalSummaries += `[Journal ${i+1}] Prompt: "${j.prompt}"\nUser Text: "${j.userText}"\nFeedback received: "${j.feedback}"\nScore: ${j.score}/100\n\n`;
    });

    let quizSummary = "";
    latestProgress.forEach((p, i) => {
      quizSummary += `[Quiz ${i+1}] Score: ${p.quizScore ?? 0}%\n`;
    });

    const systemPrompt = `You are an educational data analyst. Your job is to analyze this student's recent English performance logs and compress them into a summarized profile for future lesson personalization.
Provide the output strictly in this JSON format:
{
  "weakGrammarRules": "string (Short list of 2-3 specific grammatical areas they struggled with, e.g. third-person singular verbs, passive voice)",
  "weakVocabWords": ["string (3-5 words they looked up or should practice)"],
  "interestTopics": "string (1-2 topics of interest extracted from what they write about, e.g. family memory, technology, career)"
}`;

    const humanPrompt = `Performance Logs:\n${journalSummaries}\n${quizSummary}`;

    // Resolve LLM model from env or fallback to gemini flash
    const provider = process.env.GENERATION_AI_PROVIDER || "gemini";
    const modelName = process.env.GENERATION_AI_MODEL || "gemini-2.5-flash";
    const apiKey = process.env.GENERATION_AI_API_KEY || "";
    const baseUrl = process.env.GENERATION_AI_BASE_URL || "";

    if (!apiKey) {
      console.warn("No server-side API key found for UserMemory compression. Skipping.");
      return;
    }

    let model: any;
    if (provider === "gemini") {
      model = new ChatGoogleGenerativeAI({
        apiKey,
        model: modelName,
        temperature: 0.1,
      });
    } else {
      const opts: any = { apiKey, model: modelName, temperature: 0.1 };
      if (baseUrl) opts.configuration = { baseURL: baseUrl };
      model = new ChatOpenAI(opts);
    }

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];

    const response = await model.invoke(messages);
    const textResponse = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    const cleanText = textResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    // Save to UserMemory
    await db.userMemory.upsert({
      where: { userId: user.id },
      update: {
        weakGrammarRules: parsed.weakGrammarRules || "",
        weakVocabWords: JSON.stringify(parsed.weakVocabWords || []),
        interestTopics: parsed.interestTopics || "",
        lastCompressedAt: new Date(),
      },
      create: {
        userId: user.id,
        weakGrammarRules: parsed.weakGrammarRules || "",
        weakVocabWords: JSON.stringify(parsed.weakVocabWords || []),
        interestTopics: parsed.interestTopics || "",
        lastCompressedAt: new Date(),
      }
    });

    console.log(`Successfully compressed learning history for user: ${user.username}`);
  } catch (error) {
    console.error("Failed to compress user learning history:", error);
  }
}

/**
 * Server action to generate custom, personalized lessons and reading articles
 * based on user target scores and recent journal topics.
 */
export async function generatePersonalizedContentAction(clientApiKey?: string): Promise<GenerationResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Harap login terlebih dahulu." };
  }

  // 1. Resolve API Key (Secret env first, client local settings fallback second)
  const provider = process.env.GENERATION_AI_PROVIDER || "gemini";
  const modelName = process.env.GENERATION_AI_MODEL || "gemini-2.5-flash";
  const envApiKey = process.env.GENERATION_AI_API_KEY;
  const resolvedApiKey = (envApiKey && envApiKey.trim() !== "") ? envApiKey.trim() : clientApiKey?.trim();
  const baseUrl = process.env.GENERATION_AI_BASE_URL || "";

  if (!resolvedApiKey) {
    return { 
      success: false, 
      error: "API Key tidak ditemukan. Harap masukkan API Key di Pengaturan AI Tutor atau konfigurasikan GENERATION_AI_API_KEY di server." 
    };
  }

  try {
    // 2. Fetch memory profile if exists
    const memory = await db.userMemory.findUnique({
      where: { userId: user.id }
    });

    // 3. Fetch last 2 journals to extract writing themes
    const journals = await db.journal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    let journalContext = "";
    if (journals.length > 0) {
      journalContext = journals.map(j => `Topik: "${j.prompt}", Tulisan: "${j.userText}"`).join(" | ");
    }

    // Determine target difficulty
    const targetIelts = user.targetIeltsBand;
    let targetLevel = "Basic";
    if (targetIelts >= 6.5) targetLevel = "Advanced";
    else if (targetIelts >= 5.0) targetLevel = "Intermediate";

    const systemPrompt = `You are a professional native English tutor assisting Indonesian native speakers.
Create a personalized learning bundle for this user to help them achieve their targets:
- Current English Level: IELTS ${user.currentIeltsBand.toFixed(1)} / TOEFL ${user.currentToeflScore}
- Target Goal Level: IELTS ${user.targetIeltsBand.toFixed(1)} / TOEFL ${user.targetToeflScore}
- Target Difficulty Level: ${targetLevel}
- Weak Grammar Areas: ${memory?.weakGrammarRules || "None specified yet"}
- Focus Vocabulary: ${memory?.weakVocabWords ? JSON.parse(memory.weakVocabWords).join(", ") : "None specified yet"}
- User Current Interest/Context (based on their writing): ${memory?.interestTopics || ""} ${journalContext || "Daily life, career, studies"}

You MUST respond strictly with a JSON object in this exact format (no markdown blocks, no surrounding text, just JSON):
{
  "lesson": {
    "title": "string (Focus on a grammar rule or tip related to their weaknesses, in Indonesian)",
    "category": "string (Grammar / Vocabulary / Reading Tips)",
    "summary": "string (1-sentence summary in Indonesian)",
    "content": "string (Markdown format formal lesson in Indonesian, explaining the rule, common mistakes, and giving 3 examples with corrections)"
  },
  "article": {
    "title": "string (English title of an article written in English about their interests or topic)",
    "content": "string (Around 100-150 words English reading article, using vocabulary and sentence structures appropriate for their current level but slightly challenging to help reach their target level)",
    "translation": "string (Paragraph-by-paragraph Indonesian translation helper)",
    "vocab": {
      "word1": "meaning1 (Indonesian translation of key academic vocabulary from the article, at least 5 words)"
    }
  },
  "questions": [
    {
      "question": "string (Multiple choice comprehension or grammar question about the article in English)",
      "options": ["string (4 options)"],
      "answer": "string (The exact correct option string)",
      "explanation": "string (Explanation of why this answer is correct, in Indonesian)"
    }
  ]
}`;

    // 4. Initialize LangChain model
    let model: any;
    if (provider === "gemini") {
      model = new ChatGoogleGenerativeAI({
        apiKey: resolvedApiKey,
        model: modelName,
        temperature: 0.3,
      });
    } else {
      const opts: any = { apiKey: resolvedApiKey, model: modelName, temperature: 0.3 };
      if (baseUrl) opts.configuration = { baseURL: baseUrl };
      model = new ChatOpenAI(opts);
    }

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage("Rancang materi kustom baru saya hari ini.")
    ];

    const response = await model.invoke(messages);
    const responseText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    // Clean up ticks
    const cleanText = responseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanText);

    // 5. Save generated Lesson to DB
    const generatedLesson = await db.generatedLesson.create({
      data: {
        userId: user.id,
        title: result.lesson.title,
        category: result.lesson.category,
        content: result.lesson.content,
        summary: result.lesson.summary,
      }
    });

    // 6. Save generated Article to DB
    const generatedArticle = await db.generatedArticle.create({
      data: {
        userId: user.id,
        title: result.article.title,
        content: result.article.content,
        translation: result.article.translation,
        difficulty: targetLevel,
        vocabJson: JSON.stringify(result.article.vocab || {}),
      }
    });

    // 7. Save generated Questions to DB
    for (const q of result.questions) {
      await db.generatedQuestion.create({
        data: {
          articleId: generatedArticle.id,
          question: q.question,
          optionsJson: JSON.stringify(q.options),
          answer: q.answer,
          explanation: q.explanation,
        }
      });
    }

    return {
      success: true,
      articleId: generatedArticle.id,
      lessonId: generatedLesson.id,
    };
  } catch (error) {
    console.error("Personalized content generation failed:", error);
    return { success: false, error: "Gagal menjana materi kustom baru Anda. Harap coba beberapa saat lagi." };
  }
}
