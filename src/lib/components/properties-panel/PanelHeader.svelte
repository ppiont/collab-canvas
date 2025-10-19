<script lang="ts">
	/**
	 * Panel Header Component
	 *
	 * Displays selection count and type with clear button.
	 *
	 * Typography: 16px headers, weight 600 (text-base font-semibold)
	 * Spacing: 16px bottom padding (pb-4)
	 * Touch targets: 44x44px minimum (h-11 w-11)
	 *
	 * Features:
	 * - Smart pluralization for selection text
	 * - Clear button with X icon
	 * - Proper focus indicators
	 * - WCAG AA compliant
	 * - Keyboard accessible
	 */

	import { Button } from '$lib/components/ui/button';
	import { X } from 'lucide-svelte';

	// Props
	let {
		selectionCount = 0,
		selectionType = '',
		onClearSelection = () => {}
	}: {
		selectionCount: number;
		selectionType: string;
		onClearSelection: () => void;
	} = $props();

	// Compute selection text with smart pluralization
	const selectionText = $derived(
		selectionCount > 1
			? `${selectionCount} ${selectionType}s selected`
			: selectionCount === 1
				? `1 ${selectionType} selected`
				: 'No selection'
	);

	// Show clear button only when there's a selection
	const showClearButton = $derived(selectionCount > 0);
</script>

<!-- 
  Spacing reference (8pt grid):
  - 16px = pb-4 (bottom padding)
-->
<div class="flex justify-between items-center pb-4" data-testid="panel-header">
	<!-- Selection count and type -->
	<h2 class="text-base font-semibold truncate flex-1 mr-2">
		{selectionText}
	</h2>

	<!-- Clear selection button (44x44px touch target) -->
	{#if showClearButton}
		<Button
			variant="ghost"
			size="icon"
			onclick={onClearSelection}
			aria-label="Clear selection"
			class="h-11 w-11 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
		>
			<X class="h-4 w-4" />
		</Button>
	{/if}
</div>

<!--
USAGE EXAMPLES:

1. Single selection:
<PanelHeader 
  selectionCount={1} 
  selectionType="rectangle" 
  onClearSelection={() => clearSelection()}
/>
// Displays: "1 rectangle selected" + clear button

2. Multiple selection:
<PanelHeader 
  selectionCount={5} 
  selectionType="shape" 
  onClearSelection={() => clearSelection()}
/>
// Displays: "5 shapes selected" + clear button

3. No selection:
<PanelHeader 
  selectionCount={0} 
  selectionType="" 
  onClearSelection={() => {}}
/>
// Displays: "No selection" (no clear button)

4. With reactive selection state:
<script>
  let selectedItems = $state([]);
  const selectionCount = $derived(selectedItems.length);
  const selectionType = $derived(selectedItems[0]?.type || '');
  
  function clearSelection() {
    selectedItems = [];
  }
</script>

<PanelHeader 
  {selectionCount} 
  {selectionType} 
  onClearSelection={clearSelection}
/>
-->
