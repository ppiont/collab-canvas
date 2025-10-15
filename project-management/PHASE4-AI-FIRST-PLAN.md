# Phase 4: AI Canvas Agent - Implementation Plan

**Date:** October 15, 2025  
**Status:** 🟢 Ready for GO Signal  
**Duration:** ~4.5 hours  
**Rubric Value:** 25 points (highest single feature)

---

## 🎯 Strategic Decision: AI-First Approach

### What We're Doing
✅ **Implementing AI Canvas Agent NOW**
- Natural language canvas manipulation
- GPT-4 function calling with 22 tools
- Works with current single-room architecture
- Immediate rubric value

### What We're Deferring
⏸️ **Multi-Canvas (Phase 5+)**
- Requires D1 database for project/canvas metadata
- Requires new UI (home page, project page)
- Not needed for AI to work

⏸️ **Image Upload (Phase 6+)**
- Requires R2 storage setup
- Requires upload UI
- AI can create image placeholders without this

### Why This Makes Sense
1. **Rubric Priority** - AI = 25 points, highest value
2. **Zero Dependencies** - Works with current Yjs document
3. **Immediate Results** - Test AI commands today
4. **Wow Factor** - Most exciting feature for demo
5. **Defer Complexity** - D1/R2 setup when actually needed

---

## 📋 Implementation Tasks (8 Tasks, 4.5 Hours)

### Session 1: Foundation (40 min)
**Task 4.1:** Install OpenAI SDK (10 min)
- `cd partykit && bun add openai`
- Verify installation

**Task 4.2:** Add HTTP Handling to PartyKit (30 min)
- Implement `onRequest()` method
- Add route parsing
- Add health check endpoint
- Test: `curl https://your-partykit.dev/health`

---

### Session 2: AI Tools (2 hours)
**Task 4.3:** Define AI Tool Schema (1 hour)
- Write OpenAI function definitions for 22 tools
- 8 creation tools (rectangle, circle, ellipse, line, text, polygon, star, image)
- 6 manipulation tools (move, resize, rotate, color, delete, duplicate)
- 5 layout tools (horizontal, vertical, grid, distribute, align)
- 3 query tools (getState, findByType, findByColor)

**Task 4.4:** Implement Tool Executors (1 hour)
- Access Yjs document from Durable Object
- Implement each tool to modify shapesMap
- Add validation and error handling
- Test: Manually call executors

---

### Session 3: AI Backend (1 hour)
**Task 4.5:** Implement GPT-4 Command Handler (45 min)
- Create `handleAICommand()` method
- Call OpenAI with function calling
- Execute returned tool calls
- Return success/error

**Task 4.6:** Add Rate Limiting (15 min)
- Store timestamps in Durable Object
- Limit: 10 commands/minute per user
- Return 429 when exceeded

---

### Session 4: Frontend & Testing (1 hour)
**Task 4.7:** Connect CommandPalette (30 min)
- Replace placeholder fetch with real endpoint
- Add loading/success/error states
- Handle timeouts and errors

**Task 4.8:** Comprehensive Testing (30 min)
- Test creation commands
- Test manipulation commands  
- Test layout commands
- Test complex commands ("create a login form")
- Test rate limiting
- Test multi-user AI

---

## 🏗️ Architecture

```
CommandPalette           PartyKit Server
(Cmd/Ctrl+K)            (Cloudflare Workers)
┌──────────────┐        ┌─────────────────────────┐
│              │        │                         │
│  User types: │        │   handleAICommand()     │
│  "Create a   │─HTTP──▶│   ↓                     │
│   red circle"│        │   Call GPT-4            │
│              │        │   ↓                     │
│              │        │   Get tool calls        │
│              │        │   ↓                     │
│              │        │   executeTool()         │
│              │        │   ↓                     │
│              │        │   Modify Yjs shapesMap  │
│              │        │   ↓                     │
│              │◀─Sync──│   Broadcast to all      │
│              │        │                         │
│  Shape       │        │                         │
│  appears! ✨ │        │                         │
└──────────────┘        └─────────────────────────┘
```

