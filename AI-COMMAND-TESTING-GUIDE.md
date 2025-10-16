# AI Command Testing Guide

**Purpose:** Verify all 22 AI tools work correctly after fixing layout tools bug  
**Date:** October 16, 2025  
**Branch:** ai-features  
**Status:** Layout tools NOW IMPLEMENTED - ready for testing

---

## ✅ Bug Fix Completed

**File:** `src/lib/components/CommandPalette.svelte`  
**Lines:** 176-301  
**Change:** Replaced `// TODO: Implement layout tools if needed` with full implementations

**Layout Tools Now Implemented:**
- ✅ arrangeHorizontal
- ✅ arrangeVertical
- ✅ arrangeGrid
- ✅ distributeEvenly
- ✅ alignShapes

---

## 🧪 Testing Checklist

### Preparation

1. **Start Development Servers:**
```bash
bun run dev              # Terminal 1 (port 5173)
bunx partykit dev        # Terminal 2 (port 1999)
```

2. **Open the app:** http://localhost:5173
3. **Sign in** with Auth0
4. **Navigate to canvas:** /canvas
5. **Open Command Palette:** Press `Cmd/Ctrl+K`

---

## 📋 Test All 22 AI Tools

### Category 1: Creation Tools (8 tools)

#### Test 1.1: createRectangle
**Command:** "Create a red rectangle at 200, 200"  
**Expected:** Red rectangle appears at position (200, 200)  
**Verify:** 
- [ ] Shape appears immediately
- [ ] Position correct
- [ ] Color is red
- [ ] Syncs to other users

#### Test 1.2: createCircle
**Command:** "Create a blue circle at 400, 200 with radius 75"  
**Expected:** Blue circle, center at (400, 200), radius 75  
**Verify:**
- [ ] Shape appears
- [ ] Correct position and size
- [ ] Color is blue

#### Test 1.3: createEllipse
**Command:** "Make an ellipse at 600, 200 with radiusX 100 and radiusY 50"  
**Expected:** Ellipse at position, stretched horizontally  
**Verify:**
- [ ] Shape appears
- [ ] Correct dimensions
- [ ] Can resize

#### Test 1.4: createLine
**Command:** "Create a line from 100,100 to 300,300"  
**Expected:** Diagonal line  
**Verify:**
- [ ] Line appears
- [ ] Correct endpoints

#### Test 1.5: createText
**Command:** "Add text that says Hello World at 200, 400"  
**Expected:** Text layer with "Hello World"  
**Verify:**
- [ ] Text appears
- [ ] Correct position
- [ ] Can double-click to edit

#### Test 1.6: createPolygon
**Command:** "Create a hexagon at 400, 400"  
**Expected:** 6-sided polygon  
**Verify:**
- [ ] Polygon appears
- [ ] Has 6 sides

#### Test 1.7: createStar
**Command:** "Make a 5-point star at 600, 400"  
**Expected:** Star shape with 5 points  
**Verify:**
- [ ] Star appears
- [ ] Correct shape

#### Test 1.8: createImage
**Command:** "Create an image placeholder at 800, 200"  
**Expected:** Gray rectangle (placeholder)  
**Verify:**
- [ ] Placeholder appears
- [ ] Can be moved/resized

---

### Category 2: Manipulation Tools (6 tools)

**Setup:** Create 3 shapes first (rectangle, circle, text)

#### Test 2.1: moveShape
**Command:** "Move the rectangle to 500, 500"  
**Expected:** Rectangle moves to new position  
**Verify:**
- [ ] Shape moves
- [ ] Position is (500, 500)
- [ ] Syncs to other users

#### Test 2.2: resizeShape
**Command:** "Resize the rectangle to 250 wide and 150 tall"  
**Expected:** Rectangle changes size  
**Verify:**
- [ ] Width = 250
- [ ] Height = 150

#### Test 2.3: rotateShape
**Command:** "Rotate the rectangle 45 degrees"  
**Expected:** Rectangle rotates  
**Verify:**
- [ ] Rotation = 45°
- [ ] Visible rotation

#### Test 2.4: updateShapeColor
**Command:** "Change the rectangle to green"  
**Expected:** Fill color becomes green  
**Verify:**
- [ ] Color changes
- [ ] Syncs immediately

#### Test 2.5: deleteShape
**Command:** "Delete the circle"  
**Expected:** Circle disappears  
**Verify:**
- [ ] Shape removed
- [ ] Syncs to other users

