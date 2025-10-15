# Phase 3 Cleanup Tasks

**Created:** October 15, 2025  
**Status:** Ready to execute  
**Estimated Time:** 3 hours  
**Priority:** P0 - Block Phase 4 until complete

---

## 🎯 Cleanup Goals

- [x] Audit complete (see: `PHASE3-CODE-AUDIT.md`)
- [ ] Remove 2 zombie files (109 lines)
- [ ] Eliminate ~50 lines of duplicate code
- [ ] Remove 30+ console.log statements
- [ ] Fix 8 type safety issues
- [ ] Reduce canvas component from 447 to <200 lines
- [ ] Achieve 100% usage of abstractions we built

---

## Task List

### P0: Delete Zombie Files (10 minutes)

#### Task 1.1: Delete rectangles.ts
- [ ] Delete `/src/lib/stores/rectangles.ts`
- [ ] Verify no imports reference it (should be clean)
- [ ] Run build to confirm

**Why:** Entire file is obsolete MVP code. Replaced by `shapes.ts`.

**Files:** 1 file, 74 lines deleted

---

#### Task 1.2: Delete old types.ts
- [ ] Delete `/src/lib/types.ts`
- [ ] Verify no imports reference it (should be clean)
- [ ] Run build to confirm

**Why:** Old MVP Rectangle type. Replaced by `types/shapes.ts`.

**Files:** 1 file, 35 lines deleted

---

### P0: Remove Backward Compatibility Cruft (15 minutes)

#### Task 2.1: Clean up shapes.ts
**File:** `/src/lib/stores/shapes.ts`

- [ ] Delete lines 44-52 (duplicate `getAllShapes()` function)
- [ ] Import `getAllShapes` from `$lib/collaboration` instead
- [ ] Delete lines 145-148 (backward compatibility exports):
  ```typescript
  // DELETE THESE:
  export const addRectangle = shapeOperations.add;
  export const updateRectangle = shapeOperations.update;
  export const deleteRectangle = shapeOperations.delete;
  export const rectangles = shapes;
  ```

**Result:** 13 lines removed, imports from collaboration.ts instead

---

#### Task 2.2: Clean up stores/index.ts
**File:** `/src/lib/stores/index.ts`

- [ ] Delete lines 12-16 (backward compatibility exports):
  ```typescript
  // DELETE THESE:
  rectangles,
  addRectangle,
  updateRectangle,
  deleteRectangle
  ```

**Result:** 4 lines removed

---

#### Task 2.3: Clean up collaboration.ts
**File:** `/src/lib/collaboration.ts`

- [ ] Delete line 22:
  ```typescript
  export const rectanglesMap = shapesMap;  // DELETE
  ```
- [ ] Delete lines 130-132:
  ```typescript
  export function getAllRectangles() {    // DELETE
      return getAllShapes();              // DELETE
  }                                       // DELETE
  ```
- [ ] Fix line 89:
  ```typescript
  // CHANGE:
  console.log('Initial state loaded. Rectangles:', rectanglesMap.size);
  // TO:
  console.log('Initial state loaded. Shapes:', shapesMap.size);
  ```

**Result:** 4 lines removed, 1 line fixed

---

### P1: Use ShapeFactory (20 minutes)

#### Task 3.1: Import ShapeFactory in canvas component
**File:** `/src/routes/canvas/+page.svelte`

- [ ] Add import at top:
  ```typescript
  import { ShapeFactory } from '$lib/canvas/shapes/ShapeFactory';
  ```

---

#### Task 3.2: Replace shape creation logic
**File:** `/src/routes/canvas/+page.svelte`

- [ ] Replace entire `createShapeAtPosition` function (lines 42-114) with:
  ```typescript
  function createShapeAtPosition(x: number, y: number): Shape | null {
      return ShapeFactory.create($activeTool, {
          x,
          y,
          createdBy: data.user.id,
          zIndex: maxZIndex + 1
      });
  }
  ```

**Result:** 73 lines → 8 lines (save 65 lines)

---

#### Task 3.3: Test shape creation
- [ ] Test creating each shape type:
  - Rectangle
  - Circle
  - Ellipse
  - Line
  - Text
  - Polygon
  - Star
- [ ] Verify properties are correct
- [ ] Verify sync works across users

---

### P1: Remove Console Logs (15 minutes)

#### Task 4.1: Clean canvas/+page.svelte
**File:** `/src/routes/canvas/+page.svelte`

