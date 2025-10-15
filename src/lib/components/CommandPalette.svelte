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

	let { open = $bindable(false), userId } = $props<{ open?: boolean; userId: string }>();

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

			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					command: command.trim(),
					userId: userId
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
				for (const tool of data.toolsToExecute) {
					await executeAITool(tool.name, tool.params);
				}
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
	async function executeAITool(toolName: string, params: any): Promise<void> {
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
			const typeMap: Record<string, any> = {
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
			const shape = ShapeFactory.create(shapeType, params, userId);
			shapeOperations.add(shape);
			return;
		}

		// Manipulation tools
		if (toolName === 'moveShape') {
			shapeOperations.update(params.shapeId, { x: params.x, y: params.y });
		} else if (toolName === 'resizeShape') {
			const updates: any = {};
			if (params.width) updates.width = params.width;
			if (params.height) updates.height = params.height;
			if (params.radius) updates.radius = params.radius;
			shapeOperations.update(params.shapeId, updates);
		} else if (toolName === 'rotateShape') {
			shapeOperations.update(params.shapeId, { rotation: params.degrees % 360 });
		} else if (toolName === 'updateShapeColor') {
			const updates: any = {};
			if (params.fill) updates.fill = params.fill;
			if (params.stroke) updates.stroke = params.stroke;
			shapeOperations.update(params.shapeId, updates);
		} else if (toolName === 'deleteShape') {
			shapeOperations.delete(params.shapeId);
		} else if (toolName === 'duplicateShape') {
			const original = shapeOperations.get(params.shapeId);
			if (original) {
				const duplicate = {
					...original,
					id: crypto.randomUUID(),
					x: original.x + (params.offsetX || 20),
					y: original.y + (params.offsetY || 20),
					createdBy: userId,
					createdAt: Date.now()
				};
				shapeOperations.add(duplicate);
			}
		}
		// TODO: Implement layout tools if needed
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
