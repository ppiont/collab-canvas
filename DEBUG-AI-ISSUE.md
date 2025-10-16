# Debug: AI "Only Creates Shapes" Issue

**Problem:** User reports AI can only create shapes, not do layout/manipulation

**Hypothesis:** Fundamental architectural issue with how GPT-4 function calling works

---

## 🔍 The Architectural Problem

### How GPT-4 Function Calling Works:

1. **GPT-4 returns ALL tool calls at once** (in a single response)
2. **GPT-4 doesn't get feedback** about tool execution results
3. **GPT-4 doesn't know what IDs** will be generated

### The Issue with Complex Commands:

**User says:** "Create a login form"

**GPT-4 wants to:**
```javascript
1. createText(...) → generates id: "uuid-1" (GPT-4 doesn't know this ID!)
2. createRectangle(...) → generates id: "uuid-2" (GPT-4 doesn't know this!)
3. createText(...)
4. createRectangle(...)
5. arrangeVertical(["uuid-1", "uuid-2", ...]) ← GPT-4 can't know these IDs!
```

**GPT-4 CAN'T reference shape IDs it just created because:**
- All tool calls are returned at once
- Tool execution happens after GPT-4 finishes
- No feedback loop to get IDs back to GPT-4

---

## 🧪 Quick Debug Test

**Open the browser console and run a command:**

1. Open DevTools (F12)
2. Go to Console tab
3. Press Cmd+K in the app
4. Type: "Create 3 circles and arrange them horizontally"
5. Submit command
6. **Look for these console logs:**
   - `[AI Response]` - What tools did GPT-4 return?
   - `[AI] Executing X tools` - How many tools?
   - `[AI Tool Execution]` - What tools are being run?

**Expected to see:**
```
[AI Response] { success: true, toolsToExecute: [...] }
[AI] Executing 4 tools: [...]
[AI Tool Execution] createCircle {...}
[AI Tool Execution] createCircle {...}
[AI Tool Execution] createCircle {...}
[AI Tool Execution] arrangeHorizontal {...}  ← Does this appear?
```

**If you DON'T see arrangeHorizontal:**
- GPT-4 isn't calling layout tools
- Problem is in the prompt/model, not our implementation

**If you DO see arrangeHorizontal but it fails:**
- GPT-4 is calling it with invalid IDs (can't reference just-created shapes)
- Architectural problem

---

## 💡 Likely Solutions

### Solution 1: Layout Tools for EXISTING Shapes Only

**This should work:**
- User creates shapes manually
- User says: "Arrange these in a horizontal row"
- GPT-4 calls getCanvasState() to get IDs
- GPT-4 calls arrangeHorizontal() with those IDs
- ✅ Should work!

**Test this:**
1. Create 3 shapes manually (click toolbar, click canvas 3 times)
2. Cmd+K
3. "Arrange these shapes in a horizontal row"
4. Check console - does it call getCanvasState + arrangeHorizontal?

### Solution 2: Complex Commands with Calculated Positions

**For "create a login form":**
- GPT-4 should just calculate Y positions when creating shapes
- Don't use layout tools
- Example:
  ```
  createText(100, 100, "Username")
  createRectangle(100, 120, 200, 30)
  createText(100, 160, "Password")
  createRectangle(100, 180, 200, 30)
  createRectangle(100, 230, 100, 40, "Login button")
  ```

**This bypasses the ID problem** - no arrangeVertical needed

### Solution 3: Make GPT-4 Smarter About It

Update prompt to say:
- For creating NEW shapes: calculate positions manually
- For arranging EXISTING shapes: use getCanvasState + layout tools

---

## 🔧 Immediate Fix: Update Prompt

Let me update the system prompt to match what GPT-4 can actually do...

