<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let mode = $state<'signin' | 'signup'>('signin');
	let loading = $state(false);
	let error = $state('');
	let message = $state('');

	// Check for error from redirect
	onMount(() => {
		const urlError = $page.url.searchParams.get('error');
		if (urlError) {
			error = 'Authentication failed. Please try again.';
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!email || !password) {
			error = 'Please enter both email and password';
			return;
		}

		loading = true;
		error = '';
		message = '';

		try {
			const endpoint = mode === 'signin' ? '/auth/login' : '/auth/signup';

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Authentication failed');
			}

			if (mode === 'signup') {
				message = 'Account created! Please check your email to verify.';
				// Optionally switch to signin mode after a delay
				setTimeout(() => {
					mode = 'signin';
					message = '';
				}, 3000);
			} else {
				// Signin successful - redirect to canvas
				goto('/canvas');
			}
		} catch (err: any) {
			console.error('Auth error:', err);
			error = err.message || 'Authentication failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<header>
			<h1>CollabCanvas</h1>
			<p class="subtitle">{mode === 'signin' ? 'Sign in with email' : 'Create an account'}</p>
		</header>

		{#if message}
			<div class="message success">{message}</div>
		{/if}

		{#if error}
			<div class="message error">{error}</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					required
					disabled={loading}
					minlength="8"
				/>
			</div>

			<button type="submit" class="btn-primary" disabled={loading}>
				{#if loading}
					Loading...
				{:else if mode === 'signin'}
					Sign In
				{:else}
					Sign Up
				{/if}
			</button>
		</form>

		<div class="auth-modes">
			{#if mode === 'signin'}
				<button type="button" class="link" onclick={() => (mode = 'signup')}>
					Don't have an account? Sign up
				</button>
			{:else}
				<button type="button" class="link" onclick={() => (mode = 'signin')}>
					Already have an account? Sign in
				</button>
			{/if}
		</div>

		<footer>
			<a href="/auth/signin" class="link">← Other sign in options</a>
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

	.message.success {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
	}

	.message.error {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #334155;
	}

	input {
		padding: 0.75rem 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
	}

	input:disabled {
		background: #f1f5f9;
		cursor: not-allowed;
	}

	.btn-primary {
		padding: 0.875rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.auth-modes {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}

	.link {
		background: none;
		border: none;
		color: #667eea;
		font-size: 0.875rem;
		cursor: pointer;
		text-decoration: none;
		padding: 0.25rem;
	}

	.link:hover {
		text-decoration: underline;
	}

	footer {
		margin-top: 2rem;
		text-align: center;
	}
</style>
