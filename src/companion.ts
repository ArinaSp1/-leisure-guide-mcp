import { describeWeather, weatherAdvice } from "./advice.js";
import { investigateItem } from "./inference.js";
import { loadSettings } from "./settings.js";
import { addEvent, getEvents, replaceDemoEvents } from "./storage.js";
import { createDemoEvents } from "./demo.js";
import { getWeather } from "./weather.js";
export { getDepartureChecklist, setDepartureItem } from "./checklist.js";

export async function getDailyBrief(cityOverride?: string) {
  const settings = await loadSettings();
  const weather = await getWeather(cityOverride ?? settings.city, settings.countryCode);
  return {
    generatedAt: new Date().toISOString(),
    weather: {
      ...weather,
      condition: describeWeather(weather.weatherCode),
    },
    advice: weatherAdvice(weather),
    departureItems: settings.departureItems,
    departureItemsSource: "config/settings.json (provided during setup)",
    privacy: "Activity stays in a local JSON file. Demo events are labelled simulated.",
  };
}

export async function recordItemSeen(item: string, place: string) {
  return addEvent({
    type: "item_seen",
    title: `${item} seen`,
    detail: `Manually recorded at ${place}.`,
    timestamp: new Date().toISOString(),
    source: "manual",
    confidence: 1,
    metadata: { item: item.toLowerCase(), place, method: "manual" },
  });
}

export async function findItem(item: string, includeSimulated = false) {
  const events = (await getEvents(500)).filter((event) => includeSimulated || !event.simulated);
  return investigateItem(events, item);
}

export async function seedDemoData() {
  const events = await createDemoEvents();
  await replaceDemoEvents(events);
  return { created: events.length, simulated: true };
}
