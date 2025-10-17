<script lang="ts">
	import Konva from 'konva';
	import { Circle, Group } from 'svelte-konva';
	import { lineManager } from './LineManager.svelte';

	let { line, isSelected }: { line: any; isSelected: boolean } = $props();

	// Subscribe to store for reactive updates
	let endpoints = $state<Array<{ x: number; y: number; index: number }>>([]);
	let isDragging = $state(false);

	// Setup reactive subscription to lineManager
	$effect(() => {
		if (isSelected) {
			endpoints = lineManager.getEndpoints();
			isDragging = lineManager.isDraggingState();
		} else {
			endpoints = [];
			isDragging = false;
		}
	});

	function handleEndpointMouseDown(index: number) {
		lineManager.startDraggingEndpoint(index);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleEndpointDragMove(e: any, index: number) {
		const pos = e.target.position();
		lineManager.updateEndpointPosition(pos.x, pos.y);
	}

	function handleEndpointDragEnd() {
		lineManager.finishDragging();
	}
</script>

{#if isSelected && endpoints.length > 0}
	<Group>
		{#each endpoints as endpoint (endpoint.index)}
			<Circle
				x={endpoint.x}
				y={endpoint.y}
				radius={6}
				fill="#667eea"
				stroke="white"
				strokeWidth={2}
				draggable={true}
				onMouseDown={() => handleEndpointMouseDown(endpoint.index)}
				onDragMove={(e: any) => handleEndpointDragMove(e, endpoint.index)}
				onDragEnd={handleEndpointDragEnd}
				listening={true}
			/>
		{/each}
	</Group>
{/if}
