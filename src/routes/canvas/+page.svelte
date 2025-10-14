<script lang="ts">
	import { onMount } from 'svelte';
	import Konva from 'konva';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
	import {
		rectangles,
		addRectangle,
		updateRectangle,
		deleteRectangle,
		initializeYjsSync
	} from '$lib/stores/rectangles';
	import { initializeProvider, disconnectProvider, provider } from '$lib/collaboration';
	import type { Rectangle } from '$lib/types';
	import { DEFAULT_RECTANGLE } from '$lib/types';

	let { data } = $props();

	let containerDiv: HTMLDivElement;
	let stage: Konva.Stage;
	let gridLayer: Konva.Layer;
	let shapesLayer: Konva.Layer;
	let cursorsLayer: Konva.Layer; // Phase 5: Remote cursors

	// Canvas dimensions
	let width = $state(0);
	let height = $state(0);

	// Viewport state for pan/zoom
	let stageScale = $state(1);

	// Toolbar state
	let isCreateMode = $state(false);

	// Rectangles from store (now synced via Yjs)
	let rectanglesList = $state<Rectangle[]>([]);

	// Selection state
	let selectedRectId = $state<string | null>(null);
	let transformer: Konva.Transformer | null = null;

	// Phase 5: Cursor state
	let remoteCursors = $state<Map<number, { x: number; y: number; user: any }>>(new Map());
	let lastCursorUpdate = 0;
	const CURSOR_THROTTLE_MS = 30; // 30ms = ~33 updates/sec for smooth movement
	let cursorNodes = new Map<number, Konva.Group>(); // Track cursor nodes by clientId
	let pulseAnimation: Konva.Animation | null = null; // Single animation for all indicators

	// Subscribe to rectangles store (updated by Yjs)
	$effect(() => {
		const unsubscribe = rectangles.subscribe((value) => {
			rectanglesList = value;
		});
		return unsubscribe;
	});

	// Update canvas size on mount and resize
	function updateSize() {
		width = window.innerWidth;
		height = window.innerHeight;

		if (stage) {
			stage.width(width);
			stage.height(height);
			drawGrid();
			gridLayer?.batchDraw();
		}
	}

	/**
	 * Darken a hex color by a percentage
	 */
	function darkenColor(hex: string, percent = 30): string {
		// Remove # if present
		hex = hex.replace('#', '');

		// Convert to RGB
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		// Darken
		const darkenedR = Math.max(0, Math.floor(r * (1 - percent / 100)));
		const darkenedG = Math.max(0, Math.floor(g * (1 - percent / 100)));
		const darkenedB = Math.max(0, Math.floor(b * (1 - percent / 100)));

		// Convert back to hex
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		return `#${toHex(darkenedR)}${toHex(darkenedG)}${toHex(darkenedB)}`;
	}

	function drawGrid() {
		if (!gridLayer) return;

		gridLayer.destroyChildren();

		const gridSize = 50;
		const gridColor = '#e2e8f0';

		// Make grid much larger than viewport for infinite feel
		const gridExtent = Math.max(width, height) * 5; // 5x viewport size
		const gridStart = -gridExtent;
		const gridEnd = gridExtent;

		// Vertical lines
		for (let i = gridStart; i <= gridEnd; i += gridSize) {
			const line = new Konva.Line({
				points: [i, gridStart, i, gridEnd],
				stroke: gridColor,
				strokeWidth: 1
			});
			gridLayer.add(line);
		}

		// Horizontal lines
		for (let i = gridStart; i <= gridEnd; i += gridSize) {
			const line = new Konva.Line({
				points: [gridStart, i, gridEnd, i],
				stroke: gridColor,
				strokeWidth: 1
			});
			gridLayer.add(line);
		}
	}

	/**
	 * Render all rectangles from store to Konva layer
	 */
	function renderRectangles() {
		if (!shapesLayer) return;

		// Remove only rectangle shapes, keep transformer
		const existingRects = shapesLayer.find('.rectangle');
		existingRects.forEach((rect) => rect.destroy());

		rectanglesList.forEach((rect) => {
			const konvaRect = new Konva.Rect({
				id: rect.id,
				name: 'rectangle',
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: rect.height,
				fill: rect.fill,
				stroke: rect.stroke,
				strokeWidth: rect.strokeWidth,
				draggable: rect.draggable
			});

			// Hover effect
			konvaRect.on('mouseenter', () => {
				if (!stage) return;
				stage.container().style.cursor = 'move';
				if (selectedRectId !== rect.id) {
					konvaRect.strokeWidth(rect.strokeWidth + 1);
					shapesLayer.batchDraw();
				}
			});

			konvaRect.on('mouseleave', () => {
				if (!stage) return;
				stage.container().style.cursor = 'default';
				if (selectedRectId !== rect.id) {
					konvaRect.strokeWidth(rect.strokeWidth);
					shapesLayer.batchDraw();
				}
			});

			// Visual feedback while dragging
			konvaRect.on('dragstart', () => {
				if (!stage) return;
				konvaRect.opacity(0.7);
				konvaRect.shadowColor('black');
				konvaRect.shadowBlur(10);
				konvaRect.shadowOffset({ x: 5, y: 5 });
				konvaRect.shadowOpacity(0.3);
				stage.container().style.cursor = 'grabbing';
			});

			konvaRect.on('dragend', (e) => {
				if (!stage) return;
				// Reset visual feedback
				konvaRect.opacity(1);
				konvaRect.shadowColor('');
				konvaRect.shadowBlur(0);
				stage.container().style.cursor = 'move';

				// Update position in Yjs
				updateRectangle(rect.id, {
					x: e.target.x(),
					y: e.target.y()
				});
			});

			// Click to select
			konvaRect.on('click tap', (e) => {
				// Don't select if we're in create mode
				if (isCreateMode) return;

				e.cancelBubble = true;
				selectRectangle(rect.id);
			});

			// Handle resize (via transformer)
			konvaRect.on('transformend', () => {
				// Get updated dimensions
				const scaleX = konvaRect.scaleX();
				const scaleY = konvaRect.scaleY();

				// Calculate new dimensions
				const newWidth = Math.max(5, konvaRect.width() * scaleX);
				const newHeight = Math.max(5, konvaRect.height() * scaleY);

				// Reset scale
				konvaRect.scaleX(1);
				konvaRect.scaleY(1);

				console.log('Transform end:', {
					id: rect.id,
					newWidth,
					newHeight,
					x: konvaRect.x(),
					y: konvaRect.y()
				});

				// Update in Yjs
				updateRectangle(rect.id, {
					x: konvaRect.x(),
					y: konvaRect.y(),
					width: newWidth,
					height: newHeight
				});
			});

			shapesLayer.add(konvaRect);
		});

		// Update transformer selection
		updateTransformerSelection();

		shapesLayer.batchDraw();
	}

	/**
	 * Update transformer to attach to selected rectangle
	 */
	function updateTransformerSelection() {
		if (!transformer || !shapesLayer) return;

		if (selectedRectId) {
			const selectedNode = shapesLayer.findOne(`#${selectedRectId}`);
			if (selectedNode) {
				transformer.nodes([selectedNode]);
				transformer.moveToTop();
			} else {
				transformer.nodes([]);
			}
		} else {
			transformer.nodes([]);
		}
	}

	/**
	 * Select a rectangle to show resize handles
	 */
	function selectRectangle(id: string) {
		selectedRectId = id;
		updateTransformerSelection();
		shapesLayer?.batchDraw();
	}

	/**
	 * Deselect rectangle
	 */
	function deselectRectangle() {
		selectedRectId = null;
		if (transformer) {
			transformer.nodes([]);
			shapesLayer?.batchDraw();
		}
	}

	/**
	 * Phase 5: Broadcast cursor position via Yjs awareness (throttled)
	 */
	function broadcastCursor(e: Konva.KonvaEventObject<MouseEvent>) {
		if (!stage) return;

		const now = Date.now();
		if (now - lastCursorUpdate < CURSOR_THROTTLE_MS) return;

		lastCursorUpdate = now;

		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		// Transform to canvas coordinates (account for pan/zoom)
		const transform = stage.getAbsoluteTransform().copy().invert();
		const pos = transform.point(pointer);

		// Update awareness with cursor position
		let providerValue: any = null;
		const unsubscribe = provider.subscribe((value) => {
			providerValue = value;
		});
		unsubscribe();

		if (providerValue && providerValue.awareness) {
			providerValue.awareness.setLocalStateField('cursor', {
				x: pos.x,
				y: pos.y
			});
		}
	}

	/**
	 * Phase 5: Render remote cursors from awareness
	 *
	 * Strategy: Update existing nodes instead of recreating them.
	 * This preserves the global pulse animation running on the cursors layer.
	 * Nodes are marked with 'type' (full/indicator) and 'shouldPulse' attributes.
	 */
	function renderCursors() {
		if (!cursorsLayer || !stage) return;

		// Get current provider
		let providerValue: any = null;
		const unsubscribe = provider.subscribe((value) => {
			providerValue = value;
		});
		unsubscribe();

		if (!providerValue || !providerValue.awareness) return;

		const awareness = providerValue.awareness;
		const localClientId = awareness.clientID;

		// Get viewport bounds in canvas coordinates
		const stagePos = stage.position();
		const stageScale = stage.scaleX();
		const viewportBounds = {
			left: -stagePos.x / stageScale,
			top: -stagePos.y / stageScale,
			right: (-stagePos.x + width) / stageScale,
			bottom: (-stagePos.y + height) / stageScale
		};

		// Padding from edge for off-screen indicators
		const edgePadding = 30;

		// Track which clients are still active
		const activeClients = new Set<number>();

		// Iterate through all awareness states
		awareness.getStates().forEach((state: any, clientId: number) => {
			// Skip local user
			if (clientId === localClientId) return;

			const cursor = state.cursor;
			const user = state.user;

			if (!cursor || !user) return;

			activeClients.add(clientId);

			// Check if cursor is within viewport
			const isInViewport =
				cursor.x >= viewportBounds.left &&
				cursor.x <= viewportBounds.right &&
				cursor.y >= viewportBounds.top &&
				cursor.y <= viewportBounds.bottom;

			// Check if we already have a node for this client
			let cursorGroup = cursorNodes.get(clientId);

			if (isInViewport) {
				// ON-SCREEN CURSOR
				if (!cursorGroup || cursorGroup.getAttr('type') !== 'full') {
					// Need to create/recreate full cursor
					if (cursorGroup) {
						cursorGroup.destroy();
					}

					cursorGroup = new Konva.Group({
						x: cursor.x,
						y: cursor.y
					});
					cursorGroup.setAttr('type', 'full');

					// Simple triangle cursor with outline
					const cursorPath = new Konva.Line({
						points: [0, 0, 0, 18, 12, 12, 0, 0],
						closed: true,
						fill: user.color || '#3b82f6',
						stroke: '#ffffff',
						strokeWidth: 2,
						lineJoin: 'round',
						shadowColor: 'rgba(0, 0, 0, 0.3)',
						shadowBlur: 6,
						shadowOffset: { x: 2, y: 2 },
						shadowOpacity: 0.4
					});

					// Name label (bottom right of cursor)
					const label = new Konva.Label({
						x: 14,
						y: 14
					});

					label.add(
						new Konva.Tag({
							fill: user.color || '#3b82f6',
							cornerRadius: 4,
							shadowColor: 'rgba(0, 0, 0, 0.2)',
							shadowBlur: 4,
							shadowOffset: { x: 1, y: 1 }
						})
					);

					label.add(
						new Konva.Text({
							text: user.name || 'Anonymous',
							fontSize: 12,
							fontFamily: 'system-ui, -apple-system, sans-serif',
							fontStyle: '500',
							fill: '#ffffff',
							padding: 4
						})
					);

					cursorGroup.add(cursorPath);
					cursorGroup.add(label);
					cursorGroup.setAttr('shouldPulse', false); // Don't animate full cursors
					cursorsLayer.add(cursorGroup);
					cursorNodes.set(clientId, cursorGroup);
				} else {
					// Smooth interpolation: tween to new position instead of jumping
					// This creates buttery-smooth cursor movement even with throttled updates
					const currentPos = cursorGroup.position();
					const distance = Math.sqrt(
						Math.pow(cursor.x - currentPos.x, 2) + Math.pow(cursor.y - currentPos.y, 2)
					);

					// Only animate if position changed significantly (avoid micro-movements)
					if (distance > 1) {
						new Konva.Tween({
							node: cursorGroup,
							duration: 0.12, // 120ms smooth interpolation (tuned for 30ms updates)
							x: cursor.x,
							y: cursor.y,
							easing: Konva.Easings.EaseOut
						}).play();
					}
				}
			} else {
				// OFF-SCREEN INDICATOR
				// Calculate edge position and direction
				const centerX = (viewportBounds.left + viewportBounds.right) / 2;
				const centerY = (viewportBounds.top + viewportBounds.bottom) / 2;
				const dx = cursor.x - centerX;
				const dy = cursor.y - centerY;

				let edgeX = cursor.x;
				let edgeY = cursor.y;

				// Calculate angle for droplet rotation
				const angle = Math.atan2(dy, dx);

				// Find intersection with viewport edge
				const intersections = [];

				// Right edge
				if (dx > 0) {
					const t = (viewportBounds.right - centerX) / dx;
					const y = centerY + dy * t;
					if (y >= viewportBounds.top && y <= viewportBounds.bottom) {
						intersections.push({
							x: viewportBounds.right - edgePadding / stageScale,
							y,
							distance: t
						});
					}
				}

				// Left edge
				if (dx < 0) {
					const t = (viewportBounds.left - centerX) / dx;
					const y = centerY + dy * t;
					if (y >= viewportBounds.top && y <= viewportBounds.bottom) {
						intersections.push({
							x: viewportBounds.left + edgePadding / stageScale,
							y,
							distance: t
						});
					}
				}

				// Bottom edge
				if (dy > 0) {
					const t = (viewportBounds.bottom - centerY) / dy;
					const x = centerX + dx * t;
					if (x >= viewportBounds.left && x <= viewportBounds.right) {
						intersections.push({
							x,
							y: viewportBounds.bottom - edgePadding / stageScale,
							distance: t
						});
					}
				}

				// Top edge
				if (dy < 0) {
					const t = (viewportBounds.top - centerY) / dy;
					const x = centerX + dx * t;
					if (x >= viewportBounds.left && x <= viewportBounds.right) {
						intersections.push({
							x,
							y: viewportBounds.top + edgePadding / stageScale,
							distance: t
						});
					}
				}

				if (intersections.length > 0) {
					intersections.sort((a, b) => a.distance - b.distance);
					edgeX = intersections[0].x;
					edgeY = intersections[0].y;
				}

				if (!cursorGroup || cursorGroup.getAttr('type') !== 'indicator') {
					// Need to create/recreate indicator
					if (cursorGroup) {
						cursorGroup.destroy();
					}

					cursorGroup = new Konva.Group({
						x: edgeX,
						y: edgeY,
						rotation: (angle * 180) / Math.PI // Rotate to point toward cursor
					});
					cursorGroup.setAttr('type', 'indicator');

					// Droplet: circle back + triangle front
					const dropletCircle = new Konva.Circle({
						x: -3,
						y: 0,
						radius: 10,
						fill: user.color || '#3b82f6',
						stroke: '#ffffff',
						strokeWidth: 2.5,
						shadowColor: 'rgba(0, 0, 0, 0.3)',
						shadowBlur: 6,
						shadowOffset: { x: 2, y: 2 }
					});

					const dropletPoint = new Konva.Line({
						points: [11, -6, 16, 0, 11, 6],
						closed: true,
						fill: user.color || '#3b82f6',
						stroke: '#ffffff',
						strokeWidth: 2,
						lineJoin: 'round'
					});

					// Abbreviated name label (first letter only)
					const shortName = user.name ? user.name.charAt(0).toUpperCase() : '?';
					const nameText = new Konva.Text({
						text: shortName,
						fontSize: 12,
						fontFamily: 'Arial',
						fontStyle: 'bold',
						fill: '#ffffff',
						listening: false,
						x: -3, // Fixed position in droplet
						y: 0,
						rotation: -(angle * 180) / Math.PI // Counter-rotate to keep text horizontal
					});

					// Set offset to center of text so it rotates around its own center
					nameText.offsetX(nameText.width() / 2);
					nameText.offsetY(nameText.height() / 2);

					cursorGroup.add(dropletCircle);
					cursorGroup.add(dropletPoint);
					cursorGroup.add(nameText);
					cursorGroup.setAttr('shouldPulse', true); // Mark for animation
					cursorsLayer.add(cursorGroup);
					cursorNodes.set(clientId, cursorGroup);
				} else {
					// Smoothly animate to new edge position and rotation
					const currentPos = cursorGroup.position();
					const distance = Math.sqrt(
						Math.pow(edgeX - currentPos.x, 2) + Math.pow(edgeY - currentPos.y, 2)
					);

					// Only animate if position changed significantly
					if (distance > 1) {
						// Rotate the group to point toward cursor
						new Konva.Tween({
							node: cursorGroup,
							duration: 0.12, // 120ms smooth interpolation (tuned for 30ms updates)
							x: edgeX,
							y: edgeY,
							rotation: (angle * 180) / Math.PI,
							easing: Konva.Easings.EaseOut
						}).play();

						// Counter-rotate the text to keep it horizontal
						const textNode = cursorGroup.findOne('Text');
						if (textNode) {
							new Konva.Tween({
								node: textNode,
								duration: 0.12,
								rotation: -(angle * 180) / Math.PI,
								easing: Konva.Easings.EaseOut
							}).play();
						}
					}
				}
			}
		});

		// Remove nodes for users who left
		cursorNodes.forEach((node, clientId) => {
			if (!activeClients.has(clientId)) {
				node.destroy();
				cursorNodes.delete(clientId);
			}
		});

		cursorsLayer.batchDraw();
	}

	/**
	 * Handle stage click to create rectangles or deselect
	 */
	function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
		// If clicked on empty canvas (not a shape)
		if (e.target === stage) {
			// Deselect if not in create mode
			if (!isCreateMode) {
				deselectRectangle();
				return;
			}
		}

		// Only create if in create mode
		if (!isCreateMode) return;

		// Only create if clicked on empty canvas (not a shape)
		if (e.target !== stage) return;

		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		// Transform pointer to canvas coordinates (account for pan/zoom)
		const transform = stage.getAbsoluteTransform().copy().invert();
		const pos = transform.point(pointer);

		// Create new rectangle centered on click
		const userColor = data.userProfile?.color || '#3b82f6';
		const newRect: Rectangle = {
			id: crypto.randomUUID(),
			...DEFAULT_RECTANGLE,
			x: pos.x - (DEFAULT_RECTANGLE.width || 150) / 2,
			y: pos.y - (DEFAULT_RECTANGLE.height || 100) / 2,
			fill: userColor,
			stroke: darkenColor(userColor),
			createdBy: data.user?.id || '',
			createdAt: Date.now()
		} as Rectangle;

		addRectangle(newRect);

		// Auto-disable create mode after creating
		isCreateMode = false;

		console.log('Created rectangle:', newRect);
	}

	onMount(() => {
		console.log('Canvas page mounted');
		console.log('User profile:', data.userProfile);
		updateSize();
		console.log('Canvas dimensions:', { width, height });

		// Initialize Yjs collaboration
		console.log('Initializing Yjs collaboration...');
		initializeYjsSync();

		// Initialize PartyKit provider
		const token = data.session?.access_token || '';
		initializeProvider(
			data.user.id,
			data.userProfile?.displayName || 'Anonymous',
			data.userProfile?.color || '#3b82f6',
			token
		);
		console.log('PartyKit provider initialized');

		// Create Konva stage
		stage = new Konva.Stage({
			container: containerDiv,
			width,
			height,
			draggable: true
		});

		// Grid layer
		gridLayer = new Konva.Layer();
		stage.add(gridLayer);
		drawGrid();

		// Shapes layer
		shapesLayer = new Konva.Layer();
		stage.add(shapesLayer);

		// Create transformer (once)
		transformer = new Konva.Transformer({
			borderStroke: '#667eea',
			borderStrokeWidth: 2,
			anchorFill: '#667eea',
			anchorStroke: '#5568d3',
			anchorSize: 10,
			anchorCornerRadius: 2,
			rotateEnabled: false,
			keepRatio: false,
			enabledAnchors: [
				'top-left',
				'top-right',
				'bottom-left',
				'bottom-right',
				'middle-left',
				'middle-right',
				'top-center',
				'bottom-center'
			],
			boundBoxFunc: (oldBox, newBox) => {
				// Limit minimum size
				if (newBox.width < 5 || newBox.height < 5) {
					return oldBox;
				}
				return newBox;
			}
		});
		shapesLayer.add(transformer);

		// Phase 5: Cursors layer (above shapes, below UI)
		cursorsLayer = new Konva.Layer();
		stage.add(cursorsLayer);

		// Phase 5: Start continuous pulse animation for off-screen indicators
		pulseAnimation = new Konva.Animation((frame) => {
			if (!frame) return;

			// Subtle pulse: 1.0 to 1.12 and back (2 second cycle)
			const scale = 1 + Math.sin((frame.time * 2 * Math.PI) / 2000) * 0.12;

			// Apply to all indicator nodes
			cursorsLayer.children.forEach((node) => {
				if (node.getAttr('shouldPulse')) {
					node.scale({ x: scale, y: scale });
				}
			});
		}, cursorsLayer);
		pulseAnimation.start();

		// Phase 5: Broadcast cursor position on mousemove (throttled)
		stage.on('mousemove', broadcastCursor);

		// Phase 5: Listen to awareness changes and render cursors
		const unsubscribeProvider = provider.subscribe((providerValue) => {
			if (providerValue && providerValue.awareness) {
				const awareness = providerValue.awareness;
				const localClientId = awareness.clientID;

				// Listen to awareness changes
				const handleAwarenessChange = (changes: any) => {
					// Check if any changes involve remote users (not just local user)
					let hasRemoteChanges = false;

					if (changes && changes.added) {
						hasRemoteChanges = changes.added.some((id: number) => id !== localClientId);
					}
					if (!hasRemoteChanges && changes && changes.updated) {
						hasRemoteChanges = changes.updated.some((id: number) => id !== localClientId);
					}
					if (!hasRemoteChanges && changes && changes.removed) {
						hasRemoteChanges = changes.removed.some((id: number) => id !== localClientId);
					}

					// Only re-render if remote users changed
					if (hasRemoteChanges) {
						renderCursors();
					}
				};

				awareness.on('change', handleAwarenessChange);
				awareness.on('update', handleAwarenessChange);

				// Initial render
				renderCursors();
			}
		});

		// Handle click to create rectangles
		stage.on('click', handleStageClick);

		// Fix stage/shape dragging conflict
		stage.on('mousedown', (e) => {
			// If clicked on empty canvas, enable stage dragging (pan)
			if (e.target === stage) {
				stage.draggable(true);
			} else {
				// If clicked on a shape, disable stage dragging to allow shape drag
				stage.draggable(false);
			}
		});

		// Update cursors while panning (real-time viewport changes)
		stage.on('dragmove', (e) => {
			if (e.target === stage) {
				// Viewport is moving - update cursor positions in real-time
				renderCursors();
			}
		});

		// Re-enable stage dragging after shape drag ends
		stage.on('dragend', (e) => {
			if (e.target !== stage) {
				stage.draggable(true);
			} else {
				// Final viewport update
				renderCursors();
			}
		});

		console.log('Konva stage created successfully');

		// Keyboard shortcuts
		const handleKeyDown = (e: KeyboardEvent) => {
			// Escape to deselect
			if (e.key === 'Escape') {
				deselectRectangle();
				if (isCreateMode) {
					isCreateMode = false;
				}
			}
			// Delete key to remove selected rectangle
			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (selectedRectId) {
					deleteRectangle(selectedRectId);
					deselectRectangle();
				}
			}
		};

		window.addEventListener('resize', updateSize);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('resize', updateSize);
			window.removeEventListener('keydown', handleKeyDown);
			// Stop pulse animation
			if (pulseAnimation) {
				pulseAnimation.stop();
			}
			unsubscribeProvider(); // Phase 5: cleanup
			disconnectProvider();
			stage.destroy();
		};
	});

	// Re-render rectangles when store changes
	$effect(() => {
		if (shapesLayer && rectanglesList) {
			renderRectangles();
		}
	});

	// Handle wheel zoom
	function handleWheel(e: WheelEvent) {
		if (!stage) return;
		e.preventDefault();

		const scaleBy = 1.05;
		const oldScale = stage.scaleX();

		// Get pointer position relative to stage
		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale
		};

		// Calculate new scale
		const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

		// Clamp scale between 0.1x and 5x
		const clampedScale = Math.max(0.1, Math.min(5, newScale));

		stage.scale({ x: clampedScale, y: clampedScale });

		// Adjust position to zoom toward pointer
		const newPos = {
			x: pointer.x - mousePointTo.x * clampedScale,
			y: pointer.y - mousePointTo.y * clampedScale
		};

		stage.position(newPos);
		stage.batchDraw();

		// Update state for zoom indicator
		stageScale = clampedScale;

		// Viewport changed - check if cursors crossed on/off screen boundary
		renderCursors();
	}
</script>

<div class="canvas-container" onwheel={handleWheel}>
	<!-- Toolbar -->
	<Toolbar bind:isCreateMode />

	<!-- Connection Status -->
	<ConnectionStatus />

	<!-- Zoom indicator -->
	<div class="zoom-indicator">
		{Math.round(stageScale * 100)}%
	</div>

	<!-- Create mode indicator -->
	{#if isCreateMode}
		<div class="create-mode-indicator">Click canvas to place rectangle</div>
	{/if}

	<!-- Konva container -->
	<div bind:this={containerDiv}></div>
</div>

<style>
	.canvas-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: #ffffff;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.zoom-indicator {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		z-index: 1000;
		pointer-events: none;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.create-mode-indicator {
		position: fixed;
		top: 80px;
		left: 20px;
		background: rgba(102, 126, 234, 0.95);
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		z-index: 10;
		pointer-events: none;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
