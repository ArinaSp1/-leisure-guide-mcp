import { createServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDailyBrief, getDepartureChecklist, setDepartureItem } from "./companion.js";
import { getDailyDigest } from "./digest.js";
import { suggestWhatToDo } from "./recommendations.js";
import { addDepartureItem, getUserProfile, removeDepartureItem } from "./profile.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createLeisureGuideMcpServer } from "./mcp-server.js";
import { searchEvents } from "./event-search.js";

const port = Number(process.env.PORT ?? 4318);
const host = process.env.HOST ?? "127.0.0.1";
const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(sourceDir, "..", "public", "index.html");

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

async function readBody(request: AsyncIterable<Buffer>): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? (JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>) : {};
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname === "/health" && request.method === "GET") {
      json(response, 200, { status: "ok", service: "leisure-guide", transport: "streamable-http" });
    } else if (url.pathname === "/mcp" && request.method === "POST") {
      const mcpServer = createLeisureGuideMcpServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      await mcpServer.connect(transport);
      await transport.handleRequest(request, response, await readBody(request));
      response.on("close", () => { void transport.close(); void mcpServer.close(); });
    } else if (url.pathname === "/mcp") {
      json(response, 405, { jsonrpc: "2.0", error: { code: -32000, message: "Use POST with MCP Streamable HTTP." }, id: null });
    } else if (url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(await readFile(indexPath));
    } else if (url.pathname === "/api/brief") {
      json(response, 200, await getDailyBrief());
    } else if (url.pathname === "/api/digest") {
      json(response, 200, await getDailyDigest());
    } else if (url.pathname === "/api/checklist") {
      json(response, 200, await getDepartureChecklist());
    } else if (url.pathname === "/api/checklist/item" && request.method === "POST") {
      const body = await readBody(request);
      json(response, 200, await setDepartureItem(String(body.item ?? ""), Boolean(body.confirmed)));
    } else if (url.pathname === "/api/profile") {
      json(response, 200, await getUserProfile());
    } else if (url.pathname === "/api/profile/departure-items" && request.method === "POST") {
      const body = await readBody(request);
      json(response, 200, await addDepartureItem(String(body.item ?? "")));
    } else if (url.pathname === "/api/profile/departure-items" && request.method === "DELETE") {
      const body = await readBody(request);
      json(response, 200, await removeDepartureItem(String(body.item ?? "")));
    } else if (url.pathname === "/api/suggestions") {
      const categories = url.searchParams.get("categories")?.split(",").filter(Boolean);
      json(response, 200, await suggestWhatToDo({
        availableMinutes: Number(url.searchParams.get("minutes") ?? 90),
        budget: url.searchParams.has("budget") ? Number(url.searchParams.get("budget")) : undefined,
        area: url.searchParams.get("area") || undefined,
        categories,
      }));
    } else if (url.pathname === "/api/events") {
      json(response, 200, await searchEvents(url.searchParams.get("keyword") ?? "", url.searchParams.get("city") ?? "", Number(url.searchParams.get("limit") ?? 10)));
    } else {
      json(response, 404, { error: "Not found" });
    }
  } catch (error) {
    json(response, 500, { error: (error as Error).message });
  }
});

server.listen(port, host, () => {
  console.log(`Leisure Guide listening on http://${host}:${port}`);
  console.log("Leisure Guide MCP path:  /mcp");
});
