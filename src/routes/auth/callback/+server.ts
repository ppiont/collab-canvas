import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens } from '$lib/auth0.server';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    // Handle Auth0 errors
    if (error) {
        console.error('Auth0 error:', error, url.searchParams.get('error_description'));
        redirect(303, '/auth/signin?error=auth-failed');
    }

    // Validate code is present
    if (!code) {
        console.error('No authorization code received');
        redirect(303, '/auth/signin?error=no-code');
    }

    // Exchange code for tokens
    const redirectUri = `${url.origin}/auth/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    if (!tokens) {
        console.error('Failed to exchange code for tokens');
        redirect(303, '/auth/signin?error=token-exchange-failed');
    }

    // Set secure HTTP-only session cookie
    cookies.set('auth_session', tokens.id_token, {
        path: '/',
        httpOnly: true,
        secure: url.protocol === 'https:',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Redirect to canvas
    redirect(303, '/canvas');
};
