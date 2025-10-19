import type { Auth0User } from '$lib/auth0';
import type { UserProfile } from '$lib/user-utils';

declare global {
	namespace App {
		interface Locals {
			user: Auth0User | null;
		}
		interface PageData {
			user: Auth0User | null;
			userProfile: UserProfile | null;
		}
	}
}

export { };
