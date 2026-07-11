import type { ProviderConfig } from "./config.js";
import type { ProviderStatus, RecommendationCandidate, RecommendationContext, RecommendationProvider } from "./types.js";

interface Meal {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strSource?: string;
  strYoutube?: string;
}

export class TheMealDbProvider implements RecommendationProvider {
  readonly id = "recipes";
  readonly name = "TheMealDB";
  readonly category = "cook" as const;
  constructor(private readonly config: ProviderConfig) {}

  status(): ProviderStatus {
    return { id: this.id, name: this.name, category: this.category, state: this.config.enabled ? "live" : "disabled", detail: this.config.enabled ? "Dynamic recipe suggestions" : "Disabled in provider settings" };
  }

  async search(context: RecommendationContext): Promise<RecommendationCandidate[]> {
    if (!this.config.enabled) return [];
    const key = this.config.apiKey ?? "1";
    const requests = [0, 1, 2].map(async () => {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/${encodeURIComponent(key)}/random.php`, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`TheMealDB returned ${response.status}`);
      return ((await response.json()) as { meals?: Meal[] }).meals?.[0];
    });
    const meals = (await Promise.all(requests)).filter((meal): meal is Meal => Boolean(meal));
    const unique = [...new Map(meals.map((meal) => [meal.idMeal, meal])).values()];
    return unique.map((meal, index) => ({
      id: `meal-${meal.idMeal}`,
      provider: this.name,
      category: this.category,
      title: meal.strMeal,
      description: [meal.strArea, meal.strCategory].filter(Boolean).join(" / ") || "Recipe suggestion",
      url: meal.strSource || meal.strYoutube || `https://www.themealdb.com/meal/${meal.idMeal}`,
      estimatedMinutes: 45,
      score: 62 - index * 3,
      reasons: ["Live recipe returned by TheMealDB", "Leisure Guide uses a provisional 45-minute estimate because this provider does not supply cooking duration"],
      metadata: { mealId: meal.idMeal, category: meal.strCategory ?? "unknown", area: meal.strArea ?? "unknown" },
    }));
  }
}
