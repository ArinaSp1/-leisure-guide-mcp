import { readFile } from "node:fs/promises";
import { paths } from "./paths.js";
import type { Settings } from "./types.js";

export async function loadSettings(): Promise<Settings> {
  return JSON.parse(await readFile(paths.settings, "utf8")) as Settings;
}
