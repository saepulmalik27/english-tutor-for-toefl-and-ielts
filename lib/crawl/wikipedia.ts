// Crawls Reading Section 3 passages from English Wikipedia Good articles (PRD v2, ticket 04).
// Follows https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits: a User-Agent with contact
// details, paced requests, and Retry-After on 429.
import { db } from "@/lib/db";
import { cleanExtract, cutToLength } from "./wikipedia-text.ts";

const API = "https://en.wikipedia.org/w/api.php";
const SEARCH =
  "incategory:Good_articles -incategory:Living_people articletopic:stem|environment|society|history|education|psychology";
const MIN_WORDS = 700;
const PACE_MS = 1000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function userAgent() {
  const contact = process.env.WIKIMEDIA_CONTACT?.trim();
  if (!contact) throw new Error("WIKIMEDIA_CONTACT is not set (an email or URL Wikimedia can reach you at)");
  return `english-tutor-crawler/1.0 (${contact})`;
}

async function api<T>(params: Record<string, string>, tries = 3): Promise<T> {
  const url = `${API}?${new URLSearchParams({ action: "query", format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": userAgent() } });
  if (res.status === 429 && tries > 1) {
    await sleep((Number(res.headers.get("retry-after")) || 5) * 1000);
    return api<T>(params, tries - 1);
  }
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** Fetches up to `limit` random Good articles and stores the new ones as reading_s3 passages. */
export async function crawlGoodArticles(limit = 10) {
  const search = await api<{ query?: { search?: { pageid: number; title: string; wordcount: number }[] } }>({
    list: "search", srsearch: SEARCH, srsort: "random", srlimit: String(limit), srprop: "wordcount", srnamespace: "0",
  });
  const hits = (search.query?.search ?? []).filter(h => h.wordcount >= MIN_WORDS);
  const known = new Set(
    (await db.passage.findMany({
      where: { source: "enwiki", sourceId: { in: hits.map(h => String(h.pageid)) } },
      select: { sourceId: true },
    })).map(p => p.sourceId)
  );

  let saved = 0, tooShort = 0;
  for (const hit of hits.filter(h => !known.has(String(h.pageid)))) {
    await sleep(PACE_MS);
    const data = await api<{ query?: { pages?: { pageid: number; title: string; extract?: string; fullurl?: string }[] } }>({
      prop: "extracts|info", explaintext: "1", inprop: "url", pageids: String(hit.pageid),
    });
    const page = data.query?.pages?.[0];
    const cut = page?.extract ? cutToLength(cleanExtract(page.extract), MIN_WORDS) : null;
    if (!page || !cut) { tooShort++; continue; }
    const { count } = await db.passage.createMany({
      data: [{
        kind: "reading_s3", title: page.title, body: cut.body, wordCount: cut.wordCount,
        source: "enwiki", sourceId: String(page.pageid), sourceUrl: page.fullurl, license: "CC BY-SA 4.0",
      }],
      skipDuplicates: true,
    });
    saved += count;
  }
  return { found: hits.length, alreadyStored: known.size, saved, tooShort };
}
