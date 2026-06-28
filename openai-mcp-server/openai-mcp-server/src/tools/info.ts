import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SUPPORTED_CHAT_MODELS, SUPPORTED_IMAGE_MODELS } from "../services/openai-client.js";

const EmptySchema = z.object({}).strict();

export function registerInfoTools(server: McpServer): void {
  server.registerTool(
    "openai_list_models",
    {
      title: "List Available OpenAI Models",
      description: `Returns the list of supported OpenAI models available through this MCP server.
      
Use this when you need to know which models are available before making a chat or image request.

Returns:
  List of supported chat and image generation models with brief descriptions.`,
      inputSchema: EmptySchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const chatList = SUPPORTED_CHAT_MODELS.map((m) => {
        const descriptions: Record<string, string> = {
          "gpt-4o": "Most capable multimodal model, fast and intelligent (recommended)",
          "gpt-4o-mini": "Smaller, faster, cheaper version of GPT-4o — great for simpler tasks",
          "gpt-4-turbo": "Previous flagship GPT-4, high capability with large context",
          "gpt-4": "Original GPT-4, solid reasoning",
          "gpt-3.5-turbo": "Fast, cheap, good for simple tasks",
        };
        return `  - ${m}: ${descriptions[m] ?? ""}`;
      }).join("\n");

      const imageList = SUPPORTED_IMAGE_MODELS.map((m) => {
        const descriptions: Record<string, string> = {
          "dall-e-3": "Best quality image generation, understands complex prompts",
          "dall-e-2": "Faster and cheaper, good for simpler images",
        };
        return `  - ${m}: ${descriptions[m] ?? ""}`;
      }).join("\n");

      return {
        content: [
          {
            type: "text",
            text: `**Available OpenAI Models**\n\n**Chat / Text models:**\n${chatList}\n\n**Image generation models:**\n${imageList}`,
          },
        ],
      };
    }
  );
}
