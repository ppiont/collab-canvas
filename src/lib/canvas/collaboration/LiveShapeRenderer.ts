/**
 * Live Shape Renderer - PHASE 3
 * Renders real-time feedback for shapes being dragged by other collaborators
 * Shows ACTUAL SHAPES semi-transparently, not generic ghosts
 */

import Konva from 'konva';
import type { Shape } from '$lib/types/shapes';

interface DraggedShapeInfo {
	id: string;
	x: number;
	y: number;
	userId: string;
	timestamp: number;
}

/**
 * LiveShapeRenderer displays ACTUAL shapes being dragged by other users
 * Renders real shapes (rectangles, circles, etc.) semi-transparently
 */
export class LiveShapeRenderer {
	private shapesLayer: Konva.Layer;
	private stage: Konva.Stage;
	private awareness: any;
	private shapesMap: any; // Reference to Yjs shapes map
	private draggedShapeNodes = new Map<string, Konva.Group>();
	private userColors = new Map<string, string>();
	private lastUpdateTime = 0;
	private updateInterval = 16; // 60fps update

	constructor(shapesLayer: Konva.Layer, stage: Konva.Stage, awareness: any, shapesMap: any) {
		this.shapesLayer = shapesLayer;
		this.stage = stage;
		this.awareness = awareness;
		this.shapesMap = shapesMap;

		// Listen for Awareness state changes
		this.setupAwarenessListener();

		// Schedule periodic updates
		this.scheduleUpdates();
	}

	/**
	 * Listen for changes in other users' dragged shapes
	 */
	private setupAwarenessListener(): void {
		// Listen for awareness changes
		this.awareness.on('change', () => {
			this.updateDraggedShapes();
		});

		// Initial render
		this.updateDraggedShapes();
	}

	/**
	 * Schedule periodic updates for smooth animation
	 */
	private scheduleUpdates(): void {
		const updateLoop = () => {
			requestAnimationFrame(updateLoop);
		};
		updateLoop();
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

		// Collect all dragged shapes from all users
		this.awareness.getStates().forEach((state: any) => {
			if (state.draggedShapes && state.user) {
				const userColor = state.user.color || '#3b82f6';
				this.userColors.set(state.user.id, userColor);

				Object.entries(state.draggedShapes).forEach(([shapeId, dragInfo]: [string, any]) => {
					const key = `${state.user.id}-${shapeId}`;
					seenKeys.add(key);

					// Check for stale dragged shapes (older than 5 seconds)
					const age = Date.now() - (dragInfo.timestamp || 0);
					if (age < 5000) {
						allDraggedShapes.set(key, {
							id: shapeId,
							x: dragInfo.x,
							y: dragInfo.y,
							userId: state.user.id,
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
		for (const [key, node] of this.draggedShapeNodes.entries()) {
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
				const rect = shapeData as any;
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
				const circle = shapeData as any;
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
				const triangle = shapeData as any;
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
				const polygon = shapeData as any;
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
				const star = shapeData as any;
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
				const line = shapeData as any;
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
				const text = shapeData as any;
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
			ghost.add(shapeNode);
		}

		// Add user indicator label
		const userInfo = this.awareness.getStates().get(
			Array.from(this.awareness.getStates().entries()).find(
				([_, state]: [any, any]) => state.user?.id === dragInfo.userId
			)?.[0]
		);

		if (userInfo?.user?.name) {
			const label = new Konva.Label({
				x: 10,
				y: 10
			});

			label.add(
				new Konva.Tag({
					fill: userColor,
					cornerRadius: 2,
					opacity: 0.8
				})
			);

			label.add(
				new Konva.Text({
					text: `${userInfo.user.name}`,
					fontSize: 10,
					fontFamily: 'system-ui',
					fill: '#ffffff',
					padding: 3
				})
			);

			ghost.add(label);
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

		// Remove listeners
		if (this.awareness) {
			this.awareness.off('change', this.updateDraggedShapes);
		}
	}
}
