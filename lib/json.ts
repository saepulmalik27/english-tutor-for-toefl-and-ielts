/** Parses an LLM's JSON reply, tolerating ```json fences. Throws on malformed JSON. */
export function parseJson<T>(text: string): T {
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as T;
}
