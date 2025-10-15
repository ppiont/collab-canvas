<script lang="ts">
	/**
	 * AI Command Palette (Placeholder)
	 * Modal interface for AI canvas commands
	 */

	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-svelte';

	let { open = $bindable(false) } = $props<{ open?: boolean }>();

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

	function handleSubmit() {
		if (!command.trim()) return;

		// Placeholder: show loading then success
		commandState = 'loading';

		setTimeout(() => {
			commandState = 'success';
			setTimeout(() => {
				open = false;
				commandState = 'idle';
				command = '';
			}, 1000);
		}, 1500);
	}

	// Reset commandState when dialog opens
	$effect(() => {
		if (open) {
			commandState = 'idle';
			errorMessage = '';
		}
	});
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
