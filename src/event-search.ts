import { parseFeed } from "./news.js";

export interface EventSearchResult {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  kind: "public_feed_lead";
}

export async function searchEvents(keyword: string, city: string, limit = 10) {
  const cleanKeyword = keyword.trim();
  const cleanCity = city.trim();
  if (!cleanKeyword || !cleanCity) throw new Error("Keyword and city are required.");

  const searchPhrase = `${cleanKeyword} events ${cleanCity}`;
  const feedUrl = new URL("https://news.google.com/rss/search");
  feedUrl.searchParams.set("q", `${searchPhrase} when:30d`);
  feedUrl.searchParams.set("hl", "en");
  feedUrl.searchParams.set("gl", "DE");
  feedUrl.searchParams.set("ceid", "DE:en");

  let results: EventSearchResult[] = [];
  let warning: string | undefined;
  try {
    const response = await fetch(feedUrl, {
      headers: { "user-agent": "Leisure-Guide-MCP/0.7" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Public event feed returned ${response.status}`);
    results = parseFeed(await response.text(), "Google News RSS", [cleanKeyword, cleanCity])
      .slice(0, Math.max(1, Math.min(limit, 20)))
      .map(({ title, url, source, publishedAt }) => ({ title, url, source, publishedAt, kind: "public_feed_lead" as const }));
  } catch (error) {
    warning = (error as Error).message;
  }

  const encodedQuery = encodeURIComponent(`${cleanKeyword} ${cleanCity}`);
  return {
    query: { keyword: cleanKeyword, city: cleanCity },
    generatedAt: new Date().toISOString(),
    results,
    warning,
    interpretation: "These are recent public-feed pages that may describe relevant events. Open the source to verify the date, venue, availability, and price.",
    externalSearches: [
      { provider: "Luma", url: `https://lu.ma/discover?q=${encodedQuery}`, note: "External discovery link; Leisure Guide does not read Luma results because Luma has no credential-free public discovery API." },
      { provider: "Eventbrite", url: `https://www.eventbrite.com/d/${encodeURIComponent(cleanCity)}/${encodeURIComponent(cleanKeyword)}/`, note: "External discovery link; results are not imported into Leisure Guide." },
    ],
    privacy: "Only the entered keyword and city are sent to the public RSS endpoint.",
  };
}
