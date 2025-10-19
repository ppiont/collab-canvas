# Properties Panel - Migration Strategy & Testing

## Overview

This document outlines the strategy for migrating from the old properties panel to the new, redesigned properties panel implementation.

## Migration Approach

### Phase 1: Feature Flag Implementation

Create a feature flag to enable gradual rollout:

```typescript
// src/lib/config/features.ts
export const FEATURES = {
	USE_NEW_PROPERTIES_PANEL: import.meta.env.DEV ? true : false // Enable in dev by default
} as const;
```

### Phase 2: Wrapper Component

Create a wrapper that conditionally renders old or new panel:

```svelte
<!-- src/lib/components/PropertiesPanelController.svelte -->
<script lang="ts">
	import type { Shape } from '$lib/types/shapes';
	import { FEATURES } from '$lib/config/features';
	
	// Old component (existing)
	import LegacyPropertiesPanel from './PropertiesPanel.svelte';
	
	// New component (redesigned)
	import NewPropertiesPanel from './properties-panel/PropertiesPanel.svelte';
	
	// Props
	let {
		selectedItems = $bindable([]),
		onUpdateItems
	}: {
		selectedItems: Shape[];
		onUpdateItems: (items: Shape[]) => void;
	} = $props();
</script>

{#if FEATURES.USE_NEW_PROPERTIES_PANEL}
	<NewPropertiesPanel {selectedItems} {onUpdateItems} />
{:else}
	<LegacyPropertiesPanel {selectedItems} {onUpdateItems} />
{/if}
```

### Phase 3: Update Canvas Integration

Update main canvas component to use the wrapper:

```diff
- import PropertiesPanel from '$lib/components/PropertiesPanel.svelte';
+ import PropertiesPanelController from '$lib/components/PropertiesPanelController.svelte';

- <PropertiesPanel selectedItems={selected} onUpdateItems={handleUpdate} />
+ <PropertiesPanelController selectedItems={selected} onUpdateItems={handleUpdate} />
```

## Testing Strategy

### Pre-Deployment Testing

#### 1. Functional Testing Checklist

- [ ] **Selection Handling**
  - [ ] Empty selection (no items)
  - [ ] Single selection (rectangle)
  - [ ] Single selection (circle)
  - [ ] Single selection (text)
  - [ ] Multiple selection (same type)
  - [ ] Multiple selection (mixed types)

- [ ] **Dimensions Section**
  - [ ] X position updates
  - [ ] Y position updates
  - [ ] Width updates
  - [ ] Height updates
  - [ ] Radius updates (circles)
  - [ ] Rotation updates
  - [ ] Arrow keys increment/decrement
  - [ ] Shift+Arrow for ±10
  - [ ] Mixed values display correctly

- [ ] **Appearance Section**
  - [ ] Fill color picker
  - [ ] Fill enable/disable toggle
  - [ ] Stroke color picker
  - [ ] Stroke enable/disable toggle
  - [ ] Stroke width updates
  - [ ] Mixed values display correctly

- [ ] **Effects Section**
  - [ ] Opacity slider (0-100%)
  - [ ] Opacity input field
  - [ ] Slider/input sync
  - [ ] Blend mode selector
  - [ ] Mixed values display correctly

- [ ] **Color Picker**
  - [ ] Opens native picker on click
  - [ ] Updates on color selection
  - [ ] Hex value display
  - [ ] Copy to clipboard
  - [ ] Single-click access (no intermediate popover)

- [ ] **Header**
  - [ ] Selection count displays correctly
  - [ ] Selection type displays correctly
  - [ ] Clear button appears when items selected
  - [ ] Clear button clears selection

- [ ] **Accordion**
  - [ ] All sections expand by default
  - [ ] Sections can be collapsed
  - [ ] Sections can be expanded
  - [ ] State persists during interactions

#### 2. Accessibility Testing Checklist

- [ ] **Keyboard Navigation**
  - [ ] Tab order is logical
  - [ ] All controls reachable via keyboard
  - [ ] Enter/Space activate buttons
  - [ ] Arrow keys work in numeric inputs
  - [ ] Escape closes dialogs/popovers
  - [ ] Focus indicators visible

- [ ] **Screen Readers** (NVDA/VoiceOver)
  - [ ] Selection count announced
  - [ ] Input labels announced
  - [ ] Mixed values announced
  - [ ] Error messages announced
  - [ ] Button purposes clear

- [ ] **ARIA Attributes**
  - [ ] All inputs have labels
  - [ ] aria-describedby present
  - [ ] aria-invalid on errors
  - [ ] role="alert" on errors
  - [ ] No missing ARIA references

- [ ] **Touch Targets**
  - [ ] All buttons ≥ 44x44px
  - [ ] Adequate spacing between targets
  - [ ] No accidental activations

- [ ] **Contrast Ratios** (4.5:1 minimum)
  - [ ] Labels vs background
  - [ ] Input text vs background
  - [ ] Button text vs background
  - [ ] Disabled states distinguishable

#### 3. Visual Testing Checklist

- [ ] **8pt Grid Spacing**
  - [ ] Panel padding: 16px
  - [ ] Section spacing: 24px
  - [ ] Field spacing: 12px
  - [ ] Element gaps: 8px

