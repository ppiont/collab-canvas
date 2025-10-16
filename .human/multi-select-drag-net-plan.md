# Multi-Select & Drag-Net Selection Implementation Plan

**Date:** October 16, 2025  
**Status:** 📋 PLANNED  
**Features:** Multi-select with keyboard modifiers + Drag-net (marquee) selection

---

## Current State Analysis

### ✅ What Already Exists

**SelectionManager (`src/lib/canvas/core/SelectionManager.ts`):**
- ✅ `selectMultiple(shapeIds: string[])` - Select multiple shapes at once
- ✅ `addToSelection(shapeId: string)` - Add shape to current selection
- ✅ `removeFromSelection(shapeId: string)` - Remove shape from selection
- ✅ `toggleSelection(shapeId: string)` - Toggle shape in/out of selection
- ✅ `isSelected(shapeId: string)` - Check if shape is selected
- ✅ Transformer already supports multiple shapes simultaneously
- ✅ Copy/paste works with multiple shapes

### ❌ What's Missing

**User Interaction:**
- ❌ Shift+Click to add/remove from selection
- ❌ Cmd/Ctrl+Click to toggle selection
- ❌ Click modifier key detection in EventHandlers
- ❌ Visual feedback for multi-selection

**Drag-Net Selection:**
- ❌ Selection rectangle drawing
- ❌ Rectangle bounds calculation
- ❌ Shape intersection detection
- ❌ Shift+Drag for additive selection
- ❌ Visual selection box rendering

---

## Feature 1: Multi-Select with Keyboard Modifiers

### Design Specs

**Shift+Click Behavior:**
- First click: Select shape (same as normal click)
- Second Shift+Click: Add to selection (cumulative)
- Third Shift+Click on selected: Remove from selection
- Shift+Click on empty: Keep current selection

**Cmd/Ctrl+Click Behavior:**
- Cmd/Ctrl+Click on unselected: Add to selection
- Cmd/Ctrl+Click on selected: Remove from selection
- Pure toggle behavior

**Visual Feedback:**
- Selected shapes show transformer
- Multiple shapes: Single bounding box with all resize handles
- Selection count indicator (optional enhancement)

### Implementation Steps

#### Step 1: Update EventHandlers.ts

**File:** `src/lib/canvas/core/EventHandlers.ts`

**Changes:**
```typescript
setupClickHandler(): void {
    this.stage.on('click', (e) => {
        this.cursorManager?.stopFollowing();

        // Get keyboard modifiers
        const isShift = e.evt.shiftKey;
        const isCmd = e.evt.metaKey || e.evt.ctrlKey;

        // If clicked on empty canvas
        if (e.target === this.stage) {
            if (this.isCreateMode()) {
                // Create shape at click position
                const pos = this.stage.getPointerPosition();
                if (pos) {
                    const transform = this.stage.getAbsoluteTransform().copy().invert();
                    const canvasPos = transform.point(pos);
                    this.onShapeCreate(canvasPos.x, canvasPos.y);
                }
            } else {
                // Only deselect if no modifiers held
                if (!isShift && !isCmd) {
                    this.selectionManager.deselect();
                }
            }
        } else if (e.target.hasName('shape')) {
            // Clicked on a shape
            const shapeId = e.target.id();
            
            if (isCmd) {
                // Cmd/Ctrl+Click: Toggle selection
                this.selectionManager.toggleSelection(shapeId);
            } else if (isShift) {
                // Shift+Click: Add to or remove from selection
                if (this.selectionManager.isSelected(shapeId)) {
                    this.selectionManager.removeFromSelection(shapeId);
                } else {
                    this.selectionManager.addToSelection(shapeId);
                }
            } else {
                // Normal click: Single select
                this.selectionManager.select(shapeId);
            }
        }
    });
}
```

**Key Changes:**
1. Detect `e.evt.shiftKey`, `e.evt.metaKey`, `e.evt.ctrlKey`
2. Handle shape clicks differently based on modifiers
3. Preserve selection when clicking empty canvas with modifiers
4. Route to appropriate SelectionManager methods

#### Step 2: Update ShapeRenderer.ts

**File:** `src/lib/canvas/shapes/ShapeRenderer.ts`

