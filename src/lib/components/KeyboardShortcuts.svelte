<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { onMount } from 'svelte';

	let isOpen = $state(false);

	// Keyboard shortcuts data
	const shortcuts = [
		// Z-order management
		{ action: 'Bring to Front', keys: 'Cmd+]' },
		{ action: 'Send to Back', keys: 'Cmd+[' },

		// Shape creation
		{ action: 'Rectangle', keys: 'R' },
		{ action: 'Circle', keys: 'C' },
		{ action: 'Line', keys: 'L' },
		{ action: 'Text', keys: 'T' },
		{ action: 'Polygon', keys: 'P' },
		{ action: 'Star', keys: 'S' },
		{ action: 'Triangle', keys: 'H' },

		// Selection
		{ action: 'Select All', keys: 'Cmd+A' },
		{ action: 'Deselect', keys: 'Esc' },
		{ action: 'Multi-select', keys: 'Cmd+Click' },
		{ action: 'Add to selection', keys: 'Shift+Click' },

		// Editing
		{ action: 'Duplicate', keys: 'Cmd+D' },
		{ action: 'Delete', keys: 'Delete' },
		{ action: 'Copy', keys: 'Cmd+C' },
		{ action: 'Paste', keys: 'Cmd+V' },
		{ action: 'Undo', keys: 'Cmd+Z' },
		{ action: 'Redo', keys: 'Cmd+Shift+Z' },

		// Navigation
		{ action: 'Pan canvas', keys: 'Space+Drag' },
		{ action: 'Zoom in', keys: 'Cmd+Scroll' },
		{ action: 'Zoom out', keys: 'Cmd+Scroll' },

		// Movement
		{ action: 'Nudge up', keys: 'Arrow Up' },
		{ action: 'Nudge down', keys: 'Arrow Down' },
		{ action: 'Nudge left', keys: 'Arrow Left' },
		{ action: 'Nudge right', keys: 'Arrow Right' }
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
	<Dialog.Content class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Keyboard Shortcuts</Dialog.Title>
			<Dialog.Description>
				Hold TAB to view shortcuts. Press TAB again to close.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-1">
			{#each shortcuts as shortcut (shortcut.action)}
				<div class="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
					<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
						{shortcut.action}
					</span>
					<kbd class="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded">
						{shortcut.keys}
					</kbd>
				</div>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	kbd {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo,
			monospace;
	}
</style>