#### Test 2.6: duplicateShape
**Command:** "Duplicate the text"  
**Expected:** Copy appears with offset  
**Verify:**
- [ ] Duplicate created
- [ ] Has offset (default 20, 20)

---

### Category 3: Layout Tools (5 tools) - **NEWLY FIXED**

**Setup:** Create 5 rectangles at different positions

#### Test 3.1: arrangeHorizontal (**CRITICAL TEST**)
**Command:** "Arrange these shapes in a horizontal row"  
**Expected:** All shapes align horizontally with spacing  
**Verify:**
- [ ] ✅ Shapes arrange left to right
- [ ] ✅ Even spacing (~20px default)
- [ ] ✅ All have same Y coordinate
- [ ] ✅ Syncs to other users
- **This proves the bug fix worked!**

#### Test 3.2: arrangeVertical (**CRITICAL TEST**)
**Command:** "Arrange these shapes in a vertical column"  
**Expected:** All shapes stack vertically  
**Verify:**
- [ ] ✅ Shapes arrange top to bottom
- [ ] ✅ Even spacing
- [ ] ✅ All have same X coordinate

#### Test 3.3: arrangeGrid (**CRITICAL TEST**)
**Command:** "Create a 3x3 grid of blue circles"  
**Expected:** 9 circles in 3x3 grid pattern  
**Note:** This combines creation + layout!  
**Verify:**
- [ ] ✅ 9 circles created
- [ ] ✅ Arranged in 3 rows, 3 columns
- [ ] ✅ Even spacing

#### Test 3.4: distributeEvenly
**Command:** "Distribute these shapes evenly horizontally"  
**Expected:** Equal spacing between shapes  
**Verify:**
- [ ] ✅ Shapes spread out evenly
- [ ] ✅ Start and end positions maintained
- [ ] ✅ Middle shapes repositioned

#### Test 3.5: alignShapes
**Command:** "Align all shapes to the left"  
**Expected:** All shapes have same X coordinate (minimum)  
**Verify:**
- [ ] ✅ Vertical alignment
- [ ] ✅ All same X value

**Also test:**
- "Align to the right"
- "Align to the center"
- "Align to the top"

---

### Category 4: Query Tools (3 tools)

#### Test 4.1: getCanvasState
**Command:** "What shapes are on the canvas?"  
**Expected:** AI describes current shapes  
**Note:** This is informational, no canvas changes  
**Verify:**
- [ ] AI responds with shape list
- [ ] Accurate count and types

#### Test 4.2: findShapesByType
**Command:** "Find all rectangles"  
**Expected:** AI identifies rectangle shapes  
**Verify:**
- [ ] Correct identification
- [ ] Can use in follow-up command

#### Test 4.3: findShapesByColor
**Command:** "Find all red shapes and change them to blue"  
**Expected:** Color filtering works  
**Verify:**
- [ ] Finds correct shapes
- [ ] Changes color

---

## 🎯 Complex Command Testing (Rubric Section 4.2)

**These are the commands the rubric explicitly mentions!**

### Complex Test 1: Login Form (**CRITICAL**)

**Command:** "Create a login form"

**Expected Result:**
- Username label (text)
- Username input field (rectangle)
- Password label (text)
- Password input field (rectangle)
- Submit button (rectangle)
- **All arranged vertically** (uses arrangeVertical - previously broken!)

**Verify:**
- [ ] ✅ 3+ elements created
- [ ] ✅ Proper vertical arrangement
- [ ] ✅ Elements are properly sized
- [ ] ✅ Looks like a form layout

**Rubric:** "Create login form" produces 3+ properly arranged elements

**If This Works:** You proved the bug fix! Section 4.2 goes from 2-3 points to 6-8 points (**+4-6 points**)

---

### Complex Test 2: Navigation Bar (**CRITICAL**)

**Command:** "Build a navigation bar with Home, About, Services, Contact"

**Expected Result:**
- Background rectangle (nav bar container)
- 4 text elements (menu items)
- **All arranged horizontally** (uses arrangeHorizontal - previously broken!)

**Verify:**
- [ ] ✅ 4+ elements created
- [ ] ✅ Horizontal layout
- [ ] ✅ Even spacing
- [ ] ✅ Looks like a nav bar

---

### Complex Test 3: Card Layout (**CRITICAL**)

**Command:** "Make a card layout with title, image placeholder, and description"

**Expected Result:**
- Card background (rectangle)
- Title (text)
- Image placeholder (rectangle or image)
- Description (text)
- **Arranged vertically** (uses arrangeVertical)

