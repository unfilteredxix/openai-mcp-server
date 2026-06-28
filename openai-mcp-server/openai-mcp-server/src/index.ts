import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { registerChatTools } from "./tools/chat.js";
import { registerImageTools } from "./tools/images.js";
import { registerInfoTools } from "./tools/info.js";

// Initialize MCP server
const server = new McpServer({
  name: "openai-mcp-server",
  version: "1.0.0",
});

// Register all tools
registerChatTools(server);
registerImageTools(server);
registerInfoTools(server);

// HTTP transport (for remote deployment on Render, Railway, etc.)
async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "openai-mcp-server", version: "1.0.0" });
  });

  // MCP endpoint
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT ?? "3000");
  app.listen(port, () => {
    console.error(`OpenAI MCP Server running on http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
  });
}

// stdio transport (for local use or Claude Desktop)
async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenAI MCP Server running on stdio");
}

// Choose transport based on environment variable
const transport = process.env.TRANSPORT ?? "http";
if (transport === "http") {
  runHTTP().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
