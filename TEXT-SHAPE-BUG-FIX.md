# Text Shape Bug Fix - October 17, 2025

## Bug Description

When a text shape was created and then edited:

1. ✅ Create text shape displays "text" correctly (visible)
2. ✅ Double-click to enter edit mode works (textarea appears)
3. ✅ Editing text content works
4. ❌ **After clicking away to finish editing, text disappears** (becomes blank or white/invisible)
5. ❌ **Persists even after browser refresh - text is truly gone from render**
6. ❌ Shape still exists but is no longer interactive (can't double-click to re-edit, can't move)
7. ✅ Shape still selectable with drag-net marquee (proves it still exists)

## Root Cause Analysis

### Issue 1: Missing Default Fill Color in Shape Factory

**File:** `src/lib/canvas/shapes/ShapeFactory.ts:79-88`

The `TextShape` was created without a `fill` property:

```typescript
case 'text': {
    const props = baseProps as Partial<TextShape>;
    return {
        ...base,
        type: 'text',
        text: props.text ?? 'Text',
        fontSize: props.fontSize ?? DEFAULT_SHAPE_DIMENSIONS.text.fontSize,
        fontFamily: props.fontFamily ?? DEFAULT_SHAPE_DIMENSIONS.text.fontFamily,
        align: 'left'
        // ❌ NO FILL COLOR SET
    } as TextShape;
}
```

### Issue 2: Missing Fallback in Konva Update Logic

**File:** `src/lib/canvas/shapes/ShapeRenderer.ts:230-285`

When creating a Konva text node (line 417), the code correctly applies a fallback:

```typescript
fill: shape.fill || '#000000',  // ✅ Fallback to black
```

**BUT** when updating an existing Konva node after editing (line 237):

```typescript
konvaShape.fill(shape.fill); // ❌ NO FALLBACK! Sets to undefined
```

### Issue 3: **CRITICAL** - Node Not Shown After Update

**File:** `src/lib/canvas/shapes/ShapeRenderer.ts:180-185`

This is the **primary cause** of the persistent disappearing text bug!

When the text node is updated after editing:

```typescript
if (existingNode && !isLocallyDragging) {
	this.updateKonvaNodeProperties(existingNode, shape);
	this.applySelectionStyling(existingNode, isSelected, shape);
	// ❌ MISSING: existingNode.show()
	return;
}
```

### Complete Flow of the Bug

1. Text shape created via `ShapeFactory.create()`
2. Konva text node created and rendered (visible) ✅
3. User double-clicks text
4. `enableTextEditing()` calls: **`textNode.hide()`** (line 554) - node becomes hidden
5. Textarea overlay opens
6. User edits text and clicks away / presses Escape
7. `removeTextarea()` calls: `this.callbacks!.onShapeUpdate(shape.id, { text: newText })`
8. Yjs store is updated with new text
9. ShapeRenderer's `render()` method is called
10. It finds the existing (hidden) node at line 174
11. It calls `updateKonvaNodeProperties()` to update the text
12. **BUT** it never calls `.show()` on the node ❌
13. Node remains hidden throughout re-renders ❌
14. Text is now permanently invisible until browser refresh forces a full re-render

## Solution

### Fix 1: Add Default Fill to Text Shapes in ShapeFactory

**File:** `src/lib/canvas/shapes/ShapeFactory.ts`

```typescript
case 'text': {
    const props = baseProps as Partial<TextShape>;
    return {
        ...base,
        type: 'text',
        text: props.text ?? 'Text',
        fontSize: props.fontSize ?? DEFAULT_SHAPE_DIMENSIONS.text.fontSize,
        fontFamily: props.fontFamily ?? DEFAULT_SHAPE_DIMENSIONS.text.fontFamily,
        fill: props.fill ?? '#000000',  // ✅ ADD DEFAULT FILL
        align: 'left'
    } as TextShape;
}
```

### Fix 2: Add Fallback Logic in Konva Update

**File:** `src/lib/canvas/shapes/ShapeRenderer.ts:237`

```typescript
const konvaShape = node as Konva.Shape;
konvaShape.fill(shape.fill || (shape.type === 'text' ? '#000000' : undefined));
// ✅ Apply fallback for text shapes
```

### Fix 3: **CRITICAL** - Show Node After Update

**File:** `src/lib/canvas/shapes/ShapeRenderer.ts:182-184`

```typescript
if (existingNode && !isLocallyDragging) {
	// Sync Konva node properties from Yjs shape data
	this.updateKonvaNodeProperties(existingNode, shape);
	this.applySelectionStyling(existingNode, isSelected, shape);
	// CRITICAL: Ensure node is visible after update
	// (fixes text disappearing after editing - node was hidden but never shown again)
	existingNode.show(); // ✅ ADD THIS LINE
	return;
}
```

## Why This Triple Approach?

1. **ShapeFactory fix** ensures text always has a black fill from creation
2. **ShapeRenderer fill fallback** provides defensive programming for undefined fills
3. **ShapeRenderer show() fix** is the **PRIMARY FIX** - ensures hidden nodes become visible again after update
   - Without this, text stays hidden forever (even persists after browser refresh)
   - With this, text re-appears immediately after editing

## Testing the Fix

### Test Case 1: Create and Edit Text (PRIMARY TEST)

```
1. Click "T" tool to select text tool
2. Click on canvas to create text
3. Verify text appears as "Text" with black color
4. Double-click on the text
5. Type new content (e.g., "Hello World")
6. Click away to finish editing
7. ✅ Text should IMMEDIATELY appear with new content (THIS WAS BROKEN)
8. ✅ Text should be visible and remain visible
9. ✅ Text should be selectable and draggable
10. ✅ Double-click should re-open editing
```

### Test Case 2: Edit Multiple Times

```
1. Create text "First"
2. Edit to "Second" → ✅ Should appear
3. Edit to "Third" → ✅ Should appear
4. Edit to "Fourth" → ✅ Should appear
5. Each edit should immediately show updated text
```

### Test Case 3: Undo/Redo with Text

```
1. Create text shape "Original"
2. Edit to "Edited"
3. Press Cmd+Z (undo)
4. ✅ Should show "Original" - text visible
5. Press Cmd+Shift+Z (redo)
6. ✅ Should show "Edited" - text visible
7. Text should remain visible throughout
```

### Test Case 4: Browser Refresh

```
1. Create text "Test"
2. Edit to "Updated"
3. ✅ Text should appear (don't need to refresh)
4. Optional: Refresh browser
5. ✅ Text should still be there with "Updated" content
```

## Files Modified

- `src/lib/canvas/shapes/ShapeFactory.ts` - Add default fill to text shapes (FIXED)
- `src/lib/canvas/shapes/ShapeRenderer.ts` - Two fixes:
  1. Add fill fallback in `updateKonvaNodeProperties()` (FIXED)
  2. Add `existingNode.show()` after updating properties (CRITICAL FIX)
- `src/lib/canvas/core/EventHandlers.ts` - No changes needed
- `src/lib/types/shapes.ts` - No changes needed

## Related Code

- Text editing: `ShapeRenderer.ts:547-622` - `enableTextEditing()` method
- Shape rendering: `ShapeRenderer.ts:130-224` - `render()` method
- Shape properties update: `ShapeRenderer.ts:230-285` - `updateKonvaNodeProperties()` method
