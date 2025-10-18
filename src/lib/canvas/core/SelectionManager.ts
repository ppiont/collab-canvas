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

/** Callback for shape updates */
export type ShapeUpdateCallback = (id: string, changes: Record<string, unknown>) => void;

/**
 * SelectionManager handles canvas selection state
 */
export class SelectionManager {
	private stage: Konva.Stage;
	private layer: Konva.Layer;
	private transformer: Konva.Transformer;
	private sizeLabel: Konva.Label | null = null;
	private selectedIds = new Set<string>();
	private onSelectionChange: SelectionChangeCallback | null = null;
	private onDelete: DeleteCallback | null = null;
	private onShapeUpdate: ShapeUpdateCallback | null = null;
	private lineTransformerGroup: Konva.Group | null = null; // Custom transformer for lines
	private lineEndpoints: Konva.Circle[] = []; // Draggable endpoint circles
	private isDraggingLineEndpoint = false; // Prevent transformer recreation during drag

	constructor(stage: Konva.Stage, layer: Konva.Layer) {
		this.stage = stage;
		this.layer = layer;
		this.transformer = this.createTransformer();
		this.layer.add(this.transformer);
		this.createSizeLabel();
		this.setupTransformerEvents();

		// Create group for line transformer UI
		this.lineTransformerGroup = new Konva.Group({
			listening: true
		});
		this.layer.add(this.lineTransformerGroup);
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
	 * Create size label for showing dimensions
	 */
	private createSizeLabel(): void {
		this.sizeLabel = new Konva.Label({
			visible: false,
			listening: false
		});

		// Background box
		this.sizeLabel.add(
			new Konva.Tag({
				fill: '#667eea',
				cornerRadius: 4,
				pointerDirection: 'up',
				pointerWidth: 8,
				pointerHeight: 6
			})
		);

		// Text
		this.sizeLabel.add(
			new Konva.Text({
				text: '',
				fontSize: 12,
				fontFamily: 'Inter, system-ui, sans-serif',
				fill: 'white',
				padding: 6
			})
		);

		this.layer.add(this.sizeLabel);
	}

	/**
	 * Create custom line transformer with draggable endpoints
	 */
	private createLineTransformer(line: Konva.Line, lineId: string): void {
		if (!this.lineTransformerGroup) return;

		// Clear previous endpoints
		this.lineTransformerGroup.destroyChildren();
		this.lineEndpoints = [];

		const points = line.points();
		if (points.length < 4) return;

		// Get line's actual position (including transformations)
		const x1 = points[0] + line.x();
		const y1 = points[1] + line.y();
		const x2 = points[2] + line.x();
		const y2 = points[3] + line.y();

		// Create endpoint circles
		for (let i = 0; i < 2; i++) {
			const x = i === 0 ? x1 : x2;
			const y = i === 0 ? y1 : y2;
			const pointIndex = i * 2;

			const circle = new Konva.Circle({
				x,
				y,
				radius: 6,
				fill: '#667eea',
				stroke: '#ffffff',
				strokeWidth: 2,
				draggable: true,
				cursor: 'grab',
				listening: true
			});

			circle.on('dragstart', () => {
				this.isDraggingLineEndpoint = true;
			});

			circle.on('dragmove', () => {
				// Update the line's points LOCALLY only
				const newPoints = [...points];
				newPoints[pointIndex] = circle.x() - line.x();
				newPoints[pointIndex + 1] = circle.y() - line.y();
				line.points(newPoints);

				// Sync all endpoint circles to the updated line points
				const updatedPoints = line.points();
				for (let j = 0; j < this.lineEndpoints.length; j++) {
					const endpoint = this.lineEndpoints[j];
					const pIndex = j * 2;
					endpoint.x(updatedPoints[pIndex] + line.x());
					endpoint.y(updatedPoints[pIndex + 1] + line.y());
				}

				// Only refresh visuals locally, don't sync to Yjs yet
				if (this.layer) {
					this.layer.batchDraw();
				}
			});

			circle.on('dragend', () => {
				this.isDraggingLineEndpoint = false;
				// NOW sync to Yjs after drag is complete
				const finalPoints = line.points();
				if (this.onShapeUpdate) {
					this.onShapeUpdate(lineId, { points: finalPoints });
				}
				// Refresh all visuals after drag is complete
				this.updateVisuals();
			});

			this.lineTransformerGroup.add(circle);
			this.lineEndpoints.push(circle);
		}

		this.lineTransformerGroup.moveToTop();
		this.layer?.batchDraw();
	}

	/**
	 * Hide line transformer
	 */
	private hideLineTransformer(): void {
		if (this.lineTransformerGroup) {
			this.lineTransformerGroup.destroyChildren();
			this.lineEndpoints = [];
		}
	}

	/**
	 * Update size label position and text
	 */
	private updateSizeLabel(): void {
		if (!this.sizeLabel || !this.transformer) return;

		const nodes = this.transformer.nodes();
		if (nodes.length === 0) {
			this.sizeLabel.visible(false);
			return;
		}

		const node = nodes[0];
		const isLine = node instanceof Konva.Line;
		const isClosedPolygon = isLine && (node as Konva.Line).closed();

		if (isLine && !isClosedPolygon) {
			// For open lines only, calculate and show length
			const line = node as Konva.Line;
			const points = line.points();

			if (points.length >= 4) {
				// Calculate distance between first and last point
				const x1 = points[0];
				const y1 = points[1];
				const x2 = points[2];
				const y2 = points[3];

				const dx = x2 - x1;
				const dy = y2 - y1;
				const length = Math.round(Math.sqrt(dx * dx + dy * dy));

				// Update text
				const text = this.sizeLabel.findOne('Text') as Konva.Text;
				if (text) {
					text.text(`${length}px`);
				}

				// Position near the line midpoint
				const midX = (x1 + x2) / 2;
				const midY = (y1 + y2) / 2;

				this.sizeLabel.position({
					x: midX + 12,
					y: midY - 12
				});

				this.sizeLabel.visible(true);
				this.sizeLabel.moveToTop();
			}
		} else {
			// For regular shapes and closed polygons, show dimensions
			// Force transformer to recalculate to get accurate box
			this.transformer.forceUpdate();

			// Get the bounding box in canvas space
			const box = node.getClientRect();

			// Calculate dimensions
			let nodeWidth: number;
			let nodeHeight: number;

			if (isClosedPolygon) {
				// For polygons, use bounding box dimensions
				nodeWidth = Math.round(box.width);
				nodeHeight = Math.round(box.height);
			} else {
				// For regular shapes, use actual width/height * scale (not rotated bounds)
				nodeWidth = Math.round(node.width() * node.scaleX());
				nodeHeight = Math.round(node.height() * node.scaleY());
			}

			// Update text with actual dimensions
			const text = this.sizeLabel.findOne('Text') as Konva.Text;
			if (text) {
				text.text(`${nodeWidth} × ${nodeHeight}`);
			}

			// Position below the shape using bounding box
			const labelX = box.x + box.width / 2;
			const labelY = box.y + box.height + 12;

			this.sizeLabel.position({
				x: labelX,
				y: labelY
			});

			this.sizeLabel.visible(true);

			// Move size label to top so it's always visible
			this.sizeLabel.moveToTop();
		}
	}

	/**
	 * Unified update method - call this whenever selected shapes change visually
	 * This ensures all visual elements (transformer, size label, etc.) stay in sync
	 */
	private updateVisuals(): void {
		if (this.transformer) {
			this.transformer.forceUpdate();
		}
		this.updateSizeLabel();
		if (this.layer) {
			this.layer.batchDraw();
		}
	}

	/**
	 * Setup transformer event handlers
	 */
	private setupTransformerEvents(): void {
		// Track if transform is actually happening (not just selection)
		let isTransforming = false;

		// Listen for transform start to track when transformation begins
		this.transformer.on('transformstart', () => {
			isTransforming = true;
		});

		// Listen for transform events to update visuals in real-time
		this.transformer.on('transform', () => {
			this.updateVisuals();
		});

		// Listen for transform end to save changes
		this.transformer.on('transformend', () => {
			this.updateVisuals();

			// Only save if we were actually transforming (not just selecting)
			if (!isTransforming) {
				return;
			}
			isTransforming = false;

			const updateCallback = this.onShapeUpdate;
			if (!updateCallback) return;

			// Get all transformed nodes and save their new properties
			const nodes = this.transformer.nodes();
			nodes.forEach((node) => {
				const id = node.id();
				if (!id) return;

				// Get the transformed properties
				const changes: Record<string, unknown> = {
					x: node.x(),
					y: node.y(),
					rotation: node.rotation()
				};

				const scaleX = node.scaleX();
				const scaleY = node.scaleY();

				// Flag to determine if we should reset scale to 1
				let shouldResetScale = true;

				// Add size properties based on shape type and bake scale into them
				const className = node.getClassName();
				if (className === 'Rect' || className === 'Image') {
					const newWidth = node.width() * scaleX;
					const newHeight = node.height() * scaleY;
					changes.width = newWidth;
					changes.height = newHeight;
					// Update node dimensions
					node.width(newWidth);
					node.height(newHeight);
				} else if (className === 'Circle') {
					// For circles, we keep scale instead of baking into radius
					// This allows independent X/Y stretching
					changes.scaleX = scaleX;
					changes.scaleY = scaleY;
					shouldResetScale = false; // Don't reset scale for circles
				} else if (className === 'Ellipse') {
					const ellipse = node as Konva.Ellipse;
					const newRadiusX = ellipse.radiusX() * scaleX;
					const newRadiusY = ellipse.radiusY() * scaleY;
					changes.radiusX = newRadiusX;
					changes.radiusY = newRadiusY;
					ellipse.radiusX(newRadiusX);
					ellipse.radiusY(newRadiusY);
				} else if (className === 'Star') {
					// For stars, allow independent X/Y scaling
					const star = node as Konva.Star;

					// If scales differ, keep the scale; otherwise bake into radius
					if (Math.abs(scaleX - scaleY) > 0.01) {
						changes.scaleX = scaleX;
						changes.scaleY = scaleY;
						shouldResetScale = false;
					} else {
						// Same scale - bake into radius
						const newInnerRadius = star.innerRadius() * scaleX;
						const newOuterRadius = star.outerRadius() * scaleX;
						changes.innerRadius = newInnerRadius;
						changes.outerRadius = newOuterRadius;
						star.innerRadius(newInnerRadius);
						star.outerRadius(newOuterRadius);
					}
				} else if (className === 'Text') {
					const text = node as Konva.Text;
					const newFontSize = text.fontSize() * scaleY;
					const newWidth = node.width() * scaleX;
					changes.fontSize = newFontSize;
					changes.width = newWidth;
					text.fontSize(newFontSize);
					text.width(newWidth);
				} else if (className === 'Line') {
					const line = node as Konva.Line;
					// Polygons have closed=true, lines have closed=false
					const isClosed = line.closed();

					if (isClosed) {
						// Polygon - keep scale for independent X/Y stretching
						changes.scaleX = scaleX;
						changes.scaleY = scaleY;
						shouldResetScale = false;
					} else {
						// Open Line - scale the points directly instead of using scale transform
						const points = line.points();
						const scaledPoints: number[] = [];
						for (let i = 0; i < points.length; i += 2) {
							scaledPoints.push(points[i] * scaleX, points[i + 1] * scaleY);
						}
						changes.points = scaledPoints;
						line.points(scaledPoints);
					}
				} else if (className === 'RegularPolygon') {
					// Triangle - allow independent X/Y scaling like stars
					changes.scaleX = scaleX;
					changes.scaleY = scaleY;
					shouldResetScale = false;
				}

				// Reset scale to 1 after baking it into the size (unless we're keeping scale)
				if (shouldResetScale) {
					node.scaleX(1);
					node.scaleY(1);
				}

				// Save to Yjs
				updateCallback(id, changes);
			});

			// Force transformer update to show correct handles
			this.transformer.forceUpdate();
			this.layer.batchDraw();
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
	 * Set callback for shape updates (e.g., after transformations)
	 */
	setOnShapeUpdate(callback: ShapeUpdateCallback): void {
		this.onShapeUpdate = callback;
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
		shapeIds.forEach((id) => this.selectedIds.add(id));
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

		// Skip updating transformer if we're dragging a line endpoint
		if (this.isDraggingLineEndpoint) return;

		// Remove old drag listeners from previous nodes
		const oldNodes = this.transformer.nodes();
		oldNodes.forEach((node) => {
			node.off('dragmove.sizeLabel');
		});

		if (this.selectedIds.size > 0) {
			const selectedNodes: Konva.Node[] = [];
			let lineNode: Konva.Line | null = null;
			let lineId = '';

			this.selectedIds.forEach((id) => {
				const node = this.layer.findOne(`#${id}`);
				if (node) {
					if (node instanceof Konva.Line && !node.closed()) {
						// It's an open line - use custom transformer
						lineNode = node;
						lineId = id;
					} else {
						selectedNodes.push(node);
					}
				}
			});

			// If a line is selected, use custom line transformer
			if (lineNode) {
				this.transformer.nodes([]);
				this.createLineTransformer(lineNode, lineId);
			} else {
				// Use regular transformer for other shapes
				this.hideLineTransformer();
				if (selectedNodes.length > 0) {
					this.transformer.nodes(selectedNodes);
					this.transformer.moveToTop();
					this.transformer.forceUpdate(); // Force transformer to recalculate

					// Add drag listeners to update all visuals during drag
					selectedNodes.forEach((node) => {
						node.on('dragmove.sizeLabel', () => {
							this.updateVisuals();
						});
					});
				} else {
					this.transformer.nodes([]);
				}
			}
		} else {
			this.transformer.nodes([]);
			this.hideLineTransformer();
		}

		// Update all visuals after transformer is updated
		this.updateVisuals();
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
	 * Sync transformer when shape properties change from Yjs
	 * This ensures the transformer stays aligned with updated node positions
	 */
	syncTransformerFromYjs(): void {
		if (!this.transformer || this.selectedIds.size === 0) return;

		// Force transformer to recalculate based on current node positions
		this.transformer.forceUpdate();
		this.updateSizeLabel();
		this.layer.batchDraw();
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
		// Clean up drag listeners
		const nodes = this.transformer?.nodes() || [];
		nodes.forEach((node) => {
			node.off('dragmove.sizeLabel');
		});

		if (this.transformer) {
			this.transformer.destroy();
		}
		if (this.sizeLabel) {
			this.sizeLabel.destroy();
		}
		this.selectedIds.clear();
		this.onSelectionChange = null;
		this.onDelete = null;
	}
}
