import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { paths } from "./paths.js";
import type { TimelineEvent } from "./types.js";

async function readEventsFile(): Promise<TimelineEvent[]> {
  try {
    return JSON.parse(await readFile(paths.events, "utf8")) as TimelineEvent[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function getEvents(limit = 100): Promise<TimelineEvent[]> {
  const events = await readEventsFile();
  return events
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, Math.max(1, Math.min(limit, 500)));
}

export async function addEvent(
  event: Omit<TimelineEvent, "id">,
): Promise<TimelineEvent> {
  const events = await readEventsFile();
  const stored = { ...event, id: randomUUID() };
  events.push(stored);
  await mkdir(path.dirname(paths.events), { recursive: true });
  await writeFile(paths.events, JSON.stringify(events.slice(-1000), null, 2));
  return stored;
}

export async function replaceDemoEvents(demoEvents: TimelineEvent[]): Promise<void> {
  const events = (await readEventsFile()).filter((event) => !event.simulated);
  await mkdir(path.dirname(paths.events), { recursive: true });
  await writeFile(paths.events, JSON.stringify([...events, ...demoEvents], null, 2));
}
