/**
 * Cursor Manager - Remote Cursor Rendering and Follow Mode
 * Extracted from canvas/+page.svelte (400+ lines)
 *
 * Handles:
 * - Remote cursor rendering (full cursors + off-screen indicators)
 * - Cursor broadcasting via Yjs awareness
 * - Follow mode (center on specific user)
 * - Smooth interpolation and pulse animations
 */

import Konva from 'konva';
import type { Awareness } from 'y-protocols/awareness';
import { CURSOR } from '$lib/constants';

/** Awareness user state */
interface AwarenessUser {
	id: string;
	name: string;
	color: string;
}

/** Awareness cursor position */
interface AwarenessCursor {
	x: number;
	y: number;
}

/** Complete awareness state */
interface AwarenessState {
	user?: AwarenessUser;
	cursor?: AwarenessCursor;
}

/**
 * CursorManager handles all remote cursor rendering and interactions
 */
export class CursorManager {
	private stage: Konva.Stage;
	private cursorsLayer: Konva.Layer;
	private awareness: Awareness | null = null;
	private localUserId: string | null = null;

	// Cursor tracking
	private cursorNodes = new Map<number, Konva.Group>();
	private pulseAnimation: Konva.Animation | null = null;

	// Follow mode
	private followingUserId: string | null = null;
	private followTween: Konva.Tween | null = null;

	// Viewport dimensions (updated externally)
	private canvasWidth = 0;
	private canvasHeight = 0;

	// Event handler references for cleanup
	private awarenessChangeHandler: (() => void) | null = null;

	constructor(stage: Konva.Stage, cursorsLayer: Konva.Layer) {
		this.stage = stage;
		this.cursorsLayer = cursorsLayer;
	}

	/**
	 * Initialize cursor manager with awareness and start rendering
	 */
	initialize(awareness: Awareness, localUserId: string, width: number, height: number): void {
		this.awareness = awareness;
		this.localUserId = localUserId;
		this.canvasWidth = width;
		this.canvasHeight = height;

		// Listen to awareness changes
		this.awarenessChangeHandler = () => {
			this.renderCursors();

			// Update follow mode if active
			if (this.followingUserId) {
				this.centerOnUser(this.followingUserId, true);
			}
		};

		awareness.on('change', this.awarenessChangeHandler);
		awareness.on('update', this.awarenessChangeHandler);

		// Start pulse animation for off-screen indicators
		this.startPulseAnimation();

		// Initial render
		this.renderCursors();
	}

	/**
	 * Update canvas dimensions (call on resize)
	 */
	updateDimensions(width: number, height: number): void {
		this.canvasWidth = width;
		this.canvasHeight = height;
		this.renderCursors();
	}

	/**
	 * Broadcast local cursor position
	 */
	broadcastCursor(): void {
		if (!this.awareness) return;

		const pointer = this.stage.getPointerPosition();
		if (!pointer) return;

		// Transform to canvas coordinates (account for pan/zoom)
		const transform = this.stage.getAbsoluteTransform().copy().invert();
		const pos = transform.point(pointer);

		// Update awareness with cursor position
		this.awareness.setLocalStateField('cursor', {
			x: pos.x,
			y: pos.y
		});
	}

	/**
	 * Broadcast cursor position immediately (without throttling)
	 * Used for drag events where we want instant updates
	 */
	broadcastCursorImmediate(): void {
		if (!this.awareness) return;

		const pointer = this.stage.getPointerPosition();
		if (!pointer) return;

		// Transform to canvas coordinates (account for pan/zoom)
		const transform = this.stage.getAbsoluteTransform().copy().invert();
		const pos = transform.point(pointer);

		// Update awareness with cursor position
		this.awareness.setLocalStateField('cursor', {
			x: pos.x,
			y: pos.y
		});
	}

	/**
	 * Broadcast current cursor position without parameters
	 * Used when we need to update cursor but don't have an event object
	 */
	broadcastCurrentPosition(): void {
		this.broadcastCursorImmediate();
	}

	/**
	 * Center viewport on a specific user's cursor
	 */
	centerOnUser(userId: string, shouldFollow = false): void {
		if (!this.awareness) return;

		// Enable follow mode if requested
		if (shouldFollow) {
			this.followingUserId = userId;
		}

		// Find the user's cursor position
		let cursorX = 0;
		let cursorY = 0;
		let found = false;

		this.awareness.getStates().forEach((state: AwarenessState) => {
			if (state.user?.id === userId && state.cursor) {
				cursorX = state.cursor.x;
				cursorY = state.cursor.y;
				found = true;
			}
		});

		if (!found) {
			return;
		}

		// Calculate the center of the viewport in canvas coordinates
		const viewportCenterX = this.canvasWidth / 2;
		const viewportCenterY = this.canvasHeight / 2;

		// Calculate new stage position to center on cursor
		const currentScale = this.stage.scaleX();
		const newStageX = viewportCenterX - cursorX * currentScale;
		const newStageY = viewportCenterY - cursorY * currentScale;

		// Smoothly animate to the new position
		if (this.followTween) {
			this.followTween.destroy();
		}

		this.followTween = new Konva.Tween({
			node: this.stage,
			duration: 0.6,
			x: newStageX,
			y: newStageY,
			easing: Konva.Easings.EaseInOut,
			onFinish: () => {
				this.followTween = null;
			}
		});
		this.followTween.play();
	}

