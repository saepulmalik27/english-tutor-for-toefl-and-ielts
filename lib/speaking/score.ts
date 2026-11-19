// Speaking scoring: FC, LR, GRA (Pronunciation is not scored in the MVP). Shared logic in lib/scoring.ts.
import type { FluencyMetrics } from "./metrics.ts";
import { coachFeedback, parseCriterionScores, patternList, type Chat, type Scores } from "../scoring.ts";

export const CRITERIA = ["FC", "LR", "GRA"] as const;
export type Criterion = (typeof CRITERIA)[number];

export const parseScores = (text: string) => parseCriterionScores(text, CRITERIA);

const SCORER = `You are a certified IELTS Speaking examiner. Score ONE answer from an IELTS General Training
Speaking test on three criteria, each 0-9 in 0.5 steps, using the public IELTS Speaking band descriptors:
- FC (Fluency and Coherence): speaking at length without effort, hesitation, self-correction, logical
  sequencing and use of discourse markers. Use the fluency metrics given as facts; they come from audio timing.
- LR (Lexical Resource): range, precision, collocation, idiomatic language, paraphrase.
- GRA (Grammatical Range and Accuracy): range of structures, complex sentences, frequency of errors.
Pronunciation is NOT scored. The transcript comes from speech recognition and may hide filler words.
Judge only this answer. Respond with JSON only:
{"FC":{"band":6,"reason":"..."},"LR":{"band":6,"reason":"..."},"GRA":{"band":5.5,"reason":"..."}}`;

export async function scoreSpeaking(chat: Chat, task: string, transcript: string, metrics: FluencyMetrics) {
  return parseScores(await chat(SCORER, `Task:\n${task}\n\nFluency metrics:\n${JSON.stringify(metrics)}\n\nTranscript:\n${transcript}`));
}

export function speakingFeedback(chat: Chat, task: string, transcript: string, scores: Scores<Criterion>) {
  return coachFeedback(chat, { what: "Speaking", criteria: CRITERIA, patterns: patternList("speaking"), task, text: transcript, scores });
}