**Verify:**
- [ ] ✅ 4 elements created
- [ ] ✅ Vertical stacking
- [ ] ✅ Proper sizing
- [ ] ✅ Looks like a card

---

### Complex Test 4: Grid Layout

**Command:** "Create a 3x3 grid of colored squares - red, blue, green, yellow, purple, orange, pink, teal, gray"

**Expected Result:**
- 9 rectangles
- Different colors
- **Arranged in 3x3 grid** (uses arrangeGrid - previously broken!)

**Verify:**
- [ ] ✅ 9 squares created
- [ ] ✅ 3 rows, 3 columns
- [ ] ✅ Even spacing
- [ ] ✅ Different colors

---

## 📊 Test Results Template

### Copy This and Fill It Out

```markdown
## AI Command Test Results
**Date:** [DATE]
**Tester:** [NAME]
**Environment:** Local dev / Production

### Creation Tools (8/8)
- createRectangle: ✅ / ❌ (notes)
- createCircle: ✅ / ❌
- createEllipse: ✅ / ❌
- createLine: ✅ / ❌
- createText: ✅ / ❌
- createPolygon: ✅ / ❌
- createStar: ✅ / ❌
- createImage: ✅ / ❌

### Manipulation Tools (6/6)
- moveShape: ✅ / ❌
- resizeShape: ✅ / ❌
- rotateShape: ✅ / ❌
- updateShapeColor: ✅ / ❌
- deleteShape: ✅ / ❌
- duplicateShape: ✅ / ❌

### Layout Tools (5/5) - NEWLY FIXED
- arrangeHorizontal: ✅ / ❌ (CRITICAL)
- arrangeVertical: ✅ / ❌ (CRITICAL)
- arrangeGrid: ✅ / ❌ (CRITICAL)
- distributeEvenly: ✅ / ❌
- alignShapes: ✅ / ❌

### Complex Commands (Rubric Requirements)
- "Create a login form": ✅ / ❌ (CRITICAL FOR RUBRIC)
- "Build a navigation bar": ✅ / ❌ (CRITICAL FOR RUBRIC)
- "Make a card layout": ✅ / ❌ (CRITICAL FOR RUBRIC)
- "Create a 3x3 grid": ✅ / ❌

### Performance Measurements
- Simple command response time (avg): ___ seconds
- Complex command response time (avg): ___ seconds
- Success rate: ___% (successful / total attempts)

### Issues Found
[List any bugs, failures, or unexpected behavior]

### Conclusion
Pass / Fail - Ready for demo: Yes / No
```

---

## 🎬 Testing Workflow

### Step-by-Step Testing Process

**1. Test Simple Commands First (10 minutes)**
- Create one of each shape type
- Move a shape
- Change a color
- Delete a shape
- Verify basic AI functionality

**2. Test Layout Commands (15 minutes)**
- Create 5 rectangles manually
- Test each layout command
- **Focus on arrangeHorizontal and arrangeVertical** (most important)
- Verify shapes move as expected

**3. Test Complex Commands (20 minutes)**
- Clear canvas (or start fresh)
- Test "Create a login form" - **MOST IMPORTANT**
- Test "Build a navigation bar"
- Test "Make a card layout"
- Test "Create a 3x3 grid"
- **Document if ANY fail**

**4. Performance Testing (10 minutes)**
- Run 5-10 simple commands, measure times
- Run 3-5 complex commands, measure times
- Note any timeouts or errors
- Calculate success rate

**5. Multi-User Testing (15 minutes)**
- Open 2 browser windows
- Sign in as different users
- Run AI commands in window 1
- Verify shapes appear in window 2
- Try running AI commands simultaneously

---

## ⏱️ Performance Targets (Rubric Requirements)

### Response Times
- **Simple commands:** <2 seconds (target)
- **Complex commands:** <5 seconds (target)
- **Timeout:** 30 seconds (implemented)

### Accuracy
- **Target:** 90%+ success rate
- **Method:** Count successes / total attempts

### Reliability
- **Multi-user:** Both users should see AI-generated shapes
- **Sync:** Changes should appear immediately via Yjs

---

## 🎯 Success Criteria

### Minimum (Pass Testing)
- [ ] All creation tools work (8/8)
- [ ] All manipulation tools work (6/6)
- [ ] All layout tools work (5/5) - **THIS WAS BROKEN**
- [ ] At least 1 complex command works
- [ ] No crashes or fatal errors

