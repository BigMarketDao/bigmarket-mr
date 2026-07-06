/** Normalized OIDC-style profile from an OAuth provider. */
export type OAuthProfile = {
	sub: string;
	email?: string;
	emailVerified?: boolean;
	name?: string;
	picture?: string;
};

/** Google OIDC scopes — request exactly this string. */
export const GOOGLE_OIDC_SCOPES = 'openid email profile';

export function profileFromIdTokenClaims(claims: Record<string, unknown>): OAuthProfile {
	const sub = claims.sub;
	if (!sub) throw new Error('id_token missing sub');
	return {
		sub: String(sub),
		email: typeof claims.email === 'string' ? claims.email : undefined,
		emailVerified: typeof claims.email_verified === 'boolean' ? claims.email_verified : undefined,
		name: typeof claims.name === 'string' ? claims.name : undefined,
		picture: typeof claims.picture === 'string' ? claims.picture : undefined
	};
}
