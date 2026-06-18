/**
 * Normalize caller options into structured auth-proof input for a built-in authenticator.
 *
 * @module internal/auth/authenticators/collectProofInput
 */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isStructuredAuthProof(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @public
 * @param {{ flowId: string }} spec
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
export function collectProofInput(spec, options) {
  const partial = isStructuredAuthProof(options.authProof) ? options.authProof : {};

  switch (spec.flowId) {
    case 'password':
      return { ...partial, password: partial.password ?? options.password };
    case 'minuteSignature':
      return { ...partial, passwordHash: partial.passwordHash ?? options.passwordHash };
    case 'walletSignature':
      return {
        ...partial,
        signer: partial.signer ?? options.signer,
        deadline: partial.deadline ?? options.deadline
      };
    case 'dualFactor':
      return {
        ...partial,
        passwordHash: partial.passwordHash ?? options.passwordHash,
        signer: partial.signer ?? options.signer,
        deadline: partial.deadline ?? options.deadline
      };
    default:
      return { ...partial };
  }
}
