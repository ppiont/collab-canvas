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

			// Build URL, handling cases where PUBLIC_PARTYKIT_HOST may or may not include protocol
			const host = PUBLIC_PARTYKIT_HOST || 'localhost:1999';
			const protocol = host.startsWith('http://') || host.startsWith('https://') ? '' : 'https://';
			const url = `${protocol}${host}/parties/yjs/main/api/ai/command`;

			// Calculate visible center of viewport
			const stageWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
			const stageHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
			const visibleCenterX = (-viewport.x + stageWidth / 2) / viewport.scale;
			const visibleCenterY = (-viewport.y + stageHeight / 2) / viewport.scale;

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

			clearTimeout(timeoutId);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || `Error ${response.status}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Command failed');
			}

			// Execute AI tools client-side using our Yjs connection
			if (data.toolsToExecute && data.toolsToExecute.length > 0) {
				// Execute tools in parallel for faster performance
				await Promise.all(
					data.toolsToExecute.map((tool: { name: string; params: Record<string, unknown> }) =>
						executeAITool(tool.name, tool.params)
					)
				);
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
		// Creation tools - use ShapeFactory
		const creationTools = [
			'createRectangle',
			'createCircle',
			'createLine',
			'createText',
			'createPolygon',
			'createStar',
			'createTriangle'
		];

		if (creationTools.includes(toolName)) {
			const typeMap: Record<string, string> = {
				createRectangle: 'rectangle',
				createCircle: 'circle',
				createLine: 'line',
				createText: 'text',
				createPolygon: 'polygon',
				createStar: 'star',
				createTriangle: 'triangle'
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
			const shapes = getShapesForLayout(params.shapeIds as string[]);

			if (shapes.length === 0) {
				return;
			}

			const spacing = (params.spacing as number) || 20;
			let currentX = (params.startX as number) || 100;
			const y = (params.startY as number) || (shapes[0].y as number);

			shapes.forEach((shape) => {
				const width = getShapeWidth(shape);
				shapeOperations.update(shape.id, { x: currentX, y });
				currentX += width + spacing;
			});
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
		<!-- No overlay - keep canvas visible -->
		
		<!-- Floating palette -->
		<DialogPrimitive.Content
			class="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-white via-violet-50/50 to-indigo-50/50 shadow-2xl shadow-violet-500/20 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[10%] data-[state=open]:slide-in-from-top-[10%]"
		>
			<!-- Gradient header -->
			<div class="rounded-t-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-4">
				<div class="flex items-center gap-3">
					<div class="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
						<Sparkles class="h-6 w-6 text-yellow-300" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-white">AI Canvas Assistant</h2>
						<p class="text-xs text-violet-100">Powered by GPT-4</p>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
					class="space-y-4"
				>
					<div class="relative">
						<Input
							bind:value={command}
							placeholder="Tell me what to create... (e.g., 'Create a red circle' or 'Make a login form')"
							disabled={commandState === 'loading'}
							class="h-14 rounded-xl border-2 border-violet-200 bg-white px-5 text-base shadow-inner focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
							autofocus
						/>

						{#if commandState === 'loading'}
							<div class="absolute right-4 top-1/2 -translate-y-1/2">
								<Loader2 class="h-5 w-5 animate-spin text-violet-600" />
							</div>
						{:else if commandState === 'success'}
							<div class="absolute right-4 top-1/2 -translate-y-1/2">
								<div class="rounded-full bg-green-100 p-1">
									<CheckCircle2 class="h-5 w-5 text-green-600" />
								</div>
							</div>
						{:else if commandState === 'error'}
							<div class="absolute right-4 top-1/2 -translate-y-1/2">
								<div class="rounded-full bg-red-100 p-1">
									<XCircle class="h-5 w-5 text-red-600" />
								</div>
							</div>
						{/if}
					</div>

					{#if commandState === 'loading'}
						<div class="flex items-center gap-2 rounded-lg bg-violet-100 px-4 py-3">
							<Loader2 class="h-4 w-4 animate-spin text-violet-600" />
							<p class="text-sm font-medium text-violet-900">Processing your command...</p>
						</div>
					{/if}

					{#if commandState === 'success'}
						<div class="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-3">
							<CheckCircle2 class="h-4 w-4 text-green-600" />
							<p class="text-sm font-medium text-green-900">Command executed successfully! ✨</p>
						</div>
					{/if}

					{#if commandState === 'error'}
						<div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
							<div class="flex items-start gap-2">
								<XCircle class="h-4 w-4 text-red-600 mt-0.5" />
								<div>
									<p class="text-sm font-medium text-red-900">Command failed</p>
									<p class="text-xs text-red-700 mt-1">{errorMessage || 'Please try again'}</p>
								</div>
							</div>
						</div>
					{/if}

					<div class="flex items-center justify-between">
						<div class="flex items-center gap-4 text-xs text-slate-600">
							<span class="flex items-center gap-1">
								<kbd
									class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs border border-slate-300"
									>⌘K</kbd
								>
								to toggle
							</span>
							<span class="flex items-center gap-1">
								<kbd
									class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs border border-slate-300"
									>ESC</kbd
								>
								to close
							</span>
						</div>
						<Button 
							type="submit" 
							size="lg"
							disabled={!command.trim() || commandState === 'loading'}
							class="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
						>
							{#if commandState === 'loading'}
								<Loader2 class="h-4 w-4 animate-spin mr-2" />
								Processing...
							{:else}
								<Sparkles class="h-4 w-4 mr-2 text-yellow-300" />
								Execute
							{/if}
						</Button>
					</div>
				</form>

				<!-- Example commands -->
				{#if commandState === 'idle'}
					<div
						class="mt-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 p-4"
					>
						<p class="text-xs font-semibold text-violet-900 mb-2">Try these examples:</p>
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								onclick={() => (command = 'Create a red circle')}
								class="rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-colors"
							>
								Create a red circle
							</button>
							<button
								type="button"
								onclick={() => (command = 'Make a 200x150 blue rectangle')}
								class="rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-colors"
							>
								Make a 200x150 blue rectangle
							</button>
							<button
								type="button"
								onclick={() => (command = 'Add text that says Hello World')}
								class="rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-colors"
							>
								Add text "Hello World"
							</button>
							<button
								type="button"
								onclick={() => (command = 'Create a login form')}
								class="rounded-lg bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm border border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-colors"
							>
								Create a login form
							</button>
						</div>
					</div>
				{/if}
			</div>
		</DialogPrimitive.Content>
	</Dialog.Portal>
</Dialog.Root>
