/**
 * @typedef {import('../session/ConnectSession.js').CredentialsSession} CredentialsSession
 *
 * @typedef {Object} BuiltinAuthenticatorSpec
 * @property {string} id - Registry id (e.g. {@code passwordAuth})
 * @property {string} flowId - Explicit-flow id (e.g. {@code password})
 * @property {keyof ContractAddresses} addressKey
 * @property {(session: CredentialsSession | null, partial: Record<string, unknown>) => Record<string, unknown>} applySessionInput
 * @property {(options: Record<string, unknown>) => Record<string, unknown>} collectProofInput
 * @property {(resolved: Record<string, unknown>, authenticatorAddr: Address) => Record<string, unknown>} mapSessionResolved
 * @property {(options: Record<string, unknown>) => void} validatePrepareInput
 * @property {(config: MonsteraConfigOptions, options: Record<string, unknown>) => Record<string, unknown>} applyConfigDefaults
 * @property {KeyVaultAuthProofEncoder} proofEncoder
 * @property {CreateWalletAuthEncoder} configEncoder
 * @property {(encodeCtx: AuthProofEncodeContext, input: Record<string, unknown>) => Promise<unknown>} [prepareProofResult]
 */

export {};
