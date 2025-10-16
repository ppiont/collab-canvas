# AI Performance Optimization Strategies

**Current:** GPT-4-turbo (~2-5 second responses)  
**Goal:** Sub-2 second for simple, sub-5 second for complex

---

## 🔍 **Current Architecture Analysis**

### Request Flow (Total Time Breakdown):

```
User types command → Cmd+K → Enter
    ↓
Frontend → PartyKit (network: ~20-50ms)
    ↓
PartyKit loads canvas state (Yjs: ~10-20ms)
    ↓
OpenAI API call (GPT-4-turbo: ~1500-4000ms) ← BOTTLENECK
    ↓
Parse response (JSON: ~5-10ms)
    ↓
Return to client (network: ~20-50ms)
    ↓
Client executes tools (Yjs: ~50-100ms)
    ↓
Shapes appear on canvas

TOTAL: ~1600-4230ms (1.6-4.2 seconds)
```

**Bottleneck:** OpenAI API latency (70-95% of total time)

---

## ⚡ **Optimization Strategies (Ranked by Impact)**

### 1. Switch to GPT-4o or GPT-4o-mini (HIGHEST IMPACT)

**Current:** `gpt-4-turbo`  
**Options:**
- `gpt-4o` - Faster than turbo, similar quality
- `gpt-4o-mini` - Much faster, slightly lower quality
- `gpt-3.5-turbo` - Fastest, good for simple commands

**Expected improvement:**
- GPT-4o: ~1000-2500ms (30-40% faster)
- GPT-4o-mini: ~500-1500ms (60-70% faster)
- GPT-3.5-turbo: ~300-800ms (75-85% faster)

**Implementation:**
```typescript
// partykit/server.ts
const completion = await openai.chat.completions.create({
    model: 'gpt-4o', // ← Change here
    // or 'gpt-4o-mini' for even faster
    messages: [...],
    tools: AI_TOOLS
});
```

**Pros:**
- One line change
- Immediate impact
- Lower cost too

**Cons:**
- Slightly lower quality (test to verify)

**Recommendation:** Try `gpt-4o` first, fall back to `gpt-4o-mini` if quality is acceptable

---

### 2. Streaming Responses (MEDIUM-HIGH IMPACT)

**Concept:** Stream tool calls as they're generated, don't wait for complete response

**OpenAI Streaming:**
```typescript
const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [...],
    tools: AI_TOOLS,
    stream: true // ← Enable streaming
});

for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.tool_calls) {
        // Execute tools as they stream in
        executeToolImmediately(chunk.choices[0].delta.tool_calls);
    }
}
```

**Expected improvement:**
- Time to first shape: 500-1000ms (vs 1500-4000ms)
- User sees shapes appear progressively
- Perceived performance much better

**Pros:**
- Much better UX (progressive feedback)
- Actually faster to first paint
- Users see AI "thinking"

**Cons:**
- More complex implementation (~2-3 hours)
- Need to handle partial tool calls
- More edge cases

**Recommendation:** **Do this** - great UX improvement

---

### 3. Reduce Context Size (MEDIUM IMPACT)

**Current:** Sending full canvas state with all shape properties

**Optimization:** Send only necessary data for simple commands

```typescript
// For simple creation commands, don't send full canvas state
if (command.includes('create') && !command.includes('arrange') && canvasState.length > 20) {
    // Send only count, not full state
    userMessage = `Canvas has ${canvasState.length} shapes.\n\nUser command: ${command}`;
} else {
    // Full state for complex commands
    userMessage = `Canvas state:\n${JSON.stringify(canvasState)}\n\nUser command: ${command}`;
}
```

**Expected improvement:**
- Tokens reduced: ~50-70% for simple commands
- Faster processing: ~200-500ms improvement
- Lower cost

**Pros:**
- Easy to implement (30 minutes)
- Meaningful speedup
- Lower costs

**Cons:**
- Need heuristics to detect command type
- Could be wrong sometimes

**Recommendation:** Worth doing for simple commands

---

### 4. Command Caching (LOW-MEDIUM IMPACT)

**Concept:** Cache responses for identical commands

```typescript
// In PartyKit Durable Object storage
const cacheKey = `ai-cache:${command}:${canvasState.length}`;
const cached = await this.party.storage.get(cacheKey);

if (cached && Date.now() - cached.timestamp < 3600000) {
    // Return cached response (instant!)
    return cached.response;
}

// ... call OpenAI ...

// Cache for 1 hour
await this.party.storage.put(cacheKey, {
    response: toolsToExecute,
    timestamp: Date.now()
});
```

**Expected improvement:**
- Cached responses: <50ms (instant!)
- Cache hit rate: ~10-20% (repeated commands)

**Pros:**
- Huge speedup for repeated commands
- Very low cost (uses Durable Objects storage)

**Cons:**
- Only helps repeated commands
- Storage cost (minimal)
- Cache invalidation complexity

**Recommendation:** Nice to have, not critical

---

### 5. Parallel Tool Execution (LOW IMPACT)

**Current:** Execute tools sequentially with `await`

**Optimization:** Execute independent tools in parallel

```typescript
// Current (sequential):
for (const tool of tools) {
    await executeAITool(tool.name, tool.params); // One at a time
}

// Optimized (parallel):
await Promise.all(
    tools.map(tool => executeAITool(tool.name, tool.params))
);
```

**Expected improvement:**
- 50-100ms for multi-shape commands
- Marginal

**Pros:**
- Easy to implement (5 minutes)
- No downside

**Cons:**
- Small impact (tools are fast already)

