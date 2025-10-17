<script lang="ts">
	/**
	 * AI Command Palette
	 * Modal interface for AI canvas commands
	 */

	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-svelte';
	import { PUBLIC_PARTYKIT_HOST } from '$env/static/public';
	import { ShapeFactory } from '$lib/canvas/shapes/ShapeFactory';
	import { shapeOperations } from '$lib/stores/shapes';
	import { getShapesForLayout, getShapeWidth, getShapeHeight } from '$lib/utils/layout-helpers';

	import type { CanvasViewport } from '$lib/types/canvas';
	import type { ShapeType } from '$lib/types/shapes';

	let {
		open = $bindable(false),
		userId,
		viewport
	} = $props<{
		open?: boolean;
		userId: string;
		viewport: CanvasViewport;
	}>();

	let command = $state('');
	let commandState = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let errorMessage = $state('');

	// Keyboard shortcut: Cmd/Ctrl+K
	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				open = !open;
			}

			if (e.key === 'Escape' && open) {
				open = false;
			}
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	async function handleSubmit() {
		if (!command.trim()) return;

		commandState = 'loading';

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);

			const url = `http://${PUBLIC_PARTYKIT_HOST}/parties/yjs/main/api/ai/command`;

			console.log('[AI] Sending request to:', url);
			console.log('[AI] Current viewport:', viewport);

			// Calculate visible center of viewport
			const stageWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
			const stageHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
			const visibleCenterX = (-viewport.x + stageWidth / 2) / viewport.scale;
			const visibleCenterY = (-viewport.y + stageHeight / 2) / viewport.scale;

			console.log('[AI] Visible center:', visibleCenterX, visibleCenterY);

			const response = await fetch(url, {
				method: 'POST',
				mode: 'cors',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					command: command.trim(),
					userId: userId,
					viewport: {
						centerX: Math.round(visibleCenterX),
						centerY: Math.round(visibleCenterY),
						zoom: viewport.scale,
						stageWidth,
						stageHeight
					}
				}),
				signal: controller.signal
			});

			console.log('[AI] Response status:', response.status, response.statusText);
			console.log('[AI] Response headers:', Array.from(response.headers.entries()));

			clearTimeout(timeoutId);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || `Error ${response.status}`);
			}

			const data = await response.json();

			console.log('[AI Response]', data);

			if (!data.success) {
				throw new Error(data.error || 'Command failed');
			}

			// Execute AI tools client-side using our Yjs connection
			if (data.toolsToExecute && data.toolsToExecute.length > 0) {
				console.log('[AI] Executing', data.toolsToExecute.length, 'tools:', data.toolsToExecute);

				// Execute tools in parallel for faster performance
				await Promise.all(
					data.toolsToExecute.map((tool: { name: string; params: Record<string, unknown> }) =>
						executeAITool(tool.name, tool.params)
					)
				);

				console.log('[AI] All tools executed');
			} else {
				console.warn('[AI] No tools to execute in response');
			}

			commandState = 'success';
			setTimeout(() => {
				open = false;
				commandState = 'idle';
				command = '';
			}, 1000);
		} catch (error) {
			commandState = 'error';

			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					errorMessage = 'Request timed out. Try a simpler command.';
				} else {
					errorMessage = error.message;
				}
			} else {
				errorMessage = 'Failed to execute command';
			}
		}
	}

	// Reset commandState when dialog opens
	$effect(() => {
		if (open) {
			commandState = 'idle';
			errorMessage = '';
		}
	});

	/**
	 * Execute an AI tool client-side
	 */
	async function executeAITool(toolName: string, params: Record<string, unknown>): Promise<void> {
		console.log('[AI Tool Execution]', toolName, params);

		// Creation tools - use ShapeFactory
		const creationTools = [
			'createRectangle',
			'createCircle',
			'createEllipse',
			'createLine',
			'createText',
			'createPolygon',
			'createStar',
			'createImage'
		];

		if (creationTools.includes(toolName)) {
			const typeMap: Record<string, string> = {
				createRectangle: 'rectangle',
				createCircle: 'circle',
				createEllipse: 'ellipse',
				createLine: 'line',
				createText: 'text',
				createPolygon: 'polygon',
				createStar: 'star',
				createImage: 'image'
			};

			const shapeType = typeMap[toolName];
			const shape = ShapeFactory.create(shapeType as ShapeType, params, userId);
			shapeOperations.add(shape);
			return;
		}

		// Manipulation tools
		if (toolName === 'moveShape') {
			shapeOperations.update(params.shapeId as string, {
				x: params.x as number,
				y: params.y as number
			});
		} else if (toolName === 'resizeShape') {
			const updates: Record<string, unknown> = {};
			if (params.width) updates.width = params.width;
			if (params.height) updates.height = params.height;
			if (params.radius) updates.radius = params.radius;
			shapeOperations.update(params.shapeId as string, updates);
		} else if (toolName === 'rotateShape') {
			shapeOperations.update(params.shapeId as string, {
				rotation: (params.degrees as number) % 360
			});
		} else if (toolName === 'updateShapeColor') {
			const updates: Record<string, unknown> = {};
			if (params.fill) updates.fill = params.fill;
			if (params.stroke) updates.stroke = params.stroke;
			shapeOperations.update(params.shapeId as string, updates);
		} else if (toolName === 'deleteShape') {
			shapeOperations.delete(params.shapeId as string);
		} else if (toolName === 'duplicateShape') {
			const original = shapeOperations.get(params.shapeId as string);
			if (original) {
				const duplicate = {
					...original,
					id: crypto.randomUUID(),
					x: (original.x as number) + ((params.offsetX as number) || 20),
					y: (original.y as number) + ((params.offsetY as number) || 20),
					createdBy: userId,
					createdAt: Date.now()
				};
				shapeOperations.add(duplicate);
			}
		}
		// Layout tools
		else if (toolName === 'arrangeHorizontal') {
			console.log('[Layout] arrangeHorizontal - IDs:', params.shapeIds);
			const shapes = getShapesForLayout(params.shapeIds as string[]);

			console.log('[Layout] Found', shapes.length, 'shapes:', shapes);

			if (shapes.length === 0) {
				console.warn('[Layout] No shapes found!');
				return;
			}

			const spacing = (params.spacing as number) || 20;
			let currentX = (params.startX as number) || 100;
			const y = (params.startY as number) || (shapes[0].y as number);

			console.log('[Layout] Starting at X:', currentX, 'Y:', y, 'Spacing:', spacing);

			shapes.forEach((shape) => {
				const width = getShapeWidth(shape);
				console.log(
					'[Layout] Shape',
					shapes.indexOf(shape),
					'- ID:',
					shape.id,
					'Moving to X:',
					currentX,
					'Y:',
					y,
					'Width:',
					width
				);
				shapeOperations.update(shape.id, { x: currentX, y });
				currentX += width + spacing;
			});

			console.log('[Layout] arrangeHorizontal complete');
		} else if (toolName === 'arrangeVertical') {
			const shapes = getShapesForLayout(params.shapeIds as string[]);

			if (shapes.length === 0) return;

			const spacing = (params.spacing as number) || 20;
			const x = (params.startX as number) || (shapes[0].x as number);
			let currentY = (params.startY as number) || 100;

			shapes.forEach((shape) => {
				const height = getShapeHeight(shape);
				shapeOperations.update(shape.id, { x, y: currentY });
				currentY += height + spacing;
			});
		} else if (toolName === 'arrangeGrid') {
			const shapes = getShapesForLayout(params.shapeIds as string[]);

			if (shapes.length === 0) return;

			const spacing = (params.spacing as number) || 20;
			const startX = (params.startX as number) || 100;
			const startY = (params.startY as number) || 100;
			const cols = params.columns as number;
			const cellSize = 150; // Approximate cell size

			shapes.forEach((shape, index: number) => {
				const row = Math.floor(index / cols);
				const col = index % cols;
				shapeOperations.update(shape.id, {
					x: startX + col * (cellSize + spacing),
					y: startY + row * (cellSize + spacing)
				});
			});
		} else if (toolName === 'distributeEvenly') {
			const shapes = getShapesForLayout(params.shapeIds as string[]);

			if (shapes.length < 2) return;

			if (params.direction === 'horizontal') {
				const xs = shapes.map((s) => s.x as number);
				const minX = Math.min(...xs);
				const maxX = Math.max(...xs);
				const spacing = (maxX - minX) / (shapes.length - 1);

				shapes.forEach((shape, i: number) => {
					shapeOperations.update(shape.id, { x: minX + i * spacing });
				});
			} else {
				const ys = shapes.map((s) => s.y as number);
				const minY = Math.min(...ys);
				const maxY = Math.max(...ys);
				const spacing = (maxY - minY) / (shapes.length - 1);

				shapes.forEach((shape, i: number) => {
					shapeOperations.update(shape.id, { y: minY + i * spacing });
				});
			}
		} else if (toolName === 'alignShapes') {
			const shapes = getShapesForLayout(params.shapeIds as string[]);

			if (shapes.length === 0) return;

			const alignment = params.alignment;
			const positions = shapes.map((s) => ({
				x: s.x as number,
				y: s.y as number
			}));

			switch (alignment) {
				case 'left': {
					const minX = Math.min(...positions.map((p) => p.x));
					shapes.forEach((shape) => shapeOperations.update(shape.id, { x: minX }));
					break;
				}
				case 'right': {
					const maxX = Math.max(...positions.map((p) => p.x));
					shapes.forEach((shape) => shapeOperations.update(shape.id, { x: maxX }));
					break;
				}
				case 'center': {
					const avgX = positions.reduce((sum: number, p) => sum + p.x, 0) / positions.length;
					shapes.forEach((shape) => shapeOperations.update(shape.id, { x: avgX }));
					break;
				}
				case 'top': {
					const minY = Math.min(...positions.map((p) => p.y));
					shapes.forEach((shape) => shapeOperations.update(shape.id, { y: minY }));
					break;
				}
				case 'bottom': {
					const maxY = Math.max(...positions.map((p) => p.y));
					shapes.forEach((shape) => shapeOperations.update(shape.id, { y: maxY }));
					break;
				}
				case 'middle': {
					const avgY = positions.reduce((sum: number, p) => sum + p.y, 0) / positions.length;
					shapes.forEach((shape) => shapeOperations.update(shape.id, { y: avgY }));
					break;
				}
			}
		}
		// Query tools (getCanvasState, findShapesByType, findShapesByColor)
		// These are informational and don't modify canvas, so no client-side action needed
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<!-- No overlay - just the floating palette -->
		<DialogPrimitive.Content
			class="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2 rounded-lg border bg-white/80 p-4 shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
		>
			<!-- Header -->
			<div class="mb-3 flex items-center gap-2">
				<Sparkles class="h-4 w-4 text-primary" />
				<h2 class="text-sm font-semibold">AI Canvas Assistant</h2>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-3"
			>
				<div class="relative">
					<Input
						bind:value={command}
						placeholder="e.g., Create a red circle at 100, 200"
						disabled={commandState === 'loading'}
						class="pr-10"
						autofocus
					/>

					{#if commandState === 'loading'}
						<Loader2
							class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
						/>
					{:else if commandState === 'success'}
						<CheckCircle2
							class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
						/>
					{:else if commandState === 'error'}
						<XCircle class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
					{/if}
				</div>

				{#if commandState === 'loading'}
					<p class="text-sm text-muted-foreground">Processing your command...</p>
				{/if}

				{#if commandState === 'success'}
					<p class="text-sm font-medium text-green-600">Command executed successfully!</p>
				{/if}

				{#if commandState === 'error'}
					<p class="text-sm text-destructive">{errorMessage || 'Failed to execute command'}</p>
				{/if}

				<div class="flex items-center justify-between text-xs text-muted-foreground">
					<span>⌘K to toggle • ESC to close</span>
					<Button type="submit" size="sm" disabled={!command.trim() || commandState === 'loading'}>
						{commandState === 'loading' ? 'Processing...' : 'Execute'}
					</Button>
				</div>
			</form>

			<!-- Example commands - compact inline -->
			{#if commandState === 'idle'}
				<div class="border-t pt-2">
					<p class="text-xs text-muted-foreground">
						Try: "Create a red circle" • "Make a 200x150 rectangle" • "Add text Hello World"
					</p>
				</div>
			{/if}
		</DialogPrimitive.Content>
	</Dialog.Portal>
</Dialog.Root>
