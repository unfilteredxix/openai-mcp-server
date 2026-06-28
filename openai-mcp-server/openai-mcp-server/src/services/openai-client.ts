import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. " +
      "Please set it before starting the server."
    );
  }
  if (!_client) {
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export const SUPPORTED_CHAT_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
] as const;

export const SUPPORTED_IMAGE_MODELS = [
  "dall-e-3",
  "dall-e-2",
] as const;

export const DEFAULT_CHAT_MODEL = "gpt-4o";
export const DEFAULT_IMAGE_MODEL = "dall-e-3";
export const MAX_RESPONSE_LENGTH = 50000;
