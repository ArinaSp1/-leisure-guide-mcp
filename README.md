# Leisure Guide MCP

An API-driven, cross-platform leisure and daily-context guide with live weather, news, recipes, nearby discoveries, event search, and a user-owned departure checklist.

## What is real in this prototype

- Live weather from Open-Meteo
- Active application changes while the program is running
- Manually recorded item sightings
- A local timeline stored in `data/events.json`
- MCP tools that expose the same core functions as the dashboard

Bluetooth, Wi-Fi location, GPS, and historical screen-time imports are intentionally not included. The hackathon build focuses on live API context, recommendations, profile tools, and event discovery.

## Run the dashboard

On Windows, double-click `start-dashboard.cmd`. Keep the terminal window open, then visit <http://127.0.0.1:4318>.

Alternatively, run it from a terminal:

```sh
npm install
npm run dev
```

Open <http://127.0.0.1:4318>.

While the dashboard process is running, the same local service exposes MCP over Streamable HTTP at <http://127.0.0.1:4318/mcp>. By default it binds only to `127.0.0.1`; hosted deployments set `HOST=0.0.0.0` and receive a public HTTPS address from the platform.

Edit `config/settings.json` to change the city and departure checklist.

Edit `demo/custom-events.json` to create simulated hackathon scenarios without changing the application code. See `demo/README.md` for the event fields and examples.

## Run as an MCP server

First build the project:

```sh
npm run build
```

Configure your MCP client to launch:

```json
{
  "mcpServers": {
    "leisure-guide": {
      "command": "node",
      "args": ["/absolute/path/to/leisure-guide/dist/mcp.js"]
    }
  }
}
```

The server exposes `get_user_profile`, `add_departure_item`, `remove_departure_item`, `get_departure_checklist`, `confirm_departure_item`, `suggest_what_to_do`, `get_daily_digest`, `search_events`, and `get_daily_brief`.

`get_daily_digest` ranks live weather, real reminders, interest-based RSS stories, recipes, and nearby discoveries. Edit `config/feeds.json` and the `interests` field in `config/settings.json` to personalize it.

`suggest_what_to_do` queries every implemented recommendation provider dynamically. Provider configuration lives in `config/providers.json`. The hackathon build includes only implemented, credential-free providers: TheMealDB, Wikimedia GeoSearch, RSS, and Open-Meteo.

`search_events` accepts a keyword and city. It returns recent public RSS leads and direct Luma/Eventbrite discovery links without requiring credentials. Feed results are leads rather than guaranteed event listings, so dates, venues, prices, and availability must be verified on the linked source. Luma results are not imported because its official API requires Luma Plus and is intended for calendars controlled by the API-key owner.

## Public deployment on Render

This repository includes `render.yaml`. Connect the repository in Render and deploy the Blueprint. Render sets `PORT`; the Blueprint sets `HOST=0.0.0.0`, builds the TypeScript project, starts the service, and checks `/health`.

After deployment, the judge-facing MCP endpoint is:

```text
https://YOUR-SERVICE.onrender.com/mcp
```

The root URL opens the optional dashboard. MCP-compatible AI clients should be configured with the `/mcp` URL using Streamable HTTP. Free Render instances sleep after inactivity and use an ephemeral filesystem, so local checklist/profile changes can reset after a restart or redeploy.

## Privacy

The prototype stores data locally. It records application names and session duration, not window titles, URLs, typed text, screenshots, or message contents. Set `activityTracking` to `false` in `config/settings.json` to disable it.
