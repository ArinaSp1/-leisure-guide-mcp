import { addEvent } from "./storage.js";

let timer: NodeJS.Timeout | undefined;
let lastApp = "";
let startedAt = Date.now();

async function sample(): Promise<void> {
  try {
    const { activeWindow } = await import("active-win");
    const window = await activeWindow({
      accessibilityPermission: false,
      screenRecordingPermission: false,
    });
    const app = window?.owner.name?.trim();
    if (!app || app === lastApp) return;

    if (lastApp) {
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      await addEvent({
        type: "app_activity",
        title: `${lastApp} activity`,
        detail: `${Math.round(seconds / 60)} minute session`,
        timestamp: new Date().toISOString(),
        source: "activity",
        confidence: 1,
        metadata: { app: lastApp, seconds },
      });
    }

    lastApp = app;
    startedAt = Date.now();
  } catch (error) {
    if (timer) clearInterval(timer);
    timer = undefined;
    console.error("Activity tracking is unavailable:", (error as Error).message);
  }
}

export function startActivityTracking(): void {
  if (timer) return;
  void sample();
  timer = setInterval(() => void sample(), 10_000);
  timer.unref();
}
