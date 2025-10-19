# Infinite Reactive Loop & NaN Opacity - Diagnosis & Fix

## The Problem

You were experiencing two critical errors:

1. **Konva Warning**: `NaN is not a valid value for "opacity" attribute`
2. **Svelte Error**: `effect_update_depth_exceeded - Maximum update depth exceeded`

These errors manifested as:
```
Uncaught (in promise) Svelte error: effect_update_depth_exceeded
Maximum update depth exceeded. This typically indicates that an effect 
reads and writes the same piece of state
```

## Root Causes

### 1. NaN Opacity Values

In `EffectsSection.svelte`, the opacity calculation could produce `NaN`:

```typescript
// BEFORE (PROBLEMATIC)
const opacity = (first.opacity || 1) * 100; // Could be NaN if first.opacity is malformed
```

This happened when:
- Shape data had `undefined` or non-numeric opacity values
- Calculations resulted in `NaN` due to invalid inputs
- No validation before passing to Konva renderer

### 2. Infinite Reactive Loop

The critical issue was how the slider was bound and updated:

```svelte
<!-- BEFORE (PROBLEMATIC) -->
<Slider
  bind:value={[effects.hasMixedOpacity ? 100 : effects.opacity]}
  onValueChange={(values: number[]) => updateOpacity(values[0])}
/>
```

**Why this caused an infinite loop:**

1. Slider is bound to a **computed (derived) value** `effects.opacity`
2. User changes slider → `onValueChange` fires → `updateOpacity()` called
3. `updateOpacity()` calls `onUpdate(items.map(...))` which updates store
4. Store update changes `items` prop
5. Component re-renders, `effects` is recomputed with new items
6. `effects.opacity` changes → Slider's bound value changes
7. This triggers `onValueChange` again (even though user didn't interact)
8. Loop repeats infinitely until Svelte's depth guard stops it

**The key problem**: Binding to a **derived value** instead of a local state variable meant changes to the underlying data would re-trigger the callback, creating a feedback loop.

## The Solution

### 1. Separate State from Derived Values

Created a local state variable for the slider:

```typescript
// Local slider value state (prevents bind issues with derived values)
let sliderValue = $state(100);
```

This decouples the slider's UI state from the computed properties, preventing the reactive feedback loop.

### 2. Add Strict Validation

Enhanced opacity calculations with multi-layer validation:

```typescript
const effects = $derived.by(() => {
  // ... setup ...
  
  const first = items[0];
  // Ensure opacity is always a valid number (0-1), default to 1
  const rawOpacity = first.opacity ?? 1;
  const safeOpacity = typeof rawOpacity === 'number' && !isNaN(rawOpacity) 
    ? rawOpacity 
    : 1;
  const opacity = Math.max(0, Math.min(1, safeOpacity)) * 100; // Clamp to valid range
  
  return {
    opacity: isNaN(opacity) ? 100 : opacity, // Fallback to 100 if still NaN
    // ... rest ...
  };
});
```

**Validation layers:**
- Nullish coalescing: `rawOpacity ?? 1`
- Type checking: `typeof rawOpacity === 'number'`
- NaN detection: `!isNaN(rawOpacity)`
- Clamping: `Math.max(0, Math.min(1, safeOpacity))`
- Fallback: `isNaN(opacity) ? 100 : opacity`

### 3. Sync Slider State with Effects

Use a reactive effect to sync the slider state when data changes, without creating a loop:

```typescript
// Sync slider state when items change
$effect(() => {
  // Force re-evaluation of effects
  void effects;
  // Update slider to reflect current opacity
  const currentOpacity = effects.hasMixedOpacity ? 100 : effects.opacity;
  sliderValue = currentOpacity;
});
```

This is **one-way data flow**:
- Data changes → `effects` updates → `sliderValue` updates
- User interacts with slider → local `sliderValue` changes → manual update (see below)

### 4. Watch Slider Changes with Safe Effect

Detect user interactions on the slider without creating feedback:

```typescript
let prevSliderValue = $state(100);
$effect(() => {
  // If the slider value changed AND it's different from the computed opacity
  if (sliderValue !== prevSliderValue && sliderValue !== effects.opacity) {
    prevSliderValue = sliderValue;
    handleSliderChange(sliderValue);
  }
});
```

**Why this prevents loops:**
- We track `prevSliderValue` to detect changes
- We check `sliderValue !== effects.opacity` to ensure it's a user change, not a sync
- We only call `handleSliderChange()` for genuine user interactions
- `handleSliderChange()` uses debouncing to prevent rapid-fire updates

### 5. Add Value Validation in Update Functions

```typescript
function updateOpacity(value: number) {
  // Ensure value is a valid number before processing
  if (typeof value !== 'number' || isNaN(value)) {
    return; // Skip invalid values
  }
  // Clamp value between 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  onUpdate(items.map((item) => ({ ...item, opacity: clampedValue / 100 })));
}
```

### 6. Add Cleanup for Timeouts

Prevent memory leaks and stale state:

```typescript
$effect.pre(() => {
  return () => {
    if (sliderTimeout) {
      clearTimeout(sliderTimeout);
      sliderTimeout = null;
    }
  };
});
```

## Data Flow After Fix

```
User interacts with slider
    ↓
sliderValue changes (local state)
    ↓
prevSliderValue effect detects change
    ↓
handleSliderChange() called (with debounce)
    ↓
updateOpacity() validates and clamps value
    ↓
onUpdate() called with new opacity
    ↓
Store updates items
    ↓
components re-render
    ↓
effects re-computes with validated values
    ↓
effects.opacity updated
    ↓
sliderValue sync effect runs
    ↓
sliderValue set to new opacity (if needed)
    ↓
prevSliderValue check: sliderValue === effects.opacity
    ↓
NO re-trigger (prevents loop)
```

## Testing

To verify the fix works:

1. **NaN Prevention**:
   - Select a shape and adjust the opacity slider
   - Check console for "NaN is not a valid value" warnings
   - Should see NO warnings

2. **Loop Prevention**:
   - Adjust opacity to different values
   - Watch console for repeated error messages
   - Should see NO "effect_update_depth_exceeded" errors

3. **Mixed Values**:
   - Select multiple shapes with different opacities
   - Slider should show mixed value indicator
   - Changing opacity should update all selected shapes

4. **Reactivity**:
   - Change opacity via slider
   - Shape should update in real-time on canvas
   - No lag or multiple re-renders

## Key Takeaways

1. **Never bind to computed values directly** - Create intermediate local state
2. **Validate all numeric inputs** - Especially when integrating with external libraries (Konva)
3. **One-way data flow** - Sync data → UI, but detect interactions separately
4. **Watch for circular dependencies** - Effects that trigger store updates which re-trigger effects
5. **Debounce rapid updates** - Prevent update storms from overwhelming the reconciliation system

## Files Changed

- `src/lib/components/properties-panel/sections/EffectsSection.svelte`

## Related Issues

- Shapes with undefined opacity values
- Mixed selection opacity calculation
- Slider component integration with Svelte 5 runes
