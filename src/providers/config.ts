import { readFile } from "node:fs/promises";
import { paths } from "../paths.js";

export interface ProviderConfig {
  enabled: boolean;
  type: string;
  apiKey?: string;
  apiKeyEnvironmentVariable?: string;
  language?: string;
  radiusMetres?: number;
}

export type ProvidersConfig = Record<string, ProviderConfig>;

export async function loadProvidersConfig(): Promise<ProvidersConfig> {
  return JSON.parse(await readFile(paths.providers, "utf8")) as ProvidersConfig;
}

export function hasCredentials(config: ProviderConfig): boolean {
  if (!config.apiKeyEnvironmentVariable) return true;
  return Boolean(process.env[config.apiKeyEnvironmentVariable]);
}
