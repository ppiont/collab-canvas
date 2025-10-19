<script lang="ts">
	/**
	 * Main Properties Panel Container
	 *
	 * Displays properties for selected shapes with accordion sections.
	 * Uses Svelte 5 runes for reactive state management.
	 *
	 * Architecture:
	 * - PanelHeader for selection info
	 * - Accordion for collapsible sections
	 * - ScrollArea for long content
	 * - Section components for different property groups
	 *
	 * Spacing: 8pt grid throughout
	 * - Panel padding: 16px (p-4)
	 * - Section spacing: 24px (space-y-6)
	 * - No excessive borders (spacing-first approach)
	 */

	import type { Shape } from '$lib/types/shapes';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import PanelHeader from './PanelHeader.svelte';
	import DimensionsSection from './sections/DimensionsSection.svelte';
	import AppearanceSection from './sections/AppearanceSection.svelte';
	import EffectsSection from './sections/EffectsSection.svelte';

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
	const selectionType = $derived.by(() => {
		if (selectionCount === 0) return '';
		if (selectionCount === 1) return selectedItems[0].type;

		// Check if all selected items have the same type
		const firstType = selectedItems[0].type;
		const allSameType = selectedItems.every((item) => item.type === firstType);

		// If all same type, use that type; otherwise use generic "shape"
		return allSameType ? firstType : 'shape';
	});

	// Handle clear selection
	function handleClearSelection() {
		selectedItems = [];
	}

	// Handle shape updates
	function handleUpdateItems(updatedItems: Shape[]) {
		selectedItems = updatedItems;
		onUpdateItems(updatedItems);
	}
</script>

<!-- 
  Spacing reference (8pt grid):
  - 16px = p-4 (panel padding)
  - 24px = space-y-6 (between sections)
  - Borders minimized (only panel border-l)
-->
<aside
	class="w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-100 border-l-2 border-slate-700 dark:border-slate-600 flex flex-col shadow-2xl"
	data-testid="properties-panel"
>
	<ScrollArea class="flex-1">
		<div class="p-4 space-y-6">
			<!-- Header with selection info and clear button -->
			<PanelHeader {selectionCount} {selectionType} onClearSelection={handleClearSelection} />

			{#if selectionCount > 0}
				<!-- Accordion sections for different property groups -->
				<Accordion type="multiple" value={['dimensions', 'appearance', 'effects']} class="w-full space-y-3">
					<!-- Dimensions Section -->
					<AccordionItem value="dimensions" class="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 hover:border-slate-600 transition-all shadow-md" data-accordion-item="dimensions">
						<AccordionTrigger class="text-sm font-semibold py-3 px-4 hover:no-underline text-slate-100 hover:text-white">
							Dimensions
						</AccordionTrigger>
						<AccordionContent class="pt-3 pb-4 px-4 border-t border-slate-700">
							<DimensionsSection items={selectedItems} onUpdate={handleUpdateItems} />
						</AccordionContent>
					</AccordionItem>

					<!-- Appearance Section -->
					<AccordionItem value="appearance" class="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 hover:border-slate-600 transition-all shadow-md" data-accordion-item="appearance">
						<AccordionTrigger class="text-sm font-semibold py-3 px-4 hover:no-underline text-slate-100 hover:text-white">
							Appearance
						</AccordionTrigger>
						<AccordionContent class="pt-3 pb-4 px-4 border-t border-slate-700">
							<AppearanceSection items={selectedItems} onUpdate={handleUpdateItems} />
						</AccordionContent>
					</AccordionItem>

					<!-- Effects Section -->
					<AccordionItem value="effects" class="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 hover:border-slate-600 transition-all shadow-md" data-accordion-item="effects">
						<AccordionTrigger class="text-sm font-semibold py-3 px-4 hover:no-underline text-slate-100 hover:text-white">
							Effects
						</AccordionTrigger>
						<AccordionContent class="pt-3 pb-4 px-4 border-t border-slate-700">
							<EffectsSection items={selectedItems} onUpdate={handleUpdateItems} />
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			{:else}
				<!-- Empty state when nothing selected -->
				<div class="flex items-center justify-center py-12">
					<p class="text-sm text-muted-foreground text-center">Select an item to view properties</p>
				</div>
			{/if}
		</div>
	</ScrollArea>
</aside>

<style>
	/* Override input styling within properties panel for dark theme */
	:global([data-testid="properties-panel"] input[type="number"]),
	:global([data-testid="properties-panel"] input[type="text"]),
	:global([data-testid="properties-panel"] input[type="color"]) {
		@apply bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500;
		@apply hover:bg-slate-700/70 hover:border-slate-500;
		@apply focus-visible:bg-slate-700 focus-visible:border-slate-400 focus-visible:ring-blue-500/50;
		@apply transition-all;
	}

	/* Override slider styling */
	:global([data-testid="properties-panel"] [role="slider"]) {
		@apply bg-slate-700/50;
	}

	/* Override select/dropdown styling */
	:global([data-testid="properties-panel"] button[data-state="closed"]),
	:global([data-testid="properties-panel"] button[data-state="open"]) {
		@apply bg-slate-700/50 border-slate-600 text-slate-100;
		@apply hover:bg-slate-700/70 hover:border-slate-500;
		@apply focus-visible:ring-blue-500/50;
	}

	/* Override label styling */
	:global([data-testid="properties-panel"] label) {
		@apply text-slate-300;
	}
</style>
