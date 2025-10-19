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
	const selectionType = $derived(selectionCount > 0 ? selectedItems[0].type : '');
	
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
	class="w-full h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 border-l border-slate-200 dark:border-slate-800 flex flex-col" 
	data-testid="properties-panel"
>
	<ScrollArea class="flex-1">
		<div class="p-4 space-y-6">
			<!-- Header with selection info and clear button -->
			<PanelHeader 
				{selectionCount} 
				{selectionType}
				onClearSelection={handleClearSelection}
			/>
			
			{#if selectionCount > 0}
				<!-- Accordion sections for different property groups -->
				<Accordion 
					type="multiple" 
					value={['dimensions', 'appearance', 'effects']}
					class="w-full"
				>
					<!-- Dimensions Section -->
					<AccordionItem value="dimensions" class="border-b" data-accordion-item="dimensions">
						<AccordionTrigger class="text-sm font-medium py-3 hover:no-underline">
							Dimensions
						</AccordionTrigger>
						<AccordionContent class="pt-3 pb-4">
							<DimensionsSection 
								items={selectedItems} 
								onUpdate={handleUpdateItems}
							/>
						</AccordionContent>
					</AccordionItem>
					
					<!-- Appearance Section -->
					<AccordionItem value="appearance" class="border-b" data-accordion-item="appearance">
						<AccordionTrigger class="text-sm font-medium py-3 hover:no-underline">
							Appearance
						</AccordionTrigger>
						<AccordionContent class="pt-3 pb-4">
							<AppearanceSection 
								items={selectedItems} 
								onUpdate={handleUpdateItems}
							/>
						</AccordionContent>
					</AccordionItem>
					
					<!-- Effects Section -->
					<AccordionItem value="effects" class="border-b" data-accordion-item="effects">
						<AccordionTrigger class="text-sm font-medium py-3 hover:no-underline">
							Effects
						</AccordionTrigger>
						<AccordionContent class="pt-3 pb-4">
							<EffectsSection 
								items={selectedItems} 
								onUpdate={handleUpdateItems}
							/>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			{:else}
				<!-- Empty state when nothing selected -->
				<div class="flex items-center justify-center py-12">
					<p class="text-sm text-muted-foreground text-center">
						Select an item to view properties
					</p>
				</div>
			{/if}
		</div>
	</ScrollArea>
</aside>