**Recommendation:** Do it (it's trivial)

---

### 6. Optimize Prompt Length (LOW-MEDIUM IMPACT)

**Current:** ~500-800 tokens in system prompt

**Optimization:** Use concise system prompt

```typescript
export const AI_SYSTEM_PROMPT = `You are a canvas manipulation AI.

TOOLS: 22 tools available - creation, manipulation, layout, query

RULES:
1. For NEW shapes: Calculate positions manually
2. For EXISTING shapes: Use layout tools with IDs from canvas state
3. Create shapes near viewport center: {centerX}, {centerY}
4. Always use provided shape IDs for manipulation

Use tools to fulfill requests!`;
```

**Expected improvement:**
- Token reduction: ~60%
- Faster processing: ~100-300ms
- Lower cost

**Pros:**
- Easy to implement
- Lower costs
- Faster

**Cons:**
- May reduce quality (test carefully)

**Recommendation:** Test with shorter prompt, measure quality impact

---

### 7. Client-Side Prediction (MEDIUM IMPACT for UX)

**Concept:** Show optimistic UI immediately while waiting for AI

```typescript
// Show loading shapes immediately
if (command.includes('create circle')) {
    // Show placeholder circle while AI processes
    showPlaceholder({ type: 'circle', x: viewportCenter, y: viewportCenter });
}

// Replace with actual AI result when it arrives
```

**Expected improvement:**
- Perceived latency: Feels instant
- Actual latency: Same
- UX: Much better

**Pros:**
- Great UX improvement
- Feels much faster

**Cons:**
- Complex to implement well
- Prediction may be wrong
- Need to handle replacement

**Recommendation:** Nice to have for polish, not critical

---

### 8. Use Anthropic Claude (ALTERNATIVE)

**Alternative provider:** Claude 3.5 Sonnet or Haiku

**Claude Haiku:**
- Speed: ~300-800ms (much faster than GPT-4)
- Quality: Good for simple commands
- Cost: Much cheaper

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: this.party.env.ANTHROPIC_API_KEY
});

const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    tools: AI_TOOLS,
    messages: [{ role: 'user', content: userMessage }]
});
```

**Pros:**
- Potentially faster
- Different pricing model
- Good function calling

**Cons:**
- Need different API key
- Different API format
- Need testing

**Recommendation:** Worth experimenting with

---

## 🎯 **Recommended Implementation Plan**

### Quick Wins (1-2 hours):

#### A. Switch to GPT-4o (5 minutes)
```typescript
model: 'gpt-4o' // Change one line
```
**Expected:** 30-40% faster

#### B. Parallel Tool Execution (5 minutes)
```typescript
await Promise.all(tools.map(executeAITool));
```
**Expected:** 50-100ms faster for multi-tool commands

#### C. Reduce Context for Simple Commands (30 minutes)
```typescript
if (isSimpleCommand(command)) {
    // Send minimal context
}
```
**Expected:** 200-500ms faster for simple commands

**Total time:** 40 minutes  
**Total impact:** 50-70% faster for simple commands

---

### Medium Investment (2-4 hours):

#### D. Implement Streaming (2-3 hours)
- Progressive shape creation
- Much better UX
- Feels instant even if total time is similar

#### E. Command Caching (1-2 hours)
- Instant for repeated commands
- 10-20% hit rate

**Total time:** 3-5 hours  
**Total impact:** Great UX, some speed improvement

---

### Advanced (4-8 hours):

#### F. Optimize Prompt (1-2 hours)
- Test shorter prompts
- Measure quality impact
- Fine-tune

#### G. Client-Side Prediction (3-4 hours)
- Optimistic UI
- Placeholder shapes
- Feels instant

#### H. Try Claude (2-3 hours)
- Experiment with Claude Haiku
- Compare speed vs quality
- Implement fallback

---

## 📊 **Performance Comparison**

| Optimization | Time | Speed Gain | Complexity | Cost Impact |
|-------------|------|------------|------------|-------------|
| **GPT-4o** | 5 min | 30-40% | Easy | Lower |
| **GPT-4o-mini** | 5 min | 60-70% | Easy | Much lower |
| **Parallel execution** | 5 min | 50-100ms | Easy | None |
| **Reduce context** | 30 min | 200-500ms | Medium | Lower |
| **Streaming** | 2-3 hrs | Feels 2-3x faster | Hard | None |
| **Caching** | 1-2 hrs | Instant (10-20% hit) | Medium | Lower |
| **Shorter prompt** | 1-2 hrs | 100-300ms | Medium | Lower |
| **Claude Haiku** | 2-3 hrs | 50-75% | Hard | Much lower |

---

## 🚀 **My Recommendation**

### Phase 1: Quick Wins (Do Today - 1 hour)

1. **Switch to gpt-4o** (5 min)
2. **Parallel tool execution** (5 min)
3. **Reduce context for simple commands** (30 min)
4. **Test and measure** (20 min)

**Expected result:** 
- Simple commands: ~800-1500ms (was 1500-3000ms)
- Complex commands: ~2000-3500ms (was 3000-5000ms)
- **Meets rubric targets!** (<2s simple, <5s complex)

### Phase 2: UX Improvements (Optional - 3-4 hours)

5. **Implement streaming** for progressive feedback
6. **Add caching** for instant repeated commands

**Expected result:**
- Feels near-instant
- Great demo experience
- Professional polish

---

## 💻 **Immediate Implementation**

Want me to implement Phase 1 (quick wins) right now? It's:

1. Change model to `gpt-4o`
2. Make tool execution parallel
3. Detect simple commands and reduce context

**Time:** ~1 hour  
**Impact:** Meets rubric performance targets  
**Risk:** Low (easy to test and revert)

Should I implement these optimizations?

