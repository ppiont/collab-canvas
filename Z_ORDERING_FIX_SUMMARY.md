# Z-Ordering Fix - Summary

## Problem
Z-ordering (stacking order) of shapes was not maintained correctly across collaborators and between refreshes/zooms. Shapes would randomly shift their stacking positions, especially when zooming in and out.

## Root Cause
The bug was in `/src/lib/canvas/shapes/ShapeRenderer.ts` at lines 257-261.

The optimization that checks whether to reorder shapes was flawed:

```typescript
// ❌ BEFORE (buggy)
const currentZIndexOrder = shapes.map(s => s.id).join(',');
if (currentZIndexOrder !== this.lastZIndexOrder) {
    this.reorderShapesByZIndex(shapes);
    this.lastZIndexOrder = currentZIndexOrder;
}
```

This only checked if the **order of shape IDs** changed, not if the **zIndex values** themselves changed.

### Example of Failure:
```
Initial: [A (z=1), B (z=2)] → order string: "A,B"
User brings B forward: [A (z=1), B (z=3)] → order string: "A,B" (same!)
Result: Reordering is skipped even though z-indices changed!
```

## The Fixes

### Fix 1: Include zIndex Values in Comparison

Changed the order comparison to include zIndex values:

```typescript
// ✅ AFTER (fixed)
const currentZIndexOrder = shapes.map(s => `${s.id}:${s.zIndex}`).join(',');
if (currentZIndexOrder !== this.lastZIndexOrder) {
    this.reorderShapesByZIndex(shapes);
    this.lastZIndexOrder = currentZIndexOrder;
}
```

Now the check detects:
- ✅ When shapes are added/removed (ID list changes)
- ✅ When shape z-indices change (zIndex values change)
- ✅ When the sorted order changes

### Fix 2: Only Reorder Shapes That Exist in Layer (Zoom Bug)

**Additional Issue Discovered:** Viewport culling destroys shapes outside the viewport during zoom. The reorder logic was trying to reorder ALL shapes (including destroyed ones), causing re-created shapes to be added at the end of the layer on zoom out.

**Fix:**
```typescript
// ✅ Only reorder shapes currently in the layer
const renderedShapeIds = new Set(this.shapesLayer.find('.shape').map(n => n.id()));
const renderedShapes = shapes.filter(s => renderedShapeIds.has(s.id));
const currentZIndexOrder = renderedShapes.map(s => `${s.id}:${s.zIndex}`).join(',');
if (currentZIndexOrder !== this.lastZIndexOrder) {
    this.reorderShapesByZIndex(renderedShapes);
    this.lastZIndexOrder = currentZIndexOrder;
}
```

This ensures culled shapes don't break z-order logic during zoom operations.

## Files Changed

1. **`/src/lib/canvas/shapes/ShapeRenderer.ts`** (lines 260-266)
   - Updated the zIndex order comparison to include zIndex values (Fix 1)
   - Only reorder shapes that exist in the layer (Fix 2)
   - Added comments explaining both fixes

## Impact

- ✅ **Collaboration:** Z-index changes from any user now propagate correctly to all collaborators
- ✅ **Persistence:** Z-order survives page refreshes and reloads
- ✅ **Viewport:** Z-order remains consistent during zoom and pan operations
- ✅ **Performance:** Maintains the optimization (avoids unnecessary reordering)
- ✅ **Correctness:** Fixes the fundamental bug while keeping performance benefits

## How Z-Ordering Works (For Reference)

### Data Flow:
```
1. User changes z-index (keyboard shortcuts [ or ])
   ↓
2. EventHandlers updates shape with new zIndex value in Yjs
   ↓
3. Yjs broadcasts change to all connected clients
   ↓
4. shapes.ts observe() handler fires
   ↓
5. Sorts all shapes by zIndex
   ↓
6. Updates $shapes store
   ↓
7. ShapeRenderer $effect triggers
   ↓
8. renderShapes() called with sorted shapes
   ↓
9. Checks if zIndex order changed (NOW INCLUDES VALUES!)
   ↓
10. If changed: reorderShapesByZIndex() reorders Konva layer children
   ↓
11. Visual stacking now matches zIndex values
```

### Key Components:

1. **Yjs (shapesMap):** Source of truth for shape data including zIndex
2. **shapes.ts store:** Pre-sorts shapes by zIndex before setting store
3. **ShapeRenderer:** Ensures Konva layer children order matches sorted shape array
4. **Konva Layer:** Visual stacking determined by children array order

### Z-Index Assignment:

- **New shapes:** Get `maxZIndex + 1`
- **Bring forward:** Set to `maxZ + 1`
- **Send backward:** Set to `minZ - 1`
- **Paste:** Copies get `maxZIndex + 1`

## Testing

See `Z_ORDERING_TEST_SCENARIOS.md` for comprehensive test scenarios including:
- Single user z-index changes
- Multi-user concurrent changes
- Refresh persistence
- Zoom/pan consistency
- Edge cases and performance

## Code Review Checklist

- [x] Bug identified and root cause analyzed
- [x] Fix implemented with minimal code change
- [x] No linter errors introduced
- [x] Comments added to explain the fix
- [x] Performance optimization maintained
- [x] No breaking changes to API or behavior
- [x] Test scenarios documented

## Deployment Notes

This is a **bug fix** that requires no migration or breaking changes. Simply deploy and test using the scenarios in `Z_ORDERING_TEST_SCENARIOS.md`.

**Priority:** High - This affects core collaboration functionality

**Risk:** Low - Minimal code change, fixes existing broken behavior

**Rollback:** Simple - revert the single line change if needed