	/**
	 * Stop following a user
	 */
	stopFollowing(): void {
		if (this.followingUserId) {
			this.followingUserId = null;
		}
		if (this.followTween) {
			this.followTween.destroy();
			this.followTween = null;
		}
	}

	/**
	 * Render all remote cursors
	 * Updates existing nodes instead of recreating them for smooth animation
	 */
	private renderCursors(): void {
		if (!this.cursorsLayer || !this.stage || !this.awareness) return;

		const localClientId = this.awareness.clientID;

		// Get viewport bounds in canvas coordinates
		const stagePos = this.stage.position();
		const stageScale = this.stage.scaleX();
		const viewportBounds = {
			left: -stagePos.x / stageScale,
			top: -stagePos.y / stageScale,
			right: (-stagePos.x + this.canvasWidth) / stageScale,
			bottom: (-stagePos.y + this.canvasHeight) / stageScale
		};

		// Padding from edge for off-screen indicators
		const edgePadding = CURSOR.EDGE_PADDING;

		// Track which clients are still active
		const activeClients = new Set<number>();

		// Iterate through all awareness states
		this.awareness.getStates().forEach((state: AwarenessState, clientId: number) => {
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
			let cursorGroup = this.cursorNodes.get(clientId);

			if (isInViewport) {
				// ON-SCREEN CURSOR
				if (!cursorGroup || cursorGroup.getAttr('type') !== 'full') {
					// Need to create/recreate full cursor
					if (cursorGroup) {
						cursorGroup.remove();
						cursorGroup.destroy();
						this.cursorNodes.delete(clientId);
					}

					const counterScale = this.getCounterScale();
					cursorGroup = new Konva.Group({
						x: cursor.x,
						y: cursor.y,
						...counterScale
					});
					cursorGroup.setAttr('type', 'full');
					cursorGroup.setAttr('userId', user.id);

					// Make clickable
					this.setupCursorEventHandlers(cursorGroup, user.id);

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
						x: CURSOR.LABEL_OFFSET_X,
						y: CURSOR.LABEL_OFFSET_Y
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
					cursorGroup.setAttr('shouldPulse', false);
					this.cursorsLayer.add(cursorGroup);
					this.cursorNodes.set(clientId, cursorGroup);
				} else {
					// Smooth interpolation: tween to new position
					const currentPos = cursorGroup.position();
					const distance = Math.sqrt(
						Math.pow(cursor.x - currentPos.x, 2) + Math.pow(cursor.y - currentPos.y, 2)
					);

					// Only animate if position changed significantly
					if (distance > 1) {
						const counterScale = this.getCounterScale();
						new Konva.Tween({
							node: cursorGroup,
							duration: CURSOR.ANIMATION_DURATION / 1000,
							x: cursor.x,
							y: cursor.y,
							...counterScale,
							easing: Konva.Easings.EaseOut
						}).play();
					} else {
						// Update scale in case zoom changed
						const counterScale = this.getCounterScale();
						cursorGroup.scaleX(counterScale.scaleX);
						cursorGroup.scaleY(counterScale.scaleY);
					}
				}
			} else {
				// OFF-SCREEN INDICATOR
				const { edgeX, edgeY, angle } = this.calculateEdgePosition(
					cursor.x,
					cursor.y,
					viewportBounds,
					edgePadding,
					stageScale
				);

				if (!cursorGroup || cursorGroup.getAttr('type') !== 'indicator') {
					// Need to create/recreate indicator
					if (cursorGroup) {
						cursorGroup.remove();
						cursorGroup.destroy();
						this.cursorNodes.delete(clientId);
					}

					cursorGroup = this.createOffScreenIndicator(edgeX, edgeY, angle, user);

					cursorGroup.setAttr('type', 'indicator');
					cursorGroup.setAttr('userId', user.id);
					cursorGroup.setAttr('shouldPulse', true);

					this.setupCursorEventHandlers(cursorGroup, user.id);
					this.cursorsLayer.add(cursorGroup);
					this.cursorNodes.set(clientId, cursorGroup);
				} else {
					// Smoothly animate to new edge position and rotation
					const currentPos = cursorGroup.position();
					const distance = Math.sqrt(
						Math.pow(edgeX - currentPos.x, 2) + Math.pow(edgeY - currentPos.y, 2)
					);

					if (distance > 1) {
						const counterScale = this.getCounterScale();
						new Konva.Tween({
							node: cursorGroup,
							duration: CURSOR.ANIMATION_DURATION / 1000,
							x: edgeX,
							y: edgeY,
							rotation: (angle * 180) / Math.PI,
							...counterScale,
							easing: Konva.Easings.EaseOut
						}).play();

						// Counter-rotate the text to keep it horizontal
						const textNode = cursorGroup.findOne('Text');
						if (textNode) {
							new Konva.Tween({
								node: textNode,
								duration: CURSOR.ANIMATION_DURATION / 1000,
								rotation: -(angle * 180) / Math.PI,
								easing: Konva.Easings.EaseOut
							}).play();
						}
					} else {
						// Update scale in case zoom changed
						const counterScale = this.getCounterScale();
						cursorGroup.scaleX(counterScale.scaleX);
						cursorGroup.scaleY(counterScale.scaleY);
					}
				}
			}
		});

		// Remove nodes for users who left
		this.cursorNodes.forEach((node, clientId) => {
			if (!activeClients.has(clientId)) {
				node.remove();
				node.destroy();
				this.cursorNodes.delete(clientId);
			}
		});

		this.cursorsLayer.batchDraw();
	}

