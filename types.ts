export type RecommendationCategory = "cook" | "learn" | "explore" | "event" | "music" | "news" | "shopping";

export interface RecommendationContext {
  interests: string[];
  city: string;
  latitude: number;
  longitude: number;
  availableMinutes?: number;
  budget?: number;
  weather: {
    temperatureC: number;
    rainProbability: number;
    condition: string;
  };
}

export interface RecommendationCandidate {
  id: string;
  provider: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  url: string;
  estimatedMinutes?: number;
  estimatedCost?: number;
  distanceMetres?: number;
  score: number;
  reasons: string[];
  metadata: Record<string, unknown>;
}

export interface ProviderStatus {
  id: string;
  name: string;
  category: RecommendationCategory | "context";
  state: "live" | "disabled" | "needs_credentials" | "planned" | "error";
  detail: string;
}

export interface RecommendationProvider {
  id: string;
  name: string;
  category: RecommendationCategory;
  status(): ProviderStatus;
  search(context: RecommendationContext): Promise<RecommendationCandidate[]>;
}
