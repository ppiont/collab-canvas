# Properties Panel Design Critique: What Makes It Look Like Dogshit and How to Fix It

Your properties panel probably looks bad. Here's why and what to do about it.

## The brutal truth about most properties panels

Most properties panels suffer from **box-itis**, **visual chaos**, and **accessibility sins** that make them look amateurish and feel frustrating. They're cluttered with unnecessary containers, have no clear hierarchy, use spacing randomly, and treat disabled states as an afterthought. Let me break down exactly what's wrong and how to fix it.

---

## Critical Issues to Hunt Down and Destroy

### 1. Box-itis: You're drowning your UI in containers

**The problem:** Every section has a border. Every group has a background. Everything is trapped in boxes within boxes within boxes. This creates visual imprisonment, not organization.

**What it looks like:**
- Harsh black or dark gray borders everywhere
- Nested containers creating 3-4 layers of visual weight
- Background colors on every single section
- 1px borders used as the primary separation tool
- The "grid prison" effect where everything feels trapped

**Why it's dogshit:**
- Draws attention to containers instead of content
- Makes the interface feel cramped and claustrophobic
- Increases cognitive load - users must mentally parse all this structure
- Signals amateur design immediately

**How to fix it:**

**STOP using borders as your default separator.** Use them sparingly - maybe 2-3 times max in your entire panel.

**START using spacing to create grouping:**
- 8-12px spacing between related items (tight coupling)
- 16-24px spacing between different sections (clear separation)
- 32px+ for major panel sections