- [ ] **Typography**
  - [ ] Panel header: text-base font-semibold
  - [ ] Section headers: text-sm font-medium
  - [ ] Labels: text-xs font-medium text-muted-foreground
  - [ ] Values: default size text-foreground

- [ ] **Borders & Dividers**
  - [ ] Only panel left border
  - [ ] Accordion section borders (minimal)
  - [ ] No excessive borders elsewhere

- [ ] **Colors**
  - [ ] Uses semantic tokens
  - [ ] Light mode correct
  - [ ] Dark mode correct
  - [ ] Hover states visible
  - [ ] Focus states visible

- [ ] **Visual Regression**
  - [ ] Run Playwright visual tests
  - [ ] Compare screenshots to baselines
  - [ ] No unintended changes

#### 4. Performance Testing Checklist

- [ ] **Chrome DevTools Profile**
  - [ ] All interactions < 16.67ms (60fps)
  - [ ] No long tasks (>50ms)
  - [ ] No layout thrashing
  - [ ] Memory stable (no leaks)

- [ ] **Benchmarks**
  - [ ] Mixed value detection < 10ms (100 items)
  - [ ] Update propagation < 5ms
  - [ ] Render complete < 100ms

- [ ] **Scaling**
  - [ ] Test with 1 item
  - [ ] Test with 10 items
  - [ ] Test with 100 items
  - [ ] Test with 1000 items (stress test)

#### 5. Browser/Device Testing

- [ ] **Desktop Browsers**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Mobile Browsers**
  - [ ] iOS Safari
  - [ ] Chrome Android
  - [ ] Firefox Android

- [ ] **Viewport Sizes**
  - [ ] 320px (mobile)
  - [ ] 768px (tablet)
  - [ ] 1024px (desktop)
  - [ ] 1920px (large desktop)

- [ ] **Operating Systems**
  - [ ] macOS
  - [ ] Windows
  - [ ] Linux
  - [ ] iOS
  - [ ] Android

## Rollout Plan

### Stage 1: Development Testing (Week 1)
- Enable feature flag in development
- Internal team testing
- Fix critical bugs
- Performance profiling

### Stage 2: Staging Environment (Week 2)
- Deploy to staging
- QA team testing
- Accessibility audit
- Visual regression tests

### Stage 3: Canary Release (Week 3)
- Deploy to production with flag OFF
- Enable for 5% of users
- Monitor error rates
- Gather user feedback

### Stage 4: Gradual Rollout (Week 4-6)
- Week 4: 25% of users
- Week 5: 50% of users
- Week 6: 100% of users
- Monitor at each step

### Stage 5: Cleanup (Week 7)
- Remove feature flag
- Remove old component
- Update documentation
- Archive migration docs

## Rollback Procedures

### Emergency Rollback (Critical Bug)
```typescript
// In src/lib/config/features.ts
export const FEATURES = {
	USE_NEW_PROPERTIES_PANEL: false // Immediately disable
} as const;
```
Deploy hotfix immediately.

### Gradual Rollback (Performance Issues)
1. Reduce rollout percentage
2. Investigate issue
3. Fix or rollback completely
4. Re-test before re-rolling out

### Data Migration Issues
- New and old panels share same Shape type
- No data transformation needed
- Props interface unchanged
- Rollback safe at any time

## Monitoring & Metrics

### Key Metrics to Track

1. **Error Rates**
   - JavaScript errors in properties panel
   - Failed updates
   - Null reference errors

2. **Performance**
   - Time to interactive
   - Input latency (target: <100ms)
   - FPS during interactions (target: 60fps)

3. **User Engagement**
   - Properties panel open rate
   - Interactions per session
   - Feature usage (color picker, sliders, etc.)

4. **Accessibility**
   - Keyboard navigation usage
   - Screen reader user feedback
   - Touch target hit rates

### Logging

Add instrumentation:

```typescript
// Track feature usage
analytics.track('properties_panel_version', {
	version: FEATURES.USE_NEW_PROPERTIES_PANEL ? 'new' : 'legacy',
	timestamp: Date.now()
});

// Track errors
window.addEventListener('error', (e) => {
	if (e.filename.includes('properties-panel')) {
		analytics.track('properties_panel_error', {
			message: e.message,
			version: FEATURES.USE_NEW_PROPERTIES_PANEL ? 'new' : 'legacy'
		});
	}
});
```

## Success Criteria

The migration is considered successful when:

- [ ] **Zero Critical Bugs**: No P0/P1 bugs in production
- [ ] **Performance Targets Met**: 60fps, <100ms latency
- [ ] **Accessibility Compliance**: Zero Axe violations
- [ ] **User Satisfaction**: >95% positive feedback
- [ ] **Error Rates**: <0.1% error rate
- [ ] **100% Rollout**: All users on new panel
- [ ] **Cleanup Complete**: Old code removed

## Documentation Updates

After successful migration:

1. Update README with new component path
2. Update component documentation
3. Update Storybook/Playground examples
4. Archive this migration guide
5. Update developer onboarding docs

## Support & Communication

- **Developer Slack**: #frontend-properties-panel
- **User Support**: Document common issues
- **Feedback Form**: Embedded in panel (dev mode only)
- **Weekly Updates**: Status reports to team

---

**Migration Owner**: Frontend Team
**Estimated Timeline**: 7 weeks
**Last Updated**: 2024-10-19

