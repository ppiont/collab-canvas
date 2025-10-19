# Z-Ordering Test Scenarios

## Test the Fix

After deploying the fix in `ShapeRenderer.ts`, test these scenarios to verify Z-ordering works correctly:

## Scenario 1: Single User Z-Index Changes

**Setup:**
1. Create 3 shapes (A, B, C) in order
2. Initial z-index: A=0, B=1, C=2
3. Visual stacking: A (bottom) → B → C (top)

**Actions:**
1. Select shape A
2. Press `]` to bring A forward
3. Expected: A moves above B but below C (zIndex: A=2, B=1, C=3)
4. Press `]` again
5. Expected: A moves to top (zIndex: A=4, B=1, C=3)

**Validation:**
- ✅ Visual stacking matches zIndex values
- ✅ No flickering or jumping
- ✅ Changes persist after zoom/pan

## Scenario 2: Multi-User Concurrent Z-Index Changes

**Setup:**
1. Open two browser windows (User A and User B)
2. Create 3 shapes visible to both users

**Actions:**
1. User A: Select shape 1, press `]` (bring forward)
2. User B: Simultaneously select shape 2, press `]`
3. Wait for sync (should be < 100ms)

**Validation:**
- ✅ Both users see the same final stacking order
- ✅ No shapes "jump" to wrong positions
- ✅ Z-index values in both clients match
- ✅ Stacking order is consistent and deterministic

## Scenario 3: Refresh While Shapes Have Modified Z-Indices

**Setup:**
1. Create 5 shapes
2. Move several shapes forward/backward multiple times
3. Create a complex stacking order (not sequential)

**Actions:**
1. Note the visual stacking order
2. Refresh the page (F5 or Cmd+R)
3. Wait for Yjs sync to complete

**Validation:**
- ✅ Stacking order after refresh matches before refresh
- ✅ No shapes switch positions
- ✅ Z-index values persist correctly

## Scenario 4: Zoom and Pan After Z-Index Changes

**Setup:**
1. Create 3 overlapping shapes
2. Modify z-indices using `[` and `]` keys
3. Create a specific stacking order

**Actions:**
1. Zoom in (Cmd/Ctrl + wheel up)
2. Pan around (spacebar + drag)
3. Zoom out
4. Return to original viewport

**Validation:**
- ✅ Stacking order remains consistent during zoom
- ✅ Stacking order remains consistent during pan
- ✅ No reordering or flickering occurs
- ✅ Final stacking matches initial stacking

## Scenario 5: Create New Shape (Should Appear on Top)

**Setup:**
1. Create several shapes
2. Modify some z-indices (not all sequential)

**Actions:**
1. Note the current top shape
2. Create a new shape
3. New shape should receive zIndex = maxZIndex + 1

**Validation:**
- ✅ New shape appears on top of all others
- ✅ Existing shape order is not affected
- ✅ New shape zIndex is correctly calculated

## Scenario 6: Copy/Paste Shapes

**Setup:**
1. Create 3 shapes with modified z-indices
2. Select shape in the middle of the stack

**Actions:**
1. Copy the shape (Cmd/Ctrl+C)
2. Paste it (Cmd/Ctrl+V)
3. Pasted shape should get zIndex = maxZIndex + 1

**Validation:**
- ✅ Pasted shape appears on top
- ✅ Original shape remains at its z-index
- ✅ No other shapes are affected

## Scenario 7: Undo/Redo Z-Index Changes

**Setup:**
1. Create 3 shapes
2. Move shape A to front (`]` key)
3. Move shape B to back (`[` key)

**Actions:**
1. Undo (Cmd/Ctrl+Z) - should undo B to back
2. Undo again - should undo A to front
3. Redo (Cmd/Ctrl+Shift+Z) - should redo A to front
4. Redo again - should redo B to back

**Validation:**
- ✅ Each undo/redo correctly restores previous z-index
- ✅ Visual stacking matches the undo/redo state
- ✅ No orphaned shapes or broken stacking

## Scenario 8: Rapid Z-Index Changes

**Setup:**
1. Create 5 shapes stacked together

**Actions:**
1. Select middle shape
2. Rapidly press `]` key 10 times (bring forward repeatedly)
3. Rapidly press `[` key 10 times (send backward repeatedly)

**Validation:**
- ✅ Shape ends up in expected position
- ✅ No visual glitches or flickering
- ✅ Z-index updates sync correctly
- ✅ Performance remains smooth

## Edge Case: Very Large Z-Index Values

**Setup:**
1. Create a shape
2. Use console to manually set zIndex to 1000000
3. Create more shapes normally

**Actions:**
1. Verify the shape with z=1000000 is on top
2. Create new shape (should get z=1000001)
3. Bring another shape forward repeatedly

**Validation:**
- ✅ System handles large z-index values
- ✅ Math.max calculations work correctly
- ✅ No integer overflow issues
- ✅ New shapes get correct z-index

## Performance Test: Many Shapes

**Setup:**
1. Create 100+ shapes with various z-indices
2. Modify z-indices of multiple shapes

**Actions:**
1. Note initial render time
2. Change z-index of one shape
3. Measure re-render time

**Validation:**
- ✅ Re-render is fast (< 50ms)
- ✅ Optimization prevents unnecessary reordering
- ✅ FPS remains at 60 during changes
- ✅ No lag or stuttering

## How to Debug Z-Ordering Issues

If you encounter z-ordering problems:

1. **Check Yjs State:**
   ```javascript
   // In browser console
   const shapes = Array.from(shapesMap.values());
   shapes.forEach(s => console.log(`${s.id}: zIndex=${s.zIndex}`));
   ```

2. **Check Konva Layer Order:**
   ```javascript
   // In browser console
   const layer = stage.findOne('.shapes');
   layer.children.forEach((c, i) => console.log(`Position ${i}: ${c.id()}`));
   ```

3. **Check ShapeRenderer State:**
   - Set breakpoint in `reorderShapesByZIndex`
   - Inspect `sortedShapes` array
   - Verify zIndex values are correct

4. **Enable Debug Overlay:**
   - Press `~` (tilde) key to open debug overlay
   - Check shape count and culling stats
   - Verify shapes array is sorted correctly

