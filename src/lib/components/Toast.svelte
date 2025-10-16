<script lang="ts">
	/**
	 * Simple Toast Component
	 * Shows ephemeral notifications at the bottom center of the screen
	 */

	let { message = '', visible = false } = $props<{ message: string; visible: boolean }>();
</script>

<div
	class="toast fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-200"
	class:toast-visible={visible}
	class:toast-hidden={!visible}
>
	<div class="rounded-lg border bg-white px-4 py-2 shadow-lg backdrop-blur-sm dark:bg-gray-900">
		<p class="text-sm font-medium text-gray-900 dark:text-gray-100">
			{message}
		</p>
	</div>
</div>

<style>
	.toast {
		pointer-events: none;
	}

	.toast-hidden {
		opacity: 0;
		transform: translate(-50%, 0.5rem) scale(0.95);
	}

	.toast-visible {
		opacity: 1;
		transform: translate(-50%, 0) scale(1);
	}
</style>
