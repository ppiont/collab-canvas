# Text Shape Stroke Rendering - Refactoring Summary

## Problem Statement

The codebase had text stroke handling scattered across **three different methods**, making it fragile and hard to maintain:

1. **`createKonvaShape()`** - Set stroke during initial creation
2. **`updateKonvaNodeProperties()`** - Explicitly disabled stroke during updates
3. **`applySelectionStyling()`** - Conditionally disabled stroke based on selection state

Each location had to know about and handle the text stroke exception independently, leading to:

- ❌ Code duplication
- ❌ Maintenance burden (change logic in one place, forget the others)
- ❌ Hard to understand why stroke handling is fragmented
- ❌ Risk of missing edge cases

## Solution: Centralization Pattern

### New Method: `applyShapeTypeStyles()`

Created a **single, dedicated method** that handles ALL shape-type-specific rendering rules:

```typescript
/**
 * Apply shape-type-specific rendering rules
 * CRITICAL: Centralizes all shape-type exceptions in one place
 * - Text shapes: Never render with stroke (Konva text stroke rendering is problematic)
 * - Other shapes: Normal stroke handling
 */
private applyShapeTypeStyles(konvaShape: Konva.Shape, shape: Shape): void {
    if (shape.type === 'text') {
        // Text shapes must never have stroke - Konva's text stroke rendering
        // creates weird artifacts on curved letters (e.g., "e", "o", "s")
        const textNode = konvaShape as Konva.Text;
        textNode.stroke(undefined);
        textNode.strokeWidth(0);
    }
    // Other shape types follow normal stroke rules from shape data
}
```

### Call Sites

Now all three methods simply **call this centralized method**:

#### 1. After Shape Creation

```typescript
private createKonvaShape(shape: Shape, isDraggedByOther: boolean): Konva.Shape | null {
    // ... switch statement creates shape ...

    if (konvaShape) {
        this.applyShapeTypeStyles(konvaShape, shape);  // ← Call here
    }
    return konvaShape;
}
```

#### 2. After Shape Update

```typescript
private updateKonvaNodeProperties(node: Konva.Node, shape: Shape): void {
    // ... update common properties ...
    // ... switch statement updates shape-specific properties ...

    this.applyShapeTypeStyles(konvaShape, shape);  // ← Call here
}
```

#### 3. After Selection Styling

```typescript
private applySelectionStyling(node: Konva.Node, isSelected: boolean, shapeData: Shape): void {
    const konvaShape = node as Konva.Shape;

    if (isSelected) {
        konvaShape.stroke('#667eea');
        konvaShape.strokeWidth(2);
    } else {
        konvaShape.stroke(shapeData.stroke);
        konvaShape.strokeWidth(shapeData.strokeWidth);
    }

    this.applyShapeTypeStyles(konvaShape, shapeData);  // ← Call at the END
}
```

## Benefits

### ✅ Single Source of Truth

- Change text rendering logic in ONE place
- All methods automatically get the fix
- No risk of inconsistency

### ✅ Clear Intent

- Code is self-documenting
- Anyone reading the code sees `applyShapeTypeStyles()` and knows where shape-type rules live
- Well-commented explanation of why text can't have stroke

### ✅ Maintainability

- Easy to add new shape types with special rendering rules in the future
- No more hunting through multiple methods for stroke handling
- Reduced cognitive load

### ✅ Testability

- Could write tests specifically for `applyShapeTypeStyles()`
- All shape-type logic isolated and testable independently

### ✅ Clean Architecture

- Follows **Single Responsibility Principle**: one method handles shape-type rules
- Follows **DRY (Don't Repeat Yourself)**: no duplication
- Follows **Separation of Concerns**: shape creation, updating, and styling don't need to know about text stroke rules

## Code Changes Summary

| Method                        | Before                                                        | After                                                 |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| `createKonvaShape()`          | Returns early with stroke set inline (3 lines)                | Assigns to var, calls `applyShapeTypeStyles()` at end |
| `updateKonvaNodeProperties()` | Has text case with explicit stroke disable (2 lines)          | Calls `applyShapeTypeStyles()` at end                 |
| `applySelectionStyling()`     | Has 2 `if (shapeData.type === 'text')` conditionals (8 lines) | Simple logic, calls `applyShapeTypeStyles()` at end   |
| **New**                       | N/A                                                           | `applyShapeTypeStyles()` method (10 lines)            |

**Net Result**: More lines of code (+10 for method), but distributed logic → centralized logic. Cleaner overall.

## Related Files

- `src/lib/canvas/shapes/ShapeRenderer.ts` - Where refactoring applied

## Future Extensions

This pattern makes it easy to add more shape-type rules:

```typescript
private applyShapeTypeStyles(konvaShape: Konva.Shape, shape: Shape): void {
    switch (shape.type) {
        case 'text':
            // Text: no stroke
            textNode.stroke(undefined);
            textNode.strokeWidth(0);
            break;

        case 'line':
            // Lines: no fill
            const line = konvaShape as Konva.Line;
            line.fill(undefined);
            break;

        // Add more shape-type rules here as needed
    }
}
```

## Lesson Learned

When you find yourself implementing the same logic in multiple places:

1. **Extract to a method** with a clear, specific name
2. **Document why** the rule exists (e.g., "Konva text stroke is buggy")
3. **Call consistently** from all call sites
4. **Make it easy to extend** for future shape types

This is **much cleaner** than scattered conditionals!
