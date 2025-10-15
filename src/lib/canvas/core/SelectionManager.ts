/**
 * Selection Manager - Multi-select and Transformer
 * TODO: Extract selection logic from canvas/+page.svelte
 * Week 2 Implementation
 */

import Konva from 'konva';
import type { Shape } from '$lib/types/shapes';

export class SelectionManager {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private transformer: Konva.Transformer;
    private selectedIds: Set<string> = new Set();

    constructor(stage: Konva.Stage, layer: Konva.Layer) {
        this.stage = stage;
        this.layer = layer;

        // Create transformer
        this.transformer = new Konva.Transformer({
            borderStroke: '#667eea',
            borderStrokeWidth: 2,
            anchorFill: '#667eea',
            anchorStroke: '#5568d3',
            anchorSize: 10,
            anchorCornerRadius: 2,
            rotateEnabled: false,
            keepRatio: false
        });

        layer.add(this.transformer);
    }

    /**
     * Select a shape
     */
    select(shapeId: string) {
        // TODO: Implement single selection
        this.selectedIds.clear();
        this.selectedIds.add(shapeId);
        this.updateTransformer();
    }

    /**
     * Add shape to selection
     */
    addToSelection(shapeId: string) {
        // TODO: Implement multi-select
        this.selectedIds.add(shapeId);
        this.updateTransformer();
    }

    /**
     * Clear selection
     */
    clear() {
        this.selectedIds.clear();
        this.transformer.nodes([]);
        this.layer.batchDraw();
    }

    /**
     * Update transformer to show handles
     */
    private updateTransformer() {
        // TODO: Attach transformer to selected nodes
        const nodes = Array.from(this.selectedIds)
            .map(id => this.layer.findOne(`#${id}`))
            .filter(Boolean);

        this.transformer.nodes(nodes as Konva.Node[]);
        this.layer.batchDraw();
    }

    /**
     * Get selected IDs
     */
    getSelectedIds(): string[] {
        return Array.from(this.selectedIds);
    }
}