**Ensure shape click events pass through:**
```typescript
// In shape creation, make sure 'shape' name is set
konvaShape.name('shape');
konvaShape.id(shape.id);

// Ensure click events are enabled
konvaShape.listening(true);
```

#### Step 3: Testing

**Manual Test Cases:**
1. Click shape A → Shape A selected
2. Shift+Click shape B → Both A and B selected
3. Shift+Click shape A again → Only B selected
4. Cmd+Click shape C → B and C selected
5. Cmd+Click shape C again → Only B selected
6. Click empty space → All deselected
7. Shift+Click empty space → Selection preserved

---

## Feature 2: Drag-Net (Marquee) Selection

### Design Specs

**Visual Design:**
- Semi-transparent blue rectangle: `rgba(102, 126, 234, 0.2)`
- Blue border: `#667eea`, 2px width
- Dashed border style
- Appears on mouse down + drag

**Selection Behavior:**
- **Default (no modifiers):** Replace current selection with shapes in net
- **Shift+Drag:** Add shapes in net to current selection
- **Cmd+Drag:** Toggle shapes in net (add unselected, remove selected)

**Interaction Details:**
- Only activates in Select mode (not create mode)
- Only activates when clicking empty canvas (not on shapes)
- Shows preview rectangle while dragging
- Finalizes selection on mouse up
- Uses **intersection** detection (any part of shape in box = selected)
- Minimum drag distance: 5px (prevents accidental activation)

### Implementation Steps

#### Step 1: Create SelectionNet Component

**New File:** `src/lib/canvas/core/SelectionNet.ts`

