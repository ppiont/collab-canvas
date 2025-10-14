import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLogoutUrl } from '$lib/auth0';

export const POST: RequestHandler = async ({ cookies, url }) => {
    // Clear session cookie
    cookies.delete('auth_session', { path: '/' });

    // Generate Auth0 logout URL (clears Auth0 session)
    const returnTo = url.origin;
    const logoutUrl = getLogoutUrl(returnTo);

    // Redirect to Auth0 logout, which will then return to homepage
    redirect(303, logoutUrl);
};
