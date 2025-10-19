/**
 * AI Tool Executors
 * Functions that execute AI tools by modifying the Yjs document
 */

import * as Y from 'yjs';
import type { ToolName } from './tools';
import * as AlignmentCore from '../../src/lib/utils/alignment-core';

/** Result type for tool execution */
export interface ToolExecutionResult {
	success: boolean;
	result?: string | string[];
	error?: string;
}

/** Shape type from frontend (matches src/lib/types/shapes.ts) */
interface ShapeData {
	[key: string]: unknown;
	id: string;
	type: string;
	x: number;
	y: number;
}

/** Params type for tool execution */
interface ToolParams {
	[key: string]: unknown;
}

/** Viewport type for filtering */
interface Viewport {
	centerX: number;
	centerY: number;
	stageWidth: number;
	stageHeight: number;
	zoom: number;
}

/**
 * Filter shapes to only those visible in the viewport
 */
function filterShapesInViewport(shapes: ShapeData[], viewport: Viewport): ShapeData[] {
	const viewportLeft = viewport.centerX - viewport.stageWidth / (2 * viewport.zoom);
	const viewportRight = viewport.centerX + viewport.stageWidth / (2 * viewport.zoom);
	const viewportTop = viewport.centerY - viewport.stageHeight / (2 * viewport.zoom);
	const viewportBottom = viewport.centerY + viewport.stageHeight / (2 * viewport.zoom);

	// Add some padding (20%) to catch shapes near edges
	const padding = 0.2;
	const paddedLeft = viewportLeft - (viewport.stageWidth / viewport.zoom) * padding;
	const paddedRight = viewportRight + (viewport.stageWidth / viewport.zoom) * padding;
	const paddedTop = viewportTop - (viewport.stageHeight / viewport.zoom) * padding;
	const paddedBottom = viewportBottom + (viewport.stageHeight / viewport.zoom) * padding;

	return shapes.filter((shape) => {
		// Simple bounding box check - shape's position is in viewport
		return (
			shape.x >= paddedLeft &&
			shape.x <= paddedRight &&
			shape.y >= paddedTop &&
			shape.y <= paddedBottom
		);
	});
}

/**
 * Execute an AI tool by modifying the Yjs document
 */
