import type { TimelineEvent, WeatherSnapshot } from "./types.js";

export function describeWeather(code: number): string {
  if (code === 0) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "foggy";
  if (code >= 51 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 80 && code <= 82) return "showery";
  if (code >= 95) return "stormy";
  return "changeable";
}

export function weatherAdvice(weather: WeatherSnapshot): string[] {
  const advice: string[] = [];
  if (weather.precipitationProbability >= 50 || weather.precipitationMm > 0) {
    advice.push("Take an umbrella or a rain jacket.");
  }
  if (weather.apparentTemperatureC <= 8) advice.push("Wear a warm outer layer.");
  else if (weather.apparentTemperatureC <= 15) advice.push("A light jacket may be useful.");
  else if (weather.apparentTemperatureC >= 27) advice.push("Bring water and avoid overheating.");
  if (weather.windKph >= 35) advice.push("Expect strong wind outside.");
  if (advice.length === 0) advice.push("No special weather preparation is needed.");
  return advice;
}

export function findLatestItem(events: TimelineEvent[], item: string): TimelineEvent | undefined {
  const normalized = item.trim().toLowerCase();
  return events.find(
    (event) =>
      event.type === "item_seen" &&
      String(event.metadata?.item ?? "").toLowerCase() === normalized,
  );
}
