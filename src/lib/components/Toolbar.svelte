<script lang="ts">
	/**
	 * Enhanced Canvas Toolbar
	 * Provides UI controls for all shape tools, undo/redo, and AI assistant
	 */

	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { activeTool } from '$lib/stores/tool';
	import { history, canUndo, canRedo } from '$lib/stores/history';

	// Icons from lucide-svelte
	import {
		Square,
		Circle,
		Minus,
		Type,
		Pentagon,
		Star,
		Triangle,
		Undo,
		Redo,
		Sparkles
	} from 'lucide-svelte';

	let { onCommandPaletteOpen, onUndo, onRedo } = $props<{
		onCommandPaletteOpen: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
	}>();

	import type { ToolType } from '$lib/stores/tool';
	import type { ComponentType } from 'svelte';

	const shapeTools: Array<{ id: ToolType; icon: ComponentType; label: string; shortcut: string }> =
		[
			{ id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
			{ id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
			{ id: 'triangle', icon: Triangle, label: 'Triangle', shortcut: 'G' },
			{ id: 'polygon', icon: Pentagon, label: 'Polygon', shortcut: 'P' },
			{ id: 'star', icon: Star, label: 'Star', shortcut: 'S' },
			{ id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
			{ id: 'text', icon: Type, label: 'Text', shortcut: 'T' }
		];
</script>

<div
	class="fixed left-4 top-4 z-10 flex flex-col gap-2 rounded-lg border bg-white/95 p-2 shadow-lg backdrop-blur-sm"
>
	<!-- Shape tools -->
	{#each shapeTools as tool (tool.id)}
		<Button
			variant={$activeTool === tool.id ? 'default' : 'ghost'}
			size="icon"
			onclick={() => activeTool.set(tool.id)}
			title="{tool.label} ({tool.shortcut})"
			class="cursor-pointer transition-all hover:scale-110 hover:shadow-md active:scale-95"
		>
			{@const Icon = tool.icon}
			<Icon class="h-4 w-4" />
		</Button>
	{/each}

	<Separator />

	<!-- Undo/Redo -->
	<Button
		variant="ghost"
		size="icon"
		disabled={!$canUndo}
		onclick={() => {
			history.undo();
			onUndo?.();
		}}
		title="Undo (⌘Z)"
		class="cursor-pointer"
	>
		<Undo class="h-4 w-4" />
	</Button>
	<Button
		variant="ghost"
		size="icon"
		disabled={!$canRedo}
		onclick={() => {
			history.redo();
			onRedo?.();
		}}
		title="Redo (⌘⇧Z)"
		class="cursor-pointer"
	>
		<Redo class="h-4 w-4" />
	</Button>

	<Separator />

	<!-- AI Command Palette trigger -->
	<Button
		variant="ghost"
		size="icon"
		onclick={onCommandPaletteOpen}
		title="AI Assistant (⌘K)"
		class="cursor-pointer"
	>
		<Sparkles class="h-4 w-4" />
	</Button>
</div>