### Target (Rubric "Good" Score)
- [ ] All 22 tools work
- [ ] 2+ complex commands work correctly
- [ ] Response times < 5 seconds
- [ ] Success rate > 80%

### Excellent (Rubric "Excellent" Score)
- [ ] All tools work flawlessly
- [ ] All complex commands work
- [ ] Response times < 2s (simple), < 5s (complex)
- [ ] Success rate > 90%
- [ ] Multi-user AI tested and working

---

## 🚨 Common Failure Modes

### If Layout Commands Still Fail:
- **Check:** Is PartyKit dev server running?
- **Check:** Is OPENAI_API_KEY set in environment?
- **Check:** Did you restart dev server after code change?
- **Check:** Are shapes being created before layout command?

### If Complex Commands Fail:
- **Likely:** GPT-4 didn't call the right tools
- **Debug:** Check console for tool calls returned
- **Debug:** Check if tools were executed
- **Try:** More specific commands ("Create 3 text fields arranged vertically")

### If Response Times Are Slow:
- **Normal:** GPT-4 can take 2-5 seconds
- **Problem:** If > 10 seconds, check network
- **Problem:** If timeout (30s), command too complex

---

## 📝 Documentation Template

After testing, create: `AI-TESTING-RESULTS.md`

```markdown
# AI Command Testing Results

**Date:** [TODAY]
**Branch:** ai-features
**PartyKit:** Local dev server
**Tester:** [YOUR NAME]

## Summary
- Tools tested: 22/22
- Tools working: __/22
- Success rate: __%
- Average response time (simple): __s
- Average response time (complex): __s

## Critical Findings

### Layout Tools (Previously Broken)
- arrangeHorizontal: ✅ / ❌
- arrangeVertical: ✅ / ❌
- arrangeGrid: ✅ / ❌

### Complex Commands (Rubric Requirements)
- Login form: ✅ / ❌
- Navigation bar: ✅ / ❌
- Card layout: ✅ / ❌

## Bugs Found
[List any issues]

## Conclusion
The AI layout tools bug fix is: ✅ SUCCESSFUL / ❌ NEEDS MORE WORK
```

---

## 🎯 Expected Results After Fix

**If Fix Is Successful:**
- ✅ Complex commands work for the first time
- ✅ "Create a login form" produces vertically stacked elements
- ✅ "Build a navigation bar" produces horizontally arranged elements
- ✅ Grid commands produce proper layouts

**Rubric Impact:**
- Section 4.2 (Complex Command Execution): 2-3 → **6-8 points** (+4-6 points!)
- Section 4.3 (AI Performance): 3-4 → **5-6 points** (+2 points!)
- **Total gain: +6-8 points**

**Score Impact:**
- Previous: 51-61 points
- **After fix + testing: 57-69 points**
- **After requirements (log + video): 57-59 points (still failing)**
- **Need more work to reach 70+ (passing)**

---

## 🔧 If Tests Fail

### Debug Steps:
1. Check browser console for errors
2. Check PartyKit logs for tool calls
3. Verify OPENAI_API_KEY is set
4. Try simpler commands first
5. Check if shapes exist before layout command

### Quick Fixes:
- **Restart dev servers** (both SvelteKit and PartyKit)
- **Clear browser cache** (Cmd+Shift+R)
- **Check network tab** (is API call succeeding?)

---

## ⚡ Quick Test (5 minutes)

**Fastest way to verify the fix:**

1. Open canvas
2. Press Cmd+K
3. Type: "Create 3 red circles"
4. Wait for circles to appear
5. Press Cmd+K again
6. Type: "Arrange these in a horizontal row"
7. **Watch:** Do the circles arrange horizontally?

**If YES:** ✅ Bug fixed! Layout tools working!  
**If NO:** ❌ Debug needed

---

## 📊 Next Steps After Testing

### If All Tests Pass:
1. ✅ Update testing results document
2. ✅ Commit changes: "fix: implement AI layout tools client-side execution"
3. ✅ Mark todo #3 and #4 as complete
4. ➡️ Move to next priority: Keyboard shortcuts

### If Some Tests Fail:
1. Document which commands fail
2. Debug and fix issues
3. Retest
4. Don't move forward until working

---

**Test Time Estimate:** 1-2 hours for comprehensive testing  
**Critical Tests:** Login form, nav bar, grid (rubric requirements)  
**Success Indicator:** Layout commands work, complex commands produce proper layouts

