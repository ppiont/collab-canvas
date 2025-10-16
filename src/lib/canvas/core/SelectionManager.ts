/**
 * Selection Manager - Shape Selection and Transformer
 * Extracted from canvas/+page.svelte
 * 
 * Handles:
 * - Shape selection state
 * - Konva Transformer attachment
 * - Multi-select (future)
 * - Keyboard delete
 */

import Konva from 'konva';

/** Callback for selection changes */
export type SelectionChangeCallback = (selectedIds: string[]) => void;

/** Callback for delete action */
export type DeleteCallback = (ids: string[]) => void;

/**
 * SelectionManager handles canvas selection state
 */
export class SelectionManager {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private transformer: Konva.Transformer;
    private selectedIds = new Set<string>();
    private onSelectionChange: SelectionChangeCallback | null = null;
    private onDelete: DeleteCallback | null = null;

    constructor(stage: Konva.Stage, layer: Konva.Layer) {
        this.stage = stage;
        this.layer = layer;
        this.transformer = this.createTransformer();
        this.layer.add(this.transformer);
    }

    /**
     * Create Konva transformer
     */
    private createTransformer(): Konva.Transformer {
        return new Konva.Transformer({
            keepRatio: false,
            rotateEnabled: true,
            enabledAnchors: [
                'top-left',
                'top-center',
                'top-right',
                'middle-right',
                'bottom-right',
                'bottom-center',
                'bottom-left',
                'middle-left'
            ],
            borderStroke: '#667eea',
            borderStrokeWidth: 2,
            anchorFill: '#ffffff',
            anchorStroke: '#5568d3',
            anchorSize: 10,
            anchorCornerRadius: 2,
            rotateAnchorOffset: 30,
            rotateAnchorCursor: 'crosshair',
            boundBoxFunc: (oldBox, newBox) => {
                // Limit minimum size
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            }
        });
    }

    /**
     * Set callback for selection changes
     */
    setOnSelectionChange(callback: SelectionChangeCallback): void {
        this.onSelectionChange = callback;
    }

    /**
     * Set callback for delete action
     */
    setOnDelete(callback: DeleteCallback): void {
        this.onDelete = callback;
    }

    /**
     * Select a single shape
     */
    select(shapeId: string): void {
        this.selectedIds.clear();
        this.selectedIds.add(shapeId);
        this.updateTransformer();
        this.notifySelectionChange();
    }

    /**
     * Select multiple shapes at once
     */
    selectMultiple(shapeIds: string[]): void {
        this.selectedIds.clear();
        shapeIds.forEach(id => this.selectedIds.add(id));
        this.updateTransformer();
        this.notifySelectionChange();
    }

    /**
     * Add to selection (for multi-select)
     */
    addToSelection(shapeId: string): void {
        this.selectedIds.add(shapeId);
        this.updateTransformer();
        this.notifySelectionChange();
    }

    /**
     * Remove from selection
     */
    removeFromSelection(shapeId: string): void {
        this.selectedIds.delete(shapeId);
        this.updateTransformer();
        this.notifySelectionChange();
    }

    /**
     * Toggle selection state
     */
    toggleSelection(shapeId: string): void {
        if (this.selectedIds.has(shapeId)) {
            this.removeFromSelection(shapeId);
        } else {
            this.addToSelection(shapeId);
        }
    }

    /**
     * Deselect all
     */
    deselect(): void {
        this.selectedIds.clear();
        this.updateTransformer();
        this.notifySelectionChange();
    }

    /**
     * Delete selected shapes
     */
    delete(): void {
        if (this.selectedIds.size > 0 && this.onDelete) {
            const ids = Array.from(this.selectedIds);
            this.onDelete(ids);
            this.deselect();
        }
    }

    /**
     * Get currently selected shape IDs
     */
    getSelectedIds(): string[] {
        return Array.from(this.selectedIds);
    }

    /**
     * Check if a shape is selected
     */
    isSelected(shapeId: string): boolean {
        return this.selectedIds.has(shapeId);
    }

    /**
     * Get transformer instance
     */
    getTransformer(): Konva.Transformer {
        return this.transformer;
    }

    /**
     * Update transformer to attach to selected shapes
     */
    private updateTransformer(): void {
        if (!this.transformer || !this.layer) return;

        if (this.selectedIds.size > 0) {
            const selectedNodes: Konva.Node[] = [];

            this.selectedIds.forEach((id) => {
                const node = this.layer.findOne(`#${id}`);
                if (node) {
                    selectedNodes.push(node);
                }
            });

            if (selectedNodes.length > 0) {
                this.transformer.nodes(selectedNodes);
                this.transformer.moveToTop();
            } else {
                this.transformer.nodes([]);
            }
        } else {
            this.transformer.nodes([]);
        }

        this.layer.batchDraw();
    }

    /**
     * Manually trigger transformer update (call after shape changes)
     */
    updateTransformerAttachment(): void {
        this.updateTransformer();
        // Force update to prevent ghost boxes
        if (this.transformer) {
            this.transformer.forceUpdate();
        }
    }

    /**
     * Notify listeners of selection change
     */
    private notifySelectionChange(): void {
        if (this.onSelectionChange) {
            this.onSelectionChange(Array.from(this.selectedIds));
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.transformer) {
            this.transformer.destroy();
        }
        this.selectedIds.clear();
        this.onSelectionChange = null;
        this.onDelete = null;
    }
}
