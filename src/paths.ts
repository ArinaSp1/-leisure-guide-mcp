import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(sourceDir, "..");

export const paths = {
  root: projectRoot,
  settings: path.join(projectRoot, "config", "settings.json"),
  events: path.join(projectRoot, "data", "events.json"),
  customDemoEvents: path.join(projectRoot, "demo", "custom-events.json"),
  feeds: path.join(projectRoot, "config", "feeds.json"),
  providers: path.join(projectRoot, "config", "providers.json"),
  checklist: path.join(projectRoot, "data", "checklist.json"),
};
