/**
 * Core alignment math - works with plain shape data
 * Shared between client (Konva) and server (AI tools)
 */

export interface ShapeData {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    outerRadius?: number;
    fontSize?: number;
    type: string;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PositionUpdate {
    id: string;
    x: number;
    y: number;
}

/**
 * Calculate bounding box for a shape based on its type and properties
 */
export function getShapeBoundingBox(shape: ShapeData): BoundingBox {
    const x = shape.x;
    const y = shape.y;

    switch (shape.type) {
        case 'rectangle':
        case 'triangle':
            return {
                x: x,
                y: y,
                width: shape.width || 100,
                height: shape.height || 100
            };
        case 'circle': {
            const radius = shape.radius || 50;
            return {
                x: x - radius,
                y: y - radius,
                width: radius * 2,
                height: radius * 2
            };
        }
        case 'polygon':
        case 'star': {
            const radius = shape.outerRadius || shape.radius || 50;
            return {
                x: x - radius,
                y: y - radius,
                width: radius * 2,
                height: radius * 2
            };
        }
        case 'text':
            return {
                x: x,
                y: y,
                width: 100,
                height: shape.fontSize || 16
            };
        default:
            return { x: x, y: y, width: 100, height: 100 };
    }
}

/**
 * Align shapes to the leftmost edge
 */
export function alignLeft(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 2) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));
    const leftEdge = Math.min(...boxes.map((b) => b.box.x));

    return boxes.map(({ shape, box }) => {
        const deltaX = leftEdge - box.x;
        return {
            id: shape.id,
            x: shape.x + deltaX,
            y: shape.y
        };
    });
}

/**
 * Align shapes to horizontal center
 */
export function alignCenter(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 2) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));
    const minX = Math.min(...boxes.map((b) => b.box.x));
    const maxX = Math.max(...boxes.map((b) => b.box.x + b.box.width));
    const centerX = (minX + maxX) / 2;

    return boxes.map(({ shape, box }) => {
        const currentCenterX = box.x + box.width / 2;
        const deltaX = centerX - currentCenterX;
        return {
            id: shape.id,
            x: shape.x + deltaX,
            y: shape.y
        };
    });
}

/**
 * Align shapes to the rightmost edge
 */
export function alignRight(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 2) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));
    const rightEdge = Math.max(...boxes.map((b) => b.box.x + b.box.width));

    return boxes.map(({ shape, box }) => {
        const currentRight = box.x + box.width;
        const deltaX = rightEdge - currentRight;
        return {
            id: shape.id,
            x: shape.x + deltaX,
            y: shape.y
        };
    });
}

/**
 * Align shapes to the topmost edge
 */
export function alignTop(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 2) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));
    const topEdge = Math.min(...boxes.map((b) => b.box.y));

    return boxes.map(({ shape, box }) => {
        const deltaY = topEdge - box.y;
        return {
            id: shape.id,
            x: shape.x,
            y: shape.y + deltaY
        };
    });
}

/**
 * Align shapes to vertical middle (center vertically)
 */
export function alignMiddle(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 2) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));
    const minY = Math.min(...boxes.map((b) => b.box.y));
    const maxY = Math.max(...boxes.map((b) => b.box.y + b.box.height));
    const centerY = (minY + maxY) / 2;

    return boxes.map(({ shape, box }) => {
        const currentCenterY = box.y + box.height / 2;
        const deltaY = centerY - currentCenterY;
        return {
            id: shape.id,
            x: shape.x,
            y: shape.y + deltaY
        };
    });
}

/**
 * Align shapes to the bottommost edge
 */
export function alignBottom(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 2) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));
    const bottomEdge = Math.max(...boxes.map((b) => b.box.y + b.box.height));

    return boxes.map(({ shape, box }) => {
        const currentBottom = box.y + box.height;
        const deltaY = bottomEdge - currentBottom;
        return {
            id: shape.id,
            x: shape.x,
            y: shape.y + deltaY
        };
    });
}

/**
 * Distribute shapes evenly along the horizontal axis
 */
export function distributeHorizontally(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 3) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));

    // Sort by center x position
    const sorted = [...boxes].sort((a, b) => {
        const aCenterX = a.box.x + a.box.width / 2;
        const bCenterX = b.box.x + b.box.width / 2;
        return aCenterX - bCenterX;
    });

    const leftmostCenter = sorted[0].box.x + sorted[0].box.width / 2;
    const rightmostCenter =
        sorted[sorted.length - 1].box.x + sorted[sorted.length - 1].box.width / 2;

    const totalSpace = rightmostCenter - leftmostCenter;
    const spacing = totalSpace / (sorted.length - 1);

    return sorted.map(({ shape, box }, index) => {
        const currentCenter = box.x + box.width / 2;
        const targetCenter = leftmostCenter + spacing * index;
        const deltaX = targetCenter - currentCenter;

        return {
            id: shape.id,
            x: shape.x + deltaX,
            y: shape.y
        };
    });
}

/**
 * Distribute shapes evenly along the vertical axis
 */
export function distributeVertically(shapes: ShapeData[]): PositionUpdate[] {
    if (shapes.length < 3) return [];

    const boxes = shapes.map((s) => ({ shape: s, box: getShapeBoundingBox(s) }));

    // Sort by center y position
    const sorted = [...boxes].sort((a, b) => {
        const aCenterY = a.box.y + a.box.height / 2;
        const bCenterY = b.box.y + b.box.height / 2;
        return aCenterY - bCenterY;
    });

    const topmostCenter = sorted[0].box.y + sorted[0].box.height / 2;
    const bottommostCenter =
        sorted[sorted.length - 1].box.y + sorted[sorted.length - 1].box.height / 2;

    const totalSpace = bottommostCenter - topmostCenter;
    const spacing = totalSpace / (sorted.length - 1);

    return sorted.map(({ shape, box }, index) => {
        const currentCenter = box.y + box.height / 2;
        const targetCenter = topmostCenter + spacing * index;
        const deltaY = targetCenter - currentCenter;

        return {
            id: shape.id,
            x: shape.x,
            y: shape.y + deltaY
        };
    });
}

