<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let message = '';
	let mode: 'signin' | 'signup' | 'magic' = 'signin';

	async function handleEmailPassword() {
		if (!email || !password) {
			error = 'Please enter email and password';
			return;
		}

		loading = true;
		error = '';

		try {
			if (mode === 'signin') {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email,
					password
				});

				if (signInError) throw signInError;

				goto('/canvas');
			} else if (mode === 'signup') {
				const { error: signUpError } = await supabase.auth.signUp({
					email,
					password
				});

				if (signUpError) throw signUpError;

				message = 'Check your email to confirm your account!';
			}
		} catch (err: any) {
			console.error('Auth error:', err);
			error = err.message || 'Authentication failed';
		} finally {
			loading = false;
		}
	}

	async function handleMagicLink() {
		if (!email) {
			error = 'Please enter your email';
			return;
		}

		loading = true;
		error = '';

		try {
			const { error: magicLinkError } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (magicLinkError) throw magicLinkError;

			message = 'Check your email for the magic link!';
		} catch (err: any) {
			console.error('Magic link error:', err);
			error = err.message || 'Failed to send magic link';
		} finally {
			loading = false;
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (mode === 'magic') {
			handleMagicLink();
		} else {
			handleEmailPassword();
		}
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<header>
			<h1>CollabCanvas</h1>
			<p class="subtitle">Sign in to start collaborating</p>
		</header>

		{#if message}
			<div class="message success">{message}</div>
		{/if}

		{#if error}
			<div class="message error">{error}</div>
		{/if}

		<form on:submit={handleSubmit}>
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

			{#if mode !== 'magic'}
				<div class="form-group">
					<label for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						required={mode !== 'magic'}
						disabled={loading}
					/>
				</div>
			{/if}

			<button type="submit" class="btn-primary" disabled={loading}>
				{#if loading}
					Loading...
				{:else if mode === 'signin'}
					Sign In
				{:else if mode === 'signup'}
					Sign Up
				{:else}
					Send Magic Link
				{/if}
			</button>
		</form>

		<div class="auth-modes">
			{#if mode === 'signin'}
				<button type="button" class="link" on:click={() => (mode = 'signup')}>
					Don't have an account? Sign up
				</button>
				<button type="button" class="link" on:click={() => (mode = 'magic')}>
					Or use magic link
				</button>
			{:else if mode === 'signup'}
				<button type="button" class="link" on:click={() => (mode = 'signin')}>
					Already have an account? Sign in
				</button>
			{:else}
				<button type="button" class="link" on:click={() => (mode = 'signin')}>
					Back to sign in
				</button>
			{/if}
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
