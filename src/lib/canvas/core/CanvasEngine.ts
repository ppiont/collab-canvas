/**
 * Canvas Engine - Core Konva Stage and Layer Management
 * Extracted from canvas/+page.svelte
 *
 * Handles:
 * - Konva Stage initialization
 * - Layer management (grid, shapes, cursors)
 * - Grid rendering
 * - Canvas resizing
 */

import Konva from 'konva';
import type { CanvasConfig } from '$lib/types/canvas';

/** Canvas layers returned by initialize */
export interface CanvasLayers {
	grid: Konva.Layer;
	shapes: Konva.Layer;
	cursors: Konva.Layer;
}

/**
 * CanvasEngine manages the Konva stage and core layers
 */
export class CanvasEngine {
	private container: HTMLDivElement;
	private config: CanvasConfig;
	private stage: Konva.Stage | null = null;
	private layers: CanvasLayers | null = null;

	constructor(container: HTMLDivElement, config: CanvasConfig) {
		this.container = container;
		this.config = config;
	}

	/**
	 * Initialize Konva stage and layers
	 */
	initialize(): { stage: Konva.Stage; layers: CanvasLayers } {
		// Create stage
		this.stage = new Konva.Stage({
			container: this.container,
			width: this.config.width,
			height: this.config.height,
			draggable: false // Will be enabled conditionally on mousedown
		});

		// Create layers
		// Grid layer: static content, no events needed (performance optimization)
		const gridLayer = new Konva.Layer({ listening: false });
		this.stage.add(gridLayer);

		// Shapes layer: interactive content with full event handling
		const shapesLayer = new Konva.Layer();
		this.stage.add(shapesLayer);

		// Cursors layer: visual feedback, no interaction needed
		const cursorsLayer = new Konva.Layer({ listening: false });
		this.stage.add(cursorsLayer);

		this.layers = {
			grid: gridLayer,
			shapes: shapesLayer,
			cursors: cursorsLayer
		};

		// Draw initial grid
		this.drawGrid();

		return {
			stage: this.stage,
			layers: this.layers
		};
	}

	/**
	 * Update canvas size (call on window resize)
	 */
	updateSize(width: number, height: number): void {
		if (!this.stage || !this.layers) return;

		this.config.width = width;
		this.config.height = height;

		this.stage.width(width);
		this.stage.height(height);

		this.drawGrid();
		this.layers.grid.batchDraw();
	}

	/**
	 * Draw grid lines on grid layer
	 * Uses viewport culling for infinite grid performance
	 */
	drawGrid(): void {
		if (!this.layers || !this.stage) return;

		const gridLayer = this.layers.grid;
		gridLayer.destroyChildren();

		const gridSize = this.config.gridSize;
		const gridColor = this.config.gridColor;

		// Get current viewport bounds (accounting for stage position and scale)
		const stagePos = this.stage.position();
		const scale = this.stage.scaleX(); // Assume uniform scaling

		// Calculate visible world coordinates with padding for smooth panning
		const padding = Math.max(this.config.width, this.config.height);
		const startX = Math.floor((-stagePos.x - padding) / scale / gridSize) * gridSize;
		const endX = Math.floor((-stagePos.x + this.config.width + padding) / scale / gridSize) * gridSize;
		const startY = Math.floor((-stagePos.y - padding) / scale / gridSize) * gridSize;
		const endY = Math.floor((-stagePos.y + this.config.height + padding) / scale / gridSize) * gridSize;

		// Only render visible vertical lines
		for (let x = startX; x <= endX; x += gridSize) {
			const line = new Konva.Line({
				points: [x, startY, x, endY],
				stroke: gridColor,
				strokeWidth: 1 / scale, // Counter-scale stroke for consistent width
				listening: false
			});
			gridLayer.add(line);
		}

		// Only render visible horizontal lines
		for (let y = startY; y <= endY; y += gridSize) {
			const line = new Konva.Line({
				points: [startX, y, endX, y],
				stroke: gridColor,
				strokeWidth: 1 / scale, // Counter-scale stroke for consistent width
				listening: false
			});
			gridLayer.add(line);
		}
	}

	/**
	 * Get the Konva stage instance
	 */
	getStage(): Konva.Stage {
		if (!this.stage) {
			throw new Error('CanvasEngine not initialized');
		}
		return this.stage;
	}

	/**
	 * Get a specific layer
	 */
	getLayer(name: keyof CanvasLayers): Konva.Layer {
		if (!this.layers) {
			throw new Error('CanvasEngine not initialized');
		}
		return this.layers[name];
	}

	/**
	 * Get all layers
	 */
	getLayers(): CanvasLayers {
		if (!this.layers) {
			throw new Error('CanvasEngine not initialized');
		}
		return this.layers;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		if (this.stage) {
			this.stage.destroy();
			this.stage = null;
		}
		this.layers = null;
	}
}
