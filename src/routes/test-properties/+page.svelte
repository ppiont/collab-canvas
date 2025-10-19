<script lang="ts">
	/**
	 * Test page for the new Properties Panel
	 * 
	 * This page demonstrates the new properties panel with mock data
	 * to test layout, accordion, spacing, and interactions.
	 */
	
	import PropertiesPanel from '$lib/components/properties-panel/PropertiesPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Shape } from '$lib/types/shapes';
	
	// Mock shapes for testing
	let selectedShapes = $state<Shape[]>([]);
	
	const mockRectangle: Shape = {
		id: '1',
		type: 'rectangle',
		x: 100,
		y: 100,
		width: 200,
		height: 150,
		rotation: 0,
		fill: '#3b82f6',
		stroke: '#1e40af',
		strokeWidth: 2,
		opacity: 1,
		blendMode: 'normal',
		zIndex: 1,
		fillEnabled: true,
		strokeEnabled: true,
		createdBy: 'test-user',
		createdAt: Date.now()
	};
	
	const mockCircle: Shape = {
		id: '2',
		type: 'circle',
		x: 400,
		y: 200,
		radius: 75,
		rotation: 0,
		fill: '#ef4444',
		stroke: '#991b1b',
		strokeWidth: 1,
		opacity: 0.8,
		blendMode: 'multiply',
		zIndex: 2,
		fillEnabled: true,
		strokeEnabled: true,
		createdBy: 'test-user',
		createdAt: Date.now()
	};
	
	const mockText: Shape = {
		id: '3',
		type: 'text',
		x: 250,
		y: 400,
		text: 'Hello World',
		fontSize: 24,
		fontFamily: 'Arial',
		fill: '#000000',
		rotation: 0,
		opacity: 1,
		blendMode: 'normal',
		zIndex: 3,
		fillEnabled: true,
		createdBy: 'test-user',
		createdAt: Date.now()
	};
	
	function handleSelectNone() {
		selectedShapes = [];
	}
	
	function handleSelectSingle() {
		selectedShapes = [mockRectangle];
	}
	
	function handleSelectMultiple() {
		selectedShapes = [mockRectangle, mockCircle];
	}
	
	function handleSelectMixed() {
		selectedShapes = [mockRectangle, mockCircle, mockText];
	}
	
	function handleUpdateShapes(updatedShapes: Shape[]) {
		selectedShapes = updatedShapes;
		console.log('Shapes updated:', updatedShapes);
	}
</script>

<svelte:head>
	<title>Properties Panel Test</title>
</svelte:head>

<div class="flex h-screen bg-muted/20">
	<!-- Left side: Test controls -->
	<div class="flex-1 p-8 flex flex-col gap-4">
		<div class="space-y-4">
			<h1 class="text-3xl font-bold">Properties Panel Test</h1>
			<p class="text-muted-foreground">
				Test the new properties panel with different selection states.
			</p>
		</div>
		
		<!-- Selection controls -->
		<div class="space-y-2">
			<h2 class="text-lg font-semibold">Selection Controls</h2>
			<div class="flex flex-wrap gap-2">
				<Button onclick={handleSelectNone} variant="outline">
					No Selection
				</Button>
				<Button onclick={handleSelectSingle} variant="outline">
					Single (Rectangle)
				</Button>
				<Button onclick={handleSelectMultiple} variant="outline">
					Multiple (2 shapes)
				</Button>
				<Button onclick={handleSelectMixed} variant="outline">
					Mixed (3 types)
				</Button>
			</div>
		</div>
		
		<!-- Current selection info -->
		<div class="space-y-2">
			<h2 class="text-lg font-semibold">Current Selection</h2>
			<div class="rounded-lg border p-4 bg-background">
				{#if selectedShapes.length === 0}
					<p class="text-sm text-muted-foreground">No shapes selected</p>
				{:else}
					<div class="space-y-2">
						<p class="text-sm font-medium">
							{selectedShapes.length} shape{selectedShapes.length > 1 ? 's' : ''} selected
						</p>
						{#each selectedShapes as shape}
							<div class="text-xs font-mono bg-muted/50 p-2 rounded">
								<div>ID: {shape.id}</div>
								<div>Type: {shape.type}</div>
								<div>Position: ({shape.x}, {shape.y})</div>
								{#if shape.type === 'rectangle'}
									<div>Size: {shape.width} × {shape.height}</div>
								{/if}
								{#if shape.type === 'circle'}
									<div>Radius: {shape.radius}</div>
								{/if}
								<div>Fill: {shape.fill}</div>
								<div>Opacity: {shape.opacity}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Instructions -->
		<div class="space-y-2">
			<h2 class="text-lg font-semibold">Testing Checklist</h2>
			<ul class="text-sm text-muted-foreground space-y-1 list-disc list-inside">
				<li>Accordion sections expand/collapse properly</li>
				<li>Clear button appears and works</li>
				<li>Scroll area works with long content</li>
				<li>Empty state shows when nothing selected</li>
				<li>Header shows correct selection count</li>
				<li>Section placeholders render (full implementation in later tasks)</li>
				<li>8pt grid spacing visible throughout</li>
				<li>No excessive borders (only panel border-l)</li>
			</ul>
		</div>
	</div>
	
	<!-- Right side: Properties panel (280px width like Figma) -->
	<div class="w-[280px] h-screen">
		<PropertiesPanel 
			bind:selectedItems={selectedShapes}
			onUpdateItems={handleUpdateShapes}
		/>
	</div>
</div>

