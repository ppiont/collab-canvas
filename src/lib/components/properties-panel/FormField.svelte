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
<div class="space-y-2" data-form-field={id}>
	<!-- Label row with mixed value indicator -->
	<div class="flex justify-between items-center">
		<Label for={id} class="text-xs font-semibold text-slate-700 uppercase tracking-wide">
			{label}
			{#if required}
				<span class="text-red-500 ml-1">*</span>
			{/if}
		</Label>
		{#if isMixed}
			<span class="text-xs font-medium text-amber-600 bg-amber-100/80 px-2 py-1 rounded">
				Mixed
			</span>
		{/if}
	</div>

	<!-- Slot for input control -->
	<div class="relative">
		{@render children()}
	</div>

	<!-- Helper text or error -->
	{#if helperText}
		<p id="{id}-description" class="text-xs text-slate-500">
			{helperText}
		</p>
	{/if}
	{#if error}
		<div
			id="{id}-error"
			role="alert"
			class="text-xs font-medium text-red-600 bg-red-100/80 px-2 py-1 rounded"
		>
			{error}
		</div>
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
