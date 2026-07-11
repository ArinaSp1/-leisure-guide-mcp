import assert from "node:assert/strict";
import test from "node:test";
import { investigateItem } from "./inference.js";
import type { TimelineEvent } from "./types.js";

const now = new Date("2026-07-11T12:00:00.000Z");

function event(overrides: Partial<TimelineEvent>): TimelineEvent {
  return {
    id: crypto.randomUUID(),
    type: "item_seen",
    title: "Headphones seen",
    timestamp: "2026-07-11T11:00:00.000Z",
    source: "manual",
    confidence: 1,
    metadata: { item: "headphones", place: "home", method: "manual" },
    ...overrides,
  };
}

test("prefers recent real evidence over old simulated evidence", () => {
  const events = [
    event({ id: "real-home", simulated: false }),
    event({
      id: "demo-library",
      timestamp: "2026-07-08T11:00:00.000Z",
      source: "demo",
      simulated: true,
      confidence: 0.8,
      metadata: { item: "headphones", place: "library", method: "demo_bluetooth" },
    }),
  ];
  const result = investigateItem(events, "headphones", now);
  assert.equal(result.bestCandidate?.place, "home");
  assert.ok((result.bestCandidate?.confidence ?? 0) > (result.alternatives[0]?.confidence ?? 0));
  assert.match(result.caveat, /inference/i);
});

test("returns an honest empty conclusion", () => {
  const result = investigateItem([], "keys", now);
  assert.equal(result.found, false);
  assert.equal(result.alternatives.length, 0);
});
