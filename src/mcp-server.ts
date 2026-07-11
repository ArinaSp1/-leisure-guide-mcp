import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDailyBrief, getDepartureChecklist, setDepartureItem } from "./companion.js";
import { getDailyDigest } from "./digest.js";
import { suggestWhatToDo } from "./recommendations.js";
import { addDepartureItem, getUserProfile, removeDepartureItem } from "./profile.js";
import { searchEvents } from "./event-search.js";

export function createLeisureGuideMcpServer(): McpServer {
  const server = new McpServer({ name: "leisure-guide", version: "0.6.0" });
  const result = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }], structuredContent: value as Record<string, unknown> });

  server.tool("get_user_profile", "Read the user's local Leisure Guide profile, including interests and configured departure essentials.", {}, async () => result(await getUserProfile()));
  server.tool("add_departure_item", "Add an item to the user's standard daily departure checklist.", { item: z.string().min(1).max(40) }, async ({ item }) => result(await addDepartureItem(item)));
  server.tool("remove_departure_item", "Remove an item from the user's standard daily departure checklist.", { item: z.string().min(1).max(40) }, async ({ item }) => result(await removeDepartureItem(item)));
  server.tool("get_departure_checklist", "Read today's user-configured essentials and see which items the user has confirmed.", {}, async () => result(await getDepartureChecklist()));
  server.tool("confirm_departure_item", "Mark one configured essential as confirmed or not confirmed for today.", { item: z.string().min(1), confirmed: z.boolean().default(true) }, async ({ item, confirmed }) => result(await setDepartureItem(item, confirmed)));
  server.tool("suggest_what_to_do", "Query all configured live providers for recipes, news, and nearby discoveries, then rank the results with explanations.", {
    availableMinutes: z.number().int().min(5).max(720).optional(),
    budget: z.number().min(0).max(10000).optional(),
    area: z.string().min(1).max(100).optional(),
    categories: z.array(z.enum(["cook", "learn", "explore", "event", "music", "news", "shopping"])).optional(),
  }, async (options) => result(await suggestWhatToDo(options)));
  server.tool("get_daily_digest", "Rank today's weather, real reminders, personalized news, recipes, and discoveries. Explain why every card was selected.", {}, async () => result(await getDailyDigest()));
  server.tool("search_events", "Find recent public-feed leads for events by keyword and city, plus safe external Luma and Eventbrite discovery links. No API key is required.", {
    keyword: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
    limit: z.number().int().min(1).max(20).default(10),
  }, async ({ keyword, city, limit }) => result(await searchEvents(keyword, city, limit)));
  server.tool("get_daily_brief", "Get live weather, practical advice, and the user's departure checklist.", { city: z.string().min(1).optional().describe("Optional city override") }, async ({ city }) => result(await getDailyBrief(city)));
  return server;
}
