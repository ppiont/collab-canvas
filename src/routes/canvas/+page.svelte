<script lang="ts">
	import { onMount } from 'svelte';
	import Konva from 'konva';

	let containerDiv: HTMLDivElement;
	let stage: Konva.Stage;
	let gridLayer: Konva.Layer;
	let shapesLayer: Konva.Layer;

	// Canvas dimensions
	let width = $state(0);
	let height = $state(0);

	// Viewport state for pan/zoom
	let stageScale = $state(1);

	// Update canvas size on mount and resize
	function updateSize() {
		width = window.innerWidth;
		height = window.innerHeight;

		if (stage) {
			stage.width(width);
			stage.height(height);
			drawGrid();
			gridLayer?.batchDraw();
		}
	}

	function drawGrid() {
		if (!gridLayer) return;

		gridLayer.destroyChildren();

		const gridSize = 50;
		const gridColor = '#e2e8f0';

		// Make grid much larger than viewport for infinite feel
		const gridExtent = Math.max(width, height) * 5; // 5x viewport size
		const gridStart = -gridExtent;
		const gridEnd = gridExtent;

		// Vertical lines
		for (let i = gridStart; i <= gridEnd; i += gridSize) {
			const line = new Konva.Line({
				points: [i, gridStart, i, gridEnd],
				stroke: gridColor,
				strokeWidth: 1
			});
			gridLayer.add(line);
		}

		// Horizontal lines
		for (let i = gridStart; i <= gridEnd; i += gridSize) {
			const line = new Konva.Line({
				points: [gridStart, i, gridEnd, i],
				stroke: gridColor,
				strokeWidth: 1
			});
			gridLayer.add(line);
		}
	}

	onMount(() => {
		console.log('Canvas page mounted');
		updateSize();
		console.log('Canvas dimensions:', { width, height });

		// Create Konva stage
		stage = new Konva.Stage({
			container: containerDiv,
			width,
			height,
			draggable: true
		});

		// Grid layer
		gridLayer = new Konva.Layer();
		stage.add(gridLayer);
		drawGrid();

		// Shapes layer
		shapesLayer = new Konva.Layer();
		stage.add(shapesLayer);

		// Sample rectangles
		const rect1 = new Konva.Rect({
			x: 100,
			y: 100,
			width: 150,
			height: 100,
			fill: '#3b82f6',
			stroke: '#1e40af',
			strokeWidth: 2
		});

		const rect2 = new Konva.Rect({
			x: 300,
			y: 200,
			width: 120,
			height: 120,
			fill: '#ec4899',
			stroke: '#9f1239',
			strokeWidth: 2
		});

		const rect3 = new Konva.Rect({
			x: 500,
			y: 150,
			width: 180,
			height: 90,
			fill: '#10b981',
			stroke: '#047857',
			strokeWidth: 2
		});

		shapesLayer.add(rect1, rect2, rect3);
		shapesLayer.draw();

		// Handle dragging for pan
		stage.on('dragend', () => {
			console.log('Stage dragged to:', stage.position());
		});

		console.log('Konva stage created successfully');

		window.addEventListener('resize', updateSize);
		return () => {
			window.removeEventListener('resize', updateSize);
			stage.destroy();
		};
	});

	// Handle wheel zoom
	function handleWheel(e: WheelEvent) {
		if (!stage) return;
		e.preventDefault();

		const scaleBy = 1.05;
		const oldScale = stage.scaleX();

		// Get pointer position relative to stage
		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale
		};

		// Calculate new scale
		const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

		// Clamp scale between 0.1x and 5x
		const clampedScale = Math.max(0.1, Math.min(5, newScale));

		stage.scale({ x: clampedScale, y: clampedScale });

		// Adjust position to zoom toward pointer
		const newPos = {
			x: pointer.x - mousePointTo.x * clampedScale,
			y: pointer.y - mousePointTo.y * clampedScale
		};

		stage.position(newPos);
		stage.batchDraw();

		// Update state for zoom indicator
		stageScale = clampedScale;
	}
</script>

<div class="canvas-container" onwheel={handleWheel}>
	<!-- Zoom indicator -->
	<div class="zoom-indicator">
		{Math.round(stageScale * 100)}%
	</div>

	<!-- Konva container -->
	<div bind:this={containerDiv}></div>
</div>

<style>
	.canvas-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: #ffffff;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.zoom-indicator {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		z-index: 1000;
		pointer-events: none;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
