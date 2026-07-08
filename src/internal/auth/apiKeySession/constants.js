/**
 * ApiKeySessionAuthenticator bearer scope defaults (match on-chain {@code SCOPE_*} constants).
 *
 * @module internal/auth/apiKeySession/constants
 */

/** TOKEN-mode proof ({@code mode = 1}). */
export const MODE_TOKEN = 1;

/** ACTION-mode proof ({@code mode = 2}). */
export const MODE_ACTION = 2;

/** Bits 0–4: all KeyVault signing ops, excluding {@code executeWithAuth}. */
export const SCOPE_SIGN_ALL = 31;

/** Bits 0–5: all signing ops plus {@code executeWithAuth}. */
export const SCOPE_ALL = 63;