export async function executeTool(
	toolName: ToolName,
	params: ToolParams,
	ydoc: Y.Doc
): Promise<ToolExecutionResult> {
	const shapesMap = ydoc.getMap<ShapeData>('shapes');
	const metadata = ydoc.getMap('metadata');

	// Initialize or get the current z-index counter
	let zIndexCounter = (metadata.get('nextZIndex') as number) || 0;
	const getNextZIndex = (): number => {
		zIndexCounter++;
		metadata.set('nextZIndex', zIndexCounter);
		return zIndexCounter;
	};

	try {
		switch (toolName) {
			// ═══════════════════════════════════════════════════════
			// CREATION TOOLS
			// ═══════════════════════════════════════════════════════

			case 'createRectangle': {
				const newShape: ShapeData = {
					id: crypto.randomUUID(),
					type: 'rectangle',
					x: (params.x as number) || 0,
					y: (params.y as number) || 0,
					width: (params.width as number) || 150,
					height: (params.height as number) || 100,
					fill: (params.fill as string) || '#3b82f6',
					stroke: (params.stroke as string) || '#1e3a8a',
					strokeWidth: 2,
					opacity: 1,
					rotation: 0,
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now(),
					draggable: true
				};
				shapesMap.set(newShape.id, newShape);
				return { success: true, result: newShape.id };
			}

			case 'createCircle': {
				const newShape: ShapeData = {
					id: crypto.randomUUID(),
					type: 'circle',
					x: (params.x as number) || 0,
					y: (params.y as number) || 0,
					radius: (params.radius as number) || 50,
					fill: (params.fill as string) || '#3b82f6',
					stroke: (params.stroke as string) || '#1e3a8a',
					strokeWidth: 2,
					opacity: 1,
					rotation: 0,
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(newShape.id, newShape);
				return { success: true, result: newShape.id };
			}

			case 'createLine': {
				const newShape: ShapeData = {
					id: crypto.randomUUID(),
					type: 'line',
					x: 0,
					y: 0,
					points: params.points,
					stroke: (params.stroke as string) || '#1e3a8a',
					strokeWidth: (params.strokeWidth as number) || 2,
					opacity: 1,
					rotation: 0,
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(newShape.id, newShape);
				return { success: true, result: newShape.id };
			}

			case 'createText': {
				const newShape: ShapeData = {
					id: crypto.randomUUID(),
					type: 'text',
					x: (params.x as number) || 0,
					y: (params.y as number) || 0,
					text: params.text,
					fontSize: (params.fontSize as number) || 16,
					fontFamily: (params.fontFamily as string) || 'system-ui',
					fill: (params.fill as string) || '#000000',
					align: 'left',
					opacity: 1,
					rotation: 0,
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(newShape.id, newShape);
				return { success: true, result: newShape.id };
			}

			case 'createPolygon': {
				const newShape: ShapeData = {
					id: crypto.randomUUID(),
					type: 'polygon',
					x: (params.x as number) || 0,
					y: (params.y as number) || 0,
					sides: Math.min(12, Math.max(3, (params.sides as number) || 5)),
					radius: (params.radius as number) || 50,
					fill: (params.fill as string) || '#3b82f6',
					stroke: (params.stroke as string) || '#1e3a8a',
					strokeWidth: 2,
					opacity: 1,
					rotation: 0,
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(newShape.id, newShape);
				return { success: true, result: newShape.id };
			}

			case 'createStar': {
				const newShape: ShapeData = {
					id: crypto.randomUUID(),
					type: 'star',
					x: (params.x as number) || 0,
					y: (params.y as number) || 0,
					numPoints: Math.min(12, Math.max(5, (params.numPoints as number) || 5)),
					innerRadius: (params.innerRadius as number) || 25,
					outerRadius: (params.outerRadius as number) || 50,
					fill: (params.fill as string) || '#3b82f6',
					stroke: (params.stroke as string) || '#1e3a8a',
					strokeWidth: 2,
					opacity: 1,
					rotation: 0,
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(newShape.id, newShape);
				return { success: true, result: newShape.id };
			}

			case 'createTriangle': {
				const newShape: ShapeData = {
					id: crypto.randomUUID(),
					type: 'triangle',
					x: (params.x as number) || 0,
					y: (params.y as number) || 0,
					width: (params.width as number) || 100,
					height: (params.height as number) || 100,
					fill: (params.fill as string) || '#3b82f6',
					stroke: (params.stroke as string) || '#1e3a8a',
					strokeWidth: 2,
					opacity: 1,
					rotation: 0,
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(newShape.id, newShape);
				return { success: true, result: newShape.id };
			}

			// ═══════════════════════════════════════════════════════
			// MANIPULATION TOOLS
			// ═══════════════════════════════════════════════════════

			case 'moveShape': {
				const shape = shapesMap.get(params.shapeId as string);
				if (!shape) {
					return { success: false, error: 'Shape not found' };
				}
				shapesMap.set(params.shapeId as string, {
					...shape,
					x: (params.x as number) || 0,
					y: (params.y as number) || 0,
					modifiedAt: Date.now()
				});
				return { success: true };
			}

			case 'resizeShape': {
				const shape = shapesMap.get(params.shapeId as string);
				if (!shape) {
					return { success: false, error: 'Shape not found' };
				}

				const updates: ShapeData = { ...shape };

				// Handle different shape types
				if (params.width !== undefined) updates.width = params.width;
				if (params.height !== undefined) updates.height = params.height;
				if (params.radius !== undefined) {
					if (shape.type === 'circle') {
						updates.radius = params.radius;
					} else if (shape.type === 'polygon' || shape.type === 'star') {
						updates.radius = params.radius;
					}
				}
				if (params.radiusX !== undefined) updates.radiusX = params.radiusX;
				if (params.radiusY !== undefined) updates.radiusY = params.radiusY;
				updates.modifiedAt = Date.now();

				shapesMap.set(params.shapeId as string, updates);
				return { success: true };
			}

			case 'rotateShape': {
				const shape = shapesMap.get(params.shapeId as string);
				if (!shape) {
					return { success: false, error: 'Shape not found' };
				}
				shapesMap.set(params.shapeId as string, {
					...shape,
					rotation: (params.degrees as number) % 360,
					modifiedAt: Date.now()
				});
				return { success: true };
			}

			case 'updateShapeColor': {
				const shape = shapesMap.get(params.shapeId as string);
				if (!shape) {
					return { success: false, error: 'Shape not found' };
				}
				const updates: ShapeData = { ...shape };
				if (params.fill !== undefined) updates.fill = params.fill;
				if (params.stroke !== undefined) updates.stroke = params.stroke;
				updates.modifiedAt = Date.now();

				shapesMap.set(params.shapeId as string, updates);
				return { success: true };
			}

			case 'updateText': {
				const shape = shapesMap.get(params.shapeId as string);
				if (!shape || shape.type !== 'text') {
					return { success: false, error: 'Text shape not found' };
				}

				const updates: Partial<ShapeData> = {};
				if (params.text !== undefined) updates.text = params.text as string;
				if (params.fontSize !== undefined)
					updates.fontSize = Math.max(8, Math.min(144, params.fontSize as number));
				if (params.fontFamily !== undefined) updates.fontFamily = params.fontFamily as string;
				if (params.fontWeight !== undefined) updates.fontWeight = params.fontWeight as string;
				if (params.fontStyle !== undefined) updates.fontStyle = params.fontStyle as string;
				if (params.textDecoration !== undefined)
					updates.textDecoration = params.textDecoration as string;
				if (params.align !== undefined) updates.align = params.align as string;
				if (params.fill !== undefined) updates.fill = params.fill as string;

				shapesMap.set(params.shapeId as string, { ...shape, ...updates, modifiedAt: Date.now() });
				return { success: true, result: params.shapeId as string };
			}

			case 'deleteShape': {
				const shape = shapesMap.get(params.shapeId as string);
				if (!shape) {
					return { success: false, error: 'Shape not found' };
				}
				shapesMap.delete(params.shapeId as string);
				return { success: true };
			}

			case 'duplicateShape': {
				const shape = shapesMap.get(params.shapeId as string);
				if (!shape) {
					return { success: false, error: 'Shape not found' };
				}
				const duplicate: ShapeData = {
					...shape,
					id: crypto.randomUUID(),
					x: (shape.x as number) + ((params.offsetX as number) || 20),
					y: (shape.y as number) + ((params.offsetY as number) || 20),
					zIndex: getNextZIndex(),
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(duplicate.id, duplicate);
				return { success: true, result: duplicate.id };
			}

			// ═══════════════════════════════════════════════════════
			// Z-ORDER TOOLS
			// ═══════════════════════════════════════════════════════

			case 'bringToFront': {
				const shapeIds = params.shapeIds as string[];
				if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
					return { success: false, error: 'No shape IDs provided' };
				}

				const frontZ = getNextZIndex();
				shapeIds.forEach((id: string) => {
					const shape = shapesMap.get(id);
					if (shape) {
						shapesMap.set(id, {
							...shape,
							zIndex: frontZ,
							modifiedAt: Date.now()
						});
					}
				});

				return { success: true };
			}

			case 'sendToBack': {
				const shapeIds = params.shapeIds as string[];
				if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
					return { success: false, error: 'No shape IDs provided' };
				}

				// Send to back by using negative counter
				zIndexCounter--;
				metadata.set('nextZIndex', zIndexCounter);
				const backZ = zIndexCounter;

				shapeIds.forEach((id: string) => {
					const shape = shapesMap.get(id);
					if (shape) {
						shapesMap.set(id, {
							...shape,
							zIndex: backZ,
							modifiedAt: Date.now()
						});
					}
				});

				return { success: true };
			}

			// ═══════════════════════════════════════════════════════
			// LAYOUT TOOLS
			// ═══════════════════════════════════════════════════════

			case 'arrangeHorizontal': {
				const shapes = (params.shapeIds as string[])
					.map((id: string) => shapesMap.get(id))
					.filter((s): s is ShapeData => s !== undefined);

				if (shapes.length === 0) {
					return { success: false, error: 'No shapes found' };
				}

				const spacing = (params.spacing as number) || 20;
				let currentX = (params.startX as number) || 100;
				const y = (params.startY as number) || (shapes[0].y as number);

				shapes.forEach((shape: ShapeData) => {
					const width = (shape.width as number) || (shape.radius as number) * 2 || 100;
					shapesMap.set(shape.id, {
						...shape,
						x: currentX,
						y: y,
						modifiedAt: Date.now()
					});
					currentX += width + spacing;
				});

				return { success: true };
			}

			case 'arrangeVertical': {
				const shapes = (params.shapeIds as string[])
					.map((id: string) => shapesMap.get(id))
					.filter((s): s is ShapeData => s !== undefined);

				if (shapes.length === 0) {
					return { success: false, error: 'No shapes found' };
				}

				const spacing = (params.spacing as number) || 20;
				const x = (params.startX as number) || (shapes[0].x as number);
				let currentY = (params.startY as number) || 100;

				shapes.forEach((shape: ShapeData) => {
					const height = (shape.height as number) || (shape.radius as number) * 2 || 100;
					shapesMap.set(shape.id, {
						...shape,
						x: x,
						y: currentY,
						modifiedAt: Date.now()
					});
					currentY += height + spacing;
				});

				return { success: true };
			}

			case 'arrangeGrid': {
				const shapes = (params.shapeIds as string[])
					.map((id: string) => shapesMap.get(id))
					.filter((s): s is ShapeData => s !== undefined);

				if (shapes.length === 0) {
					return { success: false, error: 'No shapes found' };
				}

				const spacing = (params.spacing as number) || 20;
				const startX = (params.startX as number) || 100;
				const startY = (params.startY as number) || 100;
				const cols = params.columns as number;
				const cellWidth = 150; // Approximate cell size
				const cellHeight = 150;

				shapes.forEach((shape: ShapeData, index: number) => {
					const row = Math.floor(index / cols);
					const col = index % cols;

					shapesMap.set(shape.id, {
						...shape,
						x: startX + col * (cellWidth + spacing),
						y: startY + row * (cellHeight + spacing),
						modifiedAt: Date.now()
					});
				});

				return { success: true };
			}

			case 'distributeEvenly': {
				const shapes = (params.shapeIds as string[])
					.map((id: string) => shapesMap.get(id))
					.filter((s): s is ShapeData => s !== undefined);

				if (shapes.length < 3) {
					return { success: false, error: 'Need at least 3 shapes to distribute' };
				}

				// Convert to AlignmentCore.ShapeData format
				const alignmentShapes: AlignmentCore.ShapeData[] = shapes.map(s => ({
					id: s.id,
					x: s.x as number,
					y: s.y as number,
					width: s.width as number | undefined,
					height: s.height as number | undefined,
					radius: s.radius as number | undefined,
					outerRadius: s.outerRadius as number | undefined,
					fontSize: s.fontSize as number | undefined,
					type: s.type
				}));

				// Use shared distribution core logic
				const updates = params.direction === 'horizontal'
					? AlignmentCore.distributeHorizontally(alignmentShapes)
					: AlignmentCore.distributeVertically(alignmentShapes);

				// Apply updates to shapes
				updates.forEach(update => {
					const shape = shapesMap.get(update.id);
					if (shape) {
						shapesMap.set(update.id, {
							...shape,
							x: update.x,
							y: update.y,
							modifiedAt: Date.now()
						});
					}
				});

				return { success: true };
			}

			case 'alignShapes': {
				const shapes = (params.shapeIds as string[])
					.map((id: string) => shapesMap.get(id))
					.filter((s): s is ShapeData => s !== undefined);

				if (shapes.length < 2) {
					return { success: false, error: 'Need at least 2 shapes to align' };
				}

				const alignment = params.alignment as string;

				// Convert to AlignmentCore.ShapeData format
				const alignmentShapes: AlignmentCore.ShapeData[] = shapes.map(s => ({
					id: s.id,
					x: s.x as number,
					y: s.y as number,
					width: s.width as number | undefined,
					height: s.height as number | undefined,
					radius: s.radius as number | undefined,
					outerRadius: s.outerRadius as number | undefined,
					fontSize: s.fontSize as number | undefined,
					type: s.type
				}));

				// Use shared alignment core logic
				let updates: AlignmentCore.PositionUpdate[];
				switch (alignment) {
					case 'left':
						updates = AlignmentCore.alignLeft(alignmentShapes);
						break;
					case 'center':
						updates = AlignmentCore.alignCenter(alignmentShapes);
						break;
					case 'right':
						updates = AlignmentCore.alignRight(alignmentShapes);
						break;
					case 'top':
						updates = AlignmentCore.alignTop(alignmentShapes);
						break;
					case 'middle':
						updates = AlignmentCore.alignMiddle(alignmentShapes);
						break;
					case 'bottom':
						updates = AlignmentCore.alignBottom(alignmentShapes);
						break;
					default:
						return { success: false, error: `Unknown alignment type: ${alignment}` };
				}

				// Apply updates to shapes
				updates.forEach(update => {
					const shape = shapesMap.get(update.id);
					if (shape) {
						shapesMap.set(update.id, {
							...shape,
							x: update.x,
							y: update.y,
							modifiedAt: Date.now()
						});
					}
				});

				return { success: true };
			}

			// ═══════════════════════════════════════════════════════
			// QUERY TOOLS
			// ═══════════════════════════════════════════════════════

			case 'getCanvasState': {
				const allShapes: ShapeData[] = [];
				shapesMap.forEach((shape) => {
					allShapes.push(shape);
				});

				// Filter to only visible shapes if viewport is provided
				const visibleShapes =
					params.viewport && typeof params.viewport === 'object'
						? filterShapesInViewport(allShapes, params.viewport as Viewport)
						: allShapes;

				return { success: true, result: visibleShapes as unknown as string[] };
			}

			case 'findShapesByType': {
				const matching: string[] = [];
				shapesMap.forEach((shape) => {
					if (shape.type === params.type) {
						matching.push(shape.id);
					}
				});
				return { success: true, result: matching };
			}

			case 'findShapesByColor': {
				const matching: string[] = [];
				shapesMap.forEach((shape) => {
					if (shape.fill === params.color) {
						matching.push(shape.id);
					}
				});
				return { success: true, result: matching };
			}

			default:
				return { success: false, error: `Unknown tool: ${toolName}` };
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Tool execution failed'
		};
	}
}

/**
 * Get current canvas state (all shapes)
 */
export function getCanvasState(ydoc: Y.Doc): ShapeData[] {
	const shapesMap = ydoc.getMap<ShapeData>('shapes');
	const allShapes: ShapeData[] = [];
	shapesMap.forEach((shape) => {
		allShapes.push(shape);
	});
	return allShapes;
}
