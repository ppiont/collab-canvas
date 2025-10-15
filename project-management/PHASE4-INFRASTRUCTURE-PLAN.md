# Phase 4: AI Canvas Agent Implementation

**Date:** October 15, 2025  
**Status:** Ready to Begin  
**Duration:** ~4 hours  
**Objective:** Implement AI canvas agent for natural language shape manipulation

**Deferred to Later:**
- ❌ Multi-canvas & project management (Phase 5+)
- ❌ Image upload & R2 storage (Phase 6+)
- ❌ D1 database (not needed without multi-canvas)

---

## 🎯 Overview

Phase 4 focuses on implementing the AI Canvas Agent - the highest-value feature:
- **OpenAI Integration** - GPT-4 function calling in PartyKit
- **AI Tool Schema** - 15+ canvas manipulation tools
- **Command Palette** - Natural language interface
- **Rate Limiting** - Cost control and abuse prevention

**Rubric Impact:** 25 points (AI Canvas Agent section)

---

## 🏗️ Architecture Decision

### Current Architecture
```
Frontend (Railway)          Backend (Cloudflare Workers)
┌─────────────────┐         ┌──────────────────────┐
│  SvelteKit      │◄───WS──►│  PartyKit (Yjs)      │
│  - UI           │         │  - Real-time sync    │
│  - Auth0        │         │  - Durable Objects   │
└─────────────────┘         └──────────────────────┘
```

### Phase 4 Architecture (AI-Focused)
```
User Browser                PartyKit (Cloudflare Workers)
┌─────────────────┐         ┌──────────────────────────────┐
│  Canvas UI      │◄───WS──►│  Yjs Real-time Sync          │
│                 │         │                              │
│  CommandPalette │         │  ┌────────────────────────┐  │
│  (Cmd/Ctrl+K)   │─HTTP───►│  │ AI Command Handler     │  │
│                 │         │  │  - Parse natural lang  │  │
│                 │         │  │  - Call GPT-4          │  │
│                 │         │  │  - Execute tools       │  │
│                 │         │  │  - Modify Yjs doc      │  │
│                 │         │  └────────────────────────┘  │
│                 │◄──Sync──│  Changes broadcast to all    │
└─────────────────┘         └──────────────────────────────┘
```

### Key Decision: AI Without Infrastructure

**Why This Works:**
- ✅ AI commands modify existing Yjs document (no database needed)
- ✅ Works in current single "main" room
- ✅ All users see AI changes via Yjs sync
- ✅ Can implement and test immediately
- ✅ Highest rubric value (25 points)

**What We're Deferring:**
- D1 database → Phase 5 (when building multi-canvas UI)
- R2 storage → Phase 6 (when implementing image upload)
- Project/canvas management → Phase 5

---

## 📋 Phase 4 Task Breakdown (AI-Focused)

### Task 4.1: Install OpenAI SDK ✅ Next
**Duration:** 10 minutes  
**Priority:** P0 - Foundation

**Action Items:**
1. Navigate to partykit folder
2. Install OpenAI SDK: `bun add openai`
3. Verify installation in package.json

**Why First:** Need OpenAI SDK before any AI implementation

---

### Task 4.2: Add HTTP Request Handling to PartyKit
**Duration:** 30 minutes  
**Priority:** P0 - Core Infrastructure

**Action Items:**
1. Update `partykit/server.ts` to handle HTTP requests
2. Implement `onRequest()` method for HTTP endpoints
3. Add route parsing (pathname matching)
4. Add basic error handling
5. Add health check endpoint: `GET /health`

**Structure:**
```typescript
export default class CollabCanvasServer implements Party.Server {
  // Existing WebSocket handler
  onConnect(conn: Party.Connection) {
    return onConnect(conn, this.party, { persist: true });
  }
  
  // NEW: HTTP request handler
  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', room: this.party.id }));
    }
    
    // AI command endpoint
    if (url.pathname === '/api/ai/command' && req.method === 'POST') {
      return this.handleAICommand(req);
    }
    
    return new Response('Not found', { status: 404 });
  }
}
```

---

### Task 4.3: Implement AI Tool Schema
**Duration:** 1 hour  
**Priority:** P0 - Core AI Logic

**Action Items:**
1. Define OpenAI function definitions for all tools
2. Implement creation tools (createRectangle, createCircle, etc.)
3. Implement manipulation tools (moveShape, resizeShape, etc.)
4. Implement layout tools (arrangeHorizontal, alignShapes, etc.)
5. Implement query tools (getCanvasState, findShapesByType, etc.)

**Tools to Implement (15+ tools):**

