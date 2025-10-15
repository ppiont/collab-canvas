/**
 * Canvas Engine - Core Konva Stage Management
 * TODO: Extract stage setup and event handling from canvas/+page.svelte
 * Week 2 Implementation
 */

import Konva from 'konva';
import type { CanvasConfig } from '$lib/types/canvas';

export class CanvasEngine {
    private stage: Konva.Stage | null = null;
    private config: CanvasConfig;

    constructor(container: HTMLDivElement, config: CanvasConfig) {
        this.config = config;
        // TODO: Initialize Konva stage
    }

    getStage(): Konva.Stage | null {
        return this.stage;
    }

    destroy() {
        if (this.stage) {
            this.stage.destroy();
            this.stage = null;
        }
    }
}

