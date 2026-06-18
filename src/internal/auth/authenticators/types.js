/**
 * @typedef {import('../../../types/index.js').MonsteraConfigOptions} MonsteraConfigOptions
 * @typedef {import('../../../types/index.js').KeyVaultAuthProofEncoder} KeyVaultAuthProofEncoder
 * @typedef {import('../../../types/index.js').CreateWalletAuthEncoder} CreateWalletAuthEncoder
 * @typedef {import('../session/CredentialsSession.js').CredentialsSession} CredentialsSession
 *
 * @typedef {Object} BuiltinAuthenticatorSpec
 * @property {string} id - Registry id (e.g. {@code passwordAuth})
 * @property {string} flowId - Explicit-flow id (e.g. {@code password})
 * @property {keyof import('../../../types/index.js').ContractAddresses} addressKey
 * @property {(session: CredentialsSession | null, partial: Record<string, unknown>) => Record<string, unknown>} applySessionInput
 * @property {(options: Record<string, unknown>) => void} validatePrepareInput
 * @property {(config: MonsteraConfigOptions, options: Record<string, unknown>) => Record<string, unknown>} applyConfigDefaults
 * @property {KeyVaultAuthProofEncoder} proofEncoder
 * @property {CreateWalletAuthEncoder} configEncoder
 * @property {(encodeCtx: import('../../../types/index.js').AuthProofEncodeContext, input: Record<string, unknown>) => Promise<unknown>} [prepareProofResult]
 */

export {};
