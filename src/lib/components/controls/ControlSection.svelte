<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		title: string;
		sectionId: string;
	}

	let { title, sectionId }: Props = $props();

	const localStorageKey = `section-collapsed-${sectionId}`;

	let isCollapsed = $state(false);

	// Load collapsed state from localStorage
	$effect.pre(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem(localStorageKey);
			isCollapsed = stored ? JSON.parse(stored) : false;
		}
	});

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
		if (typeof window !== 'undefined') {
			localStorage.setItem(localStorageKey, JSON.stringify(isCollapsed));
		}
	}
</script>

<div class="border rounded-lg overflow-hidden">
	<button
		onclick={toggleCollapse}
		class="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
	>
		<h3 class="font-semibold text-sm">{title}</h3>
		<ChevronDown
			class="w-4 h-4 transition-transform"
			style="transform: rotate({isCollapsed ? '-90deg' : '0deg'})"
		/>
	</button>

	{#if !isCollapsed}
		<div class="border-t p-3 space-y-3">
			<!-- svelte-ignore slot_element_deprecated -->
			<slot />
		</div>
	{/if}
</div>
