<script lang="ts">
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { supabase } from '$lib/supabase';

	let testResult = '';
	let loading = false;

	async function testConnection() {
		loading = true;
		testResult = 'Testing...';

		try {
			const { data, error } = await supabase.auth.getSession();
			if (error) {
				testResult = `Error: ${error.message}`;
			} else {
				testResult = 'Connection successful! Supabase is working.';
			}
		} catch (err: any) {
			testResult = `Connection failed: ${err.message}`;
			console.error('Test error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
	<h1>Supabase Debug Page</h1>

	<div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
		<h3>Environment Variables</h3>
		<p><strong>SUPABASE_URL:</strong> {PUBLIC_SUPABASE_URL}</p>
		<p><strong>ANON_KEY:</strong> {PUBLIC_SUPABASE_ANON_KEY.substring(0, 50)}...</p>
	</div>

	<button
		on:click={testConnection}
		disabled={loading}
		style="padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 1rem 0;"
	>
		{loading ? 'Testing...' : 'Test Supabase Connection'}
	</button>

	{#if testResult}
		<div
			style="background: {testResult.includes('successful')
				? '#dcfce7'
				: '#fee2e2'}; padding: 1rem; border-radius: 8px; margin: 1rem 0;"
		>
			{testResult}
		</div>
	{/if}

	<div style="margin-top: 2rem;">
		<a href="/auth/signin" style="color: #667eea;">← Back to Sign In</a>
	</div>
</div>