Remove these console.log statements:
- [ ] Line 118: `console.log('[Canvas Effect] Shapes changed:', ...)`
- [ ] Line 122: `console.log('[Canvas Effect] hasRenderer:', ...)`
- [ ] Line 125: `console.log('[Canvas Effect] Calling renderShapes...')`
- [ ] Line 137: `console.log('[Canvas Effect] Skipping render:', ...)`
- [ ] Line 242: `console.log('[Canvas] Click event fired', ...)`
- [ ] Line 253: `console.log('[Canvas] Clicked on stage')`
- [ ] Line 255: `console.log('[Canvas] Create mode is active...')`
- [ ] Line 264: `console.log('[Canvas] Adding shape:', ...)`
- [ ] Line 268: `console.log('[Canvas] Shape added...')`
- [ ] Line 275: `console.log('[Canvas] Not in create mode...')`
- [ ] Line 280: `console.log('[Canvas] Clicked on shape...')`
- [ ] Line 351: `console.log('Canvas initialized with managers')`

**Result:** 12 console.logs removed

---

#### Task 4.2: Clean shapes/ShapeRenderer.ts
**File:** `/src/lib/canvas/shapes/ShapeRenderer.ts`

Remove these console statements:
- [ ] Line 78: `console.error('[ShapeRenderer] No shapesLayer...')`
  - Replace with proper error handling
- [ ] Line 83: `console.log('[ShapeRenderer] Rendering', ...)`
- [ ] Line 105: `console.log('[ShapeRenderer] Creating Konva shape...')`
- [ ] Line 110: `console.error('[ShapeRenderer] Failed to create...')`
  - Replace with proper error handling
- [ ] Line 115: `console.log('[ShapeRenderer] Konva shape created...')`
- [ ] Line 121: `console.log('[ShapeRenderer] Added shape...')`

**Result:** 6 console statements removed (keep 2 as proper errors)

---

#### Task 4.3: Clean stores/shapes.ts
**File:** `/src/lib/stores/shapes.ts`

Remove these console statements:
- [ ] Line 33: `console.log('Shapes synced from Yjs:', ...)`
- [ ] Line 38: `console.log('Initial shapes loaded:', ...)`
- [ ] Line 70: `console.log('Shape added to Yjs:', ...)`
- [ ] Line 104: `console.log('Shape deleted from Yjs:', ...)`
- [ ] Line 118: `console.log('Multiple shapes deleted:', ...)`
- [ ] Line 132: `console.log('All shapes cleared')`

**Result:** 6 console.logs removed

---

#### Task 4.4: Clean other files
Search for remaining console.logs in:
- [ ] `collaboration.ts`
- [ ] `CursorManager.ts`
- [ ] Other manager files

**Result:** All development logging removed

---

### P1: Fix Type Safety (30 minutes)

#### Task 5.1: Fix empty object casts in canvas
**File:** `/src/routes/canvas/+page.svelte`

Current problem (3 occurrences):
```typescript
cursorManager?.broadcastCursor({} as any);
```

**Option A:** Make parameter optional in CursorManager:
```typescript
// CursorManager.ts
broadcastCursor(e?: Konva.KonvaEventObject<MouseEvent>): void {
    if (!this.awareness || !e) return;
    // ... rest of logic
}
```

**Option B:** Call without parameter:
```typescript
// CursorManager.ts - Add new method
broadcastCurrentPosition(): void {
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;
    // ... existing logic
}
```

**Decision:** Choose Option B for clarity

- [ ] Add `broadcastCurrentPosition()` method to CursorManager
- [ ] Replace 3 `broadcastCursor({} as any)` calls with `broadcastCurrentPosition()`
- [ ] Test cursor updates still work

---

#### Task 5.2: Fix type assertion in shapes.ts
**File:** `/src/lib/stores/shapes.ts`

Current (line 85):
```typescript
const updated = { ...existing, ...changes, modifiedAt: Date.now() } as Shape;
```

**Problem:** Type assertion bypasses safety check  
**Solution:** Trust TypeScript's inference (it's already correct):
```typescript
const updated: Shape = { 
    ...existing, 
    ...changes, 
    modifiedAt: Date.now() 
};
```

- [ ] Remove `as Shape` cast
- [ ] Add explicit type annotation instead
- [ ] Verify build passes

---

### P2: Extract Event Handlers (1 hour)

#### Task 6.1: Create EventHandlers module
- [ ] Create file: `/src/lib/canvas/core/EventHandlers.ts`
- [ ] Define class:
  ```typescript
  export class CanvasEventHandlers {
      constructor(
          private stage: Konva.Stage,
          private cursorManager: CursorManager,
          private selectionManager: SelectionManager,
          private isCreateMode: () => boolean,
          private onShapeCreate: (x: number, y: number) => void
      ) {}
      
      setupWheelHandler(viewportManager: ViewportManager): void
      setupMouseMoveHandler(): void
      setupClickHandler(): void
      setupDragHandlers(): void
      setupKeyboardHandlers(): void
      
      destroy(): void
  }
  ```

