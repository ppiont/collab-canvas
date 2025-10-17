<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let isOpen = $state(false);

	// Keyboard shortcuts data, organized by category
	const shortcutCategories = [
		{
			name: 'Z-Order Management',
			shortcuts: [
				{ action: 'Bring to Front', keys: 'Cmd+]' },
				{ action: 'Send to Back', keys: 'Cmd+[' }
			]
		},
		{
			name: 'Shape Creation',
			shortcuts: [
				{ action: 'Rectangle', keys: 'R' },
				{ action: 'Circle', keys: 'C' },
				{ action: 'Line', keys: 'L' },
				{ action: 'Text', keys: 'T' },
				{ action: 'Polygon', keys: 'P' },
				{ action: 'Star', keys: 'S' },
				{ action: 'Triangle', keys: 'H' }
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
			name: 'Navigation',
			shortcuts: [
				{ action: 'Pan Canvas', keys: 'Space+Drag' },
				{ action: 'Zoom In', keys: 'Scroll Up' },
				{ action: 'Zoom Out', keys: 'Scroll Down' }
			]
		},
		{
			name: 'Movement',
			shortcuts: [
				{ action: 'Nudge Up', keys: '↑' },
				{ action: 'Nudge Down', keys: '↓' },
				{ action: 'Nudge Left', keys: '←' },
				{ action: 'Nudge Right', keys: '→' }
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
	<Dialog.Content class="max-w-5xl max-h-[90vh]">
		<Dialog.Header>
			<Dialog.Title>Keyboard Shortcuts</Dialog.Title>
			<Dialog.Description>Hold TAB to view all available shortcuts</Dialog.Description>
		</Dialog.Header>

		<div class="grid grid-cols-3 gap-6 pr-4">
			{#each shortcutCategories as category (category.name)}
				<div class="space-y-2">
					<h3 class="font-semibold text-sm text-foreground/80">{category.name}</h3>
					<div class="space-y-1">
						{#each category.shortcuts as shortcut (shortcut.action)}
							<div
								class="flex items-center justify-between px-2 py-1.5 rounded transition-colors hover:bg-accent/50"
							>
								<span class="text-sm text-muted-foreground">
									{shortcut.action}
								</span>
								<kbd
									class={cn(
										'px-2 py-0.5 text-xs font-mono font-semibold',
										'bg-muted border border-border rounded',
										'text-foreground/90'
									)}
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
