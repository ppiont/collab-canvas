/**
 * Cursor Manager - Remote Cursor Rendering
 * TODO: Extract 400+ lines of cursor logic from canvas/+page.svelte
 * Week 2 Implementation - High Priority
 */

import Konva from 'konva';
import type { Awareness } from 'y-protocols/awareness';
import { CURSOR } from '$lib/constants';

interface RemoteCursor {
    x: number;
    y: number;
    user: {
        id: string;
        name: string;
        color: string;
    };
}

export class CursorManager {
    private cursorsLayer: Konva.Layer;
    private stage: Konva.Stage;
    private awareness: Awareness | null = null;
    private cursorNodes = new Map<number, Konva.Group>();
    private pulseAnimation: Konva.Animation | null = null;
    private lastCursorUpdate = 0;
    private localClientId?: number;

    constructor(stage: Konva.Stage, cursorsLayer: Konva.Layer) {
        this.stage = stage;
        this.cursorsLayer = cursorsLayer;
    }

    /**
     * Initialize with awareness instance
     */
    initialize(awareness: Awareness) {
        this.awareness = awareness;
        this.localClientId = awareness.clientID;

        // Listen to awareness changes
        const handleChange = () => {
            this.renderCursors();
        };

        awareness.on('change', handleChange);
        awareness.on('update', handleChange);

        // Start pulse animation for off-screen indicators
        this.startPulseAnimation();
    }

    /**
     * Broadcast local cursor position (throttled)
     */
    broadcastCursor(e: Konva.KonvaEventObject<MouseEvent>) {
        if (!this.awareness) return;

        const now = Date.now();
        if (now - this.lastCursorUpdate < CURSOR.THROTTLE_MS) return;

        this.lastCursorUpdate = now;

        const pointer = this.stage.getPointerPosition();
        if (!pointer) return;

        // Transform to canvas coordinates
        const transform = this.stage.getAbsoluteTransform().copy().invert();
        const pos = transform.point(pointer);

        // Update awareness
        this.awareness.setLocalStateField('cursor', {
            x: pos.x,
            y: pos.y
        });
    }

    /**
     * Render all remote cursors
     */
    private renderCursors() {
        // TODO: Implement full cursor rendering logic
        // This will be extracted from canvas/+page.svelte
    }

    /**
     * Start pulse animation for off-screen indicators
     */
    private startPulseAnimation() {
        // TODO: Implement pulse animation
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.pulseAnimation) {
            this.pulseAnimation.stop();
        }
        this.cursorNodes.forEach(node => node.destroy());
        this.cursorNodes.clear();
    }
}

