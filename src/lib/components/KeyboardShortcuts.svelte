<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let isOpen = $state(false);

	// Keyboard shortcuts data, organized by category
	const shortcutCategories = [
		{
			name: 'Shape Creation',
			shortcuts: [
				{ action: 'Rectangle', keys: 'R' },
				{ action: 'Circle', keys: 'C' },
				{ action: 'Line', keys: 'L' },
				{ action: 'Text', keys: 'T' },
				{ action: 'Polygon', keys: 'P' },
				{ action: 'Star', keys: 'S' },
				{ action: 'Triangle', keys: 'G' }
			]
		},
		{
			name: 'Editing',
			shortcuts: [
				{ action: 'Duplicate', keys: 'Cmd+D' },
				{ action: 'Delete', keys: 'Delete' },
				{ action: 'Copy', keys: 'Cmd+C' },
				{ action: 'Paste', keys: 'Cmd+V' },
				{ action: 'Undo', keys: 'Cmd+Z' },
				{ action: 'Redo', keys: 'Cmd+Shift+Z' }
			]
		},
		{
			name: 'AI',
			shortcuts: [{ action: 'Command Palette', keys: 'Cmd+K' }]
		},
		{
			name: 'Movement',
			shortcuts: [
				{ action: 'Nudge Up', keys: '↑' },
				{ action: 'Nudge Down', keys: '↓' },
				{ action: 'Nudge Left', keys: '←' },
				{ action: 'Nudge Right', keys: '→' }
			]
		},
		{
			name: 'Selection',
			shortcuts: [
				{ action: 'Select All', keys: 'Cmd+A' },
				{ action: 'Deselect', keys: 'Esc' },
				{ action: 'Multi-select', keys: 'Cmd+Click' },
				{ action: 'Add to Selection', keys: 'Shift+Click' }
			]
		},
		{
			name: 'Navigation',
			shortcuts: [
				{ action: 'Pan Canvas', keys: 'Space+Drag' },
				{ action: 'Zoom In', keys: 'Scroll Up' },
				{ action: 'Zoom Out', keys: 'Scroll Down' }
			]
		},
		{
			name: 'Z-Order Management',
			shortcuts: [
				{ action: 'Bring to Front', keys: 'Cmd+Shift+]' },
				{ action: 'Send to Back', keys: 'Cmd+Shift+[' }
			]
		}
	];

	onMount(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Tab') {
				e.preventDefault();
				isOpen = true;
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Tab') {
				isOpen = false;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	});
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Portal></Dialog.Portal>
	<Dialog.Content
		class="w-full max-w-[75%] max-h-[80vh] bg-white/70 backdrop-blur-md"
		showCloseButton={false}
	>
		<Dialog.Header class="pb-4">
			<Dialog.Title class="text-2xl font-bold tracking-tight">Keyboard Shortcuts</Dialog.Title>
			<Dialog.Description class="text-sm text-slate-600 mt-1"
				>Hold TAB to view shortcuts</Dialog.Description
			>
		</Dialog.Header>

		<div class="grid grid-flow-col gap-x-8 gap-y-0 overflow-y-auto auto-rows-max">
			{#each shortcutCategories as category (category.name)}
				<div>
					<h3 class="text-xs font-bold uppercase tracking-widest text-slate-700 mb-3">
						{category.name}
					</h3>
					<div class="space-y-2">
						{#each category.shortcuts as shortcut (shortcut.action)}
							<div class="flex items-center justify-between gap-4">
								<span class="text-sm font-medium text-slate-700 flex-1">
									{shortcut.action}
								</span>
								<kbd
									class="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 border border-slate-300 rounded text-slate-900 whitespace-nowrap"
								>
									{shortcut.keys}
								</kbd>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(kbd) {
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
	}
</style>
