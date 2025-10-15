# AI Canvas Agent Setup

**Status:** Phase 4 Complete - Ready for Testing  
**Date:** October 15, 2025

---

## 🔑 Required: OpenAI API Key

The AI canvas agent requires an OpenAI API key to function.

### Set API Key in Cloudflare Workers

```bash
# Set the secret (run from project root)
bunx wrangler secret put OPENAI_API_KEY --name collab-canvas

# When prompted, paste your OpenAI API key
```

**Get an API key:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key (starts with `sk-`)
4. Paste when prompted by wrangler

---

## 🚀 Deploy PartyKit with AI

```bash
# Deploy to Cloudflare Workers
bunx partykit deploy

# The AI endpoint will be available at:
# https://your-partykit.dev/api/ai/command
```

---

## 🧪 Test AI Endpoint

### Health Check
```bash
curl https://your-partykit.dev/health
```

### Test AI Command
```bash
curl -X POST https://your-partykit.dev/api/ai/command \
  -H "Content-Type: application/json" \
  -d '{"command":"Create a red circle at 200, 200","userId":"test-user"}'
```

---

## 📝 Available AI Commands

### Creation Commands
- "Create a red circle at 100, 200"
- "Make a 200x150 blue rectangle"
- "Add text that says Hello World at 300, 100"
- "Create a 5-point star"
- "Make a hexagon" (6-sided polygon)

### Manipulation Commands
- "Move the circle to 400, 300"
- "Resize the rectangle to 300x200"
- "Rotate the star 45 degrees"
- "Change the blue shapes to green"
- "Delete the red rectangle"

### Layout Commands
- "Arrange all rectangles in a horizontal row"
- "Stack the shapes vertically"
- "Create a 3x3 grid of circles"
- "Distribute the shapes evenly"
- "Align all shapes to the left"

### Complex Commands
- "Create a login form" (makes username field, password field, submit button)
- "Build a navigation bar with Home, About, Contact"
- "Make a card with title, image, and description"

---

## 🛡️ Rate Limiting

- **Limit:** 10 commands per minute per user
- **Storage:** Durable Object (persists across requests)
- **Error:** Returns 429 status with `retryAfter` seconds

---

## 🏗️ Architecture

```
User → CommandPalette → PartyKit AI Endpoint → OpenAI GPT-4
                            ↓
                    Tool Executors modify Yjs
                            ↓
                    Changes sync to all users
```

---

## 📊 Implementation Details

### Files Created
- `partykit/ai/tools.ts` - 22 tool definitions for OpenAI
- `partykit/ai/executors.ts` - Tool execution logic (modifies Yjs)
- `partykit/ai/prompts.ts` - System prompts for GPT-4

### Files Modified
- `partykit/server.ts` - Added HTTP handling + AI endpoint
- `src/lib/components/CommandPalette.svelte` - Connected to backend
- `src/routes/canvas/+page.svelte` - Pass userId to palette

### Dependencies Added
- `openai@6.3.0` - OpenAI Node SDK

---

## 🎯 Ready to Test!

1. Set OPENAI_API_KEY in Cloudflare Workers
2. Deploy PartyKit
3. Open canvas in browser
4. Press Cmd/Ctrl+K
5. Type: "Create a red circle"
6. Watch it appear! ✨

---

**Status:** Implementation complete  
**Next:** Deploy and test AI commands  
**Rubric Impact:** 25 points (AI Canvas Agent section)

