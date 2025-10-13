<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';

	let { data, children } = $props();
	let session = $derived(data.session);
	let user = $derived(data.user);
</script>

{#if session && user && !$page.url.pathname.startsWith('/canvas')}
	<nav class="navbar">
		<div class="nav-content">
			<a href="/" class="nav-brand">CollabCanvas</a>
			<div class="nav-user">
				<span class="user-email">{user.email}</span>
				<form method="POST" action="/auth/signout">
					<button type="submit" class="btn-signout">Sign Out</button>
				</form>
			</div>
		</div>
	</nav>
{/if}

{@render children()}

<style>
	.navbar {
		position: sticky;
		top: 0;
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 1rem 0;
		z-index: 100;
	}

	.nav-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.nav-brand {
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-decoration: none;
	}

	.nav-user {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-email {
		font-size: 0.875rem;
		color: #64748b;
	}

	.btn-signout {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		background: white;
		color: #667eea;
		border: 2px solid #667eea;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-signout:hover {
		background: #667eea;
		color: white;
	}
</style>
