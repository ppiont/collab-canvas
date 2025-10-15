/**
 * AI Tool Executors
 * Functions that execute AI tools by modifying the Yjs document
 */

import * as Y from 'yjs';
import type { ToolName } from './tools';
import type { DurableObjectStorage } from '@cloudflare/workers-types';

/** Shape type from frontend (matches src/lib/types/shapes.ts) */
type Shape = any; // Will be synced from Yjs, no need for full type definition

/**
 * Execute an AI tool by modifying the Yjs document
 */
export async function executeTool(
    toolName: ToolName,
    params: any,
    ydoc: Y.Doc,
    storage?: DurableObjectStorage
): Promise<{ success: boolean; result?: any; error?: string }> {
    const shapesMap = ydoc.getMap('shapes');

    try {
        switch (toolName) {
            // ═══════════════════════════════════════════════════════
            // CREATION TOOLS
            // ═══════════════════════════════════════════════════════

            case 'createRectangle': {
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'rectangle',
                    x: params.x,
                    y: params.y,
                    width: params.width || 150,
                    height: params.height || 100,
                    fill: params.fill || '#3b82f6',
                    stroke: params.stroke || '#1e3a8a',
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
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'circle',
                    x: params.x,
                    y: params.y,
                    radius: params.radius || 50,
                    fill: params.fill || '#3b82f6',
                    stroke: params.stroke || '#1e3a8a',
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

            case 'createEllipse': {
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'ellipse',
                    x: params.x,
                    y: params.y,
                    radiusX: params.radiusX || 75,
                    radiusY: params.radiusY || 50,
                    fill: params.fill || '#3b82f6',
                    stroke: params.stroke || '#1e3a8a',
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
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'line',
                    x: 0,
                    y: 0,
                    points: params.points,
                    stroke: params.stroke || '#1e3a8a',
                    strokeWidth: params.strokeWidth || 2,
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
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'text',
                    x: params.x,
                    y: params.y,
                    text: params.text,
                    fontSize: params.fontSize || 16,
                    fontFamily: params.fontFamily || 'system-ui',
                    fill: params.fill || '#000000',
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
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'polygon',
                    x: params.x,
                    y: params.y,
                    sides: Math.min(12, Math.max(3, params.sides || 5)),
                    radius: params.radius || 50,
                    fill: params.fill || '#3b82f6',
                    stroke: params.stroke || '#1e3a8a',
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
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'star',
                    x: params.x,
                    y: params.y,
                    numPoints: Math.min(12, Math.max(5, params.numPoints || 5)),
                    innerRadius: params.innerRadius || 25,
                    outerRadius: params.outerRadius || 50,
                    fill: params.fill || '#3b82f6',
                    stroke: params.stroke || '#1e3a8a',
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

            case 'createImage': {
                const newShape = {
                    id: crypto.randomUUID(),
                    type: 'image',
                    x: params.x,
                    y: params.y,
                    width: params.width || 200,
                    height: params.height || 200,
                    imageUrl: params.imageUrl || `https://via.placeholder.com/${params.width || 200}x${params.height || 200}`,
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
                const shape = shapesMap.get(params.shapeId);
                if (!shape) {
                    return { success: false, error: 'Shape not found' };
                }
                shapesMap.set(params.shapeId, {
                    ...shape,
                    x: params.x,
                    y: params.y,
                    modifiedAt: Date.now()
                });
                return { success: true };
            }

            case 'resizeShape': {
                const shape = shapesMap.get(params.shapeId);
                if (!shape) {
                    return { success: false, error: 'Shape not found' };
                }

                const updates: any = { modifiedAt: Date.now() };

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

                shapesMap.set(params.shapeId, { ...shape, ...updates });
                return { success: true };
            }

            case 'rotateShape': {
                const shape = shapesMap.get(params.shapeId);
                if (!shape) {
                    return { success: false, error: 'Shape not found' };
                }
                shapesMap.set(params.shapeId, {
                    ...shape,
                    rotation: params.degrees % 360,
                    modifiedAt: Date.now()
                });
                return { success: true };
            }

            case 'updateShapeColor': {
                const shape = shapesMap.get(params.shapeId);
                if (!shape) {
                    return { success: false, error: 'Shape not found' };
                }
                const updates: any = { modifiedAt: Date.now() };
                if (params.fill !== undefined) updates.fill = params.fill;
                if (params.stroke !== undefined) updates.stroke = params.stroke;

                shapesMap.set(params.shapeId, { ...shape, ...updates });
                return { success: true };
            }

            case 'deleteShape': {
                const shape = shapesMap.get(params.shapeId);
                if (!shape) {
                    return { success: false, error: 'Shape not found' };
                }
                shapesMap.delete(params.shapeId);
                return { success: true };
            }

            case 'duplicateShape': {
                const shape = shapesMap.get(params.shapeId);
                if (!shape) {
                    return { success: false, error: 'Shape not found' };
                }
                const duplicate = {
                    ...shape,
                    id: crypto.randomUUID(),
                    x: shape.x + (params.offsetX || 20),
                    y: shape.y + (params.offsetY || 20),
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
                const shapes = params.shapeIds
                    .map((id: string) => shapesMap.get(id))
                    .filter((s: any) => s !== undefined);

                if (shapes.length === 0) {
                    return { success: false, error: 'No shapes found' };
                }

                const spacing = params.spacing || 20;
                let currentX = params.startX || 100;
                const y = params.startY || shapes[0].y;

                shapes.forEach((shape: any, index: number) => {
                    const width = shape.width || shape.radius * 2 || 100;
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
                const shapes = params.shapeIds
                    .map((id: string) => shapesMap.get(id))
                    .filter((s: any) => s !== undefined);

                if (shapes.length === 0) {
                    return { success: false, error: 'No shapes found' };
                }

                const spacing = params.spacing || 20;
                const x = params.startX || shapes[0].x;
                let currentY = params.startY || 100;

                shapes.forEach((shape: any) => {
                    const height = shape.height || shape.radius * 2 || 100;
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
                const shapes = params.shapeIds
                    .map((id: string) => shapesMap.get(id))
                    .filter((s: any) => s !== undefined);

                if (shapes.length === 0) {
                    return { success: false, error: 'No shapes found' };
                }

                const spacing = params.spacing || 20;
                const startX = params.startX || 100;
                const startY = params.startY || 100;
                const cols = params.columns;

                shapes.forEach((shape: any, index: number) => {
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    const cellWidth = 150; // Approximate cell size
                    const cellHeight = 150;

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
                const shapes = params.shapeIds
                    .map((id: string) => shapesMap.get(id))
                    .filter((s: any) => s !== undefined);

                if (shapes.length < 2) {
                    return { success: false, error: 'Need at least 2 shapes to distribute' };
                }

                // Calculate bounds
                const positions = shapes.map((s: any) => ({ x: s.x, y: s.y }));

                if (params.direction === 'horizontal') {
                    const minX = Math.min(...positions.map(p => p.x));
                    const maxX = Math.max(...positions.map(p => p.x));
                    const spacing = (maxX - minX) / (shapes.length - 1);

                    shapes.forEach((shape: any, index: number) => {
                        shapesMap.set(shape.id, {
                            ...shape,
                            x: minX + index * spacing,
                            modifiedAt: Date.now()
                        });
                    });
                } else {
                    const minY = Math.min(...positions.map(p => p.y));
                    const maxY = Math.max(...positions.map(p => p.y));
                    const spacing = (maxY - minY) / (shapes.length - 1);

                    shapes.forEach((shape: any, index: number) => {
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
                const shapes = params.shapeIds
                    .map((id: string) => shapesMap.get(id))
                    .filter((s: any) => s !== undefined);

                if (shapes.length === 0) {
                    return { success: false, error: 'No shapes found' };
                }

                const alignment = params.alignment;

                // Calculate alignment target
                const positions = shapes.map((s: any) => ({ x: s.x, y: s.y }));

                let targetValue: number;
                switch (alignment) {
                    case 'left':
                        targetValue = Math.min(...positions.map(p => p.x));
                        shapes.forEach((shape: any) => {
                            shapesMap.set(shape.id, { ...shape, x: targetValue, modifiedAt: Date.now() });
                        });
                        break;
                    case 'right':
                        targetValue = Math.max(...positions.map(p => p.x));
                        shapes.forEach((shape: any) => {
                            shapesMap.set(shape.id, { ...shape, x: targetValue, modifiedAt: Date.now() });
                        });
                        break;
                    case 'center':
                        const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
                        shapes.forEach((shape: any) => {
                            shapesMap.set(shape.id, { ...shape, x: avgX, modifiedAt: Date.now() });
                        });
                        break;
                    case 'top':
                        targetValue = Math.min(...positions.map(p => p.y));
                        shapes.forEach((shape: any) => {
                            shapesMap.set(shape.id, { ...shape, y: targetValue, modifiedAt: Date.now() });
                        });
                        break;
                    case 'bottom':
                        targetValue = Math.max(...positions.map(p => p.y));
                        shapes.forEach((shape: any) => {
                            shapesMap.set(shape.id, { ...shape, y: targetValue, modifiedAt: Date.now() });
                        });
                        break;
                    case 'middle':
                        const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
                        shapes.forEach((shape: any) => {
                            shapesMap.set(shape.id, { ...shape, y: avgY, modifiedAt: Date.now() });
                        });
                        break;
                }

                return { success: true };
            }

            // ═══════════════════════════════════════════════════════
            // QUERY TOOLS
            // ═══════════════════════════════════════════════════════

            case 'getCanvasState': {
                const allShapes: any[] = [];
                shapesMap.forEach((shape, id) => {
                    allShapes.push({ ...shape, id });
                });
                return { success: true, result: allShapes };
            }

            case 'findShapesByType': {
                const matching: string[] = [];
                shapesMap.forEach((shape, id) => {
                    if (shape.type === params.type) {
                        matching.push(id);
                    }
                });
                return { success: true, result: matching };
            }

            case 'findShapesByColor': {
                const matching: string[] = [];
                shapesMap.forEach((shape, id) => {
                    if (shape.fill === params.color) {
                        matching.push(id);
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
export function getCanvasState(ydoc: Y.Doc): any[] {
    const shapesMap = ydoc.getMap('shapes');
    const allShapes: any[] = [];
    shapesMap.forEach((shape, id) => {
        allShapes.push({ ...shape, id });
    });
    return allShapes;
}

