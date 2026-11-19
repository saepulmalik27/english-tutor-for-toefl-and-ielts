// Official ielts.org Reading samples, kept privately and unchanged (licence: personal, non-commercial,
// no modification). The file is gitignored and only copied into the private Docker image.
// Without it, generation still works from the task descriptions alone.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { QuestionType } from "./pipeline.ts";

interface ExampleFile {
  source: string;
  examples: { type: string; questions: string; answers: string }[];
}

let cache: ExampleFile | null | undefined;

function load(): ExampleFile | null {
  if (cache === undefined) {
    try {
      cache = JSON.parse(readFileSync(path.join(process.cwd(), "content/private/ielts-reading-examples.json"), "utf8")) as ExampleFile;
    } catch {
      console.warn("ielts.org examples not found; generating without examples");
      cache = null;
    }
  }
  return cache;
}

/** Up to two official examples for one question type, as prompt text. */
export function examplesFor(type: QuestionType): string {
  const file = load();
  if (!file) return "";
  return file.examples
    .filter(e => e.type === type)
    .slice(0, 2)
    .map(e => `${e.questions}\n\nAnswers:\n${e.answers}`)
    .join("\n\n---\n\n");
}
