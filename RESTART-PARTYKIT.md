# Fix CORS: Restart PartyKit Dev Server

## ⚡ **CRITICAL: You Must Restart PartyKit**

The CORS fixes I just made **won't take effect** until you restart the PartyKit dev server.

---

## 🔄 **How to Restart PartyKit:**

### Step 1: Stop PartyKit
Find the terminal running `bunx partykit dev`

Press: **`Ctrl+C`** (or `Cmd+C` on Mac)

You should see it stop.

### Step 2: Start PartyKit Again
In the same terminal:

```bash
bunx partykit dev
```

Wait for it to say:
```
✓ Built in XXXms
  Serving at http://localhost:1999
```

### Step 3: Refresh Browser
Hard refresh your browser:

**`Cmd+Shift+R`** (Mac) or **`Ctrl+Shift+R`** (Windows/Linux)

This clears any cached CORS errors.

---

## 🧪 **Test Again:**

1. ✅ PartyKit restarted
2. ✅ Browser hard refreshed
3. ✅ Create 3 shapes manually
4. ✅ Press Cmd+K
5. ✅ Type: "Arrange these shapes vertically"
6. ✅ Hit Enter

---

## 🔍 **What to Look For in Console:**

You should now see:

**Browser Console (F12):**
```
[AI] Sending request to: http://localhost:1999/parties/yjs/main/api/ai/command
[AI] Response status: 200 OK
[AI] Response headers: [['access-control-allow-origin', '*'], ...]
[AI Response] { success: true, toolsToExecute: [...] }
[AI] Executing 2 tools: [...]
[AI Tool Execution] getCanvasState {}
[AI Tool Execution] arrangeVertical { shapeIds: [...] }
```

**PartyKit Terminal:**
```
[PartyKit] Handling AI command request
[PartyKit] AI command endpoint hit
[PartyKit] Received command: Arrange these shapes vertically from user: ...
[PartyKit] OpenAI API key found, calling GPT-4...
```

---

## ❌ **If CORS Error Persists:**

### Check 1: Is PartyKit Actually Restarted?
Look at the PartyKit terminal - you should see it rebuild when you start it.

### Check 2: Is It Using the Right Code?
The terminal should show:
```
✓ Built in XXXms
```

If it says "Using cached build" or doesn't rebuild, try:
```bash
bunx partykit dev --no-cache
```

### Check 3: Check PartyKit Terminal for Logs
When you run the command, do you see:
- `[PartyKit] Handling AI command request`
- `[PartyKit] AI command endpoint hit`

**If NO:** The request isn't reaching PartyKit (network issue)  
**If YES:** PartyKit is handling it but CORS headers not working (code issue)

---

## 🚨 **Alternative: Kill All Node/Bun Processes**

If restart doesn't work, completely kill everything:

```bash
# Kill all bun/node processes
killall -9 bun node

# Restart both servers fresh
bun run dev              # Terminal 1
bunx partykit dev        # Terminal 2
```

---

## 📋 **Checklist:**

- [ ] Stopped PartyKit (Ctrl+C)
- [ ] Restarted PartyKit (bunx partykit dev)
- [ ] Saw "Built in XXXms"
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Tried AI command again
- [ ] Checked console for new logs

---

**If it still doesn't work after restart, share:**
1. What you see in browser console
2. What you see in PartyKit terminal
3. I'll debug further!