```typescript
/**
 * SelectionNet - Drag-to-select rectangle
 * 
 * Handles:
 * - Visual selection rectangle
 * - Bounds calculation
 * - Shape intersection detection
 */

import Konva from 'konva';
import type { Shape } from '$lib/types/shapes';

export interface SelectionNetBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class SelectionNet {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private selectionRect: Konva.Rect | null = null;
    private startPos: { x: number; y: number } | null = null;
    private isActive = false;

    constructor(stage: Konva.Stage, layer: Konva.Layer) {
        this.stage = stage;
        this.layer = layer;
    }

    /**
     * Start selection rectangle
     */
    start(x: number, y: number): void {
        // Convert to canvas coordinates
        const transform = this.stage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point({ x, y });
        
        this.startPos = canvasPos;
        this.isActive = true;

        // Create visual rectangle
        this.selectionRect = new Konva.Rect({
            x: canvasPos.x,
            y: canvasPos.y,
            width: 0,
            height: 0,
            fill: 'rgba(102, 126, 234, 0.2)',
            stroke: '#667eea',
            strokeWidth: 2 / this.stage.scaleX(), // Adjust for zoom
            dash: [5, 5],
            listening: false // Don't interfere with other events
        });

        this.layer.add(this.selectionRect);
        this.layer.batchDraw();
    }

    /**
     * Update selection rectangle during drag
     */
    update(x: number, y: number): void {
        if (!this.isActive || !this.startPos || !this.selectionRect) return;

        // Convert to canvas coordinates
        const transform = this.stage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point({ x, y });

        // Calculate rectangle bounds
        const x1 = Math.min(this.startPos.x, canvasPos.x);
        const y1 = Math.min(this.startPos.y, canvasPos.y);
        const x2 = Math.max(this.startPos.x, canvasPos.x);
        const y2 = Math.max(this.startPos.y, canvasPos.y);

        // Update rectangle
        this.selectionRect.x(x1);
        this.selectionRect.y(y1);
        this.selectionRect.width(x2 - x1);
        this.selectionRect.height(y2 - y1);
        this.selectionRect.strokeWidth(2 / this.stage.scaleX()); // Adjust for zoom

        this.layer.batchDraw();
    }

    /**
     * Finish selection and return bounds
     */
    end(): SelectionNetBounds | null {
        if (!this.isActive || !this.selectionRect) return null;

        const bounds = {
            x: this.selectionRect.x(),
            y: this.selectionRect.y(),
            width: this.selectionRect.width(),
            height: this.selectionRect.height()
        };

        // Clean up
        this.selectionRect.destroy();
        this.selectionRect = null;
        this.startPos = null;
        this.isActive = false;
        this.layer.batchDraw();

        return bounds;
    }

    /**
     * Cancel selection without completing
     */
    cancel(): void {
        if (this.selectionRect) {
            this.selectionRect.destroy();
            this.selectionRect = null;
        }
        this.startPos = null;
        this.isActive = false;
        this.layer.batchDraw();
    }

    /**
     * Check if selection is active
     */
    isActiveSelection(): boolean {
        return this.isActive;
    }

    /**
     * Get shapes intersecting with bounds
     */
    getIntersectingShapes(
        bounds: SelectionNetBounds,
        shapes: Shape[]
    ): string[] {
        const intersecting: string[] = [];

        for (const shape of shapes) {
            if (this.shapeIntersectsBounds(shape, bounds)) {
                intersecting.push(shape.id);
            }
        }

        return intersecting;
    }

    /**
     * Check if shape intersects selection bounds
     */
    private shapeIntersectsBounds(
        shape: Shape,
        bounds: SelectionNetBounds
    ): boolean {
        // Get shape bounds based on type
        let shapeBounds: { x: number; y: number; width: number; height: number };

        switch (shape.type) {
            case 'rectangle':
            case 'image':
                shapeBounds = {
                    x: shape.x - (shape.width / 2),
                    y: shape.y - (shape.height / 2),
                    width: shape.width,
                    height: shape.height
                };
                break;

            case 'circle':
                shapeBounds = {
                    x: shape.x - shape.radius,
                    y: shape.y - shape.radius,
                    width: shape.radius * 2,
                    height: shape.radius * 2
                };
                break;

            case 'ellipse':
                shapeBounds = {
                    x: shape.x - shape.radiusX,
                    y: shape.y - shape.radiusY,
                    width: shape.radiusX * 2,
                    height: shape.radiusY * 2
                };
                break;

            case 'polygon':
            case 'star':
                // Use radius as bounding box approximation
                const radius = shape.type === 'star' ? shape.outerRadius : shape.radius;
                shapeBounds = {
                    x: shape.x - radius,
                    y: shape.y - radius,
                    width: radius * 2,
                    height: radius * 2
                };
                break;

            case 'line':
                // Calculate line bounds from points
                const points = shape.points;
                const xs = points.filter((_, i) => i % 2 === 0);
                const ys = points.filter((_, i) => i % 2 === 1);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                shapeBounds = {
                    x: shape.x + minX,
                    y: shape.y + minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
                break;

            case 'text':
                // Text bounds (approximate)
                shapeBounds = {
                    x: shape.x,
                    y: shape.y,
                    width: (shape.text?.length || 1) * (shape.fontSize || 16) * 0.6,
                    height: shape.fontSize || 16
                };
                break;

            default:
                return false;
        }

        // AABB intersection test
        return !(
            shapeBounds.x + shapeBounds.width < bounds.x ||
            shapeBounds.x > bounds.x + bounds.width ||
            shapeBounds.y + shapeBounds.height < bounds.y ||
            shapeBounds.y > bounds.y + bounds.height
        );
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.cancel();
    }
}
```

#### Step 2: Update EventHandlers.ts

**Add SelectionNet to EventHandlers:**

