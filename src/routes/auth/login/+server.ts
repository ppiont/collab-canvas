import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_AUTH0_DOMAIN, PUBLIC_AUTH0_CLIENT_ID } from '$env/static/public';
import { AUTH0_CLIENT_SECRET } from '$env/static/private';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const { email, password } = await request.json();

	if (!email || !password) {
		return json({ error: 'Email and password required' }, { status: 400 });
	}

	try {
		// Call Auth0's Resource Owner Password Grant
		// Try with audience parameter to specify the API
		const tokenResponse = await fetch(`https://${PUBLIC_AUTH0_DOMAIN}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
				username: email,
				password: password,
				client_id: PUBLIC_AUTH0_CLIENT_ID,
				client_secret: AUTH0_CLIENT_SECRET,
				scope: 'openid profile email',
				realm: 'Username-Password-Authentication',
				audience: `https://${PUBLIC_AUTH0_DOMAIN}/api/v2/`
			})
		});

		if (!tokenResponse.ok) {
			const error = await tokenResponse.json();
			console.error('Auth0 login error:', error);
			return json(
				{ error: error.error_description || 'Invalid email or password' },
				{ status: 401 }
			);
		}

		const tokens = await tokenResponse.json();

		// Set secure HTTP-only cookie
		cookies.set('auth_session', tokens.id_token, {
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		return json({ success: true });
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Authentication failed' }, { status: 500 });
	}
};
