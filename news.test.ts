import assert from "node:assert/strict";
import test from "node:test";
import { rankStory } from "./news.js";

test("interest matches increase a story's rank and explain why", () => {
  const relevant = rankStory("Artificial intelligence advances science", "New technology research", ["artificial intelligence", "science", "music"]);
  const generic = rankStory("General update", "No matching topic", ["artificial intelligence", "science", "music"]);
  assert.ok(relevant.score > generic.score);
  assert.equal(relevant.reasons.length, 2);
  assert.match(relevant.reasons[0], /interest/i);
});