**Key Insight:** AI modifies Yjs document directly → changes sync automatically to all users via existing infrastructure!

---

## ✅ Success Criteria

### Must Work
- [ ] "Create a red circle" → red circle appears
- [ ] "Move the rectangle to 100, 200" → rectangle moves
- [ ] "Arrange shapes horizontally" → shapes align in row
- [ ] "Create a login form" → multiple shapes (form layout)
- [ ] Rate limit works (10 commands/min)
- [ ] Two users can use AI simultaneously
- [ ] All AI changes sync to collaborators

### Rubric Requirements (25 points)
- [ ] 8+ distinct command types ✅ (we have 22 tools)
- [ ] Complex commands execute multi-step plans
- [ ] Sub-2 second responses for simple commands
- [ ] 90%+ accuracy
- [ ] Natural UX with feedback
- [ ] Multi-user AI works flawlessly

---

## 🚧 What We're NOT Doing

❌ D1 database (no multi-canvas yet)  
❌ R2 storage (no image upload yet)  
❌ Project/canvas CRUD APIs  
❌ Home page UI  
❌ Project management UI  
❌ Permissions system

**Rationale:** These are infrastructure for features we haven't built yet. Do them when we build the UI that uses them.

---

## 📊 Expected Results

### After Phase 4
- ✅ AI canvas agent fully functional
- ✅ CommandPalette working (Cmd/Ctrl+K)
- ✅ 22 AI tools operational
- ✅ Rate limiting active
- ✅ Multi-user AI tested
- ✅ **25 rubric points achievable**

### Still Single-Canvas
- ✅ Works in current "main" room
- ✅ All users collaborate in one space
- ✅ No database needed
- ✅ Simple deployment

### Next Phase Options
**Option A:** Phase 5 - Multi-Canvas (requires D1)  
**Option B:** Phase 6 - Images (requires R2)  
**Option C:** Polish & Demo (prepare for submission)

---

## 🎯 My Proposed Plan for Phase 4

### Implementation Approach
1. **Start Simple:** Get basic AI working (create rectangle)
2. **Add Tools Incrementally:** One category at a time
3. **Test Continuously:** Verify each tool works before next
4. **Rate Limit:** Add cost control early
5. **Polish Last:** Error messages, UX improvements

### File Organization
```
partykit/
├── server.ts (modified - add HTTP + AI)
├── package.json (new - add openai dependency)
└── ai/
    ├── tools.ts (AI function definitions)
    ├── executors.ts (Tool implementation)
    └── prompts.ts (System prompts)
```

### Justification
- ✅ **Modular** - AI logic in separate files
- ✅ **Testable** - Can test tools individually
- ✅ **Type-safe** - TypeScript throughout
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Follows our patterns** - Same approach as Phase 2/3

---

## ⏰ Time Breakdown

| Session | Tasks | Duration | Deliverable |
|---------|-------|----------|-------------|
| 1 | 4.1-4.2 | 40 min | HTTP + OpenAI ready |
| 2 | 4.3-4.4 | 2 hours | 22 tools working |
| 3 | 4.5-4.6 | 1 hour | AI backend complete |
| 4 | 4.7-4.8 | 1 hour | End-to-end tested |
| **Total** | **8 tasks** | **~4.5 hours** | **AI agent done ✅** |

---

## 🚦 Awaiting Your GO Signal

**Proposed Execution:**
1. You say "GO"
2. I implement all 8 tasks systematically
3. Test after each session
4. Commit when AI agent fully working
5. Demo: "Create a login form" and watch it happen!

**Questions Before I Start:**
- Do you have an OpenAI API key ready? (will need to set as Cloudflare secret)
- Any specific AI commands you want to prioritize?
- Should I aim for speed or thoroughness?

---

**Status:** 🟢 Plan complete - waiting for GO  
**Next Action:** Task 4.1 (Install OpenAI SDK)  
**Confidence:** High - clear path, proven architecture

Ready when you are! 🤖✨

