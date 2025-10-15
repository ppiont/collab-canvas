# Migration Guide: MVP → Refactored Architecture

## Overview

This guide explains how to gradually migrate existing MVP code to use the new refactored architecture while maintaining full backward compatibility.

---

## 🎯 Migration Strategy

### Phase 1: Coexistence (Current)
- ✅ New code alongside old code
- ✅ Backward compatibility maintained
- ✅ Both patterns work simultaneously

### Phase 2: Gradual Migration (Weeks 2-3)
- 🔄 Update components one-by-one
- 🔄 Replace inline styles with shadcn
- 🔄 Use new stores where convenient

### Phase 3: Cleanup (Week 4-5)
- 🔄 Remove backward compatibility layer
- 🔄 Delete old types and stores
- 🔄 Update all imports

---

## 📦 Import Changes

### Types

**OLD:**
```typescript
import type { Rectangle } from '$lib/types';
```

**NEW:**
```typescript
// Specific shape type
import type { RectangleShape } from '$lib/types/shapes';

// Generic shape type (better for extensibility)
import type { Shape } from '$lib/types/shapes';

// Or use centralized export
import type { Shape, RectangleShape } from '$lib/types';
```

### Stores

**OLD:**
```typescript
import { 
  rectangles, 
  addRectangle, 
  updateRectangle, 
  deleteRectangle 
} from '$lib/stores/rectangles';
```

**NEW:**
```typescript
// Option 1: Use new shapes store
import { shapes, shapeOperations } from '$lib/stores/shapes';

// Option 2: Use centralized export
import { shapes, shapeOperations } from '$lib/stores';

// Usage
shapeOperations.add(newShape);
shapeOperations.update(id, changes);
shapeOperations.delete(id);
```

### Constants

**OLD:**
```typescript
// Hardcoded values
const gridSize = 50;
const gridColor = '#e2e8f0';
```

**NEW:**
```typescript
import { CANVAS } from '$lib/constants';

const gridSize = CANVAS.GRID_SIZE;
const gridColor = CANVAS.GRID_COLOR;
```

---

## 🔄 Pattern Changes

### 1. Store Usage

**OLD PATTERN:**
```typescript
import { rectangles } from '$lib/stores/rectangles';

$: rectanglesList = $rectangles;
```

**NEW PATTERN:**
```typescript
import { shapes } from '$lib/stores';

$: shapesList = $shapes;
// Or filter for rectangles only
$: rectanglesList = $shapes.filter(s => s.type === 'rectangle');
```

### 2. Shape Creation

**OLD PATTERN:**
```typescript
import { addRectangle } from '$lib/stores/rectangles';

const rect: Rectangle = {
  id: crypto.randomUUID(),
  type: 'rectangle',
  x: 100,
  y: 100,
  width: 150,
  height: 100,
  fill: '#3b82f6',
  stroke: '#1e40af',
  strokeWidth: 2,
  draggable: true,
  createdBy: userId,
  createdAt: Date.now()
};

addRectangle(rect);
```

**NEW PATTERN:**
```typescript
import { shapeOperations } from '$lib/stores';
import { ShapeFactory } from '$lib/canvas/shapes/ShapeFactory';

const rect = ShapeFactory.create('rectangle', {
  x: 100,
  y: 100,
  fill: '#3b82f6',
  stroke: '#1e40af'
}, userId);

shapeOperations.add(rect);
```

### 3. Shape Updates

**OLD PATTERN:**
```typescript
import { updateRectangle } from '$lib/stores/rectangles';

updateRectangle(id, { x: 200, y: 300 });
```

**NEW PATTERN:**
```typescript
import { shapeOperations } from '$lib/stores';

shapeOperations.update(id, { x: 200, y: 300 });
```

### 4. Selection Management

**NEW FEATURE:**
```typescript
import { selection, selectedShapes } from '$lib/stores';

// Select a shape
selection.select(shapeId);

// Multi-select
selection.addToSelection(shapeId);

// Get selected shapes
$: selected = $selectedShapes;

// Clear selection
selection.clear();
```

### 5. Viewport Management

**OLD PATTERN:**
```typescript
let stageX = 0;
let stageY = 0;
let scale = 1;

function handlePan(dx: number, dy: number) {
  stageX += dx;
  stageY += dy;
}
```

**NEW PATTERN:**
```typescript
import { viewport, viewportOperations } from '$lib/stores';

// Pan
viewportOperations.panBy(dx, dy);

// Zoom
viewportOperations.setZoom(2.0);

// Get current viewport
$: currentViewport = $viewport;
```

### 6. Tool Management

**NEW FEATURE:**
```typescript
import { activeTool, toolOperations } from '$lib/stores';

// Set tool
toolOperations.set('rectangle');

// Check active tool
$: isRectangleTool = $activeTool === 'rectangle';
```

### 7. Undo/Redo

**NEW FEATURE:**
```typescript
import { history, canUndo, canRedo } from '$lib/stores';

// Undo
function handleUndo() {
  if ($canUndo) history.undo();
}

// Redo
function handleRedo() {
  if ($canRedo) history.redo();
}
```

---

## 🎨 UI Component Migration

