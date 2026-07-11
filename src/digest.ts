import { describeWeather, weatherAdvice } from "./advice.js";
import type { RecommendationCandidate } from "./providers/types.js";
import { suggestWhatToDo } from "./recommendations.js";
import { loadSettings } from "./settings.js";
import { getEvents } from "./storage.js";
import { getWeather } from "./weather.js";

export interface DigestCard {
  id: string;
  section: "must_know" | "worth_knowing" | "for_you" | "ready_action";
  title: string;
  detail: string;
  score: number;
  reasons: string[];
  provider?: string;
  action?: { label: string; url: string; requiresConfirmation: boolean };
}

function candidateCard(candidate: RecommendationCandidate): DigestCard {
  const section = candidate.category === "news" ? "worth_knowing" : "for_you";
  return { id: candidate.id, section, title: candidate.title, detail: candidate.description, score: candidate.score, reasons: candidate.reasons, provider: candidate.provider, action: { label: candidate.category === "cook" ? "View recipe" : candidate.category === "news" ? "Read story" : "Explore", url: candidate.url, requiresConfirmation: false } };
}

export async function getDailyDigest() {
  const settings = await loadSettings();
  const [weather, events, suggestions] = await Promise.all([getWeather(settings.city, settings.countryCode), getEvents(100), suggestWhatToDo({ availableMinutes: 90 })]);
  const cards: DigestCard[] = [{ id: "weather-now", section: "must_know", title: `${Math.round(weather.temperatureC)} C and ${describeWeather(weather.weatherCode)} in ${weather.city}`, detail: weatherAdvice(weather).join(" "), score: weather.precipitationProbability >= 50 ? 92 : 72, reasons: ["Live Open-Meteo conditions", "Useful before leaving"] }];
  for (const reminder of events.filter((event) => event.type === "reminder" && !event.simulated).slice(0, 2)) cards.push({ id: reminder.id, section: "must_know", title: reminder.title, detail: reminder.detail ?? "Reminder", score: Math.round(70 + reminder.confidence * 20), reasons: ["Recent reminder evidence", "Recorded locally"] });
  cards.push(...suggestions.recommendations.map(candidateCard));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return { generatedAt: new Date().toISOString(), greeting: `${greeting}. I hope your day in ${weather.city} goes smoothly.`, interests: settings.interests, cards: cards.sort((a, b) => b.score - a.score), providers: suggestions.providers, warnings: suggestions.errors.map((error) => error.error) };
}
