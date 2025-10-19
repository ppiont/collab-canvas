/**
 * SelectionNet - Drag-to-select rectangle (Marquee Selection)
 *
 * Handles:
 * - Visual selection rectangle rendering
 * - Bounds calculation during drag
 * - Shape intersection detection
 * - Zoom-aware rendering
 */

import Konva from 'konva';
import type { Shape } from '$lib/types/shapes';

export interface SelectionNetBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * SelectionNet manages marquee selection rectangle
 */
export class SelectionNet {
	private stage: Konva.Stage;
	private layer: Konva.Layer;
	private selectionRect: Konva.Rect | null = null;
	private startPos: { x: number; y: number } | null = null;
	private isActive = false;

	constructor(stage: Konva.Stage, layer: Konva.Layer) {
		this.stage = stage;
		this.layer = layer;
	}

	/**
	 * Start selection rectangle at given screen coordinates
	 */
	start(x: number, y: number): void {
		// Convert screen coordinates to canvas coordinates
		const transform = this.stage.getAbsoluteTransform().copy().invert();
		const canvasPos = transform.point({ x, y });

		this.startPos = canvasPos;
		this.isActive = true;

		// Create visual rectangle
		this.selectionRect = new Konva.Rect({
			x: canvasPos.x,
			y: canvasPos.y,
			width: 0,
			height: 0,
			fill: 'rgba(102, 126, 234, 0.2)',
			stroke: '#667eea',
			strokeWidth: 2 / this.stage.scaleX(), // Adjust for zoom
			dash: [5, 5],
			listening: false // Don't interfere with other events
		});

		this.layer.add(this.selectionRect);
		this.layer.batchDraw();
	}

	/**
	 * Update selection rectangle during drag
	 */
	update(x: number, y: number): void {
		if (!this.isActive || !this.startPos || !this.selectionRect) return;

		// Convert screen coordinates to canvas coordinates
		const transform = this.stage.getAbsoluteTransform().copy().invert();
		const canvasPos = transform.point({ x, y });

		// Calculate rectangle bounds (handle negative widths/heights)
		const x1 = Math.min(this.startPos.x, canvasPos.x);
		const y1 = Math.min(this.startPos.y, canvasPos.y);
		const x2 = Math.max(this.startPos.x, canvasPos.x);
		const y2 = Math.max(this.startPos.y, canvasPos.y);

		// Update rectangle
		this.selectionRect.x(x1);
		this.selectionRect.y(y1);
		this.selectionRect.width(x2 - x1);
		this.selectionRect.height(y2 - y1);
		this.selectionRect.strokeWidth(2 / this.stage.scaleX()); // Adjust for zoom

		this.layer.batchDraw();
	}

	/**
	 * Finish selection and return bounds in canvas coordinates
	 */
	end(): SelectionNetBounds | null {
		if (!this.isActive || !this.selectionRect) return null;

		const bounds = {
			x: this.selectionRect.x(),
			y: this.selectionRect.y(),
			width: this.selectionRect.width(),
			height: this.selectionRect.height()
		};

		// Clean up
		this.selectionRect.destroy();
		this.selectionRect = null;
		this.startPos = null;
		this.isActive = false;
		this.layer.batchDraw();

		return bounds;
	}

	/**
	 * Cancel selection without completing
	 */
	cancel(): void {
		if (this.selectionRect) {
			this.selectionRect.destroy();
			this.selectionRect = null;
		}
		this.startPos = null;
		this.isActive = false;
		this.layer.batchDraw();
	}

	/**
	 * Check if selection is active
	 */
	isActiveSelection(): boolean {
		return this.isActive;
	}

	/**
	 * Get shapes intersecting with selection bounds
	 */
	getIntersectingShapes(bounds: SelectionNetBounds, shapes: Shape[]): string[] {
		const intersecting: string[] = [];

		for (const shape of shapes) {
			const doesIntersect = this.shapeIntersectsBounds(shape, bounds);

			if (doesIntersect) {
				intersecting.push(shape.id);
			}
		}

		return intersecting;
	}

	/**
	 * Check if shape intersects selection bounds using AABB collision
	 */
	private shapeIntersectsBounds(shape: Shape, bounds: SelectionNetBounds): boolean {
		// Get shape bounds based on type
		let shapeBounds: { x: number; y: number; width: number; height: number };

		switch (shape.type) {
			case 'rectangle': {
				// Konva.Rect uses top-left positioning by default
				shapeBounds = {
					x: shape.x,
					y: shape.y,
					width: shape.width,
					height: shape.height
				};
				break;
			}

			case 'triangle': {
				// Triangles use width and height like rectangles
				const triangleShape = shape as Extract<Shape, { type: 'triangle' }>;
				shapeBounds = {
					x: shape.x,
					y: shape.y,
					width: triangleShape.width,
					height: triangleShape.height
				};
				break;
			}

			case 'circle': {
				// Circles are centered
				shapeBounds = {
					x: shape.x - shape.radius,
					y: shape.y - shape.radius,
					width: shape.radius * 2,
					height: shape.radius * 2
				};
				break;
			}

			case 'polygon': {
				const polygonShape = shape as Extract<Shape, { type: 'polygon' }>;
				// Polygons are now RegularPolygon with radius
				shapeBounds = {
					x: shape.x - polygonShape.radius,
					y: shape.y - polygonShape.radius,
					width: polygonShape.radius * 2,
					height: polygonShape.radius * 2
				};
				break;
			}

			case 'star': {
				// Use radius as bounding box approximation
				const radius =
					shape.type === 'star'
						? (shape as Extract<Shape, { type: 'star' }>).outerRadius
						: (shape as Extract<Shape, { type: 'polygon' }>).radius;
				shapeBounds = {
					x: shape.x - radius,
					y: shape.y - radius,
					width: radius * 2,
					height: radius * 2
				};
				break;
			}

			case 'line': {
				// Calculate line bounds from points
				const points = shape.points;
				const xs = points.filter((_, i) => i % 2 === 0);
				const ys = points.filter((_, i) => i % 2 === 1);
				const minX = Math.min(...xs);
				const maxX = Math.max(...xs);
				const minY = Math.min(...ys);
				const maxY = Math.max(...ys);
				shapeBounds = {
					x: shape.x + minX,
					y: shape.y + minY,
					width: maxX - minX,
					height: maxY - minY
				};
				break;
			}

		case 'text': {
			// Use actual width/height if available, otherwise estimate from font size
			const textWidth = shape.width || (shape.text?.length || 1) * (shape.fontSize || 16) * 0.6;
			const textHeight = shape.height || (shape.fontSize || 16) * 1.2;
			shapeBounds = {
				x: shape.x,
				y: shape.y,
				width: textWidth,
				height: textHeight
			};
			break;
		}

			default:
				return false;
		}

		// AABB (Axis-Aligned Bounding Box) intersection test
		const intersects = !(
			shapeBounds.x + shapeBounds.width < bounds.x ||
			shapeBounds.x > bounds.x + bounds.width ||
			shapeBounds.y + shapeBounds.height < bounds.y ||
			shapeBounds.y > bounds.y + bounds.height
		);

		return intersects;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.cancel();
	}
}
