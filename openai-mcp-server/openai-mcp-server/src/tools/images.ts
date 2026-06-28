import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getOpenAIClient,
  SUPPORTED_IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL,
} from "../services/openai-client.js";

const ImageInputSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(4000)
    .describe("Description of the image to generate. Be detailed for best results."),
  model: z
    .enum(SUPPORTED_IMAGE_MODELS)
    .default(DEFAULT_IMAGE_MODEL)
    .describe("Image model to use. dall-e-3 is higher quality, dall-e-2 is faster/cheaper."),
  size: z
    .enum(["1024x1024", "1792x1024", "1024x1792"])
    .default("1024x1024")
    .describe("Image dimensions. 1792x1024 = wide landscape, 1024x1792 = tall portrait."),
  quality: z
    .enum(["standard", "hd"])
    .default("standard")
    .describe("Image quality. 'hd' produces finer detail but costs more. Only for dall-e-3."),
  style: z
    .enum(["vivid", "natural"])
    .default("vivid")
    .describe("'vivid' = hyper-real and dramatic. 'natural' = more subdued/realistic. Only for dall-e-3."),
}).strict();

export function registerImageTools(server: McpServer): void {
  server.registerTool(
    "openai_generate_image",
    {
      title: "Generate Image with DALL-E",
      description: `Generate an image using OpenAI's DALL-E model from a text description.

Use this when you need image generation through OpenAI's DALL-E (as opposed to other image generators).
DALL-E 3 produces high-quality, detail-rich images from complex prompts.
DALL-E 2 is faster and cheaper for simpler images.

Args:
  - prompt (string): Detailed description of the image (up to 4000 chars)
  - model (string): 'dall-e-3' (default, higher quality) or 'dall-e-2' (faster)
  - size (string): '1024x1024' square (default), '1792x1024' landscape, '1024x1792' portrait
  - quality (string): 'standard' (default) or 'hd' for finer detail (dall-e-3 only)
  - style (string): 'vivid' (dramatic, default) or 'natural' (realistic) (dall-e-3 only)

Returns:
  URL of the generated image (valid for 1 hour) and the revised prompt used.

Examples:
  - Portrait: size='1024x1792', prompt='Professional headshot of...'
  - Landscape scene: size='1792x1024', model='dall-e-3', quality='hd'
  - Quick concept: model='dall-e-2', size='1024x1024'`,
      inputSchema: ImageInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      const client = getOpenAIClient();

      const response = await client.images.generate({
        model: params.model,
        prompt: params.prompt,
        n: 1,
        size: params.size,
        quality: params.quality,
        style: params.style,
      });

      const image = response.data?.[0];
      if (!image?.url) {
        return {
          content: [{ type: "text", text: "Error: No image URL returned from OpenAI." }],
        };
      }

      const revisedPrompt = image.revised_prompt
        ? `\n\n**Revised prompt used by DALL-E:** ${image.revised_prompt}`
        : "";

      return {
        content: [
          {
            type: "text",
            text: `**Image generated successfully!**\n\n**URL:** ${image.url}${revisedPrompt}\n\n> Note: This URL expires after 1 hour. Save the image if you need it long-term.`,
          },
        ],
      };
    }
  );
}
