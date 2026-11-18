// Pure text shaping for crawled Wikipedia articles (no imports, so `node --test` runs it directly).
// Text is never rewritten (PRD v2): we only drop reference sections and cut at whole paragraphs.

const TAIL_SECTIONS =
  /\n=+ (See also|References|Notes|Citations|Sources|Bibliography|Further reading|External links|Footnotes) =+[\s\S]*$/;

/** Plain-text extract → reading text: reference sections removed, "== Heading ==" kept as a plain line. */
export function cleanExtract(extract: string): string {
  return extract
    .replace(TAIL_SECTIONS, "")
    .replace(/\n=+ (.+?) =+\n/g, "\n\n$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * Whole paragraphs up to `max` words; null when the result is under `min`.
 * The first paragraph is always kept, even if it alone exceeds `max`.
 */
export function cutToLength(text: string, min = 700, max = 900): { body: string; wordCount: number } | null {
  const kept: string[] = [];
  let count = 0;
  for (const para of text.split(/\n{2,}/)) {
    const n = wordCount(para);
    if (kept.length && count + n > max) break;
    kept.push(para);
    count += n;
  }
  return count < min ? null : { body: kept.join("\n\n"), wordCount: count };
}
