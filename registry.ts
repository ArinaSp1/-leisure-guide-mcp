import { loadProvidersConfig } from "./config.js";
import { NewsProvider } from "./news-provider.js";
import { TheMealDbProvider } from "./themealdb.js";
import type { ProviderStatus, RecommendationProvider } from "./types.js";
import { WikimediaProvider } from "./wikimedia.js";

export async function getRecommendationProviders(): Promise<RecommendationProvider[]> {
  const config = await loadProvidersConfig();
  return [new NewsProvider(config.news), new TheMealDbProvider(config.recipes), new WikimediaProvider(config.discoveries)];
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  const config = await loadProvidersConfig();
  const providers = await getRecommendationProviders();
  return [
    { id: "weather", name: "Open-Meteo", category: "context", state: config.weather.enabled ? "live" : "disabled", detail: "Weather and city coordinates" },
    ...providers.map((provider) => provider.status()),
  ];
}
