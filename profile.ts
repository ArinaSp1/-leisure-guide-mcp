import { writeFile } from "node:fs/promises";
import { paths } from "./paths.js";
import { loadSettings } from "./settings.js";

export async function getUserProfile() {
  const settings = await loadSettings();
  return {
    city: settings.city,
    countryCode: settings.countryCode,
    interests: settings.interests,
    departureItems: settings.departureItems,
    source: "user_setup" as const,
    storage: "local" as const,
  };
}

async function saveDepartureItems(items: string[]) {
  const settings = await loadSettings();
  settings.departureItems = items;
  await writeFile(paths.settings, JSON.stringify(settings, null, 2));
  return getUserProfile();
}

export async function addDepartureItem(rawItem: string) {
  const item = rawItem.trim();
  if (!item) throw new Error("Item name is required");
  if (item.length > 40) throw new Error("Item name must be 40 characters or fewer");
  const settings = await loadSettings();
  if (settings.departureItems.some((existing) => existing.toLowerCase() === item.toLowerCase())) return getUserProfile();
  if (settings.departureItems.length >= 30) throw new Error("The checklist supports up to 30 essentials");
  return saveDepartureItems([...settings.departureItems, item]);
}

export async function removeDepartureItem(rawItem: string) {
  const item = rawItem.trim().toLowerCase();
  const settings = await loadSettings();
  return saveDepartureItems(settings.departureItems.filter((existing) => existing.toLowerCase() !== item));
}
