import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { paths } from "./paths.js";
import type { TimelineEvent } from "./types.js";

interface CustomDemoEvent {
  hoursAgo: number;
  type: TimelineEvent["type"];
  title: string;
  detail?: string;
  confidence: number;
  metadata?: Record<string, string | number | boolean>;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function loadCustomDemoEvents(): Promise<CustomDemoEvent[]> {
  try {
    return JSON.parse(await readFile(paths.customDemoEvents, "utf8")) as CustomDemoEvent[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error(`Could not read demo/custom-events.json: ${(error as Error).message}`);
  }
}

export async function createDemoEvents(): Promise<TimelineEvent[]> {
  const base = (event: Omit<TimelineEvent, "id" | "source" | "simulated">): TimelineEvent => ({
    ...event,
    id: randomUUID(),
    source: "demo",
    simulated: true,
  });

  const builtInEvents = [
    base({
      type: "note",
      title: "Morning brief prepared",
      detail: "Rain was expected later, so an umbrella was suggested.",
      timestamp: hoursAgo(0.8),
      confidence: 1,
      metadata: { category: "weather_advice" },
    }),
    base({
      type: "app_activity",
      title: "Research session",
      detail: "A browser was active for 38 minutes.",
      timestamp: hoursAgo(1.5),
      confidence: 1,
      metadata: { app: "Browser", minutes: 38 },
    }),
    base({
      type: "item_seen",
      title: "Charger last seen",
      detail: "Manually recorded beside the desk.",
      timestamp: hoursAgo(2.2),
      confidence: 1,
      metadata: { item: "charger", place: "home desk", method: "demo_manual" },
    }),
    base({
      type: "place_seen",
      title: "Home detected",
      detail: "Connected to a known home network.",
      timestamp: hoursAgo(6),
      confidence: 0.82,
      metadata: { place: "home", method: "demo_wifi" },
    }),
    base({
      type: "app_activity",
      title: "Focused work session",
      detail: "VS Code was active for 54 minutes.",
      timestamp: hoursAgo(4.8),
      confidence: 1,
      metadata: { app: "Visual Studio Code", minutes: 54 },
    }),
    base({
      type: "item_seen",
      title: "Headphones last seen",
      detail: "Simulated Bluetooth detection at home.",
      timestamp: hoursAgo(3.5),
      confidence: 0.76,
      metadata: { item: "headphones", place: "home", method: "demo_bluetooth" },
    }),
    base({
      type: "reminder",
      title: "Break suggested",
      detail: "A long uninterrupted work session was detected.",
      timestamp: hoursAgo(2.5),
      confidence: 1,
    }),
    base({
      type: "place_seen",
      title: "University detected",
      detail: "Connected to a known university network.",
      timestamp: hoursAgo(8),
      confidence: 0.86,
      metadata: { place: "university", method: "demo_wifi" },
    }),
    base({
      type: "item_seen",
      title: "ID last seen",
      detail: "The departure checklist was confirmed at home.",
      timestamp: hoursAgo(9),
      confidence: 0.72,
      metadata: { item: "id", place: "home", method: "demo_checklist" },
    }),
    base({
      type: "reminder",
      title: "Departure checklist completed",
      detail: "Keys, phone, card, headphones, charger, and ID were confirmed.",
      timestamp: hoursAgo(9.2),
      confidence: 1,
    }),
    base({
      type: "app_activity",
      title: "Evening entertainment",
      detail: "A video app was active for 47 minutes.",
      timestamp: hoursAgo(18),
      confidence: 1,
      metadata: { app: "Video", minutes: 47 },
    }),
    base({
      type: "item_seen",
      title: "Keys last seen",
      detail: "The departure checklist placed them at home.",
      timestamp: hoursAgo(21),
      confidence: 0.78,
      metadata: { item: "keys", place: "home entrance", method: "demo_checklist" },
    }),
    base({
      type: "place_seen",
      title: "Home arrival inferred",
      detail: "The laptop reconnected to the known home network.",
      timestamp: hoursAgo(22),
      confidence: 0.84,
      metadata: { place: "home", method: "demo_wifi" },
    }),
    base({
      type: "app_activity",
      title: "Long study session",
      detail: "Notes and VS Code were active for 96 minutes.",
      timestamp: hoursAgo(27),
      confidence: 1,
      metadata: { app: "Notes + Visual Studio Code", minutes: 96 },
    }),
    base({
      type: "reminder",
      title: "Stretch reminder",
      detail: "A five-minute movement break was suggested.",
      timestamp: hoursAgo(28.7),
      confidence: 1,
    }),
    base({
      type: "item_seen",
      title: "Card last seen",
      detail: "The card was manually recorded in the backpack.",
      timestamp: hoursAgo(31),
      confidence: 1,
      metadata: { item: "card", place: "backpack", method: "demo_manual" },
    }),
    base({
      type: "place_seen",
      title: "Café visit inferred",
      detail: "Connected to a saved café network for 52 minutes.",
      timestamp: hoursAgo(34),
      confidence: 0.68,
      metadata: { place: "café", method: "demo_wifi" },
    }),
    base({
      type: "item_seen",
      title: "Phone last seen",
      detail: "Recorded during the café departure checklist.",
      timestamp: hoursAgo(34.8),
      confidence: 0.8,
      metadata: { item: "phone", place: "café", method: "demo_checklist" },
    }),
    base({
      type: "note",
      title: "Daily screen summary",
      detail: "4h 12m total: 62% productive, 18% communication, 20% entertainment.",
      timestamp: hoursAgo(44),
      confidence: 1,
      metadata: { totalMinutes: 252, productivePercent: 62 },
    }),
    base({
      type: "reminder",
      title: "Charger suggested",
      detail: "Laptop battery was low before the university routine.",
      timestamp: hoursAgo(48),
      confidence: 0.95,
    }),
    base({
      type: "item_seen",
      title: "Headphones seen at university",
      detail: "Simulated nearby-device detection in the library.",
      timestamp: hoursAgo(52),
      confidence: 0.73,
      metadata: { item: "headphones", place: "university library", method: "demo_bluetooth" },
    }),
    base({
      type: "place_seen",
      title: "University library inferred",
      detail: "A known network and calendar event agreed on the location.",
      timestamp: hoursAgo(52.2),
      confidence: 0.9,
      metadata: { place: "university library", method: "demo_combined" },
    }),
  ];

  const customEvents = (await loadCustomDemoEvents()).map((event) =>
    base({
      type: event.type,
      title: event.title,
      detail: event.detail,
      timestamp: hoursAgo(event.hoursAgo),
      confidence: event.confidence,
      metadata: event.metadata,
    }),
  );

  return [...builtInEvents, ...customEvents];
}