**Creation (8 tools):**
- createRectangle(x, y, width, height, fill, stroke)
- createCircle(x, y, radius, fill, stroke)
- createEllipse(x, y, radiusX, radiusY, fill, stroke)
- createLine(points, stroke, strokeWidth)
- createText(x, y, text, fontSize, fill)
- createPolygon(x, y, sides, radius, fill, stroke)
- createStar(x, y, numPoints, innerRadius, outerRadius, fill, stroke)
- createImage(x, y, width, height, imageUrl) // placeholder only

**Manipulation (6 tools):**
- moveShape(shapeId, x, y)
- resizeShape(shapeId, width, height)
- rotateShape(shapeId, degrees)
- updateShapeColor(shapeId, fill, stroke)
- deleteShape(shapeId)
- duplicateShape(shapeId, offsetX, offsetY)

**Layout (5 tools):**
- arrangeHorizontal(shapeIds, spacing)
- arrangeVertical(shapeIds, spacing)
- arrangeGrid(shapeIds, columns, spacing)
- distributeEvenly(shapeIds, direction)
- alignShapes(shapeIds, alignment)

**Query (3 tools):**
- getCanvasState() // returns all shapes
- findShapesByType(type)
- findShapesByColor(color)

---

### Task 4.4: Implement Tool Executors
**Duration:** 1 hour  
**Priority:** P0 - Core AI Logic

**Action Items:**
1. Access Yjs document from PartyKit Durable Object
2. Implement each tool executor to modify Yjs shapesMap
3. Add validation (shape exists, parameters valid)
4. Add error handling
5. Test each tool individually

**Example:**
```typescript
// Tool executors modify Yjs document directly
function executeCreateRectangle(params: any, ydoc: Y.Doc) {
  const shapesMap = ydoc.getMap('shapes');
  const newShape = {
    id: crypto.randomUUID(),
    type: 'rectangle',
    x: params.x,
    y: params.y,
    width: params.width || 150,
    height: params.height || 100,
    fill: params.fill || '#3b82f6',
    stroke: params.stroke || '#1e3a8a',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    zIndex: 0,
    createdBy: 'ai',
    createdAt: Date.now()
  };
  
  shapesMap.set(newShape.id, newShape);
  return newShape.id;
}
```

---

### Task 4.5: Implement AI Command Handler
**Duration:** 45 minutes  
**Priority:** P0 - Core AI Logic

**Action Items:**
1. Create `handleAICommand()` method in PartyKit server
2. Parse JSON request (command, userId)
3. Call OpenAI GPT-4 with function calling
4. Execute returned tool calls
5. Return success/error response

**Flow:**
```typescript
async handleAICommand(req: Party.Request) {
  const { command, userId } = await req.json();
  
  // Get current canvas state
  const canvasState = this.getCanvasState();
  
  // Call OpenAI
  const openai = new OpenAI({ apiKey: this.party.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content: `Canvas: ${JSON.stringify(canvasState)}\n\nCommand: ${command}` }
    ],
    tools: AI_TOOL_SCHEMA,
    tool_choice: 'auto'
  });
  
  // Execute tools
  for (const toolCall of response.choices[0].message.tool_calls || []) {
    await this.executeTool(toolCall);
  }
  
  return new Response(JSON.stringify({ success: true }));
}
```

---

### Task 4.6: Add Rate Limiting
**Duration:** 30 minutes  
**Priority:** P1 - Cost Control

**Action Items:**
1. Implement rate limiter using Durable Object storage
2. Store timestamps per user: `ratelimit:${userId}`
3. Limit: 10 commands per minute
4. Return 429 error when exceeded
5. Add cooldown info in response

**Implementation:**
```typescript
async checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const window = 60000; // 1 minute
  
  const calls = await this.party.storage.get<number[]>(key) || [];
  const recentCalls = calls.filter(t => now - t < window);
  
  if (recentCalls.length >= 10) {
    return false;
  }
  
  recentCalls.push(now);
  await this.party.storage.put(key, recentCalls);
  return true;
}
```

---

### Task 4.7: Connect CommandPalette to AI Backend
**Duration:** 30 minutes  
**Priority:** P0 - User Interface

**Action Items:**
1. Update `CommandPalette.svelte` to call PartyKit AI endpoint
2. Replace placeholder with real HTTP fetch
3. Add loading states during AI processing
4. Show success/error messages
5. Add timeout handling (10s)

