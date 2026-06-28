# OpenAI MCP Server

A Model Context Protocol (MCP) server that connects Claude to OpenAI's API, enabling ChatGPT and DALL-E access directly from Claude conversations.

## Tools Available

| Tool | Description |
|------|-------------|
| `openai_ask` | Send a single prompt to ChatGPT — simplest way to use it |
| `openai_chat` | Multi-turn conversation with full message history |
| `openai_generate_image` | Generate images with DALL-E 3 or DALL-E 2 |
| `openai_list_models` | List all available models |

## Supported Models

**Chat:** gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-3.5-turbo  
**Images:** dall-e-3, dall-e-2

---

## Deploy to Render (Recommended — Free Tier)

This mirrors how your Gemini connector is already hosted.

### Step 1 — Push to GitHub

1. Create a new GitHub repository (e.g. `openai-mcp-server`)
2. Upload all these files to it

### Step 2 — Create a Render Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Fill in these settings:
   - **Name:** `openai-mcp-server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### Step 3 — Add Your OpenAI API Key

In Render, go to your service → **Environment** tab → Add:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-...your key here...` |
| `TRANSPORT` | `http` |

### Step 4 — Connect to Claude

Once deployed, your server URL will be:
```
https://openai-mcp-server.onrender.com/mcp
```

In Claude.ai:
1. Go to **Settings → Connectors** (or the MCP section)
2. Add a new connector
3. Enter your Render URL above
4. Name it `OpenAI` or `ChatGPT`

---

## Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally (HTTP mode)
OPENAI_API_KEY=sk-... npm start

# Test health check
curl http://localhost:3000/health
```

---

## Security Note

Your OpenAI API key is stored as an environment variable on Render — it is never exposed in the code or committed to GitHub. This is the same pattern used by your Gemini connector.
