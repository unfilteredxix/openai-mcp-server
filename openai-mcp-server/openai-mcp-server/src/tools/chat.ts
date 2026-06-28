import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getOpenAIClient,
  SUPPORTED_CHAT_MODELS,
  DEFAULT_CHAT_MODEL,
  MAX_RESPONSE_LENGTH,
} from "../services/openai-client.js";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]).describe("Role of the message sender"),
  content: z.string().describe("Content of the message"),
});

const ChatInputSchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1)
    .describe("Conversation messages. Must include at least one user message."),
  model: z
    .enum(SUPPORTED_CHAT_MODELS)
    .default(DEFAULT_CHAT_MODEL)
    .describe(`OpenAI model to use. Default: ${DEFAULT_CHAT_MODEL}`),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .default(0.7)
    .describe("Creativity level 0-2. Lower = more focused, higher = more creative. Default: 0.7"),
  max_tokens: z
    .number()
    .int()
    .min(1)
    .max(16384)
    .default(2048)
    .describe("Maximum tokens in the response. Default: 2048"),
  system_prompt: z
    .string()
    .optional()
    .describe("Optional system prompt to set context/persona for the AI"),
}).strict();

const SimplePromptSchema = z.object({
  prompt: z.string().min(1).describe("The question or task to send to ChatGPT"),
  model: z
    .enum(SUPPORTED_CHAT_MODELS)
    .default(DEFAULT_CHAT_MODEL)
    .describe(`OpenAI model to use. Default: ${DEFAULT_CHAT_MODEL}`),
  system_prompt: z
    .string()
    .optional()
    .describe("Optional system prompt to set context or persona"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .default(0.7)
    .describe("Creativity level 0-2. Default: 0.7"),
}).strict();

export function registerChatTools(server: McpServer): void {
  // Simple single-prompt tool — easiest to use
  server.registerTool(
    "openai_ask",
    {
      title: "Ask ChatGPT",
      description: `Send a single question or prompt to ChatGPT and get a response.

This is the simplest way to use ChatGPT. Provide a prompt and optionally a model and system instruction.
Use this for one-off questions, analysis tasks, writing help, coding questions, or anything you'd normally ask ChatGPT.

Args:
  - prompt (string): Your question or task for ChatGPT
  - model (string): Which GPT model to use (default: gpt-4o)
  - system_prompt (string, optional): Sets the AI's persona or constraints
  - temperature (number): Creativity 0-2 (default: 0.7)

Returns:
  The ChatGPT response as text.

Examples:
  - "Summarize this text: ..." → prompt="Summarize this text: ..."
  - "Write Python code for X" → prompt="Write Python code for X", model="gpt-4o"
  - "Translate to Spanish" → prompt="Translate to Spanish: ...", model="gpt-4o-mini"`,
      inputSchema: SimplePromptSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      const client = getOpenAIClient();
      const messages: Array<{ role: "system" | "user"; content: string }> = [];

      if (params.system_prompt) {
        messages.push({ role: "system", content: params.system_prompt });
      }
      messages.push({ role: "user", content: params.prompt });

      const response = await client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature,
        max_tokens: 2048,
      });

      const text = response.choices[0]?.message?.content ?? "(No response)";
      const truncated = text.length > MAX_RESPONSE_LENGTH
        ? text.slice(0, MAX_RESPONSE_LENGTH) + "\n\n[Response truncated due to length]"
        : text;

      return {
        content: [{ type: "text", text: truncated }],
      };
    }
  );

  // Multi-turn conversation tool
  server.registerTool(
    "openai_chat",
    {
      title: "ChatGPT Multi-turn Conversation",
      description: `Send a full conversation history to ChatGPT and get the next reply.

Use this when you need multi-turn context — passing prior messages so ChatGPT understands the conversation flow.
Ideal for: follow-up questions, iterative refinement, roleplay scenarios, or collaborative writing.

Args:
  - messages (array): Full conversation history with role and content per message
  - model (string): Which GPT model to use (default: gpt-4o)
  - system_prompt (string, optional): System instruction prepended to the conversation
  - temperature (number): Creativity 0-2 (default: 0.7)
  - max_tokens (number): Max tokens in the reply (default: 2048, max: 16384)

Returns:
  ChatGPT's next response as text.

Examples:
  - Multi-turn Q&A: pass [{role:"user", content:"..."}, {role:"assistant", content:"..."}, {role:"user", content:"follow-up"}]
  - With persona: system_prompt="You are a senior software engineer"`,
      inputSchema: ChatInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      const client = getOpenAIClient();

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

      if (params.system_prompt) {
        messages.push({ role: "system", content: params.system_prompt });
      }

      for (const msg of params.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }

      const response = await client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
      });

      const text = response.choices[0]?.message?.content ?? "(No response)";
      const truncated = text.length > MAX_RESPONSE_LENGTH
        ? text.slice(0, MAX_RESPONSE_LENGTH) + "\n\n[Response truncated due to length]"
        : text;

      return {
        content: [{ type: "text", text: truncated }],
      };
    }
  );
}