**Implementation:**
```typescript
async function handleSubmit() {
  if (!command.trim()) return;
  
  commandState = 'loading';
  
  try {
    const response = await fetch(`https://${PUBLIC_PARTYKIT_HOST}/api/ai/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: command.trim(),
        userId: currentUserId
      })
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    commandState = 'success';
    setTimeout(() => {
      open = false;
      commandState = 'idle';
      command = '';
    }, 1000);
  } catch (error) {
    commandState = 'error';
    errorMessage = error.message;
  }
}
```

---

### Task 4.8: Test AI Commands
**Duration:** 30 minutes  
**Priority:** P0 - Validation

**Test Cases:**
1. **Creation:** "Create a red circle at 100, 200"
2. **Manipulation:** "Move the blue rectangle to 300, 150"
3. **Layout:** "Arrange all rectangles in a horizontal row"
4. **Complex:** "Create a login form with username and password fields"
5. **Error handling:** Invalid command, rate limit exceeded
6. **Multi-user:** Two users issue AI commands simultaneously

---

## 🔄 Implementation Order (AI-Focused)

### Session 1: OpenAI Setup & HTTP Foundation (40 min)
1. ✅ Task 4.1: Install OpenAI SDK in partykit
2. ✅ Task 4.2: Add HTTP request handling to PartyKit server
3. Test health check endpoint

### Session 2: AI Tool Schema & Executors (2 hours)
4. ✅ Task 4.3: Define 15+ AI tool functions (OpenAI schema)
5. ✅ Task 4.4: Implement tool executors (modify Yjs)
6. Test individual tools

### Session 3: AI Command Handler (1 hour)
7. ✅ Task 4.5: Implement GPT-4 function calling
8. ✅ Task 4.6: Add rate limiting (10 commands/min)
9. Test backend AI flow

### Session 4: Frontend Integration & Testing (1 hour)
10. ✅ Task 4.7: Connect CommandPalette to AI endpoint
11. ✅ Task 4.8: Comprehensive AI testing
12. Document AI commands

**Total Time:** ~4.5 hours  
**Rubric Points:** 25 (AI Canvas Agent)

---

## ✅ Success Criteria (AI-Focused)

### AI Implementation Complete
- [ ] OpenAI SDK installed and configured
- [ ] PartyKit HTTP endpoint handles AI commands
- [ ] 15+ AI tools defined and working
- [ ] Tool executors modify Yjs document correctly
- [ ] GPT-4 function calling works end-to-end

### Command Categories Working
- [ ] Creation commands (8 tools) - "Create a red circle"
- [ ] Manipulation commands (6 tools) - "Move the rectangle to 100, 200"
- [ ] Layout commands (5 tools) - "Arrange shapes horizontally"
- [ ] Complex commands - "Create a login form" (multi-shape)

### UX & Safety
- [ ] CommandPalette connects to backend
- [ ] Loading states during AI processing
- [ ] Error handling (invalid commands, network errors)
- [ ] Rate limiting (10 commands/min)
- [ ] All AI changes sync to collaborators

### Rubric Requirements Met
- [ ] 8+ distinct command types ✅ (we have 22 tools)
- [ ] Complex commands work (login form, nav bar)
- [ ] Sub-2 second responses for simple commands
- [ ] 90%+ accuracy on test commands
- [ ] Multi-user AI works (shared state)

---

## 🚧 Deferred to Future Phases

**NOT implementing in Phase 4:**
- ❌ D1 database setup (Phase 5 when building multi-canvas UI)
- ❌ R2 image storage (Phase 6 when implementing uploads)
- ❌ Multi-canvas routing (Phase 5)
- ❌ Project/canvas CRUD APIs (Phase 5)
- ❌ Home page UI (Phase 5)
- ❌ Permissions system (Phase 5)

**Phase 4 Focus:** AI Canvas Agent only - highest rubric value, works with current architecture

---

## 📊 Expected Outcomes

### New Files Created (AI-Focused)
```
partykit/
  package.json                  # NEW - Dependencies for PartyKit
  ai/
    tools.ts                    # AI tool schema definitions
    executors.ts                # Tool executor functions
    prompts.ts                  # System prompts for GPT-4
```

### Files Modified
```
partykit/server.ts              # Add HTTP handling + AI command endpoint
src/lib/components/CommandPalette.svelte  # Connect to real AI backend
src/lib/constants.ts            # Add AI constants if needed
```

### Commands to Run
```bash
# Install OpenAI SDK
cd partykit && bun add openai

# Set environment variable (Cloudflare Workers secret)
bunx wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted
```

---

## 🎯 Phase 4 Complete When:

- [ ] OpenAI SDK installed and configured
- [ ] PartyKit AI endpoint working
- [ ] All 22 AI tools implemented
- [ ] All 4 command categories tested and working
- [ ] Rate limiting functional
- [ ] CommandPalette connected and working
- [ ] Multi-user AI verified (changes sync)
- [ ] Build succeeds
- [ ] **25 rubric points achievable** (AI Canvas Agent)

---

**Status:** Ready to begin - waiting for GO signal  
**First Task:** Install OpenAI SDK  
**Estimated Completion:** 4-5 hours  
**Rubric Impact:** 25 points (highest value feature)

Let's build the AI agent! 🤖✨

