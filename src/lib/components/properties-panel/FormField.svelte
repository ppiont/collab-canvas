<script lang="ts">
	/**
	 * Reusable Form Field Component
	 * 
	 * Handles labels, inputs, and accessibility requirements.
	 * Typography: field labels 12px, weight 500.
	 * Spacing: 8px within components (space-y-2).
	 * 
	 * Features:
	 * - Proper label associations (for/id)
	 * - Mixed value indicator for multiple selections
	 * - Helper text with aria-describedby
	 * - WCAG AA compliant contrast
	 * - 8pt grid spacing (space-y-2 = 8px)
	 */
	
	import type { Snippet } from 'svelte';
	import { Label } from '$lib/components/ui/label';
	
	// Props
	let { 
		id,
		label,
		helperText = '',
		isMixed = false,
		required = false,
		error = '',
		children
	}: { 
		id: string;
		label: string;
		helperText?: string;
		isMixed?: boolean;
		required?: boolean;
		error?: string;
		children: Snippet;
	} = $props();
	
	// Compute aria-describedby IDs
	const descriptionId = $derived(helperText || error ? `${id}-description` : undefined);
</script>

<!-- 
  Spacing reference (8pt grid):
  - 8px = space-2 (between label and input)
  - Within field: space-y-2
-->
<div class="space-y-2">
	<!-- Label row with mixed value indicator -->
	<div class="flex justify-between items-center">
		<Label 
			for={id}
			class="text-xs font-medium text-muted-foreground"
		>
			{label}
			{#if required}
				<span class="text-destructive ml-0.5" aria-label="required">*</span>
			{/if}
		</Label>
		
		{#if isMixed}
			<span 
				class="text-xs text-muted-foreground italic"
				aria-label="Mixed values across selection"
			>
				Mixed
			</span>
		{/if}
	</div>
	
	<!-- Input slot with proper aria associations -->
	<div 
		aria-describedby={descriptionId}
		aria-invalid={error ? 'true' : undefined}
	>
		{@render children()}
	</div>
	
	<!-- Helper text or error message -->
	{#if helperText && !error}
		<p 
			id="{id}-description" 
			class="text-xs text-muted-foreground"
		>
			{helperText}
		</p>
	{/if}
	
	{#if error}
		<p 
			id="{id}-description" 
			class="text-xs text-destructive"
			role="alert"
		>
			{error}
		</p>
	{/if}
</div>

<!--
USAGE EXAMPLES:

1. Basic text input:
<FormField id="width" label="Width">
  <Input type="number" id="width" value={width} />
</FormField>

2. With helper text:
<FormField id="height" label="Height" helperText="Height in pixels">
  <Input type="number" id="height" value={height} />
</FormField>

3. Required field:
<FormField id="name" label="Name" required>
  <Input type="text" id="name" value={name} />
</FormField>

4. Mixed values (multiple selection):
<FormField id="opacity" label="Opacity" isMixed={hasMixedOpacity}>
  <Input 
    type="number" 
    id="opacity" 
    value={mixedOpacity || ''} 
    placeholder={hasMixedOpacity ? '—' : ''}
  />
</FormField>

5. With error:
<FormField id="email" label="Email" error="Invalid email format">
  <Input type="email" id="email" value={email} />
</FormField>

6. With select dropdown:
<FormField id="blendMode" label="Blend Mode">
  <Select value={blendMode}>
    <SelectTrigger id="blendMode">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="normal">Normal</SelectItem>
    </SelectContent>
  </Select>
</FormField>
-->