```typescript
import { SelectionNet } from './SelectionNet';

export class CanvasEventHandlers {
    // ... existing properties
    private selectionNet: SelectionNet;
    private isDrawingNet = false;
    private netStartPos: { x: number; y: number } | null = null;
    private onGetAllShapes: () => Shape[]; // New callback

    constructor(
        // ... existing params
        onGetAllShapes: () => Shape[]
    ) {
        // ... existing initialization
        this.onGetAllShapes = onGetAllShapes;
        this.selectionNet = new SelectionNet(stage, shapesLayer);
    }

    /**
     * Enhanced mouse down handler for drag-net
     */
    setupDragNetHandlers(): void {
        this.stage.on('mousedown', (e) => {
            // Only in select mode, clicking on empty canvas
            if (e.target === this.stage && !this.isCreateMode()) {
                const pos = this.stage.getPointerPosition();
                if (pos) {
                    this.netStartPos = pos;
                    // Don't start net yet - wait for drag movement
                }
            }
        });

        this.stage.on('mousemove', (e) => {
            // Check if we should start drag-net
            if (this.netStartPos && !this.isDrawingNet) {
                const pos = this.stage.getPointerPosition();
                if (pos) {
                    // Calculate drag distance
                    const dx = pos.x - this.netStartPos.x;
                    const dy = pos.y - this.netStartPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Start net if dragged more than 5px
                    if (distance > 5) {
                        this.isDrawingNet = true;
                        this.stage.draggable(false); // Disable stage drag
                        this.selectionNet.start(this.netStartPos.x, this.netStartPos.y);
                    }
                }
            }

            // Update net if drawing
            if (this.isDrawingNet) {
                const pos = this.stage.getPointerPosition();
                if (pos) {
                    this.selectionNet.update(pos.x, pos.y);
                }
            }
        });

        this.stage.on('mouseup', (e) => {
            if (this.isDrawingNet) {
                // Finalize selection
                const bounds = this.selectionNet.end();
                if (bounds && bounds.width > 0 && bounds.height > 0) {
                    const allShapes = this.onGetAllShapes();
                    const intersectingIds = this.selectionNet.getIntersectingShapes(
                        bounds,
                        allShapes
                    );

                    // Get keyboard modifiers
                    const isShift = e.evt.shiftKey;
                    const isCmd = e.evt.metaKey || e.evt.ctrlKey;

                    if (isShift) {
                        // Add to selection
                        const current = this.selectionManager.getSelectedIds();
                        const combined = [...new Set([...current, ...intersectingIds])];
                        this.selectionManager.selectMultiple(combined);
                    } else if (isCmd) {
                        // Toggle selection
                        const current = new Set(this.selectionManager.getSelectedIds());
                        intersectingIds.forEach(id => {
                            if (current.has(id)) {
                                current.delete(id);
                            } else {
                                current.add(id);
                            }
                        });
                        this.selectionManager.selectMultiple(Array.from(current));
                    } else {
                        // Replace selection
                        this.selectionManager.selectMultiple(intersectingIds);
                    }
                }

                this.isDrawingNet = false;
                this.stage.draggable(true); // Re-enable stage drag
            }
            
            this.netStartPos = null;
        });

        // Cancel on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDrawingNet) {
                this.selectionNet.cancel();
                this.isDrawingNet = false;
                this.netStartPos = null;
                this.stage.draggable(true);
            }
        });
    }
}
```

#### Step 3: Update Canvas Page

**File:** `src/routes/canvas/+page.svelte`

```typescript
// In onMount, after creating eventHandlers
eventHandlers.setupDragNetHandlers();

// Pass shapes getter to eventHandlers
const eventHandlers = new CanvasEventHandlers(
    stage,
    viewportManager,
    selectionManager,
    cursorManager,
    () => isCreateMode,
    createShape,
    () => $shapes // NEW: Pass shapes getter
);
```

---

## Testing Strategy

### Unit Tests (Future)

**SelectionNet.ts:**
- `shapeIntersectsBounds()` for all shape types
- Edge cases: zero-width/height bounds
- Rotation handling

**EventHandlers.ts:**
- Modifier key detection
- Selection mode vs create mode
- Stage drag interaction

### Manual Testing

**Multi-Select:**
1. ✅ Shift+Click adds to selection
2. ✅ Shift+Click removes from selection
3. ✅ Cmd+Click toggles selection
4. ✅ Normal click replaces selection
5. ✅ Transformer shows around all selected
6. ✅ Works with all shape types
7. ✅ Copy/paste with multi-select
8. ✅ Delete with multi-select

**Drag-Net:**
1. ✅ Drag on empty canvas shows blue rectangle
2. ✅ Selects all shapes within rectangle
3. ✅ Minimum 5px drag distance
4. ✅ Shift+Drag adds to selection
5. ✅ Cmd+Drag toggles selection
6. ✅ Works at different zoom levels
7. ✅ Escape cancels drag-net
8. ✅ Doesn't interfere with stage pan

### Edge Cases

- Zoomed in/out (different scales)
- Rotated shapes
- Overlapping shapes
- Very small shapes
- Shapes at canvas edges
- Rapid clicking
- Drag < 5px (should not activate net)

---

## Performance Considerations

### Optimization Strategies

