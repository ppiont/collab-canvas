# Canvas Functionality Fixes - Detailed Plan

**Branch:** canvas-functionality  
**Goal:** Fix rubric-critical canvas features  
**Priority:** High (these affect Section 2.1 scoring: 8 points)

---

## 🔍 **Issues Identified**

### 1. ⚡ Pan/Zoom Too Jittery

**Current state:** Works but feels abrupt/snappy  
**Rubric requirement:** "Smooth pan/zoom"  
**Impact:** User experience, polish

### 2. 📝 Text Formatting Broken

**Current state:** Can create text, double-click to edit, but no formatting  
**Rubric requirement:** "Text with formatting"  
**Impact:** Missing feature points

### 3. 🎯 Multi-Select Drag Not Working

**Current state:** Shift+click works, dragnet shows but doesn't select  
**Rubric requirement:** "Multi-select (shift-click or drag)"  
**Impact:** Feature partially broken

### 4. 📚 Layer Management Unclear

**Current state:** Z-index keyboard shortcuts exist  
**Rubric requirement:** "Layer management"  
**Impact:** Need to understand what rubric expects

---

## 🛠️ **Issue Analysis & Solutions**

### Issue #1: Pan/Zoom Jitter

#### Current Implementation:

```typescript
// ViewportManager.ts:52-74
const newScale =
	e.deltaY < 0
		? oldScale * CANVAS.ZOOM_STEP // 1.05
		: oldScale / CANVAS.ZOOM_STEP;

this.stage.scale({ x: clampedScale, y: clampedScale });
this.stage.position(newPos);
this.stage.batchDraw(); // ← Immediate, no easing
```

**Problem:** Instant updates, no easing/smoothing

#### Solution: Add Smooth Transitions

**Option A: Konva Tween (Recommended)**

```typescript
import Konva from 'konva';

// Smooth zoom with easing
new Konva.Tween({
	node: this.stage,
	duration: 0.15, // 150ms smooth transition
	scaleX: clampedScale,
	scaleY: clampedScale,
	x: newPos.x,
	y: newPos.y,
	easing: Konva.Easings.EaseOut
}).play();
```

**Benefits:**

- Smooth, professional feel
- Built into Konva
- Configurable easing

**Cons:**

