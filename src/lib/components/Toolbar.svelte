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
	class="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur-md"
>
	<!-- Shape tools -->
	{#each shapeTools as tool (tool.id)}
		<Button
			variant={$activeTool === tool.id ? 'default' : 'ghost'}
			size="icon"
			onclick={() => activeTool.set(tool.id)}
			title="{tool.label} ({tool.shortcut})"
			class={`h-11 w-11 cursor-pointer rounded-xl transition-all hover:scale-105 hover:shadow-lg active:scale-95 ${
				$activeTool === tool.id
					? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
					: 'hover:bg-slate-100'
			}`}
		>
			{@const Icon = tool.icon}
			<Icon class="h-5 w-5" />
		</Button>
	{/each}

	<Separator orientation="vertical" class="mx-1 h-8 bg-slate-300" />

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
		class="h-11 w-11 cursor-pointer rounded-xl hover:bg-slate-100 disabled:opacity-40"
	>
		<Undo class="h-5 w-5" />
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
		class="h-11 w-11 cursor-pointer rounded-xl hover:bg-slate-100 disabled:opacity-40"
	>
		<Redo class="h-5 w-5" />
	</Button>

	<Separator orientation="vertical" class="mx-1 h-8 bg-slate-300" />

	<!-- AI Command Palette trigger -->
	<Button
		variant="ghost"
		size="icon"
		onclick={onCommandPaletteOpen}
		title="AI Assistant (⌘K)"
		class="h-11 w-11 cursor-pointer rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-violet-500/40 active:scale-95"
	>
		<Sparkles class="h-5 w-5" />
	</Button>
</div>
