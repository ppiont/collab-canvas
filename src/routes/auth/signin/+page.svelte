<script lang="ts">
	import { getLoginUrl } from '$lib/auth0';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let loading = $state(false);
	let error = $state('');

	// Check for error from callback
	onMount(() => {
		const urlError = $page.url.searchParams.get('error');
		if (urlError) {
			error = 'Authentication failed. Please try again.';
		}
	});

	function signInWithProvider(connection: string) {
		loading = true;
		const redirectUri = `${window.location.origin}/auth/callback`;
		const loginUrl = getLoginUrl(redirectUri, connection);
		window.location.href = loginUrl;
	}

	function signInWithEmail() {
		// Redirect to custom email login page
		window.location.href = '/auth/email';
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<header>
			<h1>CollabCanvas</h1>
			<p class="subtitle">Sign in to start collaborating</p>
		</header>

		{#if error}
			<div class="message error">{error}</div>
		{/if}

		<div class="auth-buttons">
			<button
				class="btn-social btn-google"
				onclick={() => signInWithProvider('google-oauth2')}
				disabled={loading}
			>
				<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
					<path
						fill="#4285F4"
						d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
					/>
					<path
						fill="#34A853"
						d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
					/>
					<path
						fill="#FBBC05"
						d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
					/>
					<path
						fill="#EA4335"
						d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
					/>
				</svg>
				{loading ? 'Redirecting...' : 'Continue with Google'}
			</button>

			<button
				class="btn-social btn-facebook"
				onclick={() => signInWithProvider('facebook')}
				disabled={loading}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
					/>
				</svg>
				{loading ? 'Redirecting...' : 'Continue with Facebook'}
			</button>

			<div class="divider">
				<span>or</span>
			</div>

			<button class="btn-email" onclick={signInWithEmail} disabled={loading}>
				{loading ? 'Redirecting...' : 'Continue with Email'}
			</button>
		</div>

		<footer>
			<a href="/" class="link">← Back to home</a>
		</footer>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		background: white;
		border-radius: 16px;
		padding: 2.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		color: #64748b;
		margin: 0;
	}

	.message {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.message.error {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}

	.auth-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	button {
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-social {
		background: white;
		color: #1e293b;
		border: 2px solid #e2e8f0;
	}

	.btn-social:hover:not(:disabled) {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.btn-facebook {
		color: #1877f2;
	}

	.btn-email {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-email:hover:not(:disabled) {
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		color: #94a3b8;
		font-size: 0.875rem;
		margin: 0.5rem 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #e2e8f0;
	}

	.divider span {
		padding: 0 1rem;
	}

	footer {
		margin-top: 2rem;
		text-align: center;
	}

	.link {
		color: #667eea;
		font-size: 0.875rem;
		text-decoration: none;
		padding: 0.25rem;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
