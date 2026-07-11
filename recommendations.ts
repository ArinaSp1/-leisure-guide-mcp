import { describeWeather } from "./advice.js";
import { getRecommendationProviders, getProviderStatuses } from "./providers/registry.js";
import type { RecommendationCandidate, RecommendationContext } from "./providers/types.js";
import { loadSettings } from "./settings.js";
import { getWeather } from "./weather.js";

export interface SuggestionOptions {
  availableMinutes?: number;
  budget?: number;
  categories?: string[];
  area?: string;
}

export async function suggestWhatToDo(options: SuggestionOptions = {}) {
  const settings = await loadSettings();
  const weather = await getWeather(options.area ?? settings.city, options.area ? undefined : settings.countryCode);
  const context: RecommendationContext = {
    interests: settings.interests,
    city: weather.city,
    latitude: weather.latitude,
    longitude: weather.longitude,
    availableMinutes: options.availableMinutes,
    budget: options.budget,
    weather: { temperatureC: weather.temperatureC, rainProbability: weather.precipitationProbability, condition: describeWeather(weather.weatherCode) },
  };
  const providers = await getRecommendationProviders();
  const selected = options.categories?.length ? providers.filter((provider) => options.categories?.includes(provider.category)) : providers;
  const results = await Promise.allSettled(selected.map(async (provider) => ({ provider, candidates: await provider.search(context) })));
  const candidates: RecommendationCandidate[] = [];
  const errors: Array<{ provider: string; error: string }> = [];
  for (const result of results) {
    if (result.status === "fulfilled") candidates.push(...result.value.candidates);
    else errors.push({ provider: "unknown", error: (result.reason as Error).message });
  }
  const durationFiltered = options.availableMinutes
    ? candidates.filter((candidate) => candidate.estimatedMinutes === undefined || candidate.estimatedMinutes <= options.availableMinutes!)
    : candidates;
  const constraintNotes = [
    options.availableMinutes ? "Duration is enforced only when a provider supplies duration metadata; unknown durations remain visible." : undefined,
    options.budget !== undefined ? "Connected providers currently do not supply reliable prices, so budget is recorded but not enforced." : undefined,
    options.area ? `Area is resolved live and location providers search around the centre of ${context.city}.` : undefined,
  ].filter((note): note is string => Boolean(note));
  return {
    generatedAt: new Date().toISOString(),
    context: { city: context.city, coordinateBasis: options.area ? "requested_area_centre" : "configured_city_centre", weather: context.weather, availableMinutes: options.availableMinutes ?? null, budget: options.budget ?? null },
    recommendations: durationFiltered.sort((a, b) => b.score - a.score).slice(0, 15),
    constraintNotes,
    providers: await getProviderStatuses(),
    errors,
  };
}
