# Z-Ordering Bug Analysis

## Problem Statement
Z-ordering (stacking order) of shapes is not maintained properly across collaborators and between refreshes/zooms. Shapes appear to randomly shift their stacking order, especially when zooming in and out.

## Root Cause

The bug is in `/src/lib/canvas/shapes/ShapeRenderer.ts` at lines 257-261:

```typescript
const currentZIndexOrder = shapes.map(s => s.id).join(',');
if (currentZIndexOrder !== this.lastZIndexOrder) {
    this.reorderShapesByZIndex(shapes);
    this.lastZIndexOrder = currentZIndexOrder;
}
```

### The Flaw

This optimization only checks if the **ORDER of shape IDs** has changed, NOT if the **zIndex values** themselves have changed.

### Example Failure Scenario

1. **Initial state:**
   - Shape A (zIndex: 1)
   - Shape B (zIndex: 2)
   - Order string: "A,B"

2. **User brings B to front:**
   - Shape A (zIndex: 1)
   - Shape B (zIndex: 3)
   - Order string: **still "A,B"**

3. **Result:** The reorder is SKIPPED because the ID order string is identical, even though the zIndex value changed!

## Why This Causes Random Shifting

1. **Concurrent Updates**: When multiple users modify z-indices, the Konva layer children array order becomes out of sync with Yjs zIndex values

2. **Refresh/Zoom**: On viewport changes or page refresh, shapes are re-rendered but the stale `lastZIndexOrder` check prevents proper re-ordering

3. **Stale State**: The optimization creates a cached state that doesn't reflect actual zIndex changes from Yjs

## System Flow

```
User A brings shape forward (zIndex: 2 → 3)
    ↓
Yjs updates zIndex property
    ↓
shapes.ts observe() fires → sorts shapes by zIndex → updates $shapes store
    ↓
ShapeRenderer.renderShapes() effect triggered
    ↓
❌ currentZIndexOrder check: "A,B,C" === "A,B,C" → SKIP reordering!
    ↓
Konva layer children order is now STALE (doesn't match zIndex values)
    ↓
User B sees wrong stacking order
```

## The Fixes

### Fix 1: Include zIndex in Comparison

Replace the flawed ID-based optimization with a zIndex-aware check:

```typescript
// Generate order string that includes both ID and zIndex
const currentZIndexOrder = shapes.map(s => `${s.id}:${s.zIndex}`).join(',');
if (currentZIndexOrder !== this.lastZIndexOrder) {
    this.reorderShapesByZIndex(shapes);
    this.lastZIndexOrder = currentZIndexOrder;
}
```

This ensures reordering happens whenever:
- A shape is added/removed (ID list changes)
- A shape's zIndex is modified (zIndex value changes)
- The sorted order of shapes changes

### Fix 2: Only Reorder Shapes That Exist in Layer (Zoom Bug)

**Additional Bug Found:** When viewport culling is active (zooming), shapes outside the viewport are destroyed. But the reorder logic was trying to reorder ALL shapes, including destroyed ones. When you zoom back out, culled shapes get re-created and added to the END of the layer, making them appear on top.

**The Flow:**
```
Zoom in → Shapes A,B,C culled (destroyed)
Reorder → Only visible shapes D,E,F reordered  
Zoom out → A,B,C re-created → Added to END → Appear on top!
```

**Fix:**
```typescript
// Only reorder shapes that actually exist in the layer
const renderedShapeIds = new Set(this.shapesLayer.find('.shape').map(n => n.id()));
const renderedShapes = shapes.filter(s => renderedShapeIds.has(s.id));
const currentZIndexOrder = renderedShapes.map(s => `${s.id}:${s.zIndex}`).join(',');
if (currentZIndexOrder !== this.lastZIndexOrder) {
    this.reorderShapesByZIndex(renderedShapes);
    this.lastZIndexOrder = currentZIndexOrder;
}
```

This ensures:
- Only shapes currently in the layer are considered for reordering
- Culled shapes don't break the z-order logic
- When shapes are re-created after zoom, they get added in correct z-order

## Impact

- ✅ Z-order changes from any user propagate correctly to all collaborators
- ✅ Z-order persists across refreshes and zooms
- ✅ No performance regression (still avoids unnecessary reordering)
- ✅ Maintains the optimization intent while fixing the correctness bug

