<script lang="ts">
	/**
	 * Main Properties Panel Container
	 * 
	 * Displays properties for selected shapes with accordion sections.
	 * Uses Svelte 5 runes for reactive state management.
	 */
	
	import type { Shape } from '$lib/types/shapes';
	
	// Props
	let { 
		selectedItems = $bindable([]),
		onUpdateItems = (items: Shape[]) => {}
	}: { 
		selectedItems: Shape[];
		onUpdateItems: (items: Shape[]) => void;
	} = $props();
	
	// Reactive state
	const selectionCount = $derived(selectedItems.length);
	const selectionType = $derived(selectionCount > 0 ? selectedItems[0].type : '');
</script>

<!-- Properties Panel will be implemented -->
<div class="w-full h-full bg-background border-l border-border">
	<div class="p-4">
		{#if selectionCount > 0}
			<p class="text-sm text-muted-foreground">
				{selectionCount} item{selectionCount > 1 ? 's' : ''} selected ({selectionType})
			</p>
		{:else}
			<p class="text-sm text-muted-foreground">No selection</p>
		{/if}
	</div>
</div>