- Slightly delayed (but that's the smoothness!)

**Option B: requestAnimationFrame (More Control)**

```typescript
// Linear interpolation over time
let startTime = performance.now();
const animate = (currentTime: number) => {
	const elapsed = currentTime - startTime;
	const progress = Math.min(elapsed / 150, 1); // 150ms
	const eased = easeOutQuad(progress);

	// Interpolate between old and new
	const currentScale = oldScale + (newScale - oldScale) * eased;
	this.stage.scale({ x: currentScale, y: currentScale });

	if (progress < 1) requestAnimationFrame(animate);
};
requestAnimationFrame(animate);
```

**Recommendation:** Use Option A (Konva Tween) - simpler and proven

**Effort:** 1-2 hours  
**Files:** `ViewportManager.ts`

---

### Issue #2: Text Formatting Broken

#### What Currently Works:

- ✅ Create text shapes
- ✅ Double-click to edit content
- ✅ Properties panel: change fontSize

#### What's Missing:

- ❌ Bold/italic/underline toggle buttons
- ❌ Font family selector
- ❌ Text alignment buttons
- ❌ Applying fontStyle actually makes text bold/italic

#### Current Text Editing:

```typescript
// ShapeRenderer.ts:551-626
private enableTextEditing(textNode, shape) {
    // Creates HTML textarea
    // Can edit text content
    // But NO formatting controls!
}
```

#### Solution: Add Text Formatting Controls

**Step 1: Fix PropertiesPanel** (30 minutes)

```svelte
<!-- Add to PropertiesPanel.svelte for text shapes -->
<div class="flex gap-2">
	<Button
		variant={shape.fontStyle === 'bold' ? 'default' : 'outline'}
		size="sm"
		onclick={() => toggleFontStyle('bold')}
	>
		<Bold class="h-4 w-4" />
	</Button>
	<Button
		variant={shape.fontStyle === 'italic' ? 'default' : 'outline'}
		size="sm"
		onclick={() => toggleFontStyle('italic')}
	>
		<Italic class="h-4 w-4" />
	</Button>
</div>

<Select bind:value={shape.fontFamily}>
	<option value="system-ui">System</option>
	<option value="serif">Serif</option>
	<option value="monospace">Mono</option>
</Select>

<div class="flex gap-2">
	<Button onclick={() => updateShape({ align: 'left' })}>
		<AlignLeft class="h-4 w-4" />
	</Button>
	<!-- Center, Right -->
</div>
```

**Step 2: Fix Konva Text Rendering** (30 minutes)

```typescript
// ShapeRenderer.ts:412-422
case 'text':
    return new Konva.Text({
        ...baseConfig,
        text: shape.text,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily || 'system-ui',
        fontStyle: shape.fontStyle || 'normal',  // ← Apply this!
        align: shape.align || 'left',
        // ... rest
    });
```

**Effort:** 1-2 hours  
**Files:** `PropertiesPanel.svelte`, `ShapeRenderer.ts`

---

### Issue #3: Drag-Net Selection Not Working

#### Current State Analysis:

Looking at console logs from earlier:

```
[DragNet] Starting drag-net, distance: 6
[DragNet] Bounds: {x: 264, y: 321, width: 175, height: 51}
[SelectionNet] Intersecting shapes: ["e1a0fc24-..."]  ← FINDS SHAPES!
[DragNet] Intersecting shapes: ["e1a0fc24-..."]  ← GETS SHAPES!
```

**The dragnet IS working!** It's finding intersecting shapes.

#### Let me check EventHandlers to see if selection is applied:

From EventHandlers.ts:283:

```typescript
const intersectingIds = this.selectionNet.getIntersectingShapes(bounds, allShapes);
console.log('[DragNet] Intersecting shapes:', intersectingIds);
```

**Need to see what happens next...**

#### Likely Issue:

After getting intersecting IDs, we need to call `selectionManager.selectMultiple(intersectingIds)`

Let me check if that's missing...

Looking at the logs, I see:

```
[DragNet] Default mode - Selected: ["e1a0fc24-..."]
```

So it IS selecting! But maybe the user's experience is that:

- The animation shows
- But shapes don't appear selected after?

**Hypothesis:** Selection is happening but transformer isn't showing, or selection is being cleared immediately.

#### Solution: Debug and Fix

**Step 1:** Add more logging to see what's happening
**Step 2:** Ensure transformer appears after dragnet selection
**Step 3:** Make sure selection isn't cleared by subsequent click

**Effort:** 1-2 hours  
**Files:** `EventHandlers.ts`, potentially `SelectionManager.ts`

---

### Issue #4: Layer Management (What Does Rubric Mean?)

#### Rubric Section 2.1 Says:

"Layer management" as part of "Excellent (7-8 points)" criteria

#### What "Layer Management" Typically Means:

1. **Z-index control** ✅ We have this (keyboard shortcuts)
2. **Visual layer panel** (sidebar showing all shapes in list)
3. **Drag to reorder** in the panel
4. **Show/hide layers**
5. **Lock layers**

#### What We Currently Have:

- ✅ Z-index in data model
- ✅ Keyboard shortcuts (Cmd+], Cmd+[)
- ✅ Shapes render in z-index order
- ❌ NO visual layers panel

#### What Rubric Likely Expects (Minimum):

Just the **ability to control layer order** - which we have via keyboard!

**Recommendation:** Layer management is DONE via keyboard shortcuts. No panel needed for rubric.

**If we wanted to add panel (optional):**

- Sidebar showing shape list
- Drag to reorder
- Click to select

**Effort:** 3-4 hours (not critical for rubric)

---

## 📋 **Prioritized Fix List**

### Priority 1: Fix Drag-Net Selection (CRITICAL)

**Why:** Rubric explicitly requires "multi-select (shift-click or drag)"  
**Status:** Partially broken (shows animation but may not work)  
**Effort:** 1-2 hours  
**Impact:** Required for "Good" rating in Section 2.1

### Priority 2: Add Text Formatting Controls

**Why:** Rubric requires "text with formatting"  
**Status:** Text works but no formatting UI  
**Effort:** 1-2 hours  
**Impact:** +1-2 points in Section 2.1

### Priority 3: Smooth Pan/Zoom

**Why:** Rubric requires "smooth pan/zoom"  
**Status:** Works but jittery  
**Effort:** 1-2 hours  
**Impact:** Polish, user experience

### Priority 4: Layer Management

**Why:** Rubric mentions it  
**Status:** Already have it via keyboard shortcuts ✅  
**Effort:** 0 hours (already done!)  
**Impact:** None (satisfied by keyboard shortcuts)

---

## 🎯 **Recommended Implementation Order**

### Session 1: Drag-Net Selection (1-2 hours)

1. Test current behavior thoroughly
2. Add comprehensive logging
3. Find why selection doesn't "stick"
4. Fix the issue
5. Test: Drag to select multiple shapes ✅

### Session 2: Text Formatting (1-2 hours)

1. Add formatting buttons to PropertiesPanel
2. Wire up bold/italic/fontStyle
3. Add font family selector
4. Add alignment buttons
5. Test: Format text, see it update ✅

### Session 3: Smooth Pan/Zoom (1-2 hours)

1. Add Konva.Tween to zoom
2. Add easing to pan (if needed)
3. Tune duration and easing curve
4. Test: Feels smooth and professional ✅

**Total Time:** 3-6 hours  
**Impact:** +2-3 rubric points, much better UX

---

## 📊 **Rubric Impact**

### Section 2.1: Canvas Functionality (8 points)

**Current (5-6/8):**

- ✅ Smooth pan/zoom - JITTERY
- ✅ 3+ shape types - YES (7 types)
- ⚠️ Text with formatting - NO FORMATTING
- ⚠️ Multi-select drag - BROKEN
- ✅ Layer management - YES (keyboard)
- ✅ Transform operations - YES
- ✅ Duplicate/delete - YES

**After Fixes (7-8/8):**

- ✅ Smooth pan/zoom - SMOOTH
- ✅ 3+ shape types - YES (7 types)
- ✅ Text with formatting - YES
- ✅ Multi-select drag - WORKING
- ✅ Layer management - YES (keyboard)
- ✅ Transform operations - YES
- ✅ Duplicate/delete - YES

**Gain:** +2 points

---

## 🧪 **Testing Protocol**

### Test Drag-Net:

1. Click empty canvas
2. Drag to create selection box
3. Release mouse
4. **Expected:** All shapes in box are selected (transformer shows)
5. **Current:** Animation shows but selection may not stick

### Test Text Formatting:

1. Create text shape
2. Select it
3. Properties panel shows formatting buttons
4. Click Bold
5. **Expected:** Text becomes bold
6. **Current:** No formatting buttons exist

### Test Smooth Zoom:

1. Scroll wheel to zoom
2. **Expected:** Smooth easing (150ms transition)
3. **Current:** Instant/jittery

---

## 📝 **Next Steps**

1. **Test drag-net** - See exact failure mode
2. **Fix drag-net** - Make selection stick
3. **Add text formatting UI** - Buttons in PropertiesPanel
4. **Add smooth zoom** - Konva.Tween
5. **Test all changes**
6. **Commit and push**

**Want me to start with drag-net selection debugging?**
