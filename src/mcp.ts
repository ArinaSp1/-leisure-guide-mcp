import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLeisureGuideMcpServer } from "./mcp-server.js";

await createLeisureGuideMcpServer().connect(new StdioServerTransport());