1. **Debounce net updates:** Update at most 60fps during drag
2. **Spatial indexing:** Use quadtree for large canvases (>100 shapes)
3. **Lazy bounds calculation:** Only calculate when needed
4. **Caching:** Cache shape bounds until shape changes

### Implementation Notes

```typescript
// In SelectionNet.update()
private lastUpdateTime = 0;
private readonly UPDATE_THROTTLE = 16; // ~60fps

update(x: number, y: number): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.UPDATE_THROTTLE) {
        return; // Skip this update
    }
    this.lastUpdateTime = now;
    
    // ... rest of update logic
}
```

---

## UI/UX Enhancements (Optional)

### Selection Counter

**Display:** "3 shapes selected" badge when multiple selected

**Implementation:**
```svelte
<!-- In canvas/+page.svelte -->
{#if $selectedShapes.length > 1}
    <div class="selection-counter">
        {$selectedShapes.length} shapes selected
    </div>
{/if}

<style>
.selection-counter {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: #667eea;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    z-index: 1000;
}
</style>
```

### Keyboard Shortcuts Help

Add to existing shortcuts documentation:
- **Shift+Click:** Add to selection
- **Cmd/Ctrl+Click:** Toggle selection
- **Drag:** Marquee select
- **Shift+Drag:** Add to selection (marquee)

---

## Implementation Checklist

### Phase 1: Multi-Select (Estimated: 1-2 hours)
- [ ] Update `EventHandlers.setupClickHandler()` with modifier detection
- [ ] Test Shift+Click behavior
- [ ] Test Cmd+Click behavior
- [ ] Verify transformer works with multiple shapes
- [ ] Test copy/paste with multi-select
- [ ] Test delete with multi-select

### Phase 2: Drag-Net Selection (Estimated: 2-3 hours)
- [ ] Create `SelectionNet.ts` class
- [ ] Implement `start()`, `update()`, `end()` methods
- [ ] Implement shape intersection detection
- [ ] Add drag-net handlers to EventHandlers
- [ ] Test default (replace) selection mode
- [ ] Test Shift+Drag (additive) mode
- [ ] Test Cmd+Drag (toggle) mode
- [ ] Test minimum drag distance (5px)
- [ ] Test at different zoom levels
- [ ] Test Escape to cancel

### Phase 3: Polish (Estimated: 30 minutes)
- [ ] Add selection counter UI (optional)
- [ ] Update keyboard shortcuts documentation
- [ ] Test all edge cases
- [ ] Performance testing with many shapes

---

## Post-MVP Rubric Impact

### Before Multi-Select:
**Canvas Features:** ~15/25 points
- Basic selection ✅
- Single shape manipulation ✅

### After Multi-Select:
**Canvas Features:** ~20/25 points
- Multi-select ✅
- Marquee selection ✅
- Bulk operations (copy, delete) ✅

**Expected Score Increase:** +5 points

---

## Dependencies

### Required:
- ✅ SelectionManager (already exists)
- ✅ Konva Transformer (already supports multi-select)
- ✅ EventHandlers infrastructure (already exists)

### Optional:
- Quadtree for spatial indexing (if performance issues with >500 shapes)

---

## References

### Similar Implementations:
- **Figma:** Shift to add, Cmd to toggle, drag for marquee
- **Sketch:** Same as Figma
- **Adobe XD:** Same pattern
- **Canva:** Same pattern

### Konva Examples:
- [Selection demo](https://konvajs.org/docs/select_and_transform/Basic_demo.html)
- [Multi-shape transformer](https://konvajs.org/docs/select_and_transform/Transform_Multiple_Shapes.html)

---

## Success Criteria

✅ **Multi-Select:**
1. User can Shift+Click to add shapes to selection
2. User can Cmd/Ctrl+Click to toggle shapes
3. Transformer shows around all selected shapes
4. Copy/paste/delete work with multiple shapes

✅ **Drag-Net:**
1. User can drag selection rectangle on empty canvas
2. All shapes within rectangle are selected
3. Shift+Drag adds to existing selection
4. Cmd+Drag toggles shapes
5. Visual feedback is clear and responsive
6. Works correctly at all zoom levels

---

**Next Steps:** Implement Phase 1 (Multi-Select) first, test thoroughly, then proceed to Phase 2 (Drag-Net).

