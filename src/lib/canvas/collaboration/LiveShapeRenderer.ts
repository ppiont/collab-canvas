/**
 * Live Shape Renderer - PHASE 3
 * Renders real-time feedback for shapes being dragged by other collaborators
 * Shows semi-transparent ghost shapes that follow remote user movements
 */

import Konva from 'konva';
import type * as Y from 'yjs';

interface DraggedShapeInfo {
	id: string;
	x: number;
	y: number;
	userId: string;
	timestamp: number;
}

/**
 * LiveShapeRenderer displays shapes being dragged by other users
 * Creates semi-transparent ghost shapes that update in real-time
 */
export class LiveShapeRenderer {
	private shapesLayer: Konva.Layer;
	private stage: Konva.Stage;
	private awareness: any;
	private draggedShapeNodes = new Map<string, Konva.Group>();
	private userColors = new Map<string, string>();
	private lastUpdateTime = 0;
	private updateInterval = 16; // 60fps update

	constructor(shapesLayer: Konva.Layer, stage: Konva.Stage, awareness: any) {
		this.shapesLayer = shapesLayer;
		this.stage = stage;
		this.awareness = awareness;

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
	 * Create a ghost shape for a dragged object
	 */
	private createDragGhost(key: string, dragInfo: DraggedShapeInfo): void {
		const userColor = this.userColors.get(dragInfo.userId) || '#3b82f6';

		// Create a simple rectangle ghost (represents any shape type)
		const ghost = new Konva.Group({
			x: dragInfo.x,
			y: dragInfo.y
		});

		// Semi-transparent rectangle outline
		const rect = new Konva.Rect({
			width: 100, // Default size
			height: 100,
			stroke: userColor,
			strokeWidth: 2,
			dash: [5, 5],
			opacity: 0.6,
			fill: userColor,
			fillOpacity: 0.05
		});

		ghost.add(rect);

		// Optional: Add user indicator label
		const label = new Konva.Label({
			x: 10,
			y: 10
		});

		const userInfo = this.awareness.getStates().get(
			Array.from(this.awareness.getStates().entries()).find(
				([_, state]: [any, any]) => state.user?.id === dragInfo.userId
			)?.[0]
		);

		if (userInfo?.user?.name) {
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
