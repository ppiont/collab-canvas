/**
 * Base Shape Class
 * Abstract class with common shape operations
 * Week 2 Implementation
 */

import Konva from 'konva';
import type { Shape } from '$lib/types/shapes';

export abstract class BaseShape {
    protected shape: Shape;
    protected node: Konva.Shape | Konva.Group | null = null;

    constructor(shape: Shape) {
        this.shape = shape;
    }

    /**
     * Create Konva node for this shape
     * Must be implemented by subclasses
     */
    abstract createNode(): Konva.Shape | Konva.Group;

    /**
     * Update node with new properties
     */
    updateNode(changes: Partial<Shape>) {
        if (!this.node) return;

        // Update common properties
        if (changes.x !== undefined) this.node.x(changes.x);
        if (changes.y !== undefined) this.node.y(changes.y);
        if (changes.rotation !== undefined) this.node.rotation(changes.rotation);
        if (changes.opacity !== undefined) this.node.opacity(changes.opacity);

        // Update shape-specific properties
        this.updateSpecificProperties(changes);
    }

    /**
     * Update shape-specific properties
     * Override in subclasses as needed
     */
    protected updateSpecificProperties(changes: Partial<Shape>) {
        // Default implementation does nothing
    }

    /**
     * Get the Konva node
     */
    getNode(): Konva.Shape | Konva.Group | null {
        return this.node;
    }

    /**
     * Destroy the Konva node
     */
    destroy() {
        if (this.node) {
            this.node.destroy();
            this.node = null;
        }
    }
}

