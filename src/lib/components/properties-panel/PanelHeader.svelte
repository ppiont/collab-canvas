<script lang="ts">
	/**
	 * Panel Header Component
	 * 
	 * Displays selection count and type with clear button.
	 * Follows typography scale: 16px headers, weight 600.
	 */
	
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
	
	const selectionText = $derived(
		selectionCount > 1 
			? `${selectionCount} ${selectionType}s selected` 
			: selectionCount === 1
			? `1 ${selectionType} selected`
			: 'No selection'
	);
</script>

<!-- Panel header will be fully implemented -->
<div class="flex justify-between items-center pb-4">
	<h2 class="text-base font-semibold">{selectionText}</h2>
</div>

