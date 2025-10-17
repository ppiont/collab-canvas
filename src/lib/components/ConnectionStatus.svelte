<script lang="ts">
	/**
	 * Connection Status Indicator with Online Users Dropdown
	 * Shows real-time connection state to PartyKit and list of online users
	 */

	import { connectionStatus, provider } from '$lib/collaboration';
	import LogoutIcon from '$lib/assets/logout.svg';

	interface OnlineUser {
		clientId: number;
		id: string;
		name: string;
		color: string;
	}

	let { currentUserId, onUserClick } = $props<{
		currentUserId: string;
		onUserClick?: (userId: string) => void;
	}>();

	let status = $derived($connectionStatus);
	let currentProvider = $derived($provider);
	let users = $state<OnlineUser[]>([]);
	let showDropdown = $state(false);

	// Update users list from awareness
	function updateUsers() {
		if (!currentProvider || !currentProvider.awareness) return;

		const states = currentProvider.awareness.getStates();
		const usersList: OnlineUser[] = [];

		states.forEach((state: Record<string, unknown>, clientId: number) => {
			if (state && typeof state === 'object' && 'user' in state) {
				const user = state.user as typeof state.user;
				if (user) {
					usersList.push({
						clientId,
						id: (user as Record<string, string>).id,
						name: (user as Record<string, string>).name,
						color: (user as Record<string, string>).color
					});
				}
			}
		});

		// Sort: current user first, then alphabetically
		usersList.sort((a, b) => {
			if (a.id === currentUserId) return -1;
			if (b.id === currentUserId) return 1;
			return a.name.localeCompare(b.name);
		});

		users = usersList;
	}

	// Listen to awareness changes
	$effect(() => {
		if (currentProvider && currentProvider.awareness) {
			const handleChange = () => {
				updateUsers();
			};

			currentProvider.awareness.on('change', handleChange);
			currentProvider.awareness.on('update', handleChange);

			// Initial load
			updateUsers();

			return () => {
				currentProvider.awareness.off('change', handleChange);
				currentProvider.awareness.off('update', handleChange);
			};
		}
	});

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleUserClick(userId: string) {
		if (onUserClick) {
			onUserClick(userId);
		}
	}

	function handleUserKeyPress(event: KeyboardEvent, userId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleUserClick(userId);
		}
	}

	// Status labels
	const statusLabels = {
		connected: 'Connected',
		connecting: 'Connecting...',
		disconnected: 'Disconnected'
	};
</script>

