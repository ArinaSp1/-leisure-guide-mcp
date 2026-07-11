export type EventSource = "system" | "weather" | "activity" | "manual" | "demo";

export interface TimelineEvent {
  id: string;
  type: "app_activity" | "item_seen" | "place_seen" | "reminder" | "note";
  title: string;
  detail?: string;
  timestamp: string;
  source: EventSource;
  confidence: number;
  simulated?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface Settings {
  city: string;
  countryCode?: string;
  breakReminderMinutes: number;
  departureItems: string[];
  interests: string[];
  demoMode: boolean;
  activityTracking: boolean;
}

export interface WeatherSnapshot {
  city: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationMm: number;
  precipitationProbability: number;
  windKph: number;
  weatherCode: number;
  observedAt: string;
}

export interface AppUsage {
  app: string;
  seconds: number;
}