---

#### Task 6.2: Move event handlers from canvas
**From:** `/src/routes/canvas/+page.svelte` lines 213-349  
**To:** `/src/lib/canvas/core/EventHandlers.ts`

Move these handlers:
- [ ] Wheel handler (lines 213-219)
- [ ] Mouse move handler (lines 224-233)
- [ ] Mouse enter handler (lines 235-238)
- [ ] Click handler (lines 241-282)
- [ ] Drag handlers (lines 285-324)
- [ ] Keyboard handler (lines 336-348)

**Result:** 136 lines moved to separate module

---

#### Task 6.3: Update canvas to use EventHandlers
**File:** `/src/routes/canvas/+page.svelte`

```typescript
let eventHandlers: CanvasEventHandlers;

onMount(() => {
    // ... existing initialization ...
    
    // Set up event handlers
    eventHandlers = new CanvasEventHandlers(
        stage,
        cursorManager,
        selectionManager,
        () => isCreateMode,
        (x, y) => {
            const newShape = createShapeAtPosition(x, y);
            if (newShape) {
                shapeOperations.add(newShape);
                selectionManager.select(newShape.id);
            }
        }
    );
    
    eventHandlers.setupWheelHandler(viewportManager);
    eventHandlers.setupMouseMoveHandler();
    eventHandlers.setupClickHandler();
    eventHandlers.setupDragHandlers();
    eventHandlers.setupKeyboardHandlers();
    
    return () => {
        // ... existing cleanup ...
        eventHandlers?.destroy();
    };
});
```

**Result:** Canvas component now <200 lines

---

### P2: Final Verification (15 minutes)

#### Task 7.1: Build & Lint
- [ ] Run `bun run build` - should succeed
- [ ] Run linter - should pass with 0 errors
- [ ] Check bundle size - should be smaller

---

#### Task 7.2: Functional Testing
Test all features work:
- [ ] Create all 8 shape types
- [ ] Drag shapes
- [ ] Resize shapes
- [ ] Rotate shapes
- [ ] Delete shapes
- [ ] Pan canvas
- [ ] Zoom canvas
- [ ] See remote cursors
- [ ] See online users
- [ ] Test with 2+ browser windows
- [ ] Follow mode works

---

#### Task 7.3: Code Metrics
Verify targets met:
- [ ] Canvas component: <200 lines (currently 447)
- [ ] Zero zombie files
- [ ] Zero duplicate code
- [ ] Zero `as any` casts
- [ ] Zero console.log statements
- [ ] ShapeFactory used for all shape creation

---

## 📊 Expected Results

### Before Cleanup
```
canvas/+page.svelte:        447 lines
stores/rectangles.ts:        74 lines (ZOMBIE)
types.ts:                    35 lines (ZOMBIE)
Duplicate code:             ~50 lines
Console.logs:               30+ statements
Type safety issues:          8 casts
ShapeFactory usage:          0%
```

### After Cleanup
```
canvas/+page.svelte:        ~180 lines (-267)
stores/rectangles.ts:       DELETED (-74)
types.ts:                   DELETED (-35)
Duplicate code:             0 lines (-50)
Console.logs:               0 (-30+)
Type safety issues:         0 (-8)
ShapeFactory usage:         100% ✅
```

**Total reduction:** ~400 lines of cleaner code

---

## 🚀 Execution Order

**Session 1 (30 min):**
1. Tasks 1.1-1.2: Delete zombie files
2. Tasks 2.1-2.3: Remove backward compatibility
3. Run build to verify

**Session 2 (30 min):**
4. Tasks 3.1-3.3: Implement ShapeFactory usage
5. Test shape creation
6. Run build to verify

**Session 3 (30 min):**
7. Tasks 4.1-4.4: Remove all console.logs
8. Run build to verify

**Session 4 (30 min):**
9. Tasks 5.1-5.2: Fix type safety issues
10. Run build to verify

**Session 5 (1 hour):**
11. Tasks 6.1-6.3: Extract event handlers
12. Test thoroughly

**Session 6 (15 min):**
13. Task 7: Final verification
14. Update refactoring-progress.md
15. Commit & celebrate! 🎉

---

## ✅ Completion Checklist

Phase 3 is complete when:
- [ ] All zombie files deleted
- [ ] All duplicate code removed
- [ ] All console.logs removed
- [ ] All type safety issues fixed
- [ ] Canvas component <200 lines
- [ ] ShapeFactory used everywhere
- [ ] Event handlers extracted
- [ ] All tests pass
- [ ] Build succeeds
- [ ] All features work
- [ ] Documentation updated

---

**Status:** Ready to execute  
**Next Step:** Start with Session 1 (delete zombie files)