<div class="connection-status-container">
	<div class="status-wrapper">
		<button
			class="connection-status"
			class:connected={status === 'connected'}
			class:connecting={status === 'connecting'}
			class:disconnected={status === 'disconnected'}
			onclick={toggleDropdown}
		>
			<span class="dot"></span>
			<span class="text">
				{statusLabels[status]}
				{#if status === 'connected'}
					<span class="count">• {users.length}</span>
				{/if}
			</span>
			{#if status === 'connected'}
				<span class="arrow" class:open={showDropdown}>▼</span>
			{/if}
		</button>

		<!-- Sign Out Button -->
		<form method="POST" action="/auth/signout" class="signout-form">
			<button type="submit" class="signout-button" title="Sign Out">
				<img src={LogoutIcon} alt="Sign out" class="signout-icon" />
				<span class="signout-text">Sign Out</span>
			</button>
		</form>
	</div>

	{#if showDropdown && status === 'connected'}
		<div class="dropdown">
			<div class="dropdown-header">Online Users</div>
			<ul class="user-list">
				{#each users as user (user.clientId)}
					<li class:is-current={user.id === currentUserId}>
						{#if user.id !== currentUserId}
							<button
								class="user-item clickable"
								onclick={() => handleUserClick(user.id)}
								onkeydown={(e) => handleUserKeyPress(e, user.id)}
							>
								<div class="user-dot" style="background: {user.color}"></div>
								<span class="user-name">{user.name}</span>
							</button>
						{:else}
							<div class="user-item">
								<div class="user-dot" style="background: {user.color}"></div>
								<span class="user-name">{user.name}</span>
								<span class="badge">You</span>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.connection-status-container {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 100;
	}

	.status-wrapper {
		display: flex;
		align-items: stretch;
		flex-direction: row;
		gap: 0;
	}

	.connection-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.95);
		padding: 0.625rem 1rem;
		border-radius: 8px 0 0 8px;
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
		border: none;
		cursor: pointer;
	}

	.connection-status:hover {
		background: rgba(255, 255, 255, 1);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.08);
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

	.count {
		color: #64748b;
		font-weight: 400;
	}

	.arrow {
		font-size: 0.625rem;
		color: #64748b;
		transition: transform 0.2s ease;
		margin-left: 0.25rem;
	}

	.arrow.open {
		transform: rotate(180deg);
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

	/* Dropdown styles */
	.dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		min-width: 200px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 8px;
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(12px);
		overflow: hidden;
		animation: dropdownFadeIn 0.2s ease;
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-header {
		padding: 0.75rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.user-list {
		list-style: none;
		margin: 0;
		padding: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.user-list li {
		list-style: none;
	}

	.user-list li.is-current {
		background-color: rgba(102, 126, 234, 0.08);
		border-radius: 6px;
	}

	.user-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.625rem;
		border-radius: 6px;
		transition: background-color 0.2s ease;
		width: 100%;
		text-align: left;
	}

	.user-item.clickable {
		cursor: pointer;
		background: none;
		border: none;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}

	.user-item.clickable:hover {
		background-color: rgba(102, 126, 234, 0.12);
	}

	.user-item.clickable:focus {
		outline: 2px solid #667eea;
		outline-offset: -2px;
		background-color: rgba(102, 126, 234, 0.12);
	}

	.user-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
	}

	.user-name {
		font-size: 0.875rem;
		color: #334155;
		font-weight: 500;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		font-size: 0.75rem;
		color: #667eea;
		font-weight: 600;
		background-color: rgba(102, 126, 234, 0.12);
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		flex-shrink: 0;
	}

	/* Scrollbar styling */
	.user-list::-webkit-scrollbar {
		width: 6px;
	}

	.user-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.user-list::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}

	.user-list::-webkit-scrollbar-thumb:hover {
		background-color: rgba(0, 0, 0, 0.3);
	}

	/* Sign Out Button - Tab/Blade Style */
	.signout-form {
		margin: 0;
		display: flex;
	}

	.signout-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 0.625rem 0.625rem;
		background: rgba(239, 68, 68, 0.95);
		border: 1px solid rgba(239, 68, 68, 0.5);
		border-radius: 0 8px 8px 0;
		border-left: none;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 2px 8px rgba(239, 68, 68, 0.2),
			0 0 0 1px rgba(239, 68, 68, 0.1);
		backdrop-filter: blur(8px);
		white-space: nowrap;
		width: 44px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.signout-button:hover {
		width: 110px;
		padding: 0.625rem 0.75rem 0.625rem 0.625rem;
		background: rgba(239, 68, 68, 1);
		box-shadow:
			0 4px 12px rgba(239, 68, 68, 0.3),
			0 0 0 1px rgba(239, 68, 68, 0.2);
	}

	.signout-button:active {
		transform: scale(0.98);
	}

	.signout-button:focus {
		outline: 2px solid #ef4444;
		outline-offset: 2px;
	}

	.signout-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.2s ease;
		flex-shrink: 0;
		filter: brightness(0) invert(1);
	}

	.signout-button:hover .signout-icon {
		transform: scale(1.15);
	}

	.signout-text {
		white-space: nowrap;
		opacity: 0;
		max-width: 0;
		transition:
			opacity 0.2s ease,
			max-width 0.3s ease;
		flex-shrink: 0;
		overflow: hidden;
	}

	.signout-button:hover .signout-text {
		opacity: 1;
		max-width: 100px;
		transition-delay: 0.05s;
	}
</style>
