# Editing Clue's demo evidence

Edit `custom-events.json` to add or change simulated events. Clicking **Load demo evidence** imports these entries together with Clue's built-in scenario.

Each event has:

- `hoursAgo`: relative time; `0.5` means 30 minutes ago and `24` means yesterday.
- `type`: `item_seen`, `place_seen`, `reminder`, `app_activity`, or `note`.
- `title`: the short timeline label.
- `detail`: the human-readable explanation.
- `confidence`: a number from `0` to `1`.
- `metadata`: structured facts used by the inference engine.

For an item sighting, `metadata` needs `item`, `place`, and `method`. For place corroboration, the `place` text must exactly match the item sighting's place.

After editing the file, restart the dashboard and click **Load demo evidence** again. Invalid JSON will produce a clear error instead of silently loading incorrect data.
