<div class="container">
	<header>
		<h1>CollabCanvas</h1>
		<p class="tagline">Real-time collaborative canvas for teams</p>
	</header>

	<main>
		<div class="hero">
			<h2>Design together, in real-time</h2>
			<p>
				Create, move, and collaborate on canvas objects with your team. See changes instantly with
				sub-100ms synchronization.
			</p>
		</div>

		<div class="features">
			<div class="feature">
				<h3>⚡ Real-time Sync</h3>
				<p>Changes appear instantly across all connected users</p>
			</div>
			<div class="feature">
				<h3>👥 Multiplayer Cursors</h3>
				<p>See where your teammates are working</p>
			</div>
			<div class="feature">
				<h3>💾 Auto-save</h3>
				<p>Your work is automatically persisted</p>
			</div>
		</div>

		<div class="cta">
			<a href="/canvas" class="button">Open Canvas</a>
		</div>
	</main>

	<footer>
		<p>Built with SvelteKit + Yjs + PartyKit + Supabase</p>
	</footer>
</div>

<style>
	.container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 3rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
	}

	.tagline {
		font-size: 1.25rem;
		color: #64748b;
		margin-top: 0.5rem;
	}

	main {
		max-width: 800px;
		width: 100%;
	}

	.hero {
		text-align: center;
		margin-bottom: 3rem;
	}

	.hero h2 {
		font-size: 2rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 1rem 0;
	}

	.hero p {
		font-size: 1.125rem;
		color: #475569;
		line-height: 1.7;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.feature {
		text-align: center;
		padding: 1.5rem;
		border-radius: 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
	}

	.feature h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.feature p {
		color: #64748b;
		margin: 0;
	}

	.cta {
		text-align: center;
		margin-top: 3rem;
	}

	.button {
		display: inline-block;
		padding: 1rem 2.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 8px;
		text-decoration: none;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
	}

	.button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
	}

	footer {
		margin-top: 4rem;
		text-align: center;
		color: #94a3b8;
		font-size: 0.875rem;
	}
</style>
