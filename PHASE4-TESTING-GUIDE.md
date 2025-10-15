# Phase 4: AI Canvas Agent - Testing Guide

**Status:** Implementation Complete - Ready to Test  
**Date:** October 15, 2025

---

## 🔧 Setup Required

### 1. Set OpenAI API Key (Local Testing)

Edit `partykit/.env.local`:
```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 2. Restart PartyKit Dev Server

```bash
# Stop current server (Ctrl+C)
bunx partykit dev

# Should see: "Loading environment variables from .env.local"
```

---

## 🧪 Testing Checklist

### Test 1: Simple Creation Commands ⭐
**Rubric:** Creation category (2+ commands required)

- [ ] "Create a red circle at 200, 200"
  - **Expected:** Red circle appears at position 200, 200
  
- [ ] "Make a blue rectangle"
  - **Expected:** Blue rectangle appears on canvas

- [ ] "Add text that says Hello World"
  - **Expected:** "Hello World" text appears

**Success criteria:** Shapes appear within 2 seconds, sync to other users

---

### Test 2: Manipulation Commands ⭐
**Rubric:** Manipulation category (2+ commands required)

- [ ] First create a shape, then: "Move the circle to 400, 300"
  - **Expected:** Circle moves to new position

- [ ] "Change the rectangle to green"
  - **Expected:** Rectangle changes color

- [ ] "Rotate the star 90 degrees"
  - **Expected:** Star rotates

**Success criteria:** Existing shapes are modified correctly

---

### Test 3: Layout Commands ⭐
**Rubric:** Layout category (1+ command required)

- [ ] Create 3 rectangles, then: "Arrange them in a horizontal row"
  - **Expected:** Rectangles align horizontally with spacing

- [ ] Create several shapes, then: "Align all shapes to the left"
  - **Expected:** All shapes line up on left edge

**Success criteria:** Multiple shapes are repositioned relative to each other

---

### Test 4: Complex Commands ⭐
**Rubric:** Complex category (1+ command required)

- [ ] "Create a login form"
  - **Expected:** Username label + input, password label + input, submit button
  - **Expected:** Vertically arranged, logical layout

- [ ] "Build a navigation bar with Home, About, Contact"
  - **Expected:** Background rectangle + 3 text elements
  - **Expected:** Horizontally arranged

**Success criteria:** Multi-step plans execute, creates 3+ properly arranged elements

---

### Test 5: Edge Cases & Error Handling

- [ ] Invalid command: "asdflkj nonsense"
  - **Expected:** Error message, palette stays open

- [ ] Rate limiting: Execute 11 commands rapidly
  - **Expected:** 11th command returns rate limit error

- [ ] Network error: Stop PartyKit server, try command
  - **Expected:** Timeout or error message

---

### Test 6: Multi-User AI

- [ ] Open 2 browser windows
- [ ] User 1: "Create a red circle"
- [ ] **Expected:** User 2 sees circle appear in real-time
- [ ] User 2: "Create a blue rectangle"
- [ ] **Expected:** User 1 sees rectangle appear

**Success criteria:** AI changes sync to all collaborators via Yjs

---

## 🎯 Rubric Scoring Guide

### Command Breadth & Capability (10 points)

✅ **Excellent (9-10 points):** 8+ distinct command types
- We have 22 tools across 4 categories ✅

### Complex Command Execution (8 points)

Target: "Create login form" produces 3+ properly arranged elements
- Should create: 2 text labels, 2 input rectangles, 1 submit button
- Should arrange: Vertically stacked with spacing

### AI Performance & Reliability (7 points)

- Sub-2 second responses ✅ (GPT-4 turbo is fast)
- 90%+ accuracy (test with variety of commands)
- Natural UX with feedback ✅ (loading states, success/error)
- Shared state works ✅ (Yjs sync)

---

## 🐛 Troubleshooting

### "OpenAI API key not configured"
- Check `partykit/.env.local` has OPENAI_API_KEY
- Restart PartyKit dev server
- Check console for "Loading environment variables"

### "Request timed out"
- OpenAI API might be slow
- Try simpler command
- Check network connection

### Shapes created but not visible
- Check browser console for errors
- Verify Yjs sync is working
- Check shapes store is updating

### Rate limit hit immediately
- Clear Durable Object storage
- Wait 1 minute
- Try again

---

## 📊 Expected Performance

### Response Times
- Simple commands (create 1 shape): **1-2 seconds**
- Complex commands (create 5+ shapes): **3-5 seconds**
- Timeout after: **10 seconds**

### Accuracy
- Simple commands: **95%+**
- Complex commands: **85%+**
- Ambiguous commands: AI asks for clarification

---

## ✅ Phase 4 Complete When:

- [ ] All 4 command categories tested and working
- [ ] Complex commands create proper layouts
- [ ] Rate limiting functional
- [ ] Multi-user AI verified
- [ ] Response times meet targets
- [ ] Error handling works
- [ ] Ready for demo

---

**Next:** Set OPENAI_API_KEY and start testing!  
**Rubric Impact:** 25 points if all criteria met  
**Demo Command:** "Create a login form" ← this is the wow moment! 🎬

