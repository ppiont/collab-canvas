/**
 * Live Shape Renderer - PHASE 3
 * Renders real-time feedback for shapes being dragged by other collaborators
 * Shows ACTUAL SHAPES semi-transparently, not generic ghosts
 */

import Konva from 'konva';
import type { Shape } from '$lib/types/shapes';
import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';
import { CANVAS } from '$lib/constants';

interface DraggedShapeInfo {
	id: string;
	x: number;
	y: number;
	userId: string;
	timestamp: number;
}

interface AwarenessStateData {
	user?: {
		id: string;
		name: string;
		color: string;
	};
	draggedShapes?: Record<string, DraggedShapeInfo>;
}

/**
 * LiveShapeRenderer displays ACTUAL shapes being dragged by other users
 * Renders real shapes (rectangles, circles, etc.) semi-transparently
 */
export class LiveShapeRenderer {
	private shapesLayer: Konva.Layer;
	private stage: Konva.Stage;
	private awareness: Awareness;
	private shapesMap: Y.Map<Shape>;
	private localUserId: string;
	private draggedShapeNodes = new Map<string, Konva.Group>();
	private userColors = new Map<string, string>();
	private lastUpdateTime = 0;
	private updateInterval = CANVAS.FRAME_TIME_MS; // 60fps update
	private awarenessChangeHandler: (() => void) | null = null;

	constructor(shapesLayer: Konva.Layer, stage: Konva.Stage, awareness: Awareness, shapesMap: Y.Map<Shape>, localUserId: string) {
		this.shapesLayer = shapesLayer;
		this.stage = stage;
		this.awareness = awareness;
		this.shapesMap = shapesMap;
		this.localUserId = localUserId;

		// Listen for Awareness state changes
		this.setupAwarenessListener();
	}

	/**
	 * Listen for changes in other users' dragged shapes
	 */
	private setupAwarenessListener(): void {
		// Store handler for cleanup
		this.awarenessChangeHandler = () => {
			this.updateDraggedShapes();
		};

		// Listen for awareness changes
		this.awareness.on('change', this.awarenessChangeHandler);

		// Initial render
		this.updateDraggedShapes();
	}

	/**
	 * Update displayed dragged shapes from Awareness
	 */
	private updateDraggedShapes(): void {
		const now = Date.now();
		if (now - this.lastUpdateTime < this.updateInterval) return;
		this.lastUpdateTime = now;

		const allDraggedShapes = new Map<string, DraggedShapeInfo>();
		const seenKeys = new Set<string>();

		// Collect all dragged shapes from OTHER users (exclude local user)
		this.awareness.getStates().forEach((state: AwarenessStateData) => {
			if (state.draggedShapes && state.user) {
				const user = state.user; // Store in const to satisfy TypeScript
				
				// Skip local user - don't render ghosts for own drags
				if (user.id === this.localUserId) {
					return;
				}
				
				const userColor = user.color || '#3b82f6';
				this.userColors.set(user.id, userColor);

				Object.entries(state.draggedShapes).forEach(([shapeId, dragInfo]) => {
					const key = `${user.id}-${shapeId}`;
					seenKeys.add(key);

					// Check for stale dragged shapes (older than 5 seconds)
					const age = Date.now() - (dragInfo.timestamp || 0);
					if (age < 5000) {
						allDraggedShapes.set(key, {
							id: shapeId,
							x: dragInfo.x,
							y: dragInfo.y,
							userId: user.id,
							timestamp: dragInfo.timestamp
						});
					}
				});
			}
		});

		// Update or create ghost shapes for active drags
		allDraggedShapes.forEach((dragInfo, key) => {
			if (!this.draggedShapeNodes.has(key)) {
				this.createDragGhost(key, dragInfo);
			} else {
				this.updateDragGhost(key, dragInfo);
			}
		});

		// Remove ghosts for drags that ended
		for (const [key] of this.draggedShapeNodes.entries()) {
			if (!seenKeys.has(key)) {
				this.removeDragGhost(key);
			}
		}

		this.shapesLayer.batchDraw();
	}

