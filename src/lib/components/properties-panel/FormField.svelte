<script lang="ts">
	/**
	 * Reusable Form Field Component
	 * 
	 * Handles labels, inputs, and accessibility requirements.
	 * Typography: field labels 12px, weight 500.
	 * Spacing: 8px within components (space-y-2).
	 */
	
	import type { Snippet } from 'svelte';
	
	// Props
	let { 
		id,
		label,
		helperText = '',
		isMixed = false,
		required = false,
		children
	}: { 
		id: string;
		label: string;
		helperText?: string;
		isMixed?: boolean;
		required?: boolean;
		children: Snippet;
	} = $props();
</script>

<!-- Form field wrapper with proper accessibility -->
<div class="space-y-2">
	<div class="flex justify-between items-center">
		<label 
			for={id}
			class="text-xs font-medium text-muted-foreground"
			aria-required={required}
		>
			{label}
		</label>
		{#if isMixed}
			<span class="text-xs text-muted-foreground">Mixed values</span>
		{/if}
	</div>
	
	<div aria-describedby={helperText ? `${id}-description` : undefined}>
		{@render children()}
	</div>
	
	{#if helperText}
		<p id="{id}-description" class="text-xs text-muted-foreground">
			{helperText}
		</p>
	{/if}
</div>

