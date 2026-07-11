import { getPersonalNews } from "../news.js";
import type { ProviderConfig } from "./config.js";
import type { ProviderStatus, RecommendationCandidate, RecommendationContext, RecommendationProvider } from "./types.js";

export class NewsProvider implements RecommendationProvider {
  readonly id = "news";
  readonly name = "Configured RSS feeds";
  readonly category = "news" as const;
  constructor(private readonly config: ProviderConfig) {}
  status(): ProviderStatus { return { id: this.id, name: this.name, category: this.category, state: this.config.enabled ? "live" : "disabled", detail: this.config.enabled ? "Interest-ranked live feeds" : "Disabled in provider settings" }; }
  async search(context: RecommendationContext): Promise<RecommendationCandidate[]> {
    if (!this.config.enabled) return [];
    const news = await getPersonalNews(context.interests, 5);
    return news.stories.map((story) => ({ id: `news-${story.url}`, provider: story.source, category: this.category, title: story.title, description: story.source, url: story.url, score: story.score, reasons: story.reasons, metadata: { publishedAt: story.publishedAt ?? null } }));
  }
}