**LIGHTEN your borders when you must use them:**
- Use colors only 10-15% darker than background (not #000000 or dark grays)
- Prefer 1px at most, never 2px+
- Tint with subtle brand colors instead of gray

**REPLACE borders with alternatives:**
- Subtle shadows (0 1px 2px rgba(0,0,0,0.05))
- Background color differences (5-10% contrast, not 50%)
- White space alone for most grouping
- Single horizontal dividers (1px, 10% opacity) between major sections only

**Svelte 5 + ShadCN implementation:**
```svelte
<!-- ❌ BAD: Box prison -->
<div class="border rounded-lg p-4">
  <div class="border-b pb-2">
    <div class="border rounded p-2">
      <!-- Content trapped in 3 layers -->
    </div>
  </div>
</div>

<!-- ✅ GOOD: Spacing-first approach -->
<div class="space-y-6">
  <div class="space-y-3">
    <!-- Related items, tight spacing -->
  </div>
  
  <div class="h-px bg-border" /> <!-- Single divider -->
  
  <div class="space-y-3">
    <!-- Next section -->
  </div>
</div>
```

---

### 2. Visual hierarchy: Everything looks equally important (which means nothing is)

**The problem:** Your labels look the same as your values. Section headers are barely bigger than body text. Everything uses the same weight, same color, same emphasis. Users can't scan - they must read every single thing.

**What it looks like:**
- Label: "Width" and value: "250px" have identical styling
- Section headers at 14px, body text at 13px (barely noticeable)
- Everything in the same gray tone
- No bold text anywhere (or bold everywhere)
- Random font sizes without system (14px, 13px, 15px, 12px scattered randomly)

**Why it's dogshit:**
- Impossible to scan quickly
- Users waste mental energy figuring out relationships
- Important actions disappear into the noise
- Looks unprofessional and unfinished

**How to fix it:**

**Implement a strict type scale:**
```svelte
<!-- Panel headers: 16px, weight 600 -->
<h3 class="text-base font-semibold">Layout Properties</h3>

<!-- Section labels: 14px, weight 500 -->
<label class="text-sm font-medium">Dimensions</label>

<!-- Field labels: 12-13px, weight 400-500 -->
<span class="text-xs font-medium text-muted-foreground">Width</span>

<!-- Input values: 14px, weight 400 -->
<Input class="text-sm" value="250px" />

<!-- Helper text: 11-12px, weight 400, muted -->
<p class="text-xs text-muted-foreground">Auto-layout width</p>
```

**Use spacing to create hierarchy (most powerful in dense UIs):**
- Give important elements **more breathing room**
- Tight spacing (4-8px) = related items
- Generous spacing (24-32px) = important standalone elements

**Weight differentiation:**
- **Bold (600-700)**: Section headers only
- **Medium (500)**: Field labels, interactive elements
- **Regular (400)**: Input values, body text
- **Never more than 3 weights total**

**Color hierarchy:**
- Primary text: High contrast (foreground color)
- Secondary text: 70-80% opacity (muted-foreground)
- Tertiary text: 50-60% opacity (truly de-emphasized)
- Don't rely on color alone - combine with weight and size

---

### 3. Inconsistent spacing: The pixel salad problem

**The problem:** You've got 7px here, 12px there, 14px somewhere else, and 16px over there. No system, no rhythm, just random gaps that feel arbitrary and create visual chaos.

**What it looks like:**
- Different padding around similar containers
- Gaps between form fields varying (12px, then 16px, then 14px)
- Elements that are "almost" aligned but off by 2-3px
- No relationship between spacing values

**Why it's dogshit:**
- Creates subconscious discomfort even if users can't identify why
- Signals "I didn't pay attention to details"
- Destroys any sense of visual rhythm
- Makes everything feel thrown together

**How to fix it:**

**Adopt the 8pt grid religiously:**
```typescript
// Define your spacing scale in Tailwind config
const spacing = {
  0: '0px',
  1: '4px',    // 0.5 * 8
  2: '8px',    // 1 * 8
  3: '12px',   // 1.5 * 8
  4: '16px',   // 2 * 8
  5: '20px',   // 2.5 * 8
  6: '24px',   // 3 * 8
  8: '32px',   // 4 * 8
  12: '48px',  // 6 * 8
}
```

**Spacing rules for properties panels:**
- **Within components**: 4-8px (space-y-2)
- **Between related fields**: 12px (space-y-3)
- **Between form sections**: 16-24px (space-y-4 or space-y-6)
- **Between major panel sections**: 24-32px (space-y-6 or space-y-8)
- **Panel padding**: 16-20px (p-4 or p-5)

**Svelte 5 spacing pattern:**
```svelte
<div class="space-y-6"> <!-- Major sections: 24px -->
  <section class="space-y-4"> <!-- Form group: 16px -->
    <h3 class="text-base font-semibold">Dimensions</h3>
    
    <div class="space-y-3"> <!-- Related fields: 12px -->
      <FormField label="Width">
        <Input />
      </FormField>
      
      <FormField label="Height">
        <Input />
      </FormField>
    </div>
  </section>
  
  <div class="h-px bg-border" />
  
  <section class="space-y-4">
    <!-- Next section -->
  </section>
</div>
```

**Never, ever use arbitrary values like `class="mt-[13px]"` - you're breaking the system.**

---

### 4. Color picker sins: Amateur hour

Based on analysis of Figma, Chrome DevTools, and modern color picker libraries, here's what's probably wrong with yours:

**Common disasters:**

**A. Combining hue and saturation in one control**
- Makes it nearly impossible to adjust saturation while maintaining hue
- Forces precision mouse movements
- **Fix**: Separate hue slider from saturation/brightness area (standard 2D color area + hue slider pattern)

**B. No contrast checking**
- Users pick colors that fail WCAG AA (4.5:1 minimum)
- No visual indicators for accessible colors
- **Fix**: Built-in contrast ratio display like Chrome DevTools. Show AA/AAA pass/fail indicators.

**C. Missing format flexibility**
- Only shows HEX, or can't convert between formats
- **Fix**: Support HEX, RGB, HSL, HSB at minimum. One-click format switching.

**D. No color history or swatches**
- Users can't return to recently used colors
- No saved palette support
- **Fix**: Show last 10-20 picked colors. Support saved color libraries/design tokens.

**E. Poor touch targets**
- Color picker thumbs too small (<44x44px)
- **Fix**: Minimum 44x44px touch targets. Increase size on focus.

**Modern color picker anatomy (what to build):**
```svelte
<Popover>
  <!-- Trigger: Swatch + Label -->
  <PopoverTrigger class="flex items-center gap-2">
    <div class="h-8 w-8 rounded border-2 border-white shadow ring-1 ring-black/10"
         style="background: {color}" />
    <span>Fill Color</span>
  </PopoverTrigger>
  
  <PopoverContent class="w-[280px] p-4">
    <!-- 2D Color Area (HSB: saturation x brightness) -->
    <div class="mb-3">
      <ColorArea colorSpace="hsb" 
                 xChannel="saturation" 
                 yChannel="brightness" 
                 class="w-full h-[160px] rounded" />
    </div>
    
    <!-- Hue Slider (separate) -->
    <div class="mb-2">
      <ColorSlider channel="hue" class="w-full h-3 rounded" />
    </div>
    
    <!-- Alpha Slider -->
    <div class="mb-3">
      <ColorSlider channel="alpha" class="w-full h-3 rounded" />
    </div>
    
    <!-- Format Switcher + Input -->
    <div class="flex gap-2 mb-3">
      <Select bind:value={format} class="w-20">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hex">HEX</SelectItem>
          <SelectItem value="rgb">RGB</SelectItem>
          <SelectItem value="hsl">HSL</SelectItem>
        </SelectContent>
      </Select>
      <Input bind:value={colorValue} class="flex-1" />
      <Button size="icon" variant="ghost" onclick={copyColor}>
        <CopyIcon class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Recent Colors -->
    <div class="space-y-2 mb-3">
      <label class="text-xs font-medium text-muted-foreground">Recent</label>
      <div class="flex gap-1">
        {#each recentColors as recent}
          <button 
            class="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
            style="background: {recent}"
            onclick={() => selectColor(recent)} />
        {/each}
      </div>
    </div>
    
    <!-- Contrast Checker (critical for accessibility) -->
    <div class="text-xs text-muted-foreground border-t pt-2">
      <div class="flex items-center justify-between">
        <span>Contrast: {contrastRatio.toFixed(2)}</span>
        <div class="flex gap-2">
          <span class={aaPass ? 'text-green-600' : 'text-destructive'}>
            {aaPass ? '✓' : '✗'}AA
          </span>
          <span class={aaaPass ? 'text-green-600' : 'text-destructive'}>
            {aaaPass ? '✓' : '✗'}AAA
          </span>
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

**Use React Aria Components or react-colorful** - don't build from scratch. They handle accessibility, keyboard navigation, and mobile interactions properly. For Svelte, consider wrapping these or using Bits-UI primitives.

---

### 5. Disabled states: The UX black hole

**The problem:** Your disabled buttons and fields create frustration without providing helpful feedback. Users don't know WHY something is disabled or how to fix it.

**What it looks like:**
- Grayed out submit button with no explanation
- Form fields that appear disabled but aren't
- No feedback when clicking disabled elements
- Low contrast disabled states (30% opacity that's barely visible)

**Why it's dogshit:**
- Creates puzzle-like frustration
- No clear path to resolution
- Accessibility nightmare (low contrast, can't focus, screen reader issues)
- Users repeatedly click trying to figure it out

**How to fix it:**

**STOP disabling submit buttons entirely:**
```svelte
<!-- ❌ BAD: Disabled until form valid -->
<Button type="submit" disabled={!isValid}>
  Submit
</Button>

<!-- ✅ GOOD: Always enabled, validate on submit -->
<script lang="ts">
  import { toast } from 'svelte-sonner';
  
  let errors = $state<string[]>([]);
  
  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    errors = validateForm();
    
    if (errors.length > 0) {
      toast.error('Please fix the errors below');
      return;
    }
    
    // Proceed with submission
    submitForm();
  };
