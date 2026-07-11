import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { paths } from "./paths.js";
import { loadSettings } from "./settings.js";

export interface DepartureChecklist {
  date: string;
  source: "user_setup";
  items: Array<{ name: string; confirmed: boolean }>;
  completedCount: number;
  totalCount: number;
  complete: boolean;
}

interface StoredChecklist {
  date: string;
  confirmed: Record<string, boolean>;
}

function today(): string {
  return new Date().toLocaleDateString("sv-SE");
}

async function readStored(): Promise<StoredChecklist> {
  try {
    const stored = JSON.parse(await readFile(paths.checklist, "utf8")) as StoredChecklist;
    return stored.date === today() ? stored : { date: today(), confirmed: {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { date: today(), confirmed: {} };
    throw error;
  }
}

async function writeStored(value: StoredChecklist): Promise<void> {
  await mkdir(path.dirname(paths.checklist), { recursive: true });
  await writeFile(paths.checklist, JSON.stringify(value, null, 2));
}

export async function getDepartureChecklist(): Promise<DepartureChecklist> {
  const [settings, stored] = await Promise.all([loadSettings(), readStored()]);
  const items = settings.departureItems.map((name) => ({ name, confirmed: Boolean(stored.confirmed[name.toLowerCase()]) }));
  const completedCount = items.filter((item) => item.confirmed).length;
  return { date: stored.date, source: "user_setup", items, completedCount, totalCount: items.length, complete: items.length > 0 && completedCount === items.length };
}

export async function setDepartureItem(itemName: string, confirmed: boolean): Promise<DepartureChecklist> {
  const settings = await loadSettings();
  const configured = settings.departureItems.find((item) => item.toLowerCase() === itemName.trim().toLowerCase());
  if (!configured) throw new Error(`${itemName} is not in the user's departure checklist`);
  const stored = await readStored();
  stored.confirmed[configured.toLowerCase()] = confirmed;
  await writeStored(stored);
  return getDepartureChecklist();
}
