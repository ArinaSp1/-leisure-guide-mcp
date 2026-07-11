import type { ProviderConfig } from "./config.js";
import type { ProviderStatus, RecommendationCandidate, RecommendationContext, RecommendationProvider } from "./types.js";

interface GeoResult { pageid: number; title: string; dist: number; lat: number; lon: number }

export class WikimediaProvider implements RecommendationProvider {
  readonly id = "discoveries";
  readonly name = "Wikimedia GeoSearch";
  readonly category = "explore" as const;
  constructor(private readonly config: ProviderConfig) {}

  status(): ProviderStatus {
    return { id: this.id, name: this.name, category: this.category, state: this.config.enabled ? "live" : "disabled", detail: this.config.enabled ? "Nearby public knowledge using configured city coordinates" : "Disabled in provider settings" };
  }

  async search(context: RecommendationContext): Promise<RecommendationCandidate[]> {
    if (!this.config.enabled) return [];
    const language = this.config.language ?? "en";
    const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
    url.search = new URLSearchParams({ action: "query", format: "json", origin: "*", list: "geosearch", gscoord: `${context.latitude}|${context.longitude}`, gsradius: String(Math.min(this.config.radiusMetres ?? 10000, 10000)), gslimit: "12", gsnamespace: "0" }).toString();
    const response = await fetch(url, { headers: { "user-agent": "Leisure-Guide-MCP/0.6" }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Wikimedia returned ${response.status}`);
    const results = ((await response.json()) as { query?: { geosearch?: GeoResult[] } }).query?.geosearch ?? [];
    return results.slice(0, 6).map((place, index) => ({
      id: `wiki-${place.pageid}`,
      provider: this.name,
      category: this.category,
      title: place.title,
      description: `${Math.round(place.dist)} metres from the configured ${context.city} centre point`,
      url: `https://${language}.wikipedia.org/?curid=${place.pageid}`,
      distanceMetres: Math.round(place.dist),
      estimatedMinutes: 45,
      score: Math.max(35, 67 - index * 3 - Math.round(place.dist / 2000)),
      reasons: ["Live geotagged Wikimedia result", "Potential niche cultural or historical discovery", "Location is based on city centre until live location is connected"],
      metadata: { pageId: place.pageid, latitude: place.lat, longitude: place.lon, locationBasis: "configured_city_centre" },
    }));
  }
}