</script>

<form onsubmit={handleSubmit}>
  <!-- Form fields -->
  
  {#if errors.length > 0}
    <div class="rounded-md bg-destructive/10 p-3 space-y-1 border border-destructive/20">
      {#each errors as error}
        <p class="text-sm text-destructive font-medium">{error}</p>
      {/each}
    </div>
  {/if}
  
  <Button type="submit">Submit</Button>
</form>
```

**For truly disabled elements, explain WHY:**
```svelte
<script lang="ts">
  let { disabled = false, disabledReason = '' } = $props();
  
  const handleClick = (e: MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      if (disabledReason) {
        toast.error(disabledReason);
      }
    }
  };
</script>

<!-- Use aria-disabled instead of disabled (keeps focusable) -->
<Button 
  aria-disabled={disabled}
  class:opacity-60={disabled}
  class:cursor-not-allowed={disabled}
  onclick={handleClick}
>
  <slot />
</Button>
```

**Visual design for disabled (when you must):**
- Use 40-60% opacity, not full gray
- Maintain some color visibility
- Add `cursor: not-allowed`
- Keep minimum 3:1 contrast if possible
- Add explanatory text nearby
- Use loading states for temporary disables

**Loading states pattern:**
```svelte
<script lang="ts">
  let isSubmitting = $state(false);
  
  const handleSubmit = async () => {
    isSubmitting = true;
    try {
      await submitForm();
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Button 
  onclick={handleSubmit} 
  disabled={isSubmitting}
  class="min-w-[100px]"
>
  {#if isSubmitting}
    <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
    Submitting...
  {:else}
    Submit
  {/if}
</Button>
```

---

### 6. Mixed/multiple selection handling: The dash problem

**The problem:** When multiple elements are selected with different values, you either show nothing, show "Mixed", or handle it poorly. Users can't tell what's happening.

**What professional tools do:**

**Figma approach (best practice):**
- Shows `—` (em dash) in field when values differ
- User can type to apply value to all
- Clear about mixed state
- Preserves individual values when clearing field

**Pattern to implement:**
```svelte
<script lang="ts">
  type SelectedObject = { id: string; width: number; height: number; };
  
  let { selection = [] }: { selection: SelectedObject[] } = $props();
  
  // Derive mixed state for width
  const widthState = $derived.by(() => {
    if (selection.length === 0) return { value: '', mixed: false };
    const firstWidth = selection[0].width;
    const allSame = selection.every(s => s.width === firstWidth);
    return {
      value: allSame ? String(firstWidth) : '',
      mixed: !allSame
    };
  });
  
  const heightState = $derived.by(() => {
    if (selection.length === 0) return { value: '', mixed: false };
    const firstHeight = selection[0].height;
    const allSame = selection.every(s => s.height === firstHeight);
    return {
      value: allSame ? String(firstHeight) : '',
      mixed: !allSame
    };
  });
  
  const updateWidth = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      selection.forEach(s => s.width = numValue);
    }
  };
</script>

<div class="space-y-3">
  <!-- Selection count indicator -->
  {#if selection.length > 1}
    <div class="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border">
      <span class="text-xs font-medium">{selection.length} items selected</span>
    </div>
  {/if}
  
  <!-- Width field with mixed state -->
  <div class="space-y-1.5">
    <Label for="width" class="text-xs font-medium text-muted-foreground">
      Width
    </Label>
    <div class="relative">
      <Input 
        id="width"
        value={widthState.value}
        placeholder={widthState.mixed ? '—' : 'Width'}
        class="h-8 text-sm pr-8"
        class:text-muted-foreground={widthState.mixed}
        oninput={(e) => updateWidth(e.currentTarget.value)}
      />
      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        px
      </span>
    </div>
    {#if widthState.mixed}
      <p class="text-xs text-muted-foreground">Mixed values</p>
    {/if}
  </div>
  
  <!-- Similar pattern for height -->
</div>
```

**Show selection count prominently:**
```svelte
{#if selection.length > 1}
  <div class="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-muted/80 backdrop-blur-sm border-b">
    <span class="text-sm font-medium">{selection.length} items selected</span>
    <Button variant="ghost" size="sm" onclick={clearSelection}>
      Clear
    </Button>
  </div>
{/if}
```

---

### 7. Accessibility sins (you're probably committing all of these)

**The brutal checklist:**

**❌ Low contrast text** (most common sin)
- Light gray labels on white background
- Test everything with WebAIM Contrast Checker
- Minimum 4.5:1 for normal text, 3:1 for large text
- **Fix**: Use `text-foreground` for primary, `text-muted-foreground` for secondary (these meet WCAG AA in ShadCN)

```svelte
<!-- ❌ BAD: Custom gray that might not meet contrast -->
<span class="text-gray-400">Label</span>

<!-- ✅ GOOD: Semantic token that meets WCAG AA -->
<span class="text-muted-foreground">Label</span>
```

**❌ No focus indicators**
- Removed default outlines without replacement
- **Fix**: Never remove focus styles. Use ShadCN's built-in focus ring utilities:

```svelte
<!-- ❌ BAD: Focus removed -->
<Input class="focus:outline-none" />

<!-- ✅ GOOD: Proper focus ring -->
<Input class="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />

<!-- ✅ BETTER: ShadCN Input already includes proper focus styles -->
<Input />
```

**❌ Missing keyboard navigation**
- Can't tab through all controls
- Arrow keys don't work in numeric inputs
- **Fix**: Test with Tab key only. All interactive elements must be focusable and have proper tabindex.

```svelte
<script lang="ts">
  const handleKeyDown = (e: KeyboardEvent) => {
    const input = e.currentTarget as HTMLInputElement;
    const currentValue = Number(input.value) || 0;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      input.value = String(currentValue + (e.shiftKey ? 10 : 1));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      input.value = String(currentValue - (e.shiftKey ? 10 : 1));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
</script>

<Input 
  type="number" 
  onkeydown={handleKeyDown}
  aria-label="Width in pixels"
/>
```

**❌ Forms without proper labels**
```svelte
<!-- ❌ BAD: No association -->
<div>Width</div>
<Input />

<!-- ✅ GOOD: Properly associated -->
<Label for="width">Width</Label>
<Input id="width" />

<!-- ✅ BETTER: Use ShadCN Form components with Svelte 5 -->
<script lang="ts">
  import * as Form from '$lib/components/ui/form';
  import { superForm } from 'sveltekit-superforms';
  
  let { data } = $props();
  const form = superForm(data.form);
  const { form: formData } = form;
</script>

<Form.Field {form} name="width">
  <Form.Control>
    {#snippet children({ props })}
      <Form.Label>Width</Form.Label>
      <Input {...props} bind:value={$formData.width} />
    {/snippet}
  </Form.Control>
  <Form.Description>Width in pixels</Form.Description>
  <Form.FieldErrors />
</Form.Field>
```

**❌ Small touch targets**
- Buttons less than 44x44px
- **Fix**: Minimum 44x44px for all interactive elements

```svelte
<!-- ❌ BAD: Too small -->
<Button size="sm" class="h-6">Tiny</Button>

<!-- ✅ GOOD: Proper touch target -->
<Button class="h-11 min-w-[44px]">Action</Button>

<!-- For icon buttons -->
<Button size="icon" class="h-11 w-11">
  <IconComponent class="h-4 w-4" />
</Button>
```

**❌ Color-only indicators**
- Red border without text explanation for errors
- **Fix**: Always combine color with text, icons, or other indicators

```svelte
<!-- ❌ BAD: Color only -->
<Input class="border-red-500" />

<!-- ✅ GOOD: Color + text + icon -->
<div class="space-y-1">
  <Input 
    class="border-destructive focus-visible:ring-destructive" 
    aria-invalid="true"
    aria-describedby="width-error"
  />
  <p id="width-error" class="text-sm text-destructive flex items-center gap-1">
    <AlertCircle class="h-3 w-3" />
    Width must be greater than 0
  </p>
</div>
```

**Complete accessibility checklist:**
```
□ All text meets 4.5:1 contrast ratio (WCAG AA)
□ Focus indicators visible on all interactive elements
□ All form inputs have associated labels (for/id or aria-label)
□ Error messages are specific and properly associated (aria-describedby)
□ Touch targets minimum 44x44px
□ Keyboard navigation works completely (Tab, Arrow keys, Enter, Escape)
□ Screen reader can access all content (proper ARIA labels)
□ Color not sole means of conveying information
□ Text resizes to 200% without loss of functionality
□ Loading states properly announced (aria-live)
```

---

### 8. Performance disasters in reactive panels

**The problem:** Your properties panel lags when typing, updating, or interacting. Every keystroke triggers a full re-render of the entire panel.

**Common causes in Svelte 5:**

**A. Creating new object/array references in derived state:**
```svelte
<script lang="ts">
  // ❌ BAD: New array every time selection changes
  const selectedIds = $derived(selection.map(s => s.id));
  
  // ✅ GOOD: Memoize if needed, or pass stable references
  const selectedIds = $derived.by(() => {
    return selection.map(s => s.id);
  });
</script>
```

**B. Not using $derived effectively:**
```svelte
<script lang="ts">
  let selection = $state<Element[]>([]);
  
  // ❌ BAD: Recalculates every render
  const totalWidth = selection.reduce((sum, el) => sum + el.width, 0);
  
  // ✅ GOOD: Only recalculates when selection changes
  const totalWidth = $derived(
    selection.reduce((sum, el) => sum + el.width, 0)
  );
</script>
```

**C. Expensive operations in render:**
```svelte
<script lang="ts">
  let items = $state<Item[]>([]);
  
  // ❌ BAD: Sorting on every render
  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));
  
  // ✅ GOOD: Sort only when items change
  const sortedItems = $derived(
    [...items].sort((a, b) => a.name.localeCompare(b.name))
  );
</script>
```

**D. Not debouncing expensive operations:**
```svelte
<script lang="ts">
  import { debounce } from '$lib/utils';
  
  let searchQuery = $state('');
  let searchResults = $state<Result[]>([]);
  
  // Debounce search by 300ms
  const performSearch = debounce(async (query: string) => {
    if (!query) {
      searchResults = [];
      return;
    }
    searchResults = await searchAPI(query);
  }, 300);
  
  $effect(() => {
    performSearch(searchQuery);
  });
</script>

<Input 
  bind:value={searchQuery} 
  placeholder="Search..."
/>
```

**E. Using controlled inputs for large forms:**
```svelte
<script lang="ts">
  // ❌ SLOW: Every keystroke updates state and re-renders panel
  let description = $state('');
</script>
<Textarea bind:value={description} />

<!-- ✅ FASTER: Use uncontrolled for non-critical fields -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  
  // superForm optimizes re-renders internally
  let { data } = $props();
  const form = superForm(data.form);
  const { form: formData, enhance } = form;
</script>

<form use:enhance>
  <Form.Field {form} name="description">
    <Form.Control>
      {#snippet children({ props })}
        <Textarea {...props} bind:value={$formData.description} />
      {/snippet}
    </Form.Control>
  </Form.Field>
</form>
```

**F. Re-creating event handlers:**
```svelte
<script lang="ts">
  // ❌ BAD: New function every render
  {#each items as item}
    <Button onclick={() => handleClick(item.id)}>
      {item.name}
    </Button>
  {/each}
  
  // ✅ GOOD: Event delegation or stable handlers
  const handleClick = (id: string) => {
    // Handle click
  };
</script>

{#each items as item}
  <Button onclick={() => handleClick(item.id)}>
    {item.name}
  </Button>
{/each}
```

**Performance optimization checklist:**
```
□ Use $derived for computed values that depend on state
□ Use $derived.by() for complex derivations
□ Debounce expensive operations (search, API calls)
□ Avoid creating new objects/arrays unnecessarily
□ Use $effect for side effects, not $derived
□ Profile with Chrome DevTools Performance tab
□ Test with large datasets (100+ items)
□ Use virtualization for long lists (svelte-virtual)
□ Lazy load heavy components
□ Optimize images and assets
```

**Debounce utility:**
```typescript
// lib/utils.ts
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

---

## Actionable Implementation Guide

### Modern properties panel architecture

**Component structure:**
```
src/lib/components/properties-panel/
├── PropertiesPanel.svelte          # Main container
├── PanelHeader.svelte              # Selection info, actions
├── PanelSection.svelte             # Collapsible section wrapper
├── FormField.svelte                # Reusable field component
└── sections/
    ├── DimensionsSection.svelte    # Width, height, position
    ├── LayoutSection.svelte        # Auto-layout, flex, grid
    ├── AppearanceSection.svelte    # Fill, stroke, effects
    ├── TypographySection.svelte    # Font properties
    └── ColorPickerField.svelte     # Color picker integration
```

**Properties panel foundation (PropertiesPanel.svelte):**
```svelte
<script lang="ts">
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import PanelHeader from './PanelHeader.svelte';
  import DimensionsSection from './sections/DimensionsSection.svelte';
  import AppearanceSection from './sections/AppearanceSection.svelte';
  
  type SelectedElement = {
    id: string;
    name: string;
    type: string;
    width: number;
    height: number;
    x: number;
    y: number;
    fill: string;
    // ... other properties
  };
  
  let { 
    selection = $bindable([]) 
  }: { 
    selection: SelectedElement[] 
  } = $props();
  
  const hasSelection = $derived(selection.length > 0);
  const isMultiple = $derived(selection.length > 1);
  
  // Default expanded sections
  let expandedSections = $state(['dimensions', 'appearance']);
</script>

<aside class="w-[280px] h-full border-l bg-background flex flex-col">
  <!-- Header -->
  <PanelHeader {selection} />
  
  <!-- Scrollable Content -->
  <ScrollArea class="flex-1">
    {#if hasSelection}
      <Accordion 
        type="multiple" 
        bind:value={expandedSections}
        class="w-full"
      >
        <!-- Dimensions Section -->
        <AccordionItem value="dimensions" class="border-b">
          <AccordionTrigger class="px-4 py-3 text-sm font-semibold hover:bg-muted/50">
            Dimensions
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <DimensionsSection bind:selection />
          </AccordionContent>
        </AccordionItem>
        
        <!-- Appearance Section -->
        <AccordionItem value="appearance" class="border-b">
          <AccordionTrigger class="px-4 py-3 text-sm font-semibold hover:bg-muted/50">
            Appearance
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <AppearanceSection bind:selection />
          </AccordionContent>
        </AccordionItem>
        
        <!-- Add more sections as needed -->
      </Accordion>
    {:else}
      <div class="flex items-center justify-center h-full p-4">
        <p class="text-sm text-muted-foreground text-center">
          Select an element to view properties
        </p>
      </div>
    {/if}
  </ScrollArea>
</aside>
```

**Panel header with selection info (PanelHeader.svelte):**
```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { X } from 'lucide-svelte';
  
  type SelectedElement = { id: string; name: string; type: string; };
  
  let { selection }: { selection: SelectedElement[] } = $props();
  
  const hasSelection = $derived(selection.length > 0);
  const isMultiple = $derived(selection.length > 1);
  
  const displayName = $derived(() => {
    if (!hasSelection) return 'No selection';
    if (isMultiple) return `${selection.length} selected`;
    return selection[0].name || selection[0].type;
  });
  
  const clearSelection = () => {
    selection.length = 0; // Clear array while maintaining reactivity
  };
</script>

<div class="p-4 border-b bg-background">
  <div class="flex items-center justify-between">
    <div class="flex-1 min-w-0">
      <h2 class="text-sm font-semibold truncate">
        {displayName()}
      </h2>
      {#if isMultiple}
        <p class="text-xs text-muted-foreground">
          Mixed selection
        </p>
      {/if}
    </div>
    
    {#if hasSelection}
      <Button 
        variant="ghost" 
        size="icon"
        class="h-8 w-8 ml-2"
        onclick={clearSelection}
      >
        <X class="h-4 w-4" />
      </Button>
    {/if}
  </div>
</div>
```

**Reusable field component (FormField.svelte):**
```svelte
<script lang="ts">
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import type { Snippet } from 'svelte';
  
  let { 
    label,
    value = $bindable(''),
    mixed = false,
    unit = '',
    disabled = false,
    type = 'text',
    placeholder = '',
    min,
    max,
    step,
    children,
    onchange,
  }: {
    label: string;
    value?: string | number;
    mixed?: boolean;
    unit?: string;
    disabled?: boolean;
    type?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    children?: Snippet;
    onchange?: (value: string) => void;
  } = $props();
  
  const handleInput = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    value = type === 'number' ? Number(target.value) : target.value;
    onchange?.(target.value);
  };
</script>

<div class="space-y-1.5">
  <Label for={label} class="text-xs font-medium text-muted-foreground">
    {label}
  </Label>
  
  {#if children}
    {@render children()}
  {:else}
    <div class="relative">
      <Input 
        id={label}
        {type}
        value={mixed ? '' : value}
        placeholder={mixed ? '—' : placeholder}
        {disabled}
        {min}
        {max}
        {step}
        class="h-8 text-sm"
        class:pr-8={unit}
        class:text-muted-foreground={mixed}
        oninput={handleInput}
      />
      {#if unit}
        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {unit}
        </span>
      {/if}
    </div>
  {/if}
  
  {#if mixed}
    <p class="text-xs text-muted-foreground">Mixed values</p>
  {/if}
</div>
```

**Dimensions section example (DimensionsSection.svelte):**
```svelte
<script lang="ts">
  import FormField from '../FormField.svelte';
  import { Lock, Unlock } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  
  type Element = { width: number; height: number; x: number; y: number; };
  
  let { selection }: { selection: Element[] } = $props();
  
  let constrainProportions = $state(false);
  let aspectRatio = $state(1);
  
  // Derive mixed states
  const widthState = $derived.by(() => {
    if (selection.length === 0) return { value: 0, mixed: false };
    const first = selection[0].width;
    return {
      value: first,
      mixed: !selection.every(s => s.width === first)
    };
  });
  
  const heightState = $derived.by(() => {
    if (selection.length === 0) return { value: 0, mixed: false };
    const first = selection[0].height;
    return {
      value: first,
      mixed: !selection.every(s => s.height === first)
    };
  });
  
  const updateWidth = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    
    selection.forEach(s => {
      s.width = num;
      if (constrainProportions) {
        s.height = num / aspectRatio;
      }
    });
  };
  
  const updateHeight = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    
    selection.forEach(s => {
      s.height = num;
      if (constrainProportions) {
        s.width = num * aspectRatio;
      }
    });
  };
  
  $effect(() => {
    if (selection.length === 1 && !widthState.mixed && !heightState.mixed) {
      aspectRatio = widthState.value / heightState.value;
    }
  });
</script>

<div class="space-y-3">
  <!-- Width and Height -->
  <div class="flex gap-2">
    <div class="flex-1">
      <FormField 
        label="W" 
        value={widthState.value}
        mixed={widthState.mixed}
        unit="px"
        type="number"
        min={0}
        onchange={updateWidth}
      />
    </div>
    
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 mt-5"
      onclick={() => constrainProportions = !constrainProportions}
    >
      {#if constrainProportions}
        <Lock class="h-3 w-3" />
      {:else}
        <Unlock class="h-3 w-3" />
      {/if}
    </Button>
    
    <div class="flex-1">
      <FormField 
        label="H" 
        value={heightState.value}
        mixed={heightState.mixed}
        unit="px"
        type="number"
        min={0}
        onchange={updateHeight}
      />
    </div>
  </div>
  
  <!-- Position (similar pattern) -->
  <!-- ... -->
</div>
```

---

### Typography scale implementation

**Add to your Tailwind config:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      fontSize: {
        // Properties panel typography scale
        'panel-header': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'panel-section': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'panel-label': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'panel-value': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'panel-helper': ['11px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        // Additional spacing values for dense UIs
        '1.5': '6px',   // 1.5 * 4
        '2.5': '10px',  // 2.5 * 4
        '3.5': '14px',  // 3.5 * 4
      }
    }
  }
} satisfies Config;
```

**Usage in components:**
```svelte
<!-- Panel headers -->
<h3 class="text-panel-header">Layout Properties</h3>

<!-- Section labels -->
<label class="text-panel-section">Dimensions</label>

<!-- Field labels -->
<span class="text-panel-label text-muted-foreground">Width</span>

<!-- Input values -->
<Input class="text-panel-value" />

<!-- Helper text -->
<p class="text-panel-helper text-muted-foreground">Auto-layout width</p>
```

---

### Color system for panels

**Ensure proper semantic tokens in your global CSS:**
```css
/* app.css or global.css */
@layer base {
  :root {
    /* Text hierarchy */
    --foreground: 0 0% 10%;           /* Primary text - WCAG AA */
    --muted-foreground: 0 0% 45%;     /* Secondary labels - WCAG AA */
    
    /* Backgrounds */
    --background: 0 0% 100%;           /* Main panel bg */
    --muted: 0 0% 96%;                 /* Subtle group bg */
    --accent: 0 0% 93%;                /* Hover state */
    
    /* Borders */
    --border: 0 0% 90%;                /* Subtle dividers */
    
    /* Interactive */
    --primary: 221 83% 53%;            /* Action color */
    --primary-foreground: 0 0% 100%;   /* Text on primary */
    --destructive: 0 84% 60%;          /* Error state */
    --destructive-foreground: 0 0% 100%;
    
    /* Focus */
    --ring: 221 83% 53%;               /* Focus ring color */
    --ring-offset: 0 0% 100%;
    
    /* Input */
    --input: 0 0% 90%;                 /* Input border */
  }
  
  .dark {
    --foreground: 0 0% 98%;
    --muted-foreground: 0 0% 60%;
    
    --background: 0 0% 10%;
    --muted: 0 0% 15%;
    --accent: 0 0% 18%;
    
    --border: 0 0% 20%;
    
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    
    --ring: 221 83% 53%;
    --ring-offset: 0 0% 10%;
    
    --input: 0 0% 20%;
  }
}

/* Ensure focus rings are always visible */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

---

## The Quick Win Checklist

Apply these in order for maximum impact:

### Week 1: Foundation fixes (kills 70% of problems)
- [ ] **Remove 80% of borders** - Replace with spacing (8-12px between items, 16-24px between sections)
- [ ] **Implement 8pt grid** - All spacing must be multiples of 4px or 8px (use Tailwind's default spacing scale)
- [ ] **Fix contrast ratios** - All text must pass WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] **Add focus indicators** - Visible 2px ring on all interactive elements
- [ ] **Establish type scale** - Max 4 sizes: 16px headers, 14px labels, 12px helper, 11px tertiary

### Week 2: Hierarchy and interaction
- [ ] **Create clear visual hierarchy** - Use size, weight, color, and spacing (not just one)
- [ ] **Fix color picker** - Separate hue slider, add contrast checker, support multiple formats
- [ ] **Handle mixed selections** - Show em dash (—) for different values, display selection count
- [ ] **Stop disabling buttons** - Show validation errors instead, use loading states for processing
- [ ] **Add proper labels** - All form inputs associated with labels (for/id or aria-label)

### Week 3: Performance and polish
- [ ] **Use $derived for computed values** - Don't recalculate on every render
- [ ] **Debounce expensive operations** - 300ms delay for search, validation
- [ ] **Test keyboard navigation** - Tab through everything, arrow keys work in numeric inputs
- [ ] **Profile performance** - Check Chrome DevTools for slow renders
- [ ] **Optimize for mobile** - 44x44px touch targets, test on actual devices

---

## Resources and Tools

### Study these panels (copy what they do):
- **Figma properties panel** - Gold standard for hierarchy and organization
- **Chrome DevTools** - Excellent density and accessibility features  
- **Framer** - Clean, minimal aesthetic with smart progressive disclosure
- **Webflow** - Good handling of complex CSS properties with focus mode

### Use these libraries (don't reinvent):
- **ShadCN/ui for Svelte** - Pre-built accessible components ([shadcn-svelte.com](https://shadcn-svelte.com))
- **Bits-UI** - Svelte-native accessible primitives ([bits-ui.com](https://bits-ui.com))
- **react-colorful** - Lightweight color picker (adapt for Svelte, 2.8KB)
- **React Aria** - Reference for accessibility patterns

### Test with these tools:
- **WebAIM Contrast Checker** - Verify all text meets WCAG AA ([webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/))
- **Axe DevTools** - Browser extension for accessibility scanning
- **Chrome DevTools Performance** - Profile render performance and identify bottlenecks
- **Keyboard-only testing** - Disconnect mouse, navigate with Tab/Enter/Escape/Arrows

### Learn from these resources:
- **Svelte 5 Documentation** - Runes, reactivity, performance ([svelte.dev/docs](https://svelte.dev/docs))
- **ShadCN Svelte 5 Migration** - Latest patterns and best practices
- **WCAG 2.1 Guidelines** - Accessibility requirements ([w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref/))
- **Material Design** - Spacing, density, interaction states ([material.io](https://material.io))

---

## Critical Anti-Patterns to Avoid

**Never do these:**

1. **Don't remove focus outlines without replacement** - Accessibility disaster
2. **Don't use borders as primary separators** - Creates visual prison
3. **Don't disable buttons without explanation** - UX black hole
4. **Don't mix spacing values randomly** - Use 8pt grid religiously
5. **Don't create new objects in $derived** - Performance killer
6. **Don't rely on color alone** - Combine with text, icons, weight
7. **Don't use arbitrary Tailwind values** - `mt-[13px]` breaks the system
8. **Don't make touch targets smaller than 44x44px** - Mobile usability failure
9. **Don't skip contrast testing** - Most common accessibility violation
10. **Don't forget keyboard navigation** - Test with Tab key only

---

## Prompts for LLM Agent Coder

When using an LLM to implement these fixes, use these specific prompts:

### 1. Remove box-itis and fix spacing
```
Convert this properties panel to use spacing-first separation instead of borders:
- Remove all border classes except 1 horizontal divider between major sections
- Replace with Tailwind spacing: space-y-3 for related items, space-y-6 for sections
- Use single 1px divider (h-px bg-border) only between major sections
- Add p-4 padding to panel container, no padding on individual sections
- All spacing must use Tailwind's default scale (multiples of 4px)
```

### 2. Establish visual hierarchy
```
Fix the visual hierarchy in this properties panel:
- Panel headers: text-base font-semibold (16px, weight 600)
- Section labels: text-sm font-medium (14px, weight 500)
- Field labels: text-xs font-medium text-muted-foreground (12px)
- Input values: text-sm (14px, weight 400)
- Helper text: text-xs text-muted-foreground (11px)
- Never use more than these 3 font weights
```

### 3. Add proper color picker
```
Implement a color picker component with these requirements:
- 2D color area for saturation/brightness (hsb color space)
- Separate hue slider below the color area
- Separate alpha slider
- Format switcher dropdown (HEX, RGB, HSL, HSB)
- Input field showing current color value
- Copy button to copy color to clipboard
- Recent colors section showing last 10 colors
- Contrast ratio checker showing AA/AAA compliance
- Minimum 44x44px touch targets for all controls
- Proper keyboard navigation (arrow keys adjust values)
```

### 4. Handle mixed selections
```
Add mixed selection handling to this form field:
- Calculate if selected elements have different values
- Show em dash (—) as placeholder when values differ
- Add "Mixed values" helper text below field
- When user types, apply value to all selected elements
- Show selection count in panel header when multiple selected
- Use $derived.by() to compute mixed state efficiently
```

### 5. Fix accessibility
```
Fix accessibility issues in this properties panel:
- Add proper label associations (Label with for= and Input with id=)
- Add focus-visible:ring-2 focus-visible:ring-ring to all inputs
- Ensure all text colors meet WCAG AA (4.5:1 contrast)
- Add aria-label to unlabeled inputs
- Add aria-describedby to link error messages with inputs
- Make all interactive elements minimum 44x44px
- Add keyboard shortcuts (arrow keys for numeric inputs)
- Test with screen reader and document any ARIA attributes needed
```

### 6. Optimize performance
```
Optimize this properties panel for performance:
- Convert computed values to use $derived or $derived.by()
- Add debouncing to search inputs (300ms delay)
- Use $effect for side effects, never in $derived
- Ensure no new objects/arrays created in render path
- Add loading states that temporarily disable inputs during saves
- Profile with Chrome DevTools and identify any slow renders
```

### 7. Complete implementation
```
Build a properties panel for a Figma-like design tool using Svelte 5 and ShadCN with:

Structure:
- 280px fixed width, full height sidebar
- Sticky header showing selection info
- Scrollable content area with accordion sections
- Sections: Dimensions, Layout, Appearance, Typography

Requirements:
- Support single and multiple selection with mixed value handling
- All spacing using 8pt grid (Tailwind's default scale)
- No borders except single dividers between major sections
- Proper visual hierarchy (16px headers, 14px labels, 12px helper text)
- All interactive elements 44x44px minimum
- Fully keyboard navigable
- WCAG AA compliant contrast
- Proper focus indicators
- Loading states for async operations
- Performance optimized with $derived and debouncing

Use ShadCN components: Accordion, Input, Label, Button, ScrollArea
Use Svelte 5 runes: $state, $derived, $derived.by(), $effect, $props, $bindable
```

---

## Final Word

Your properties panel is the primary interface for detailed editing. If it looks bad, your entire tool looks bad. If it's hard to use, users will hate your product.

**The core insight:** Professional panels succeed by doing less, not more. Less borders. Less decoration. Less visual weight. They use spacing, hierarchy, and restraint to let the content shine.

Stop trying to make it look "designed" with fancy borders and backgrounds. Start making it **functional** with proper spacing, clear hierarchy, and accessibility baked in from day one.

**Fix the spacing first** (kills 40% of visual problems), **then hierarchy** (another 30%), **then accessibility** (the remaining 30%). In that order. Don't skip steps.

Study what Figma does. Copy their patterns ruthlessly. They've spent thousands of hours solving these exact problems. Learn from their work.

Now go make it not look like dogshit.