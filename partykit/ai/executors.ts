/**
 * AI Tool Executors
 * Functions that execute AI tools by modifying the Yjs document
 */

import * as Y from 'yjs';
import type { ToolName } from './tools';

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

/**
 * Execute an AI tool by modifying the Yjs document
 */
export async function executeTool(
	toolName: ToolName,
	params: ToolParams,
	ydoc: Y.Doc
): Promise<ToolExecutionResult> {
	const shapesMap = ydoc.getMap<ShapeData>('shapes');

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
					zIndex: shapesMap.size,
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
					zIndex: shapesMap.size,
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
					zIndex: shapesMap.size,
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
					zIndex: shapesMap.size,
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
					zIndex: shapesMap.size,
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
					zIndex: shapesMap.size,
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
					zIndex: shapesMap.size,
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
					zIndex: shapesMap.size,
					createdBy: 'ai',
					createdAt: Date.now()
				};
				shapesMap.set(duplicate.id, duplicate);
				return { success: true, result: duplicate.id };
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

				if (shapes.length < 2) {
					return { success: false, error: 'Need at least 2 shapes to distribute' };
				}

				// Calculate bounds
				const positions = shapes.map((s: ShapeData) => ({ x: s.x as number, y: s.y as number }));

				if (params.direction === 'horizontal') {
					const minX = Math.min(...positions.map((p) => p.x));
					const maxX = Math.max(...positions.map((p) => p.x));
					const spacing = (maxX - minX) / (shapes.length - 1);

					shapes.forEach((shape: ShapeData, index: number) => {
						shapesMap.set(shape.id, {
							...shape,
							x: minX + index * spacing,
							modifiedAt: Date.now()
						});
					});
				} else {
					const minY = Math.min(...positions.map((p) => p.y));
					const maxY = Math.max(...positions.map((p) => p.y));
					const spacing = (maxY - minY) / (shapes.length - 1);

					shapes.forEach((shape: ShapeData, index: number) => {
						shapesMap.set(shape.id, {
							...shape,
							y: minY + index * spacing,
							modifiedAt: Date.now()
						});
					});
				}

				return { success: true };
			}

			case 'alignShapes': {
				const shapes = (params.shapeIds as string[])
					.map((id: string) => shapesMap.get(id))
					.filter((s): s is ShapeData => s !== undefined);

				if (shapes.length === 0) {
					return { success: false, error: 'No shapes found' };
				}

				const alignment = params.alignment as string;

				// Calculate alignment target
				const positions = shapes.map((s: ShapeData) => ({ x: s.x as number, y: s.y as number }));

				let targetValue: number;
				switch (alignment) {
					case 'left': {
						targetValue = Math.min(...positions.map((p) => p.x));
						shapes.forEach((shape: ShapeData) => {
							shapesMap.set(shape.id, { ...shape, x: targetValue, modifiedAt: Date.now() });
						});
						break;
					}
					case 'right': {
						targetValue = Math.max(...positions.map((p) => p.x));
						shapes.forEach((shape: ShapeData) => {
							shapesMap.set(shape.id, { ...shape, x: targetValue, modifiedAt: Date.now() });
						});
						break;
					}
					case 'center': {
						const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
						shapes.forEach((shape: ShapeData) => {
							shapesMap.set(shape.id, { ...shape, x: avgX, modifiedAt: Date.now() });
						});
						break;
					}
					case 'top': {
						targetValue = Math.min(...positions.map((p) => p.y));
						shapes.forEach((shape: ShapeData) => {
							shapesMap.set(shape.id, { ...shape, y: targetValue, modifiedAt: Date.now() });
						});
						break;
					}
					case 'bottom': {
						targetValue = Math.max(...positions.map((p) => p.y));
						shapes.forEach((shape: ShapeData) => {
							shapesMap.set(shape.id, { ...shape, y: targetValue, modifiedAt: Date.now() });
						});
						break;
					}
					case 'middle': {
						const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
						shapes.forEach((shape: ShapeData) => {
							shapesMap.set(shape.id, { ...shape, y: avgY, modifiedAt: Date.now() });
						});
						break;
					}
				}

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
				return { success: true, result: allShapes as unknown as string[] };
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
