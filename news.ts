import { readFile } from "node:fs/promises";
import { paths } from "./paths.js";

interface FeedConfig {
  name: string;
  url: string;
  enabled: boolean;
}

export interface NewsStory {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  score: number;
  reasons: string[];
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, names: string[]): string | undefined {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return decodeXml(match[1]);
  }
  return undefined;
}

function link(block: string): string | undefined {
  const rssLink = tag(block, ["link"]);
  if (rssLink?.startsWith("http")) return rssLink;
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
  return atomLink?.startsWith("http") ? atomLink : undefined;
}

export function rankStory(title: string, description: string, interests: string[]) {
  const text = `${title} ${description}`.toLowerCase();
  const matched = interests.filter((interest) => text.includes(interest.toLowerCase()));
  const score = Math.min(85, 35 + matched.length * 18);
  return {
    score,
    reasons: matched.length
      ? matched.map((interest) => `Matches your interest: ${interest}`)
      : ["Recent story from a selected source"],
  };
}

export function parseFeed(xml: string, source: string, interests: string[]): NewsStory[] {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map((match) => match[2]);
  return blocks.slice(0, 15).flatMap((block) => {
    const title = tag(block, ["title"]);
    const url = link(block);
    if (!title || !url) return [];
    const description = tag(block, ["description", "summary", "content"]) ?? "";
    const ranking = rankStory(title, description, interests);
    return [{
      title,
      url,
      source,
      publishedAt: tag(block, ["pubDate", "published", "updated"]),
      ...ranking,
    }];
  });
}

export async function getPersonalNews(interests: string[], limit = 4): Promise<{ stories: NewsStory[]; errors: string[] }> {
  const feeds = JSON.parse(await readFile(paths.feeds, "utf8")) as FeedConfig[];
  const results = await Promise.allSettled(
    feeds.filter((feed) => feed.enabled).map(async (feed) => {
      const url = new URL(feed.url);
      if (url.protocol !== "https:") throw new Error(`${feed.name} must use HTTPS`);
      const response = await fetch(url, {
        headers: { "user-agent": "Leisure-Guide-MCP/0.6" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`${feed.name} returned ${response.status}`);
      return parseFeed(await response.text(), feed.name, interests);
    }),
  );

  const stories = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const errors = results.flatMap((result) => result.status === "rejected" ? [(result.reason as Error).message] : []);
  return {
    stories: stories.sort((a, b) => b.score - a.score).slice(0, limit),
    errors,
  };
}