	/**
	 * Create a ghost shape for a dragged object (actual shape, not generic)
	 */
	private createDragGhost(key: string, dragInfo: DraggedShapeInfo): void {
		// Get the actual shape data from Yjs
		const shapeData = this.shapesMap.get(dragInfo.id) as Shape | undefined;
		if (!shapeData) return; // Shape doesn't exist yet

		const userColor = this.userColors.get(dragInfo.userId) || '#3b82f6';

		// Create a group for the ghost shape
		const ghost = new Konva.Group({
			x: dragInfo.x,
			y: dragInfo.y,
			opacity: 0.6 // Semi-transparent
		});

		// Render actual shape based on type
		let shapeNode: Konva.Node | null = null;

		switch (shapeData.type) {
			case 'rectangle': {
				const rect = shapeData as Extract<Shape, { type: 'rectangle' }>;
				shapeNode = new Konva.Rect({
					width: rect.width,
					height: rect.height,
					fill: rect.fill || userColor,
					stroke: rect.stroke,
					strokeWidth: rect.strokeWidth,
					opacity: 0.6
				});
				break;
			}

			case 'circle': {
				const circle = shapeData as Extract<Shape, { type: 'circle' }>;
				shapeNode = new Konva.Circle({
					radius: circle.radius,
					fill: circle.fill || userColor,
					stroke: circle.stroke,
					strokeWidth: circle.strokeWidth,
					opacity: 0.6
				});
				break;
			}

			case 'triangle': {
				const triangle = shapeData as Extract<Shape, { type: 'triangle' }>;
				shapeNode = new Konva.RegularPolygon({
					sides: 3,
					radius: Math.max(triangle.width, triangle.height) / 2,
					fill: triangle.fill || userColor,
					stroke: triangle.stroke,
					strokeWidth: triangle.strokeWidth,
					opacity: 0.6
				});
				break;
			}

			case 'polygon': {
				const polygon = shapeData as Extract<Shape, { type: 'polygon' }>;
				shapeNode = new Konva.RegularPolygon({
					sides: 5, // Default pentagon
					radius: polygon.radius,
					fill: polygon.fill || userColor,
					stroke: polygon.stroke,
					strokeWidth: polygon.strokeWidth,
					opacity: 0.6
				});
				break;
			}

			case 'star': {
				const star = shapeData as Extract<Shape, { type: 'star' }>;
				shapeNode = new Konva.Star({
					numPoints: star.numPoints || 5,
					innerRadius: star.innerRadius || 20,
					outerRadius: star.outerRadius || 50,
					fill: star.fill || userColor,
					stroke: star.stroke,
					strokeWidth: star.strokeWidth,
					opacity: 0.6
				});
				break;
			}

			case 'line': {
				const line = shapeData as Extract<Shape, { type: 'line' }>;
				shapeNode = new Konva.Line({
					points: line.points,
					stroke: line.stroke || userColor,
					strokeWidth: line.strokeWidth,
					lineCap: 'round',
					lineJoin: 'round',
					opacity: 0.6
				});
				break;
			}

			case 'text': {
				const text = shapeData as Extract<Shape, { type: 'text' }>;
				shapeNode = new Konva.Text({
					text: text.text,
					fontSize: text.fontSize,
					fontFamily: text.fontFamily,
					fill: text.fill || userColor,
					opacity: 0.6
				});
				break;
			}

			default: {
				// Fallback: generic rectangle
				shapeNode = new Konva.Rect({
					width: 50,
					height: 50,
					fill: userColor,
					opacity: 0.6
				});
			}
		}

		if (shapeNode) {
			ghost.add(shapeNode as Konva.Shape);
		}

		// Apply rotation from shape data to match current visual state
		if (shapeData.rotation) {
			ghost.rotation(shapeData.rotation);
		}

		ghost.setAttr('dragKey', key);
		this.shapesLayer.add(ghost);
		this.draggedShapeNodes.set(key, ghost);
	}

	/**
	 * Update position of an existing drag ghost
	 */
	private updateDragGhost(key: string, dragInfo: DraggedShapeInfo): void {
		const ghost = this.draggedShapeNodes.get(key);
		if (ghost) {
			ghost.x(dragInfo.x);
			ghost.y(dragInfo.y);
		}
	}

	/**
	 * Remove a drag ghost shape
	 */
	private removeDragGhost(key: string): void {
		const ghost = this.draggedShapeNodes.get(key);
		if (ghost) {
			ghost.destroy();
			this.draggedShapeNodes.delete(key);
		}
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		// Remove all ghost shapes
		for (const [key, node] of this.draggedShapeNodes.entries()) {
			node.destroy();
			this.draggedShapeNodes.delete(key);
		}

		// Remove listeners with correct reference
		if (this.awareness && this.awarenessChangeHandler) {
			this.awareness.off('change', this.awarenessChangeHandler);
			this.awarenessChangeHandler = null;
		}
	}
}