### Button Component

**OLD:**
```svelte
<button class="toolbar-btn" class:active={isCreateMode}>
  Create Rectangle
</button>

<style>
  .toolbar-btn {
    padding: 8px 16px;
    background: #667eea;
    color: white;
    border-radius: 6px;
  }
  .active {
    background: #5568d3;
  }
</style>
```

**NEW:**
```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import { Square } from 'lucide-svelte';
</script>

<Button 
  variant={isCreateMode ? 'default' : 'outline'} 
  size="sm"
  on:click={toggleCreateMode}
>
  <Square class="w-4 h-4 mr-2" />
  Create Rectangle
</Button>
```

### Dropdown Menu

**OLD:**
```svelte
<div class="dropdown">
  <button on:click={toggleDropdown}>Menu</button>
  {#if isOpen}
    <div class="menu">
      <!-- items -->
    </div>
  {/if}
</div>

<style>
  /* lots of custom CSS */
</style>
```

**NEW:**
```svelte
<script>
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button builders={[builder]}>Menu</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>Item 1</DropdownMenu.Item>
    <DropdownMenu.Item>Item 2</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

---

## 🔧 Utility Function Changes

### Color Utilities

**OLD:**
```typescript
function darkenColor(hex: string, factor: number) {
  // custom implementation
}
```

**NEW:**
```typescript
// Use shadcn's built-in color utilities or Tailwind classes
import { cn } from '$lib/utils';

<div class={cn("bg-primary", isDark && "bg-primary/80")} />
```

### Class Name Merging

**OLD:**
```typescript
const classes = `base-class ${isActive ? 'active' : ''} ${variant}`;
```

**NEW:**
```typescript
import { cn } from '$lib/utils';

const classes = cn(
  'base-class',
  isActive && 'active',
  variant
);
```

---

## 📝 Type Guard Usage

When working with the generic `Shape` type, use type guards:

```typescript
import type { Shape } from '$lib/types';
import { isRectangle, isCircle } from '$lib/types';

function handleShape(shape: Shape) {
  if (isRectangle(shape)) {
    // TypeScript knows shape is RectangleShape here
    console.log(shape.width, shape.height);
  } else if (isCircle(shape)) {
    // TypeScript knows shape is CircleShape here
    console.log(shape.radius);
  }
}
```

---

## 🎯 Recommended Migration Order

### Week 2: Canvas Modularization
1. ✅ New code uses new patterns
2. 🔄 Extract cursor logic to CursorManager
3. 🔄 Extract shape rendering to shape classes
4. 🔄 Old compatibility layer remains

### Week 3: Component Updates
1. 🔄 Migrate Toolbar to shadcn
2. 🔄 Migrate ConnectionStatus to shadcn
3. 🔄 Remove inline `<style>` blocks
4. 🔄 Use lucide-svelte icons

### Week 4: Store Updates
1. 🔄 Update canvas/+page.svelte to use new stores
2. 🔄 Replace direct rectanglesMap access with shapeOperations
3. 🔄 Add undo/redo keyboard shortcuts
4. 🔄 Old compatibility layer remains

### Week 5: Cleanup
1. 🔄 Remove rectangles.ts (use shapes.ts)
2. 🔄 Remove old Rectangle type
3. 🔄 Update all imports
4. 🔄 Delete compatibility layer

---

## ⚠️ Breaking Changes (Future)

### Will Be Removed in Week 5

**Deprecated Imports:**
```typescript
// These will be removed
import { rectangles } from '$lib/stores/rectangles';
import { rectanglesMap } from '$lib/collaboration';
import type { Rectangle } from '$lib/types';
```

**Use Instead:**
```typescript
import { shapes } from '$lib/stores/shapes';
import { shapesMap } from '$lib/collaboration';
import type { RectangleShape, Shape } from '$lib/types/shapes';
```

---

## 🚀 Quick Start Checklist

For new features, always use the new patterns:

- [ ] Import from `$lib/types` or `$lib/types/shapes`
- [ ] Use `shapeOperations` instead of individual functions
- [ ] Use `Shape` union type instead of specific shape types
- [ ] Use shadcn components instead of custom styled elements
- [ ] Import constants from `$lib/constants`
- [ ] Use type guards when narrowing Shape unions
- [ ] Use lucide-svelte for icons

---

## 📚 Additional Resources

- **Type Reference:** `src/lib/types/`
- **Store Reference:** `src/lib/stores/`
- **Constants Reference:** `src/lib/constants.ts`
- **shadcn Components:** `src/lib/components/ui/`
- **Migration Progress:** `project-management/refactoring-progress.md`

---

## 💡 Pro Tips

1. **Use TypeScript's Auto-Imports**: Let your IDE suggest imports from the new locations

2. **Leverage Type Guards**: They make working with union types smooth

3. **Batch Updates**: Update related functionality together (e.g., all selection code at once)

4. **Test Incrementally**: Build and test after each migration step

5. **Keep Compatibility**: Don't remove old code until Week 5

---

**Last Updated:** Week 1 Complete
**Status:** Backward Compatibility Phase
**Next Review:** Week 3 (Component Migration Complete)

