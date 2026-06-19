import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export interface feedbackResult {
  score: number;
  ieltsBand: number;
  toeflScore: number;
  feedback: string;
}

export interface LangChainConfig {
  provider: string; // "gemini" | "openai" | "deepseek" | "qwen" | "custom"
  modelName: string;
  apiKey: string;
  baseUrl?: string;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  placeholderApiKey: string;
  helperText: string;
}

export const PROVIDERS: ProviderMetadata[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    placeholderApiKey: "AIzaSy...",
    helperText: "Gunakan API key dari Google AI Studio."
  },
  {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    placeholderApiKey: "sk-proj-...",
    helperText: "Gunakan API key dari OpenAI Platform."
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    placeholderApiKey: "sk-...",
    helperText: "Gunakan API key dari DeepSeek Console."
  },
  {
    id: "qwen",
    name: "Qwen (Alibaba)",
    defaultModel: "qwen-turbo",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    placeholderApiKey: "sk-...",
    helperText: "Gunakan API key dari DashScope (Alibaba Cloud)."
  },
  {
    id: "custom",
    name: "Custom (OpenAI Compatible)",
    defaultModel: "",
    defaultBaseUrl: "",
    placeholderApiKey: "API Key...",
    helperText: "Gunakan endpoint API eksternal apa pun yang kompatibel dengan OpenAI (seperti Groq, OpenRouter, Ollama, dll)."
  }
];

/**
 * Perform writing analysis using LangChain.js supporting multiple providers.
 */
export async function evaluateWritingWithLangChain(
  text: string,
  prompt: string,
  config: LangChainConfig
): Promise<feedbackResult> {
  const { provider, modelName, apiKey, baseUrl } = config;

  const systemInstruction = `You are a professional native English tutor assisting Indonesian native speakers.
Analyze the user's English writing response to the prompt: "${prompt}".
Provide:
1. A grammar correctness score out of 100.
2. Estimated IELTS Writing Band (Float, 4.0 to 9.0, e.g. 6.5).
3. Estimated TOEFL Writing Score (Int, 8 to 30).
4. Detailed, encouraging feedback written in INDONESIAN language. Highlight grammatical mistakes, give exact corrections, explain the grammar rules in Indonesian, and suggest 3 better vocabulary words with their Indonesian translations.

You MUST respond strictly with a JSON object in this exact format (no surrounding explanation, just JSON):
{
  "score": number,
  "ieltsBand": number,
  "toeflScore": number,
  "feedback": "string (Markdown format in Indonesian)"
}`;

  let model: any;

  if (provider === "gemini") {
    // Native Gemini client via LangChain
    model = new ChatGoogleGenerativeAI({
      apiKey,
      model: modelName || "gemini-2.5-flash",
      temperature: 0.2,
    });
  } else {
    // OpenAI, DeepSeek, Qwen, or any custom compatible endpoint (Ollama, OpenRouter, Groq)
    const openAiOptions: any = {
      apiKey,
      model: modelName || "gpt-4o-mini",
      temperature: 0.2,
    };
    
    // Resolve base URL: check config first, then default provider base URL
    let resolvedBaseUrl = baseUrl?.trim();
    if (!resolvedBaseUrl) {
      const providerMeta = PROVIDERS.find(p => p.id === provider);
      if (providerMeta?.defaultBaseUrl) {
        resolvedBaseUrl = providerMeta.defaultBaseUrl;
      }
    }

    if (resolvedBaseUrl && resolvedBaseUrl !== "") {
      openAiOptions.configuration = {
        baseURL: resolvedBaseUrl,
      };
    }
    
    model = new ChatOpenAI(openAiOptions);
  }

  const messages = [
    new SystemMessage(systemInstruction),
    new HumanMessage(`Prompt: "${prompt}"\nUser Submission: "${text}"`),
  ];

  try {
    const response = await model.invoke(messages);
    const responseText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    // Clean up code block ticks if LLM wraps output in markdown code blocks
    const cleanText = responseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanText);

    return {
      score: Number(result.score) || 60,
      ieltsBand: Number(result.ieltsBand) || 5.0,
      toeflScore: Number(result.toeflScore) || 15,
      feedback: String(result.feedback),
    };
  } catch (error) {
    console.error("LangChain evaluation failed:", error);
    throw error;
  }
}