	/**
	 * Calculate edge position for off-screen cursor indicator
	 */
	private calculateEdgePosition(
		cursorX: number,
		cursorY: number,
		viewportBounds: { left: number; top: number; right: number; bottom: number },
		edgePadding: number,
		stageScale: number
	): { edgeX: number; edgeY: number; angle: number } {
		const centerX = (viewportBounds.left + viewportBounds.right) / 2;
		const centerY = (viewportBounds.top + viewportBounds.bottom) / 2;
		const dx = cursorX - centerX;
		const dy = cursorY - centerY;

		let edgeX = cursorX;
		let edgeY = cursorY;

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

		return { edgeX, edgeY, angle };
	}

	/**
	 * Create off-screen cursor indicator (droplet shape)
	 */
	private createOffScreenIndicator(
		x: number,
		y: number,
		angle: number,
		user: AwarenessUser
	): Konva.Group {
		const counterScale = this.getCounterScale();
		const group = new Konva.Group({
			x,
			y,
			rotation: (angle * 180) / Math.PI,
			...counterScale
		});

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
			x: -3,
			y: 0,
			rotation: -(angle * 180) / Math.PI
		});

		nameText.offsetX(nameText.width() / 2);
		nameText.offsetY(nameText.height() / 2);

		group.add(dropletCircle);
		group.add(dropletPoint);
		group.add(nameText);

		return group;
	}

	/**
	 * Set up cursor node event handlers (click, hover)
	 */
	private setupCursorEventHandlers(group: Konva.Group, userId: string): void {
		group.listening(true);
		group.on('click', () => {
			this.centerOnUser(userId);
		});
		group.on('mouseenter', () => {
			if (this.stage) this.stage.container().style.cursor = 'pointer';
		});
		group.on('mouseleave', () => {
			if (this.stage) this.stage.container().style.cursor = 'default';
		});
	}

	/**
	 * Get counter-scale to maintain cursor size regardless of zoom
	 */
	private getCounterScale(): { scaleX: number; scaleY: number } {
		const stageScale = this.stage.scaleX();
		return { scaleX: 1 / stageScale, scaleY: 1 / stageScale };
	}

	/**
	 * Start pulse animation for off-screen indicators
	 */
	private startPulseAnimation(): void {
		this.pulseAnimation = new Konva.Animation((frame) => {
			if (!frame) return;

			// Subtle pulse: 1.0 to 1.12 and back (2 second cycle)
			const pulseScale = 1 + Math.sin((frame.time * 2 * Math.PI) / 2000) * 0.12;

			// Apply to all indicator nodes, accounting for stage zoom
			this.cursorsLayer.children.forEach((node) => {
				if (node.getAttr('shouldPulse')) {
					const finalScale = pulseScale / this.stage.scaleX();
					node.scale({ x: finalScale, y: finalScale });
				}
			});
		}, this.cursorsLayer);

		this.pulseAnimation.start();
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		// Clean up awareness listeners FIRST
		if (this.awareness && this.awarenessChangeHandler) {
			this.awareness.off('change', this.awarenessChangeHandler);
			this.awareness.off('update', this.awarenessChangeHandler);
			this.awarenessChangeHandler = null;
		}

		if (this.pulseAnimation) {
			this.pulseAnimation.stop();
			this.pulseAnimation = null;
		}

		if (this.followTween) {
			this.followTween.destroy();
			this.followTween = null;
		}

		this.cursorNodes.forEach((node) => {
			node.destroy();
		});
		this.cursorNodes.clear();

		this.awareness = null;
	}
}
