<script lang="ts">
	/**
	 * Connection Status Indicator
	 * Shows real-time connection state to PartyKit
	 */

	import { connectionStatus, provider } from '$lib/collaboration';

	let status = $derived($connectionStatus);
	let currentProvider = $derived($provider);
	let connectedUsers = $state(1);

	// Update connected users count from awareness
	$effect(() => {
		if (currentProvider) {
			const updateCount = () => {
				const count = currentProvider.awareness.getStates().size;
				connectedUsers = count;
				console.log('Connected users updated:', count);
			};

			// Initial count
			updateCount();

			// Listen to awareness changes
			currentProvider.awareness.on('change', updateCount);
			currentProvider.awareness.on('update', updateCount);

			return () => {
				currentProvider.awareness.off('change', updateCount);
				currentProvider.awareness.off('update', updateCount);
			};
		}
	});

	// Status labels
	const statusLabels = {
		connected: 'Connected',
		connecting: 'Connecting...',
		disconnected: 'Disconnected'
	};
</script>

<div
	class="connection-status"
	class:connected={status === 'connected'}
	class:connecting={status === 'connecting'}
	class:disconnected={status === 'disconnected'}
>
	<span class="dot"></span>
	<span class="text">
		{statusLabels[status]}
		{#if status === 'connected'}
			<span class="users">• {connectedUsers} online</span>
		{/if}
	</span>
</div>

<style>
	.connection-status {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.95);
		padding: 0.625rem 1rem;
		border-radius: 8px;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(8px);
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		transition: background-color 0.3s ease;
	}

	.connection-status.connected .dot {
		background-color: #10b981;
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
	}

	.connection-status.connecting .dot {
		background-color: #f59e0b;
		animation: pulse-dot 1.5s ease-in-out infinite;
	}

	.connection-status.disconnected .dot {
		background-color: #ef4444;
	}

	.text {
		color: #334155;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.users {
		color: #64748b;
		font-weight: 400;
	}

	@keyframes pulse-dot {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.6;
			transform: scale(1.2);
		}
	}

	.connection-status.connected {
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.connection-status.connecting {
		border: 1px solid rgba(245, 158, 11, 0.2);
	}

	.connection-status.disconnected {
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
</style>
